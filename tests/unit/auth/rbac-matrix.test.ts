import { describe, it, expect } from 'vitest';
import {
  AuthService,
  ROLE_PERMISSIONS,
  type AuthenticatedPrincipal,
  type AiAgentMetadata,
} from '@ai-news/auth';
import { ForbiddenError } from '@ai-news/shared';

describe('Enterprise RBAC Matrix & Token Lifecycle (Unit Tests)', () => {
  describe('Role-Permission Mapping Matrix', () => {
    it('grants universal permissions to admin role', () => {
      const adminScopes = ROLE_PERMISSIONS.admin;
      expect(adminScopes).toContain('news:admin');
      expect(adminScopes).toContain('news:read');
      expect(adminScopes).toContain('news:write');
      expect(adminScopes).toContain('news:publish');
      expect(adminScopes).toContain('news:media');
      expect(adminScopes).toContain('news:sources');
      expect(adminScopes).toContain('news:topics');
      expect(adminScopes).toContain('news:search');
    });

    it('grants publication and editorial scopes to editor role without admin scope', () => {
      const editorScopes = ROLE_PERMISSIONS.editor;
      expect(editorScopes).toContain('news:publish');
      expect(editorScopes).toContain('news:write');
      expect(editorScopes).not.toContain('news:admin');
    });

    it('grants draft creation and source editing to journalist role without publish scope', () => {
      const journalistScopes = ROLE_PERMISSIONS.journalist;
      expect(journalistScopes).toContain('news:write');
      expect(journalistScopes).toContain('news:sources');
      expect(journalistScopes).not.toContain('news:publish');
      expect(journalistScopes).not.toContain('news:admin');
    });

    it('restricts reader role to news:read and news:search scopes exclusively', () => {
      const readerScopes = ROLE_PERMISSIONS.reader;
      expect(readerScopes).toEqual(['news:read', 'news:search']);
    });

    it('equips ai_agent with autonomous pipeline scopes excluding news:admin', () => {
      const aiScopes = ROLE_PERMISSIONS.ai_agent;
      expect(aiScopes).toContain('news:read');
      expect(aiScopes).toContain('news:write');
      expect(aiScopes).toContain('news:publish');
      expect(aiScopes).toContain('news:sources');
      expect(aiScopes).not.toContain('news:admin');
    });
  });

  describe('AuthService.requireRole Enforcement', () => {
    it('allows admin role universal access across any role requirements', () => {
      const adminPrincipal: AuthenticatedPrincipal = {
        id: 'usr_admin',
        organizationId: 'org_1',
        role: 'admin',
        clientType: 'human_web',
        scopes: ROLE_PERMISSIONS.admin,
      };

      expect(() => AuthService.requireRole(adminPrincipal, 'journalist')).not.toThrow();
      expect(() => AuthService.requireRole(adminPrincipal, 'reader')).not.toThrow();
      expect(() => AuthService.requireRole(adminPrincipal, 'editor')).not.toThrow();
    });

    it('allows principal with news:admin scope universal access', () => {
      const privilegedPrincipal: AuthenticatedPrincipal = {
        id: 'usr_custom_admin',
        organizationId: 'org_1',
        role: 'editor',
        clientType: 'human_web',
        scopes: ['news:admin', 'news:read'],
      };

      expect(() => AuthService.requireRole(privilegedPrincipal, 'journalist')).not.toThrow();
    });

    it('permits access when principal possesses one of the allowed roles', () => {
      const editorPrincipal: AuthenticatedPrincipal = {
        id: 'usr_editor',
        organizationId: 'org_1',
        role: 'editor',
        clientType: 'human_web',
        scopes: ROLE_PERMISSIONS.editor,
      };

      expect(() => AuthService.requireRole(editorPrincipal, 'editor', 'admin')).not.toThrow();
    });

    it('throws ForbiddenError with descriptive message when role does not match', () => {
      const readerPrincipal: AuthenticatedPrincipal = {
        id: 'usr_reader',
        organizationId: 'org_1',
        role: 'reader',
        clientType: 'human_mobile',
        scopes: ROLE_PERMISSIONS.reader,
      };

      expect(() => AuthService.requireRole(readerPrincipal, 'editor', 'admin')).toThrow(
        ForbiddenError
      );
      expect(() => AuthService.requireRole(readerPrincipal, 'editor')).toThrow(
        'Insufficient role privileges. Required one of: [editor], but principal possesses role: "reader".'
      );
    });
  });

  describe('AuthService.requireScope Enforcement', () => {
    it('allows admin principal universal scope bypass', () => {
      const adminPrincipal: AuthenticatedPrincipal = {
        id: 'usr_admin',
        organizationId: 'org_1',
        role: 'admin',
        clientType: 'human_web',
        scopes: ROLE_PERMISSIONS.admin,
      };

      expect(() => AuthService.requireScope(adminPrincipal, 'news:publish')).not.toThrow();
      expect(() => AuthService.requireScope(adminPrincipal, 'news:write')).not.toThrow();
    });

    it('allows principal with the required scope', () => {
      const journalistPrincipal: AuthenticatedPrincipal = {
        id: 'usr_journo',
        organizationId: 'org_1',
        role: 'journalist',
        clientType: 'human_web',
        scopes: ROLE_PERMISSIONS.journalist,
      };

      expect(() => AuthService.requireScope(journalistPrincipal, 'news:write')).not.toThrow();
    });

    it('throws ForbiddenError when required scope is absent', () => {
      const readerPrincipal: AuthenticatedPrincipal = {
        id: 'usr_reader',
        organizationId: 'org_1',
        role: 'reader',
        clientType: 'human_mobile',
        scopes: ROLE_PERMISSIONS.reader,
      };

      expect(() => AuthService.requireScope(readerPrincipal, 'news:publish')).toThrow(
        ForbiddenError
      );
      expect(() => AuthService.requireScope(readerPrincipal, 'news:publish')).toThrow(
        'Insufficient privileges. Required scope: "news:publish", but principal has: [news:read, news:search]'
      );
    });
  });

  describe('Pre-configured Persona Resolution & AI Agent Metadata', () => {
    it('resolves Bearer dev-journalist to journalist role and scopes', () => {
      const principal = AuthService.resolveBearerToken('Bearer dev-journalist');
      expect(principal.id).toBe('usr_dev_journalist');
      expect(principal.role).toBe('journalist');
      expect(principal.scopes).toEqual(ROLE_PERMISSIONS.journalist);
    });

    it('resolves Bearer dev-reader to reader role and mobile client type', () => {
      const principal = AuthService.resolveBearerToken('Bearer dev-reader');
      expect(principal.id).toBe('usr_dev_reader');
      expect(principal.role).toBe('reader');
      expect(principal.clientType).toBe('human_mobile');
    });

    it('resolves Bearer dev-gemini to ai_agent role with gemini_spark client type', () => {
      const principal = AuthService.resolveBearerToken('Bearer dev-gemini');
      expect(principal.id).toBe('usr_dev_gemini');
      expect(principal.role).toBe('ai_agent');
      expect(principal.clientType).toBe('gemini_spark');
      expect(principal.scopes).toEqual(ROLE_PERMISSIONS.ai_agent);
    });

    it('resolves Bearer dev-chatgpt to ai_agent role with chatgpt client type', () => {
      const principal = AuthService.resolveBearerToken('Bearer dev-chatgpt');
      expect(principal.id).toBe('usr_dev_chatgpt');
      expect(principal.role).toBe('ai_agent');
      expect(principal.clientType).toBe('chatgpt');
      expect(principal.scopes).toEqual(ROLE_PERMISSIONS.ai_agent);
    });

    it('rejects unrecognized tokens instead of silently granting access', () => {
      expect(() => AuthService.resolveBearerToken('Bearer unknown-string')).toThrow();
    });
  });

  describe('JWT Cryptographic Generation & Verification', () => {
    it('generates signed JWT and successfully parses it back into an AuthenticatedPrincipal', () => {
      const token = AuthService.generateToken(
        {
          id: 'usr_crypto_test',
          organizationId: 'org_crypto_inc',
          role: 'editor',
          email: 'crypto@globalpulse.news',
          clientType: 'human_web',
          scopes: ['news:read', 'news:write'],
        },
        undefined,
        '2h'
      );

      expect(typeof token).toBe('string');
      expect(token.split('.').length).toBe(3);

      const verified = AuthService.verifyToken(token);
      expect(verified.id).toBe('usr_crypto_test');
      expect(verified.organizationId).toBe('org_crypto_inc');
      expect(verified.role).toBe('editor');
      expect(verified.email).toBe('crypto@globalpulse.news');
      expect(verified.scopes).toContain('news:read');
      expect(verified.scopes).toContain('news:write');
    });

    it('correctly maps default scopes when scopes are omitted in payload', () => {
      const token = AuthService.generateToken({
        id: 'usr_no_explicit_scopes',
        role: 'reader',
      });

      const verified = AuthService.verifyToken(token);
      expect(verified.scopes).toEqual(ROLE_PERMISSIONS.reader);
    });

    it('embeds and preserves AI agent metadata inside signed token', () => {
      const agentMetadata: AiAgentMetadata = {
        agentName: 'Custom Autonomous Bot',
        model: 'deepseek-v3',
        provider: 'deepseek',
        version: '1.0',
        capabilities: ['translation', 'summarization'],
      };

      const token = AuthService.generateToken({
        id: 'usr_deepseek_bot',
        role: 'ai_agent',
        clientType: 'custom_mcp',
        agentMetadata,
      });

      const verified = AuthService.verifyToken(token);
      expect(verified.role).toBe('ai_agent');
      expect(verified.agentMetadata).toEqual(agentMetadata);
    });
  });
});
