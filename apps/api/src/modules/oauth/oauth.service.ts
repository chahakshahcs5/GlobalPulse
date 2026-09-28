import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import * as crypto from 'crypto';
import { AuthService, type ClientType, type NewsScope, type UserRole } from '@ai-news/auth';
import { appConfig } from '../../config/configuration';

export interface AuthorizationCodeEntry {
  code: string;
  clientId: string;
  redirectUri?: string;
  scopes: NewsScope[];
  codeChallenge?: string;
  codeChallengeMethod?: 'S256' | 'plain';
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
  code_challenge_method?: 'S256' | 'plain';
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

  constructor() {
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
      code_challenge_methods_supported: ['S256', 'plain'],
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
  createAuthorizationCode(req: AuthorizeRequest): { code: string; state?: string; redirect_uri?: string } {
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

    // Parse scopes
    const parsedScopes: NewsScope[] = req.scope
      ? (req.scope.split(/[\s,]+/).filter(Boolean) as NewsScope[])
      : DEFAULT_SCOPES;

    // Resolve clientType
    let clientType: ClientType = 'custom_mcp';
    const lowerId = req.client_id.toLowerCase();
    if (lowerId.includes('claude')) clientType = 'claude';
    else if (lowerId.includes('chatgpt') || lowerId.includes('openai')) clientType = 'chatgpt';
    else if (lowerId.includes('gemini')) clientType = 'gemini';

    const code = `authcode_${crypto.randomBytes(24).toString('hex')}`;
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minute TTL

    const entry: AuthorizationCodeEntry = {
      code,
      clientId: req.client_id,
      redirectUri: req.redirect_uri,
      scopes: parsedScopes,
      codeChallenge: req.code_challenge,
      codeChallengeMethod: req.code_challenge_method || (req.code_challenge ? 'S256' : undefined),
      expiresAt,
      principalId: `agent_${req.client_id.replace(/[^a-zA-Z0-9_-]/g, '_')}`,
      clientType,
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

    if (entry.redirectUri && req.redirect_uri && entry.redirectUri !== req.redirect_uri) {
      throw new BadRequestException({
        error: 'invalid_grant',
        error_description: 'redirect_uri mismatch with issued authorization code.',
      });
    }

    // PKCE Verification (RFC 7636)
    if (entry.codeChallenge) {
      if (!req.code_verifier) {
        throw new BadRequestException({
          error: 'invalid_request',
          error_description: 'code_verifier is required for PKCE-secured requests.',
        });
      }

      const isValid = this.verifyPkce(req.code_verifier, entry.codeChallenge, entry.codeChallengeMethod);
      if (!isValid) {
        throw new BadRequestException({
          error: 'invalid_grant',
          error_description: 'PKCE verification failed: code_verifier does not match code_challenge.',
        });
      }
    }

    // Generate production-grade JWT
    const token = AuthService.generateToken(
      {
        id: entry.principalId,
        organizationId: 'org_globalpulse',
        role: 'ai_agent' as UserRole,
        clientType: entry.clientType,
        scopes: entry.scopes,
        agentMetadata: {
          model: 'external-ai-model',
          provider: entry.clientType === 'claude' ? 'anthropic' : entry.clientType === 'gemini' ? 'google' : entry.clientType === 'chatgpt' ? 'openai' : 'custom',
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
    const clientId = req.client_id || 'anonymous_agent';

    let clientType: ClientType = 'custom_mcp';
    const lowerId = clientId.toLowerCase();
    if (lowerId.includes('claude')) clientType = 'claude';
    else if (lowerId.includes('chatgpt') || lowerId.includes('openai')) clientType = 'chatgpt';
    else if (lowerId.includes('gemini')) clientType = 'gemini';

    const requestedScopes: NewsScope[] = req.scope
      ? (req.scope.split(/[\s,]+/).filter(Boolean) as NewsScope[])
      : DEFAULT_SCOPES;

    const token = AuthService.generateToken(
      {
        id: `agent_${clientId.replace(/[^a-zA-Z0-9_-]/g, '_')}`,
        organizationId: 'org_globalpulse',
        role: 'ai_agent' as UserRole,
        clientType,
        scopes: requestedScopes,
        agentMetadata: {
          model: 'autonomous-agent-daemon',
          provider: clientType === 'claude' ? 'anthropic' : clientType === 'gemini' ? 'google' : clientType === 'chatgpt' ? 'openai' : 'custom',
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

  private verifyPkce(verifier: string, challenge: string, method?: 'S256' | 'plain'): boolean {
    if (method === 'plain') {
      return verifier === challenge;
    }
    // S256: BASE64URL-ENCODE(SHA256(ASCII(code_verifier)))
    const hash = crypto.createHash('sha256').update(verifier, 'ascii').digest('base64url');
    return hash === challenge;
  }
}

export const oauthService = new OAuthService();

