import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { FastifyInstance } from 'fastify';
import { buildServer } from '../../../apps/api/src/server';
import { db } from '@ai-news/database';
import { AuthService } from '@ai-news/auth';
import { CollaborationService } from '@ai-news/stories';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerEditorialTools } from '../../../apps/mcp-server/src/tools/editorial.tools';

describe('Multi-Author Collaboration & Editorial Kanban (F8, F9)', () => {
  let app: FastifyInstance;
  const testOrgId = 'org_default';

  let editorToken1: string;
  let editorToken2: string;
  let testStoryId: string;

  beforeEach(async () => {
    db.clear();
    app = buildServer({ logger: false });
    await app.ready();

    editorToken1 = AuthService.generateToken({
      id: 'usr_editor_alice',
      organizationId: testOrgId,
      role: 'editor',
      clientType: 'human_web',
      scopes: ['news:read', 'news:write'],
    });

    editorToken2 = AuthService.generateToken({
      id: 'usr_editor_bob',
      organizationId: testOrgId,
      role: 'editor',
      clientType: 'human_web',
      scopes: ['news:read', 'news:write'],
    });

    const now = new Date().toISOString();
    const scheduledTime = new Date(Date.now() + 24 * 3600 * 1000).toISOString();

    const story1 = await db.stories.create({
      id: 'sty_kanban_draft',
      organizationId: testOrgId,
      slug: 'investigative-deep-dive-ai',
      title: 'Investigative Deep Dive into Frontier AI Architectures',
      summary: 'Draft investigation on scaling frontiers.',
      status: 'DRAFT',
      articleType: 'analysis',
      authorId: 'usr_editor_alice',
      createdByClient: 'human_web',
      createdVia: 'web',
      currentVersionNumber: 1,
      topicIds: ['ai'],
      entityIds: ['ent_deepmind'],
      sourceIds: [],
      blocks: [],
      publishedAt: now,
      createdAt: now,
      updatedAt: now,
      wordCount: 200,
      readingTimeMinutes: 1,
    });
    testStoryId = story1.id;

    await db.stories.create({
      id: 'sty_kanban_scheduled',
      organizationId: testOrgId,
      slug: 'markets-closing-bell-recap',
      title: 'Global Markets Closing Bell Roundup',
      summary: 'Scheduled summary for tomorrow morning.',
      status: 'SCHEDULED',
      scheduledPublishAt: scheduledTime,
      articleType: 'markets',
      authorId: 'usr_editor_bob',
      createdByClient: 'human_web',
      createdVia: 'web',
      currentVersionNumber: 1,
      topicIds: ['finance'],
      entityIds: ['ent_nyse'],
      sourceIds: [],
      blocks: [],
      publishedAt: scheduledTime,
      createdAt: now,
      updatedAt: now,
      wordCount: 300,
      readingTimeMinutes: 2,
    });
  });

  afterEach(async () => {
    await app.close();
    db.clear();
  });

  describe('F8: Multi-Author Presence & Draft Locking Core Logic', () => {
    it('acquires exclusive lease lock and blocks concurrent editor collision', async () => {
      const collaborationService = new CollaborationService(db);

      // User 1 acquires lock
      const user1 = {
        id: 'usr_editor_alice',
        name: 'Alice Editor',
        role: 'editor',
        clientType: 'human_web',
      };
      const lockRes1 = await collaborationService.acquireLock(testStoryId, user1, 300, testOrgId);

      expect(lockRes1.success).toBe(true);
      expect(lockRes1.lock?.lockedBy.id).toBe('usr_editor_alice');

      // User 2 attempts to acquire lock on the same story -> rejected
      const user2 = {
        id: 'usr_editor_bob',
        name: 'Bob Editor',
        role: 'editor',
        clientType: 'human_web',
      };
      const lockRes2 = await collaborationService.acquireLock(testStoryId, user2, 300, testOrgId);

      expect(lockRes2.success).toBe(false);
      expect(lockRes2.heldBy?.id).toBe('usr_editor_alice');

      // User 1 releases lock
      const releaseRes = await collaborationService.releaseLock(testStoryId, 'usr_editor_alice');
      expect(releaseRes).toBe(true);

      // Now User 2 can successfully acquire lock
      const lockRes3 = await collaborationService.acquireLock(testStoryId, user2, 300, testOrgId);
      expect(lockRes3.success).toBe(true);
      expect(lockRes3.lock?.lockedBy.id).toBe('usr_editor_bob');
    });

    it('tracks presence and prunes inactive sessions', async () => {
      const collaborationService = new CollaborationService(db);

      collaborationService.pingPresence(testStoryId, { id: 'usr_alice', name: 'Alice' });
      collaborationService.pingPresence(testStoryId, { id: 'usr_bob', name: 'Bob' });

      const presence = await collaborationService.getPresence(testStoryId);
      expect(presence.activeUsers.length).toBe(2);
      expect(presence.activeUsers.map((u) => u.id)).toContain('usr_alice');
      expect(presence.activeUsers.map((u) => u.id)).toContain('usr_bob');
    });
  });

  describe('F9: Editorial Kanban & Calendar Core Logic', () => {
    it('partitions newsroom stories into Kanban workflow columns', async () => {
      const collaborationService = new CollaborationService(db);
      const board = await collaborationService.getKanbanBoard(testOrgId);

      expect(board.totalCount).toBe(2);
      expect(board.columns.DRAFT.length).toBe(1);
      expect(board.columns.DRAFT[0].id).toBe('sty_kanban_draft');
      expect(board.columns.SCHEDULED.length).toBe(1);
      expect(board.columns.SCHEDULED[0].id).toBe('sty_kanban_scheduled');
      expect(board.columns.PUBLISHED.length).toBe(0);
    });

    it('transitions story status with validation', async () => {
      const collaborationService = new CollaborationService(db);
      const updated = await collaborationService.transitionStoryStatus(
        testStoryId,
        'IN_REVIEW',
        testOrgId
      );

      expect(updated.status).toBe('IN_REVIEW');

      const board = await collaborationService.getKanbanBoard(testOrgId);
      expect(board.columns.IN_REVIEW.length).toBe(1);
      expect(board.columns.DRAFT.length).toBe(0);
    });

    it('retrieves calendar schedule', async () => {
      const collaborationService = new CollaborationService(db);
      const calendar = await collaborationService.getCalendarSchedule(testOrgId);

      expect(calendar.scheduledStories.length).toBe(1);
      expect(calendar.scheduledStories[0].id).toBe('sty_kanban_scheduled');
    });
  });

  describe('REST API Endpoints: Editorial Collaboration & Kanban', () => {
    it('acquires and releases lock via REST API', async () => {
      // 1. Acquire lock
      const acqRes = await app.inject({
        method: 'POST',
        url: `/api/stories/${testStoryId}/lock/acquire`,
        headers: { authorization: `Bearer ${editorToken1}` },
      });

      expect(acqRes.statusCode).toBe(200);
      const acqBody = JSON.parse(acqRes.body);
      expect(acqBody.success).toBe(true);

      // 2. Second editor blocked
      const blockedRes = await app.inject({
        method: 'POST',
        url: `/api/stories/${testStoryId}/lock/acquire`,
        headers: { authorization: `Bearer ${editorToken2}` },
      });

      expect(blockedRes.statusCode).toBe(200);
      const blockedBody = JSON.parse(blockedRes.body);
      expect(blockedBody.success).toBe(false);

      // 3. Heartbeat by first editor
      const hbRes = await app.inject({
        method: 'POST',
        url: `/api/stories/${testStoryId}/lock/heartbeat`,
        headers: { authorization: `Bearer ${editorToken1}` },
      });
      expect(hbRes.statusCode).toBe(200);

      // 4. Release lock
      const relRes = await app.inject({
        method: 'POST',
        url: `/api/stories/${testStoryId}/lock/release`,
        headers: { authorization: `Bearer ${editorToken1}` },
      });
      expect(relRes.statusCode).toBe(200);
    });

    it('retrieves kanban board and transitions status via REST API', async () => {
      // 1. Get Kanban board
      const kbRes = await app.inject({
        method: 'GET',
        url: '/api/editorial/kanban',
        headers: { authorization: `Bearer ${editorToken1}` },
      });

      expect(kbRes.statusCode).toBe(200);
      const kbBody = JSON.parse(kbRes.body);
      expect(kbBody.columns.DRAFT.length).toBe(1);

      // 2. Transition status
      const transRes = await app.inject({
        method: 'PUT',
        url: `/api/stories/${testStoryId}/status`,
        headers: { authorization: `Bearer ${editorToken1}` },
        payload: {
          status: 'PUBLISHED',
        },
      });

      expect(transRes.statusCode).toBe(200);
      const transBody = JSON.parse(transRes.body);
      expect(transBody.status).toBe('PUBLISHED');
    });
  });

  describe('MCP Tools: Editorial Collaboration & Kanban', () => {
    it('executes lock, kanban, and transition tools over MCP', async () => {
      const server = new McpServer({
        name: 'test-editorial-mcp',
        version: '1.0.0',
      });

      const principal = {
        id: 'usr_ai_editor',
        organizationId: testOrgId,
        role: 'ai_agent' as const,
        clientType: 'gemini' as const,
        scopes: ['news:read', 'news:write'] as Array<'news:read' | 'news:write'>,
      };

      registerEditorialTools(server, db, () => principal);

      const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
      const client = new Client(
        { name: 'mcp-test-client', version: '1.0.0' },
        { capabilities: {} }
      );

      await server.connect(serverTransport);
      await client.connect(clientTransport);

      try {
        // 1. acquire_story_lock
        const acqRes = await client.callTool({
          name: 'acquire_story_lock',
          arguments: { storyId: testStoryId, ttlSeconds: 120 },
        });
        const acqData = JSON.parse((acqRes as any).content[0].text);
        expect(acqData.success).toBe(true);

        // 2. get_editorial_kanban
        const kbRes = await client.callTool({
          name: 'get_editorial_kanban',
          arguments: {},
        });
        const kbData = JSON.parse((kbRes as any).content[0].text);
        expect(kbData.totalCount).toBeGreaterThanOrEqual(2);

        // 3. transition_story_status
        const transRes = await client.callTool({
          name: 'transition_story_status',
          arguments: { storyId: testStoryId, status: 'IN_REVIEW' },
        });
        const transData = JSON.parse((transRes as any).content[0].text);
        expect(transData.success).toBe(true);
        expect(transData.status).toBe('IN_REVIEW');

        // 4. release_story_lock
        const relRes = await client.callTool({
          name: 'release_story_lock',
          arguments: { storyId: testStoryId },
        });
        const relData = JSON.parse((relRes as any).content[0].text);
        expect(relData.success).toBe(true);
      } finally {
        await client.close();
        await server.close();
      }
    });
  });
});
