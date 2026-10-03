import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import * as crypto from 'crypto';
import { AuthService, type ClientType, type NewsScope, type UserRole } from '@ai-news/auth';
import { appConfig } from '../../config/configuration';

export interface RegisteredOAuthClient {
  clientId: string;
  clientSecret?: string;
  clientType: ClientType;
  allowedGrants: ('authorization_code' | 'client_credentials')[];
  allowedScopes: NewsScope[];
  redirectUris?: string[];
  isPublic?: boolean;
}

export interface AuthorizationCodeEntry {
  code: string;
  clientId: string;
  redirectUri?: string;
  scopes: NewsScope[];
  codeChallenge: string;
  codeChallengeMethod: 'S256';
  expiresAt: number;
  principalId: string;
  clientType: ClientType;
}

export interface AuthorizeRequest {
  response_type: string;
  client_id: string;
  redirect_uri?: string;
  scope?: string;
  state?: string;
  code_challenge?: string;
  code_challenge_method?: string;
  client_type?: string;
}

export interface TokenRequest {
  grant_type: string;
  code?: string;
  client_id?: string;
  client_secret?: string;
  redirect_uri?: string;
  code_verifier?: string;
  scope?: string;
}

const DEFAULT_SCOPES: NewsScope[] = [
  'news:read',
  'news:search',
  'news:write',
  'news:publish',
  'news:media',
  'news:sources',
  'news:topics',
];

@Injectable()
export class OAuthService {
  private codes = new Map<string, AuthorizationCodeEntry>();
  private clients = new Map<string, RegisteredOAuthClient>();

  constructor() {
    this.seedDefaultClients();

    // Periodically clean up expired authorization codes
    setInterval(() => {
      const now = Date.now();
      for (const [code, entry] of this.codes.entries()) {
        if (entry.expiresAt <= now) {
          this.codes.delete(code);
        }
      }
    }, 60000).unref();
  }

  private seedDefaultClients(): void {
    const defaultClients: RegisteredOAuthClient[] = [
      {
        clientId: 'claude_desktop_agent',
        clientType: 'claude',
        allowedGrants: ['authorization_code'],
        isPublic: true,
        allowedScopes: DEFAULT_SCOPES,
        redirectUris: [
          'http://localhost:3000/oauth/callback',
          'http://127.0.0.1:3000/oauth/callback',
          'http://localhost:3002/oauth/callback',
          'http://127.0.0.1:3002/oauth/callback',
          'https://claude.ai/oauth/callback',
        ],
      },
      {
        clientId: 'gemini_agent_service',
        clientSecret: process.env.OAUTH_GEMINI_CLIENT_SECRET || 'sec_test_gemini_999',
        clientType: 'gemini',
        allowedGrants: ['client_credentials', 'authorization_code'],
        allowedScopes: DEFAULT_SCOPES,
        redirectUris: [
          'http://localhost:3000/oauth/callback',
          'http://localhost:3002/oauth/callback',
          'https://gemini.google.com/oauth/callback',
          'https://spark.gemini.google.com/oauth/callback',
          'https://oauth.googleusercontent.com',
        ],
      },
      {
        clientId: 'chatgpt_mcp_client',
        clientSecret: process.env.OAUTH_CHATGPT_CLIENT_SECRET || 'sec_test_chatgpt_999',
        clientType: 'chatgpt',
        allowedGrants: ['client_credentials', 'authorization_code'],
        allowedScopes: DEFAULT_SCOPES,
        redirectUris: [
          'http://localhost:3000/oauth/callback',
          'http://localhost:3002/oauth/callback',
          'https://chatgpt.com/api/auth/callback',
        ],
      },
      {
        clientId: 'globalpulse_admin_client',
        clientSecret: process.env.OAUTH_ADMIN_CLIENT_SECRET || 'sec_admin_secret_globalpulse',
        clientType: 'custom_mcp',
        allowedGrants: ['client_credentials'],
        allowedScopes: [...DEFAULT_SCOPES, 'news:admin'],
      },
    ];

    const isProd = process.env.NODE_ENV === 'production';
    if (isProd) {
      if (!process.env.OAUTH_ADMIN_CLIENT_SECRET) {
        throw new Error('OAUTH_ADMIN_CLIENT_SECRET must be explicitly set in production mode.');
      }
      if (!process.env.OAUTH_GEMINI_CLIENT_SECRET || !process.env.OAUTH_CHATGPT_CLIENT_SECRET) {
        throw new Error(
          'OAuth client secrets for AI agents must be explicitly set in production mode.'
        );
      }
    }

    for (const client of defaultClients) {
      this.clients.set(client.clientId, client);
    }
  }

