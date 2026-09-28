import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { FastifyInstance } from 'fastify';
import * as crypto from 'crypto';
import { buildServer } from '../../../apps/api/src/server';
import { AuthService } from '@ai-news/auth';

describe('OAuth 2.1 & RFC 8414 Authorization Server Integration Tests', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = buildServer();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('RFC 8414 & RFC 9723 Discovery Metadata', () => {
    it('serves /.well-known/oauth-authorization-server metadata', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/.well-known/oauth-authorization-server',
      });

      expect(res.statusCode).toBe(200);
      const meta = JSON.parse(res.body);
      expect(meta.issuer).toBeDefined();
      expect(meta.authorization_endpoint).toContain('/oauth/authorize');
      expect(meta.token_endpoint).toContain('/oauth/token');
      expect(meta.jwks_uri).toContain('/oauth/jwks');
      expect(meta.grant_types_supported).toContain('authorization_code');
      expect(meta.grant_types_supported).toContain('client_credentials');
      expect(meta.code_challenge_methods_supported).toContain('S256');
      expect(meta.scopes_supported).toContain('news:read');
      expect(meta.scopes_supported).toContain('news:write');
    });

    it('serves /.well-known/oauth-protected-resource metadata', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/.well-known/oauth-protected-resource',
      });

      expect(res.statusCode).toBe(200);
      const meta = JSON.parse(res.body);
      expect(meta.resource).toBeDefined();
      expect(meta.authorization_servers).toBeInstanceOf(Array);
      expect(meta.scopes_supported).toContain('news:read');
    });

    it('serves /.well-known/openid-configuration metadata', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/.well-known/openid-configuration',
      });

      expect(res.statusCode).toBe(200);
      const meta = JSON.parse(res.body);
      expect(meta.authorization_endpoint).toBeDefined();
      expect(meta.token_endpoint).toBeDefined();
    });

    it('serves /oauth/jwks public keys', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/oauth/jwks',
      });

      expect(res.statusCode).toBe(200);
      const jwks = JSON.parse(res.body);
      expect(jwks.keys).toBeInstanceOf(Array);
      expect(jwks.keys.length).toBeGreaterThan(0);
    });
  });

  describe('RFC 7636 PKCE Authorization Code Grant for External AI Agents', () => {
    // Generate valid PKCE code_verifier and code_challenge
    const codeVerifier = crypto.randomBytes(32).toString('base64url');
    const codeChallenge = crypto
      .createHash('sha256')
      .update(codeVerifier, 'ascii')
      .digest('base64url');

    let authorizationCode: string;

    it('handles /oauth/authorize and issues short-lived authorization code', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/oauth/authorize',
        payload: {
          response_type: 'code',
          client_id: 'claude_desktop_agent',
          scope: 'news:read news:write news:publish',
          state: 'state_anti_csrf_99',
          code_challenge: codeChallenge,
          code_challenge_method: 'S256',
        },
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.code).toBeDefined();
      expect(body.code.startsWith('authcode_')).toBe(true);
      expect(body.state).toBe('state_anti_csrf_99');

      authorizationCode = body.code;
    });

    it('rejects /oauth/token if PKCE code_verifier does not match code_challenge', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/oauth/token',
        payload: {
          grant_type: 'authorization_code',
          client_id: 'claude_desktop_agent',
          code: authorizationCode,
          code_verifier: 'invalid_code_verifier_12345678901234567890',
        },
      });

      expect(res.statusCode).toBe(400);
      const err = JSON.parse(res.body);
      expect(err.error || err.detail).toBeDefined();
    });

    it('successfully exchanges code with valid code_verifier and issues AI Principal JWT', async () => {
      // Re-issue a fresh code for exchange
      const authRes = await app.inject({
        method: 'POST',
        url: '/oauth/authorize',
        payload: {
          response_type: 'code',
          client_id: 'claude_desktop_agent',
          scope: 'news:read news:write news:publish',
          code_challenge: codeChallenge,
          code_challenge_method: 'S256',
        },
      });
      const freshCode = JSON.parse(authRes.body).code;

      const tokenRes = await app.inject({
        method: 'POST',
        url: '/oauth/token',
        payload: {
          grant_type: 'authorization_code',
          client_id: 'claude_desktop_agent',
          code: freshCode,
          code_verifier: codeVerifier,
        },
      });

      expect(tokenRes.statusCode).toBe(200);
      const tokenBody = JSON.parse(tokenRes.body);
      expect(tokenBody.access_token).toBeDefined();
      expect(tokenBody.token_type).toBe('Bearer');
      expect(tokenBody.expires_in).toBe(86400);
      expect(tokenBody.scope).toContain('news:read');
      expect(tokenBody.scope).toContain('news:write');

      // Verify the generated token decodes properly into an authenticated AI Principal
      const principal = AuthService.verifyToken(tokenBody.access_token);
      expect(principal.role).toBe('ai_agent');
      expect(principal.clientType).toBe('claude');
      expect(principal.scopes).toContain('news:read');
      expect(principal.scopes).toContain('news:write');
      expect(principal.scopes).toContain('news:publish');

      // Single-use guarantee: exchanging the same code again must fail
      const reuseRes = await app.inject({
        method: 'POST',
        url: '/oauth/token',
        payload: {
          grant_type: 'authorization_code',
          client_id: 'claude_desktop_agent',
          code: freshCode,
          code_verifier: codeVerifier,
        },
      });
      expect(reuseRes.statusCode).toBe(400);
    });
  });

  describe('Client Credentials Grant for Autonomous External AI Daemons', () => {
    it('issues JWT token for autonomous Gemini agent daemon via client_credentials', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/oauth/token',
        payload: {
          grant_type: 'client_credentials',
          client_id: 'gemini_agent_service',
          client_secret: 'sec_test_gemini_999',
          scope: 'news:read news:search news:write',
        },
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.access_token).toBeDefined();
      expect(body.token_type).toBe('Bearer');
      expect(body.expires_in).toBe(86400);

      const principal = AuthService.verifyToken(body.access_token);
      expect(principal.role).toBe('ai_agent');
      expect(principal.clientType).toBe('gemini');
      expect(principal.scopes).toContain('news:read');
      expect(principal.scopes).toContain('news:search');
      expect(principal.scopes).toContain('news:write');
    });

    it('rejects unsupported grant types with RFC 6749 error', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/oauth/token',
        payload: {
          grant_type: 'implicit_password_unknown',
        },
      });

      expect(res.statusCode).toBe(400);
    });

    it('rejects client_credentials request without valid client_secret (OAuth token forgery prevention)', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/oauth/token',
        payload: {
          grant_type: 'client_credentials',
          client_id: 'gemini_agent_service',
          // Missing client_secret
          scope: 'news:read',
        },
      });

      expect(res.statusCode).toBe(401);
      const err = JSON.parse(res.body);
      expect(err.error || err.detail).toMatch(/invalid_client/i);
    });

    it('rejects client_credentials request with incorrect client_secret', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/oauth/token',
        payload: {
          grant_type: 'client_credentials',
          client_id: 'gemini_agent_service',
          client_secret: 'wrong_secret_attack',
          scope: 'news:read',
        },
      });

      expect(res.statusCode).toBe(401);
      const err = JSON.parse(res.body);
      expect(err.error || err.detail).toMatch(/invalid_client/i);
    });

    it('rejects unauthorized scope elevation (e.g. requesting news:admin without authorization)', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/oauth/token',
        payload: {
          grant_type: 'client_credentials',
          client_id: 'gemini_agent_service',
          client_secret: 'sec_test_gemini_999',
          scope: 'news:read news:admin',
        },
      });

      expect(res.statusCode).toBe(400);
      const err = JSON.parse(res.body);
      expect(err.error || err.detail).toMatch(/invalid_scope/i);
    });

    it('allows news:admin scope for authorized admin client with valid credentials', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/oauth/token',
        payload: {
          grant_type: 'client_credentials',
          client_id: 'globalpulse_admin_client',
          client_secret: 'sec_admin_secret_globalpulse',
          scope: 'news:read news:admin',
        },
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.access_token).toBeDefined();

      const principal = AuthService.verifyToken(body.access_token);
      expect(principal.scopes).toContain('news:admin');
    });
  });

  describe('OAuth Redirect URI and PKCE Security Hardening', () => {
    it('rejects /oauth/authorize with unregistered redirect_uri (open redirect prevention)', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/oauth/authorize',
        payload: {
          response_type: 'code',
          client_id: 'claude_desktop_agent',
          redirect_uri: 'https://malicious-attacker-site.com/steal-code',
          code_challenge: 'E9Melhoa2OwvFrGMTJguCH5rtx64410-gZB7GfqWtZo',
          code_challenge_method: 'S256',
        },
      });

      expect(res.statusCode).toBe(400);
      const err = JSON.parse(res.body);
      expect(err.error || err.detail).toMatch(/invalid_request/i);
    });

    it('rejects /oauth/authorize when PKCE code_challenge is missing', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/oauth/authorize',
        payload: {
          response_type: 'code',
          client_id: 'claude_desktop_agent',
          redirect_uri: 'http://localhost:3000/oauth/callback',
          // Missing code_challenge
        },
      });

      expect(res.statusCode).toBe(400);
      const err = JSON.parse(res.body);
      expect(err.error || err.detail).toMatch(/invalid_request/i);
    });

    it('rejects /oauth/authorize when code_challenge_method is plain', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/oauth/authorize',
        payload: {
          response_type: 'code',
          client_id: 'claude_desktop_agent',
          redirect_uri: 'http://localhost:3000/oauth/callback',
          code_challenge: 'plain_challenge_string',
          code_challenge_method: 'plain',
        },
      });

      expect(res.statusCode).toBe(400);
      const err = JSON.parse(res.body);
      expect(err.error || err.detail).toMatch(/invalid_request/i);
    });
  });
});
