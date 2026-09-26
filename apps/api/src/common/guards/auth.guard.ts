import { FastifyRequest, FastifyReply } from 'fastify';
import { AuthService, AuthenticatedPrincipal } from '@ai-news/auth';

declare module 'fastify' {
  interface FastifyRequest {
    principal: AuthenticatedPrincipal;
  }
}

export async function authGuard(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const authHeader = request.headers.authorization;
  const principal = AuthService.resolveBearerToken(authHeader);
  request.principal = principal;
}
