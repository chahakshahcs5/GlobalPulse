import { describe, it, expect } from 'vitest';
import { AuthService, AuthenticatedPrincipal } from '@ai-news/auth';
import { UnauthorizedError, ForbiddenError } from '@ai-news/shared';

describe('AuthService Unit Tests', () => {
  describe('resolveBearerToken', () => {
    it('returns read-only development principal when no Authorization header is provided', () => {
      const principal = AuthService.resolveBearerToken();
      expect(principal.id).toBe('usr_anonymous_dev');
      expect(principal.role).toBe('reader');
      expect(principal.clientType).toBe('human_web');
      expect(principal.scopes).toContain('news:read');
      expect(principal.scopes).not.toContain('news:admin');
      expect(principal.scopes).not.toContain('news:publish');
    });

    it('returns read-only development principal when header does not start with Bearer', () => {
      const principal = AuthService.resolveBearerToken('Basic dXNlcjpwYXNz');
      expect(principal.id).toBe('usr_anonymous_dev');
      expect(principal.role).toBe('reader');
    });

    it('throws UnauthorizedError when token is expired_token', () => {
      expect(() => AuthService.resolveBearerToken('Bearer expired_token')).toThrow(UnauthorizedError);
      expect(() => AuthService.resolveBearerToken('Bearer expired_token')).toThrow('Token has expired');
    });

    it('throws UnauthorizedError when token has invalid_signature', () => {
      expect(() => AuthService.resolveBearerToken('Bearer invalid_signature')).toThrow(UnauthorizedError);
      expect(() => AuthService.resolveBearerToken('Bearer invalid_signature')).toThrow('Invalid token signature');
    });

    it('resolves dev-admin to internal_service with full administrative privileges', () => {
      const principal = AuthService.resolveBearerToken('Bearer dev-admin');
      expect(principal.id).toBe('usr_dev_admin');
      expect(principal.clientType).toBe('internal_service');
      expect(principal.scopes).toContain('news:admin');
      expect(principal.scopes).toContain('news:publish');
    });

    it('rejects unrecognized non-JWT tokens instead of silently granting access', () => {
      expect(() => AuthService.resolveBearerToken('Bearer mcp-gemini-spark-session-token')).toThrow(UnauthorizedError);
      expect(() => AuthService.resolveBearerToken('Bearer random-string')).toThrow(UnauthorizedError);
    });

    it('strictly rejects unauthenticated requests when in production', () => {
      const prevEnv = process.env.NODE_ENV;
      const prevAllowDev = process.env.ALLOW_DEV_TOKENS;
      try {
        (process.env as Record<string, string | undefined>).NODE_ENV = 'production';
        delete process.env.ALLOW_DEV_TOKENS;

        expect(() => AuthService.resolveBearerToken()).toThrow(UnauthorizedError);
        expect(() => AuthService.resolveBearerToken('Basic credentials')).toThrow(UnauthorizedError);
        expect(() => AuthService.resolveBearerToken('Bearer ')).toThrow(UnauthorizedError);
        expect(() => AuthService.resolveBearerToken('Bearer dev-admin')).toThrow(UnauthorizedError);
        expect(() => AuthService.resolveBearerToken('Bearer dev-editor')).toThrow(UnauthorizedError);
      } finally {
        (process.env as Record<string, string | undefined>).NODE_ENV = prevEnv;
        if (prevAllowDev !== undefined) process.env.ALLOW_DEV_TOKENS = prevAllowDev;
      }
    });

    it('rejects tampered or forged JWT tokens rather than falling through', () => {
      const forgedToken = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.tamperedSignature';
      expect(() => AuthService.resolveBearerToken(forgedToken)).toThrow(UnauthorizedError);
    });
  });

  describe('requireScope', () => {
    const standardPrincipal: AuthenticatedPrincipal = {
      id: 'usr_reporter',
      organizationId: 'org_pulse',
      role: 'journalist',
      clientType: 'claude',
      scopes: ['news:read', 'news:write', 'news:sources'],
    };

    const adminPrincipal: AuthenticatedPrincipal = {
      id: 'usr_super',
      organizationId: 'org_pulse',
      role: 'admin',
      clientType: 'internal_service',
      scopes: ['news:admin'],
    };

    it('allows access when principal possesses the required scope', () => {
      expect(() => AuthService.requireScope(standardPrincipal, 'news:read')).not.toThrow();
      expect(() => AuthService.requireScope(standardPrincipal, 'news:write')).not.toThrow();
      expect(() => AuthService.requireScope(standardPrincipal, 'news:sources')).not.toThrow();
    });

    it('allows access to ANY scope when principal has news:admin', () => {
      expect(() => AuthService.requireScope(adminPrincipal, 'news:publish')).not.toThrow();
      expect(() => AuthService.requireScope(adminPrincipal, 'news:media')).not.toThrow();
      expect(() => AuthService.requireScope(adminPrincipal, 'news:topics')).not.toThrow();
    });

    it('throws ForbiddenError when principal lacks the required scope', () => {
      expect(() => AuthService.requireScope(standardPrincipal, 'news:publish')).toThrow(ForbiddenError);
      expect(() => AuthService.requireScope(standardPrincipal, 'news:publish')).toThrow(/Insufficient privileges/);
    });
  });

  describe('requireRole (RBAC)', () => {
    const editorPrincipal: AuthenticatedPrincipal = {
      id: 'usr_ed_1',
      organizationId: 'org_pulse',
      role: 'editor',
      clientType: 'human_web',
      scopes: ['news:read', 'news:write', 'news:publish'],
    };

    const readerPrincipal: AuthenticatedPrincipal = {
      id: 'usr_rd_1',
      organizationId: 'org_pulse',
      role: 'reader',
      clientType: 'human_mobile',
      scopes: ['news:read'],
    };

    const geminiPrincipal: AuthenticatedPrincipal = {
      id: 'usr_gemini',
      organizationId: 'org_pulse',
      role: 'ai_agent',
      clientType: 'gemini_spark',
      scopes: ['news:read', 'news:write'],
      agentMetadata: {
        agentName: 'Gemini Spark News Editor',
        model: 'gemini-2.5-flash',
        provider: 'google',
      },
    };

    it('allows access when principal possesses the required role', () => {
      expect(() => AuthService.requireRole(editorPrincipal, 'editor', 'admin')).not.toThrow();
      expect(() => AuthService.requireRole(geminiPrincipal, 'ai_agent')).not.toThrow();
    });

    it('throws ForbiddenError when principal has insufficient role', () => {
      expect(() => AuthService.requireRole(readerPrincipal, 'editor', 'admin')).toThrow(ForbiddenError);
      expect(() => AuthService.requireRole(readerPrincipal, 'editor', 'admin')).toThrow(/Insufficient role privileges/);
    });
  });

  describe('JWT Cryptographic Issuance & Verification', () => {
    it('signs and verifies valid JWT for human editor', () => {
      const token = AuthService.generateToken({
        id: 'usr_alice_editor',
        organizationId: 'org_global',
        role: 'editor',
        email: 'alice@globalpulse.news',
        clientType: 'human_web',
        scopes: ['news:read', 'news:write', 'news:publish'],
      });

      expect(typeof token).toBe('string');
      expect(token.split('.').length).toBe(3);

      const verified = AuthService.verifyToken(token);
      expect(verified.id).toBe('usr_alice_editor');
      expect(verified.role).toBe('editor');
      expect(verified.email).toBe('alice@globalpulse.news');
      expect(verified.scopes).toContain('news:publish');
    });

    it('signs and verifies JWT for AI Agent with metadata', () => {
      const token = AuthService.generateToken({
        id: 'agent_gemini_lead',
        organizationId: 'org_global',
        role: 'ai_agent',
        clientType: 'gemini',
        scopes: ['news:read', 'news:write'],
        agentMetadata: {
          agentName: 'Gemini Newsroom Analyst',
          model: 'gemini-2.5-pro',
          provider: 'google',
          version: '2026.3',
        },
      });

      const verified = AuthService.verifyToken(token);
      expect(verified.id).toBe('agent_gemini_lead');
      expect(verified.role).toBe('ai_agent');
      expect(verified.agentMetadata?.model).toBe('gemini-2.5-pro');
      expect(verified.agentMetadata?.provider).toBe('google');
    });
  });

  describe('getProtectedResourceMetadata (RFC 8414)', () => {
    it('returns compliant OAuth 2.0 Protected Resource Metadata document', () => {
      const meta = AuthService.getProtectedResourceMetadata('https://api.globalpulse.news');

      expect(meta.resource).toBe('https://api.globalpulse.news');
      expect(meta.authorization_servers).toContain('https://auth.globalpulse.news');
      expect(meta.bearer_methods_supported).toEqual(['header']);
      expect(meta.scopes_supported).toContain('news:read');
      expect(meta.scopes_supported).toContain('news:write');
      expect(meta.scopes_supported).toContain('news:publish');
      expect(meta.resource_documentation).toBe('https://docs.globalpulse.news/mcp-auth');
    });
  });
});
