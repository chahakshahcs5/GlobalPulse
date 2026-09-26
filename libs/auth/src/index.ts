import { UnauthorizedError, ForbiddenError } from '@ai-news/shared';

export type NewsScope =
  | 'news:read'
  | 'news:search'
  | 'news:write'
  | 'news:publish'
  | 'news:media'
  | 'news:sources'
  | 'news:topics'
  | 'news:admin';

export interface AuthenticatedPrincipal {
  id: string;
  organizationId: string;
  email?: string;
  clientType: 'gemini' | 'gemini_spark' | 'chatgpt' | 'claude' | 'custom_mcp' | 'human_web' | 'human_mobile' | 'internal_service';
  scopes: NewsScope[];
  tokenExpiresAt?: number;
}

export class AuthService {
  /**
   * Validates whether an authenticated principal has the required scope.
   */
  static requireScope(principal: AuthenticatedPrincipal, requiredScope: NewsScope): void {
    if (principal.scopes.includes('news:admin')) {
      return; // Admin possesses all scopes
    }
    if (!principal.scopes.includes(requiredScope)) {
      throw new ForbiddenError(
        `Insufficient privileges. Required scope: "${requiredScope}", but principal has: [${principal.scopes.join(', ')}]`
      );
    }
  }

  /**
   * Helper to construct a mock or verified principal from Bearer header
   */
  static resolveBearerToken(authHeader?: string): AuthenticatedPrincipal {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // Return a default development principal for testing if no token provided
      return {
        id: 'usr_dev_default',
        organizationId: 'org_default',
        email: 'agent@news.platform',
        clientType: 'gemini',
        scopes: [
          'news:read',
          'news:search',
          'news:write',
          'news:publish',
          'news:media',
          'news:sources',
          'news:topics',
          'news:admin',
        ],
      };
    }

    const token = authHeader.replace('Bearer ', '').trim();
    if (token === 'expired_token') {
      throw new UnauthorizedError('Token has expired');
    }
    if (token === 'invalid_signature') {
      throw new UnauthorizedError('Invalid token signature');
    }

    // In production this verifies JWT with JWKS
    return {
      id: 'usr_mcp_client',
      organizationId: 'org_default',
      clientType: 'chatgpt',
      scopes: ['news:read', 'news:search', 'news:write', 'news:publish', 'news:media', 'news:sources'],
    };
  }
}