  public registerClient(client: RegisteredOAuthClient): void {
    this.clients.set(client.clientId, client);
  }

  public getClient(clientId: string): RegisteredOAuthClient | undefined {
    return this.clients.get(clientId);
  }

  /**
   * RFC 8414 Authorization Server Metadata
   */
  getAuthorizationServerMetadata() {
    const issuer = appConfig.apiBaseUrl;
    return {
      issuer,
      authorization_endpoint: `${issuer}/oauth/authorize`,
      token_endpoint: `${issuer}/oauth/token`,
      jwks_uri: `${issuer}/oauth/jwks`,
      response_types_supported: ['code'],
      grant_types_supported: ['authorization_code', 'client_credentials'],
      code_challenge_methods_supported: ['S256'],
      token_endpoint_auth_methods_supported: ['client_secret_post', 'client_secret_basic', 'none'],
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
      service_documentation: appConfig.docsUrl,
    };
  }

  /**
   * RFC 9723 Protected Resource Metadata
   */
  getProtectedResourceMetadata() {
    return {
      resource: appConfig.jwtAudience,
      authorization_servers: [appConfig.apiBaseUrl],
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
      resource_documentation: appConfig.docsUrl,
    };
  }

  /**
   * RFC 7636 / RFC 6749: Authorize endpoint
   */
  createAuthorizationCode(req: AuthorizeRequest): {
    code: string;
    state?: string;
    redirect_uri?: string;
  } {
    if (req.response_type !== 'code') {
      throw new BadRequestException({
        error: 'unsupported_response_type',
        error_description: 'Only response_type="code" is supported.',
      });
    }

    if (!req.client_id) {
      throw new BadRequestException({
        error: 'invalid_request',
        error_description: 'client_id is required.',
      });
    }

    const client = this.clients.get(req.client_id);
    if (!client) {
      throw new BadRequestException({
        error: 'invalid_client',
        error_description: `Unregistered client_id: "${req.client_id}".`,
      });
    }

    if (!client.allowedGrants.includes('authorization_code')) {
      throw new BadRequestException({
        error: 'unauthorized_client',
        error_description: 'Client is not authorized for authorization_code grant.',
      });
    }

    // Validate redirect_uri against registered client redirect URIs
    if (req.redirect_uri) {
      const allowedUris = client.redirectUris || [];
      const isAllowed = allowedUris.some((uri) => {
        try {
          const registeredUrl = new URL(uri);
          const reqUrl = new URL(req.redirect_uri!);
          if (
            client.clientType === 'gemini' &&
            (reqUrl.hostname.endsWith('google.com') ||
              reqUrl.hostname.endsWith('googleusercontent.com'))
          ) {
            return true;
          }
          return (
            registeredUrl.origin === reqUrl.origin && registeredUrl.pathname === reqUrl.pathname
          );
        } catch {
          return uri === req.redirect_uri;
        }
      });

      if (!isAllowed) {
        throw new BadRequestException({
          error: 'invalid_request',
          error_description: `redirect_uri is not registered for client "${req.client_id}".`,
        });
      }
    }

    // PKCE is mandatory under OAuth 2.1 (RFC 7636)
    if (!req.code_challenge) {
      throw new BadRequestException({
        error: 'invalid_request',
        error_description:
          'code_challenge is required. PKCE is mandatory for authorization_code flow.',
      });
    }

    if (req.code_challenge_method !== 'S256') {
      throw new BadRequestException({
        error: 'invalid_request',
        error_description:
          'Only code_challenge_method="S256" is supported. plain is prohibited under OAuth 2.1.',
      });
    }

    // Parse and authorize scopes; downscope to client.allowedScopes (RFC 6749 §3.3)
    const rawRequestedScopes: NewsScope[] = req.scope
      ? (req.scope.split(/[\s,]+/).filter(Boolean) as NewsScope[])
      : client.allowedScopes;

    const parsedScopes = rawRequestedScopes.filter((s) => client.allowedScopes.includes(s));
    if (parsedScopes.length === 0) {
      throw new BadRequestException({
        error: 'invalid_scope',
        error_description: `None of the requested scope(s) are authorized for client "${req.client_id}".`,
      });
    }

    const code = `authcode_${crypto.randomBytes(24).toString('hex')}`;
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minute TTL

    const entry: AuthorizationCodeEntry = {
      code,
      clientId: req.client_id,
      redirectUri: req.redirect_uri,
      scopes: parsedScopes,
      codeChallenge: req.code_challenge,
      codeChallengeMethod: 'S256',
      expiresAt,
      principalId: `agent_${req.client_id.replace(/[^a-zA-Z0-9_-]/g, '_')}`,
      clientType: client.clientType,
    };

    this.codes.set(code, entry);

    return {
      code,
      state: req.state,
      redirect_uri: req.redirect_uri,
    };
  }

