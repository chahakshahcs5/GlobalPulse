import jwt, { JwtPayload, SignOptions } from 'jsonwebtoken';
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

export type UserRole = 'admin' | 'editor' | 'journalist' | 'reader' | 'ai_agent';

export type ClientType =
  | 'gemini'
  | 'gemini_spark'
  | 'chatgpt'
  | 'claude'
  | 'custom_mcp'
  | 'human_web'
  | 'human_mobile'
  | 'internal_service';

export interface AiAgentMetadata {
  agentName?: string;
  model: string;
  provider: 'google' | 'openai' | 'anthropic' | 'deepseek' | 'meta' | 'custom';
  version?: string;
  capabilities?: string[];
}

export interface AuthenticatedPrincipal {
  id: string;
  organizationId: string;
  role: UserRole;
  email?: string;
  clientType: ClientType;
  scopes: NewsScope[];
  agentMetadata?: AiAgentMetadata;
  aiMetadata?: AiAgentMetadata;
  tokenExpiresAt?: number;
}

export const ROLE_PERMISSIONS: Record<UserRole, NewsScope[]> = {
  admin: [
    'news:read',
    'news:search',
    'news:write',
    'news:publish',
    'news:media',
    'news:sources',
    'news:topics',
    'news:admin',
  ],
  editor: [
    'news:read',
    'news:search',
    'news:write',
    'news:publish',
    'news:media',
    'news:sources',
    'news:topics',
  ],
  journalist: [
    'news:read',
    'news:search',
    'news:write',
    'news:media',
    'news:sources',
    'news:topics',
  ],
  reader: ['news:read', 'news:search'],
  ai_agent: [
    'news:read',
    'news:search',
    'news:write',
    'news:publish',
    'news:media',
    'news:sources',
    'news:topics',
  ],
};

const DEFAULT_JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-minimum-32-chars-globalpulse-key';
const DEFAULT_ISSUER = process.env.JWT_ISSUER || 'https://auth.globalpulse.news';
const DEFAULT_AUDIENCE = process.env.JWT_AUDIENCE || 'https://api.globalpulse.news';

export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (process.env.NODE_ENV === 'production') {
    if (!secret || secret === 'dev-secret-minimum-32-chars-globalpulse-key' || secret.length < 32) {
      throw new Error(
        'CRITICAL SECURITY CONFIGURATION ERROR: A strong JWT_SECRET (minimum 32 characters) must be configured in production environment.'
      );
    }
    return secret;
  }
  return secret || DEFAULT_JWT_SECRET;
}

export class AuthService {
  /**
   * Generates a signed RFC 7519 JSON Web Token for human users or AI agents.
   */
  static generateToken(
    principal: Partial<Omit<AuthenticatedPrincipal, 'tokenExpiresAt'>> & {
      id: string;
      role: UserRole;
    },
    secret: string = getJwtSecret(),
    expiresIn: SignOptions['expiresIn'] = '24h'
  ): string {
    const payload: Record<string, unknown> = {
      sub: principal.id,
      org: principal.organizationId || 'org_default',
      role: principal.role,
      email: principal.email,
      clientType: principal.clientType || 'human_web',
      scopes:
        principal.scopes && principal.scopes.length > 0
          ? principal.scopes
          : ROLE_PERMISSIONS[principal.role] || [],
      ...(principal.agentMetadata ? { agent: principal.agentMetadata } : {}),
    };

    const options: SignOptions = {
      issuer: DEFAULT_ISSUER,
      audience: DEFAULT_AUDIENCE,
      expiresIn,
    };

    return jwt.sign(payload, secret, options);
  }

  /**
   * Cryptographically verifies and resolves an RFC 7519 JWT into an AuthenticatedPrincipal.
   */
  static verifyToken(token: string, secret: string = getJwtSecret()): AuthenticatedPrincipal {
    try {
      const decoded = jwt.verify(token, secret, {
        issuer: DEFAULT_ISSUER,
        audience: DEFAULT_AUDIENCE,
      }) as JwtPayload;

      const role = (decoded.role as UserRole) || 'reader';
      const scopes = Array.isArray(decoded.scopes)
        ? (decoded.scopes as NewsScope[])
        : ROLE_PERMISSIONS[role] || [];

      return {
        id: decoded.sub as string,
        organizationId: (decoded.org as string) || 'org_default',
        role,
        email: decoded.email as string | undefined,
        clientType: (decoded.clientType as ClientType) || 'human_web',
        scopes,
        agentMetadata: decoded.agent as AiAgentMetadata | undefined,
        tokenExpiresAt: decoded.exp,
      };
    } catch (err: unknown) {
      if (err instanceof jwt.TokenExpiredError) {
        throw new UnauthorizedError('Token has expired');
      }
      if (err instanceof jwt.JsonWebTokenError) {
        throw new UnauthorizedError(err.message || 'Invalid token signature');
      }
      throw new UnauthorizedError('Token validation failed');
    }
  }

