import { FastifyRequest, FastifyReply } from 'fastify';
import { AuthService, NewsScope } from '@ai-news/auth';

/**
 * Creates a preHandler hook ensuring the authenticated principal possesses the specified scope.
 */
export function requireScope(scope: NewsScope) {
  return async function scopeGuard(request: FastifyRequest, _reply: FastifyReply): Promise<void> {
    if (!request.principal) {
      // In case authGuard wasn't run prior
      const authHeader = request.headers.authorization;
      request.principal = AuthService.resolveBearerToken(authHeader);
    }

    AuthService.requireScope(request.principal, scope);
  };
}