  /**
   * RFC 6749 / RFC 7636: Token Exchange Endpoint
   */
  exchangeToken(req: TokenRequest): {
    access_token: string;
    token_type: string;
    expires_in: number;
    scope: string;
  } {
    if (req.grant_type === 'authorization_code') {
      return this.handleAuthorizationCodeGrant(req);
    } else if (req.grant_type === 'client_credentials') {
      return this.handleClientCredentialsGrant(req);
    }

    throw new BadRequestException({
      error: 'unsupported_grant_type',
      error_description: 'grant_type must be "authorization_code" or "client_credentials".',
    });
  }

  private handleAuthorizationCodeGrant(req: TokenRequest) {
    if (!req.code) {
      throw new BadRequestException({
        error: 'invalid_request',
        error_description: 'code is required for authorization_code grant.',
      });
    }

    const entry = this.codes.get(req.code);
    if (!entry) {
      throw new BadRequestException({
        error: 'invalid_grant',
        error_description: 'Authorization code is invalid or has already been used.',
      });
    }

    // Single-use: immediately delete
    this.codes.delete(req.code);

    if (entry.expiresAt <= Date.now()) {
      throw new BadRequestException({
        error: 'invalid_grant',
        error_description: 'Authorization code has expired.',
      });
    }

    if (req.client_id && entry.clientId !== req.client_id) {
      throw new BadRequestException({
        error: 'invalid_grant',
        error_description: 'client_id mismatch with issued authorization code.',
      });
    }

    const client = this.clients.get(entry.clientId);
    if (!client) {
      throw new BadRequestException({
        error: 'invalid_client',
        error_description: 'Registered client not found for issued code.',
      });
    }

    // If client is confidential (has clientSecret), require and validate secret
    if (client.clientSecret) {
      if (!req.client_secret || req.client_secret !== client.clientSecret) {
        throw new UnauthorizedException({
          error: 'invalid_client',
          error_description: 'client_secret is required and must match registered credentials.',
        });
      }
    }

    if (entry.redirectUri && req.redirect_uri && entry.redirectUri !== req.redirect_uri) {
      throw new BadRequestException({
        error: 'invalid_grant',
        error_description: 'redirect_uri mismatch with issued authorization code.',
      });
    }

    // PKCE Verification (RFC 7636)
    if (!req.code_verifier) {
      throw new BadRequestException({
        error: 'invalid_request',
        error_description: 'code_verifier is required for PKCE-secured requests.',
      });
    }

    const isValid = this.verifyPkce(req.code_verifier, entry.codeChallenge);
    if (!isValid) {
      throw new BadRequestException({
        error: 'invalid_grant',
        error_description: 'PKCE verification failed: code_verifier does not match code_challenge.',
      });
    }

    // Generate production-grade JWT
    const token = AuthService.generateToken(
      {
        id: entry.principalId,
        organizationId: 'org_globalpulse',
        role: entry.scopes.includes('news:admin')
          ? ('admin' as UserRole)
          : ('ai_agent' as UserRole),
        clientType: entry.clientType,
        scopes: entry.scopes,
        agentMetadata: {
          model: 'external-ai-model',
          provider:
            entry.clientType === 'claude'
              ? 'anthropic'
              : entry.clientType === 'gemini'
                ? 'google'
                : entry.clientType === 'chatgpt'
                  ? 'openai'
                  : 'custom',
        },
      },
      undefined,
      '24h'
    );

    return {
      access_token: token,
      token_type: 'Bearer',
      expires_in: 86400,
      scope: entry.scopes.join(' '),
    };
  }