  /**
   * Enforces Role-Based Access Control (RBAC).
   */
  static requireRole(principal: AuthenticatedPrincipal, ...allowedRoles: UserRole[]): void {
    if (principal.role === 'admin' || principal.scopes.includes('news:admin')) {
      return; // Administrator has universal access
    }
    if (!allowedRoles.includes(principal.role)) {
      throw new ForbiddenError(
        `Insufficient role privileges. Required one of: [${allowedRoles.join(', ')}], but principal possesses role: "${principal.role}".`
      );
    }
  }

  /**
   * Validates whether an authenticated principal has the required scope.
   */
  static requireScope(principal: AuthenticatedPrincipal, requiredScope: NewsScope): void {
    if (principal.role === 'admin' || principal.scopes.includes('news:admin')) {
      return; // Administrator has universal scope
    }
    if (!principal.scopes.includes(requiredScope)) {
      throw new ForbiddenError(
        `Insufficient privileges. Required scope: "${requiredScope}", but principal has: [${principal.scopes.join(', ')}]`
      );
    }
  }

  /**
   * Registry of configured dev/test tokens loaded from environment variables.
   * Format: DEV_TOKEN_<NAME>=<role>:<clientType>
   * Example: DEV_TOKEN_GEMINI=ai_agent:gemini_spark
   */
  private static _devTokenRegistry: Map<string, AuthenticatedPrincipal> | null = null;

  private static getDevTokenRegistry(): Map<string, AuthenticatedPrincipal> {
    if (this._devTokenRegistry) return this._devTokenRegistry;
    this._devTokenRegistry = new Map();

    for (const [key, value] of Object.entries(process.env)) {
      if (key.startsWith('DEV_TOKEN_') && value) {
        const tokenName = key.replace('DEV_TOKEN_', '').toLowerCase();
        const [role, clientType] = value.split(':') as [UserRole, ClientType];
        if (role && ROLE_PERMISSIONS[role]) {
          this._devTokenRegistry.set(`dev-${tokenName}`, {
            id: `usr_dev_${tokenName}`,
            organizationId: 'org_default',
            role,
            email: `${tokenName}@dev.news.platform`,
            clientType: clientType || 'human_web',
            scopes: ROLE_PERMISSIONS[role],
          });
        }
      }
    }

    return this._devTokenRegistry;
  }

  /**
   * Resolves Authorization Bearer token header.
   * Production: requires cryptographically signed JWT.
   * Dev/Test: accepts JWTs and explicitly configured dev tokens via DEV_TOKEN_* env vars.
   */
  static resolveBearerToken(authHeader?: string): AuthenticatedPrincipal {
    const isProduction = process.env.NODE_ENV === 'production';
    const allowDevTokens = process.env.ALLOW_DEV_TOKENS === 'true' || !isProduction;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      if (isProduction) {
        throw new UnauthorizedError('Missing or malformed Authorization header');
      }
      // Non-production anonymous fallback: read-only access only
      return {
        id: 'usr_anonymous_dev',
        organizationId: 'org_default',
        role: 'reader',
        email: undefined,
        clientType: 'human_web',
        scopes: ROLE_PERMISSIONS.reader,
      };
    }

    const token = authHeader.replace(/^Bearer\s+/i, '').trim();

    if (!token) {
      throw new UnauthorizedError('Authorization Bearer token payload is empty');
    }

    // Try parsing as cryptographically signed JWT
    if (token.includes('.')) {
      return this.verifyToken(token);
    }

    // Dev/test tokens: only accepted in non-production or when explicitly enabled
    if (!allowDevTokens) {
      throw new UnauthorizedError('Invalid token format: cryptographic JWT required in production');
    }

    // Special error-simulation tokens for test harnesses
    if (token === 'expired_token') {
      throw new UnauthorizedError('Token has expired');
    }
    if (token === 'invalid_signature') {
      throw new UnauthorizedError('Invalid token signature');
    }

    // Look up in environment-configured dev token registry
    const devRegistry = this.getDevTokenRegistry();
    const devPrincipal = devRegistry.get(token);
    if (devPrincipal) {
      return { ...devPrincipal };
    }

    // No matching token found — reject instead of silently granting access
    throw new UnauthorizedError(
      'Unrecognized token. In non-production, configure dev tokens via DEV_TOKEN_* environment variables (e.g. DEV_TOKEN_EDITOR=editor:human_web) and use "Bearer dev-editor".'
    );
  }

  /**
   * RFC 8414 OAuth 2.0 Protected Resource Metadata
   */
  static getProtectedResourceMetadata(resourceUri = 'https://api.globalpulse.news'): {
    resource: string;
    authorization_servers: string[];
    scopes_supported: NewsScope[];
    bearer_methods_supported: string[];
    resource_documentation: string;
  } {
    return {
      resource: resourceUri,
      authorization_servers: ['https://auth.globalpulse.news'],
      scopes_supported: [
        'news:read',
        'news:search',
        'news:write',
        'news:publish',
        'news:media',
        'news:sources',
        'news:topics',
        'news:admin',
      ],
      bearer_methods_supported: ['header'],
      resource_documentation: 'https://docs.globalpulse.news/mcp-auth',
    };
  }
}

export * from './password';
export * from './tenant';
