import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { FastifyInstance } from 'fastify';
import { buildServer } from '../../../apps/api/src/server';
import { db } from '@ai-news/database';
import { PasswordHasher } from '@ai-news/auth';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerUserTools } from '../../../apps/mcp-server/src/tools/user.tools';

describe('User Accounts, Authentication Flow & Following (F1, F17)', () => {
  let app: FastifyInstance;
  const testOrgId = 'org_default';

  beforeEach(async () => {
    db.clear();
    app = buildServer({ logger: false });
    await app.ready();
  });

  afterEach(async () => {
    await app.close();
    db.clear();
  });

  describe('F1: Cryptographic PasswordHasher', () => {
    it('hashes passwords with unique random salts and verifies match', () => {
      const plain = 'SecretSecurePassword2026!';
      const hash1 = PasswordHasher.hash(plain);
      const hash2 = PasswordHasher.hash(plain);

      expect(hash1).not.toBe(hash2); // Different salts
      expect(PasswordHasher.verify(plain, hash1)).toBe(true);
      expect(PasswordHasher.verify(plain, hash2)).toBe(true);
      expect(PasswordHasher.verify('WrongPassword', hash1)).toBe(false);
      expect(PasswordHasher.verify('', hash1)).toBe(false);
      expect(PasswordHasher.verify(plain, 'invalid:hash')).toBe(false);
    });
  });

  describe('F1: Registration, Login & Session Management', () => {
    const testUser = {
      name: 'Dr. Jane Quantum',
      email: 'jane.quantum@science.org',
      password: 'ComplexPassword123#',
    };

    it('registers a new reader account, returns signed JWT, and sets httpOnly cookie', async () => {
      const regRes = await app.inject({
        method: 'POST',
        url: '/api/auth/register',
        payload: testUser,
      });

      expect(regRes.statusCode).toBe(201);
      const body = JSON.parse(regRes.body);
      expect(body.user.email).toBe(testUser.email.toLowerCase());
      expect(body.user.role).toBe('reader');
      expect(body.user.passwordHash).toBeDefined();
      expect(body.token).toBeDefined();

      // Check cookie
      const setCookie = regRes.headers['set-cookie'];
      expect(setCookie).toBeDefined();
      expect(setCookie).toContain('gp_token=');
      expect(setCookie).toContain('HttpOnly');
    });

    it('rejects registration with existing email', async () => {
      await app.inject({
        method: 'POST',
        url: '/api/auth/register',
        payload: testUser,
      });

      const dupRes = await app.inject({
        method: 'POST',
        url: '/api/auth/register',
        payload: testUser,
      });

      expect(dupRes.statusCode).toBe(409);
    });

    it('logs in successfully with correct credentials', async () => {
      await app.inject({
        method: 'POST',
        url: '/api/auth/register',
        payload: testUser,
      });

      const loginRes = await app.inject({
        method: 'POST',
        url: '/api/auth/login',
        payload: {
          email: testUser.email,
          password: testUser.password,
        },
      });

      expect(loginRes.statusCode).toBe(200);
      const body = JSON.parse(loginRes.body);
      expect(body.user.email).toBe(testUser.email.toLowerCase());
      expect(body.token).toBeDefined();
      expect(loginRes.headers['set-cookie']).toContain('gp_token=');
    });

    it('rejects login with incorrect password', async () => {
      await app.inject({
        method: 'POST',
        url: '/api/auth/register',
        payload: testUser,
      });

      const failRes = await app.inject({
        method: 'POST',
        url: '/api/auth/login',
        payload: {
          email: testUser.email,
          password: 'IncorrectPassword999',
        },
      });

      expect(failRes.statusCode).toBe(401);
    });

    it('clears session cookie on logout', async () => {
      const logoutRes = await app.inject({
        method: 'POST',
        url: '/api/auth/logout',
      });

      expect(logoutRes.statusCode).toBe(200);
      expect(logoutRes.headers['set-cookie']).toContain('Max-Age=0');
    });

    it('retrieves user profile and updates user preferences', async () => {
      const regRes = await app.inject({
        method: 'POST',
        url: '/api/auth/register',
        payload: testUser,
      });
      const { token } = JSON.parse(regRes.body);

      // GET /api/auth/me
      const meRes = await app.inject({
        method: 'GET',
        url: '/api/auth/me',
        headers: { authorization: `Bearer ${token}` },
      });

      expect(meRes.statusCode).toBe(200);
      const me = JSON.parse(meRes.body);
      expect(me.email).toBe(testUser.email.toLowerCase());
      expect(me.stats.followingCount).toBe(0);

      // PUT /api/auth/preferences
      const prefRes = await app.inject({
        method: 'PUT',
        url: '/api/auth/preferences',
        headers: { authorization: `Bearer ${token}` },
        payload: {
          categories: ['technology', 'science'],
          emailFrequency: 'weekly',
          theme: 'dark',
        },
      });

      expect(prefRes.statusCode).toBe(200);
      const updatedUser = JSON.parse(prefRes.body);
      expect(updatedUser.preferences.categories).toEqual(['technology', 'science']);
      expect(updatedUser.preferences.emailFrequency).toBe('weekly');
      expect(updatedUser.preferences.theme).toBe('dark');
    });
  });

  describe('F17: Following Interests (Topics, Entities, Authors)', () => {
    let userToken: string;

    beforeEach(async () => {
      const regRes = await app.inject({
        method: 'POST',
        url: '/api/auth/register',
        payload: {
          name: 'Reader Follower',
          email: 'follower@news.reader',
          password: 'Password123#456',
        },
      });
      userToken = JSON.parse(regRes.body).token;
    });

    it('allows user to follow and unfollow topics and entities', async () => {
      // 1. Follow a topic
      const followRes = await app.inject({
        method: 'POST',
        url: '/api/users/follow',
        headers: { authorization: `Bearer ${userToken}` },
        payload: { targetType: 'topic', targetId: 'artificial-intelligence' },
      });

      expect(followRes.statusCode).toBe(200);
      const follow = JSON.parse(followRes.body);
      expect(follow.targetType).toBe('topic');
      expect(follow.targetId).toBe('artificial-intelligence');

      // 2. Follow an author
      await app.inject({
        method: 'POST',
        url: '/api/users/follow',
        headers: { authorization: `Bearer ${userToken}` },
        payload: { targetType: 'author', targetId: 'usr_journalist_1' },
      });

      // 3. Check isFollowing
      const checkRes = await app.inject({
        method: 'GET',
        url: '/api/users/following/topic/artificial-intelligence',
        headers: { authorization: `Bearer ${userToken}` },
      });
      expect(checkRes.statusCode).toBe(200);
      expect(JSON.parse(checkRes.body).following).toBe(true);

      // 4. List following
      const listRes = await app.inject({
        method: 'GET',
        url: '/api/users/following',
        headers: { authorization: `Bearer ${userToken}` },
      });
      expect(listRes.statusCode).toBe(200);
      const list = JSON.parse(listRes.body);
      expect(list.length).toBe(2);

      // 5. Unfollow topic
      const unfollowRes = await app.inject({
        method: 'DELETE',
        url: '/api/users/follow/topic/artificial-intelligence',
        headers: { authorization: `Bearer ${userToken}` },
      });
      expect(unfollowRes.statusCode).toBe(200);
      expect(JSON.parse(unfollowRes.body).success).toBe(true);

      // 6. Verify isFollowing is now false
      const checkAfterRes = await app.inject({
        method: 'GET',
        url: '/api/users/following/topic/artificial-intelligence',
        headers: { authorization: `Bearer ${userToken}` },
      });
      expect(JSON.parse(checkAfterRes.body).following).toBe(false);
    });
  });

  describe('F17: MCP Follow Interest Tools', () => {
    it('executes follow_interest, list_user_following, and unfollow_interest via MCP', async () => {
      const server = new McpServer({
        name: 'test-user-mcp',
        version: '1.0.0',
      });

      const principal = {
        id: 'usr_mcp_agent_42',
        organizationId: testOrgId,
        role: 'ai_agent' as const,
        clientType: 'gemini' as const,
        scopes: ['news:read', 'news:write'] as Array<'news:read' | 'news:write'>,
      };

      registerUserTools(server, db, () => principal);

      const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
      const client = new Client(
        { name: 'mcp-test-client', version: '1.0.0' },
        { capabilities: {} }
      );

      await server.connect(serverTransport);
      await client.connect(clientTransport);

      try {
        // Follow interest
        const followResult = await client.callTool({
          name: 'follow_interest',
          arguments: {
            target_type: 'topic',
            target_id: 'quantum-computing',
          },
        });
        const followData = JSON.parse(
          (followResult as unknown as { content: Array<{ text: string }> }).content[0].text
        );
        expect(followData.follow.targetId).toBe('quantum-computing');

        // List following
        const listResult = await client.callTool({
          name: 'list_user_following',
          arguments: {},
        });
        const listData = JSON.parse(
          (listResult as unknown as { content: Array<{ text: string }> }).content[0].text
        );
        expect(listData.count).toBe(1);
        expect(listData.following[0].targetId).toBe('quantum-computing');

        // Unfollow interest
        const unfollowResult = await client.callTool({
          name: 'unfollow_interest',
          arguments: {
            target_type: 'topic',
            target_id: 'quantum-computing',
          },
        });
        const unfollowData = JSON.parse(
          (unfollowResult as unknown as { content: Array<{ text: string }> }).content[0].text
        );
        expect(unfollowData.success).toBe(true);
      } finally {
        await client.close();
        await server.close();
      }
    });
  });
});