  private handleClientCredentialsGrant(req: TokenRequest) {
    if (!req.client_id || !req.client_secret) {
      throw new UnauthorizedException({
        error: 'invalid_client',
        error_description: 'client_id and client_secret are required for client_credentials grant.',
      });
    }

    const client = this.clients.get(req.client_id);
    if (!client || client.clientSecret !== req.client_secret) {
      throw new UnauthorizedException({
        error: 'invalid_client',
        error_description: 'Invalid client credentials.',
      });
    }

    if (!client.allowedGrants.includes('client_credentials')) {
      throw new BadRequestException({
        error: 'unauthorized_client',
        error_description: 'Client is not authorized for client_credentials grant.',
      });
    }

    const requestedScopes: NewsScope[] = req.scope
      ? (req.scope.split(/[\s,]+/).filter(Boolean) as NewsScope[])
      : client.allowedScopes;

    // Check scope authorization: client cannot request scopes it has not been granted
    const unauthorizedScopes = requestedScopes.filter((s) => !client.allowedScopes.includes(s));
    if (unauthorizedScopes.length > 0) {
      throw new BadRequestException({
        error: 'invalid_scope',
        error_description: `Scope(s) [${unauthorizedScopes.join(', ')}] are not authorized for client "${req.client_id}".`,
      });
    }

    const role: UserRole = requestedScopes.includes('news:admin') ? 'admin' : 'ai_agent';

    const token = AuthService.generateToken(
      {
        id: `agent_${client.clientId.replace(/[^a-zA-Z0-9_-]/g, '_')}`,
        organizationId: 'org_globalpulse',
        role,
        clientType: client.clientType,
        scopes: requestedScopes,
        agentMetadata: {
          model: 'autonomous-agent-daemon',
          provider:
            client.clientType === 'claude'
              ? 'anthropic'
              : client.clientType === 'gemini'
                ? 'google'
                : client.clientType === 'chatgpt'
                  ? 'openai'
                  : 'custom',
        },
      },
      undefined,
      '24h'
    );

    return {
      access_token: token,
      token_type: 'Bearer',
      expires_in: 86400,
      scope: requestedScopes.join(' '),
    };
  }

  private verifyPkce(verifier: string, challenge: string): boolean {
    // S256: BASE64URL-ENCODE(SHA256(ASCII(code_verifier)))
    const hash = crypto.createHash('sha256').update(verifier, 'ascii').digest('base64url');
    return hash === challenge;
  }
}

export const oauthService = new OAuthService();
