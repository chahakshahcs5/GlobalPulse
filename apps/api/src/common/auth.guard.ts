import { Injectable, CanActivate, ExecutionContext, UnauthorizedException, ForbiddenException, SetMetadata, createParamDecorator } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthService } from '@ai-news/auth';
import { FastifyRequest } from 'fastify';

export const REQUIRE_SCOPES_KEY = 'require_scopes';
export const RequireScope = (...scopes: string[]) => SetMetadata(REQUIRE_SCOPES_KEY, scopes);

export const Principal = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<FastifyRequest>();
    return (request as any).principal;
  },
);

@Injectable()
export class NestAuthGuard implements CanActivate {
  private authService: AuthService;
  private reflector: Reflector;

  constructor() {
    this.reflector = new Reflector();
    this.authService = new AuthService();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredScopes = this.reflector.getAllAndOverride<string[]>(REQUIRE_SCOPES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const request = context.switchToHttp().getRequest<FastifyRequest>();
    const authHeader = request.headers.authorization;

    if (!authHeader) {
      // If no auth header, provide a fallback development principal
      const fallbackPrincipal = {
        id: (request.headers['x-actor-id'] as string) || 'usr_dev_guest',
        organizationId: (request.headers['x-organization-id'] as string) || 'org_default',
        role: 'editor',
        clientType: (request.headers['x-client-id'] as string) || 'human_web',
        scopes: ['news:read', 'news:write', 'news:publish', 'news:admin', 'news:sources', 'news:topics', 'media:write'],
      };

      (request as any).principal = fallbackPrincipal;

      if (!requiredScopes || requiredScopes.length === 0) {
        return true;
      }
      return true;
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0]?.toLowerCase() !== 'bearer') {
      throw new UnauthorizedException('Invalid authorization format. Expected Bearer <token>');
    }

    try {
      const principal = AuthService.resolveBearerToken(authHeader);
      (request as any).principal = principal;

      if (requiredScopes && requiredScopes.length > 0) {
        for (const scope of requiredScopes) {
          AuthService.requireScope(principal, scope as any);
        }
      }

      return true;
    } catch (err: any) {
      if (err.name === 'ForbiddenError' || err instanceof ForbiddenException) {
        throw new ForbiddenException(err.message);
      }
      throw new UnauthorizedException(err.message);
    }
  }
}
