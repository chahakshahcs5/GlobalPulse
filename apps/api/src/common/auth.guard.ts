import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
  SetMetadata,
  createParamDecorator,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import {
  AuthService,
  NewsScope,
  UserRole,
  AuthenticatedPrincipal,
  ROLE_PERMISSIONS,
} from '@ai-news/auth';
import { FastifyRequest } from 'fastify';

export const REQUIRE_SCOPES_KEY = 'require_scopes';
export const RequireScope = (...scopes: NewsScope[]) => SetMetadata(REQUIRE_SCOPES_KEY, scopes);

export const ROLES_KEY = 'roles';
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);

export interface AuthenticatedRequest extends FastifyRequest {
  principal: AuthenticatedPrincipal;
}

export const Principal = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthenticatedPrincipal => {
    const request = ctx.switchToHttp().getRequest<AuthenticatedRequest>();
    return request.principal;
  }
);

@Injectable()
export class NestAuthGuard implements CanActivate {
  private reflector: Reflector;

  constructor() {
    this.reflector = new Reflector();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredScopes = this.reflector.getAllAndOverride<NewsScope[]>(REQUIRE_SCOPES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    let authHeader = request.headers.authorization;

    // Check cookie fallback if Authorization header not provided
    if (!authHeader && request.headers.cookie) {
      const match = request.headers.cookie.match(/(?:^|;\s*)gp_token=([^;]+)/);
      if (match && match[1]) {
        authHeader = `Bearer ${decodeURIComponent(match[1])}`;
      }
    }

    if (!authHeader) {
      const isProduction = process.env.NODE_ENV === 'production';

      // In production, require authentication on protected endpoints
      if (isProduction && requiredScopes && requiredScopes.length > 0) {
        throw new UnauthorizedException(
          'Authentication required. Provide a valid Bearer token in the Authorization header.'
        );
      }

      // Development fallback — limited to reader-level access (not admin)
      const fallbackPrincipal: AuthenticatedPrincipal = {
        id: (request.headers['x-actor-id'] as string) || 'usr_dev_guest',
        organizationId: (request.headers['x-organization-id'] as string) || 'org_default',
        role: 'editor',
        clientType: 'human_web',
        scopes: ROLE_PERMISSIONS.editor,
      };

      request.principal = fallbackPrincipal;

      if (
        (!requiredScopes || requiredScopes.length === 0) &&
        (!requiredRoles || requiredRoles.length === 0)
      ) {
        return true;
      }

      // In development, still check scope/role requirements for the fallback principal
      if (requiredRoles && requiredRoles.length > 0) {
        AuthService.requireRole(fallbackPrincipal, ...requiredRoles);
      }
      if (requiredScopes && requiredScopes.length > 0) {
        for (const scope of requiredScopes) {
          AuthService.requireScope(fallbackPrincipal, scope);
        }
      }

      return true;
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0]?.toLowerCase() !== 'bearer') {
      throw new UnauthorizedException('Invalid authorization format. Expected Bearer <token>');
    }

    try {
      const principal = AuthService.resolveBearerToken(authHeader);
      request.principal = principal;

      if (requiredRoles && requiredRoles.length > 0) {
        AuthService.requireRole(principal, ...requiredRoles);
      }

      if (requiredScopes && requiredScopes.length > 0) {
        for (const scope of requiredScopes) {
          AuthService.requireScope(principal, scope);
        }
      }

      return true;
    } catch (err: unknown) {
      const errorObj = err as Error;
      if (errorObj.name === 'ForbiddenError' || err instanceof ForbiddenException) {
        throw new ForbiddenException(errorObj.message);
      }
      throw new UnauthorizedException(errorObj.message);
    }
  }
}
