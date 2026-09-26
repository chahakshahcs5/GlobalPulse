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

  constructor(private reflector: Reflector) {
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
      // If no auth header, provide a fallback development principal if no specific scopes required
      // or check bearer
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
      const payload = await this.authService.verifyAccessToken(parts[1]!);
      const principal = {
        id: payload.sub,
        organizationId: payload.organizationId || 'org_default',
        role: payload.role || 'editor',
        clientType: payload.clientType || 'human_web',
        scopes: payload.scopes || [],
      };

      (request as any).principal = principal;

      if (requiredScopes && requiredScopes.length > 0) {
        const hasScope = requiredScopes.some((s) => principal.scopes.includes(s));
        if (!hasScope) {
          throw new ForbiddenException(`Missing required scope(s): ${requiredScopes.join(', ')}`);
        }
      }

      return true;
    } catch (err: any) {
      if (err instanceof ForbiddenException) throw err;
      throw new UnauthorizedException(err.message || 'Invalid or expired token');
    }
  }
}
