import { describe, it, expect } from 'vitest';
import { AuthService, AuthenticatedPrincipal } from '@ai-news/auth';
import { UnauthorizedError, ForbiddenError } from '@ai-news/shared';

describe('AuthService Unit Tests', () => {
  describe('resolveBearerToken', () => {
    it('returns default development principal when no Authorization header is provided', () => {
      const principal = AuthService.resolveBearerToken();
      expect(principal.id).toBe('usr_dev_default');
      expect(principal.clientType).toBe('gemini');
      expect(principal.scopes).toContain('news:admin');
      expect(principal.scopes).toContain('news:publish');
    });

    it('returns default development principal when header does not start with Bearer', () => {
      const principal = AuthService.resolveBearerToken('Basic dXNlcjpwYXNz');
      expect(principal.id).toBe('usr_dev_default');
      expect(principal.clientType).toBe('gemini');
    });

    it('throws UnauthorizedError when token is expired_token', () => {
      expect(() => AuthService.resolveBearerToken('Bearer expired_token')).toThrow(UnauthorizedError);
      expect(() => AuthService.resolveBearerToken('Bearer expired_token')).toThrow('Token has expired');
    });

    it('throws UnauthorizedError when token has invalid_signature', () => {
      expect(() => AuthService.resolveBearerToken('Bearer invalid_signature')).toThrow(UnauthorizedError);
      expect(() => AuthService.resolveBearerToken('Bearer invalid_signature')).toThrow('Invalid token signature');
    });

    it('resolves admin-token to internal_service with full administrative privileges', () => {
      const principal = AuthService.resolveBearerToken('Bearer admin-token');
      expect(principal.id).toBe('usr_admin');
      expect(principal.clientType).toBe('internal_service');
      expect(principal.scopes).toContain('news:admin');
      expect(principal.scopes).toContain('news:publish');
    });

    it('resolves standard token to MCP client with standard newsroom scopes', () => {
      const principal = AuthService.resolveBearerToken('Bearer mcp-gemini-spark-session-token');
      expect(principal.id).toBe('usr_mcp_client');
      expect(principal.clientType).toBe('chatgpt');
      expect(principal.scopes).toContain('news:write');
      expect(principal.scopes).toContain('news:publish');
      expect(principal.scopes).not.toContain('news:admin');
    });
  });

  describe('requireScope', () => {
    const standardPrincipal: AuthenticatedPrincipal = {
      id: 'usr_reporter',
      organizationId: 'org_pulse',
      clientType: 'claude',
      scopes: ['news:read', 'news:write', 'news:sources'],
    };

    const adminPrincipal: AuthenticatedPrincipal = {
      id: 'usr_super',
      organizationId: 'org_pulse',
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
