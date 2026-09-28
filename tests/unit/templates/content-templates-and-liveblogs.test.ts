import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { FastifyInstance } from 'fastify';
import { buildServer } from '../../../apps/api/src/server';
import { db } from '@ai-news/database';
import { AuthService } from '@ai-news/auth';
import { TemplateService, LiveblogService } from '@ai-news/stories';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerTemplateTools } from '../../../apps/mcp-server/src/tools/template.tools';
import { registerLiveblogTools } from '../../../apps/mcp-server/src/tools/liveblog.tools';

describe('Content Templates & Liveblog Dispatches (F10, F11)', () => {
  let app: FastifyInstance;
  const testOrgId = 'org_default';

  let editorToken: string;
  let readerToken: string;
  let testStoryId: string;

  beforeEach(async () => {
    db.clear();
    app = buildServer({ logger: false });
    await app.ready();

    editorToken = AuthService.generateToken({
      id: 'usr_editor_bob',
      organizationId: testOrgId,
      role: 'editor',
      clientType: 'human_web',
      scopes: ['news:read', 'news:write', 'news:publish'],
    });

    readerToken = AuthService.generateToken({
      id: 'usr_reader_alice',
      organizationId: testOrgId,
      role: 'reader',
      clientType: 'human_web',
      scopes: ['news:read'],
    });

    // Seed a liveblog story for testing F11
    const now = new Date().toISOString();
    const liveblogStory = await db.stories.create({
      id: 'sty_election_liveblog_01',
      organizationId: testOrgId,
      slug: 'general-election-live-coverage-2026',
      title: 'Global General Election 2026 Live Updates',
      summary: 'Continuous rolling coverage of polling results and exit analyses.',
      status: 'PUBLISHED',
      articleType: 'liveblog',
      authorId: 'usr_editor_bob',
      createdByClient: 'human_web',
      createdVia: 'admin',
      currentVersionNumber: 1,
      topicIds: ['elections', 'democracy'],
      entityIds: ['ent_election_commission'],
      sourceIds: [],
      blocks: [],
      publishedAt: now,
      createdAt: now,
      updatedAt: now,
      wordCount: 150,
      readingTimeMinutes: 1,
    });
    testStoryId = liveblogStory.id;
  });

  afterEach(async () => {
    await app.close();
    db.clear();
  });

  describe('F10: Content Templates Core Logic', () => {
    it('provides 5 canonical enterprise templates', () => {
      const templateService = new TemplateService(db);
      const templates = templateService.listTemplates();

      expect(templates.length).toBe(5);
      const ids = templates.map((t) => t.id);
      expect(ids).toContain('breaking_news_alert');
      expect(ids).toContain('investigative_deep_dive');
      expect(ids).toContain('editorial_opinion');
      expect(ids).toContain('liveblog_event');
      expect(ids).toContain('fact_check_report');
    });

    it('instantiates draft story with pre-populated skeleton blocks and computed metrics', async () => {
      const templateService = new TemplateService(db);
      const story = await templateService.instantiateStory(
        {
          templateId: 'investigative_deep_dive',
          title: 'Whistleblower Files: The Covert Offshore Cloud Infrastructure',
          summary: 'An investigative report on undisclosed corporate hosting networks.',
          topicIds: ['cybersecurity', 'governance'],
          entityIds: ['ent_cloudcorp'],
        },
        {
          organizationId: testOrgId,
          authorId: 'usr_editor_bob',
          clientType: 'human_web',
          createdVia: 'api',
        }
      );

      expect(story.id).toBeDefined();
      expect(story.status).toBe('DRAFT');
      expect(story.articleType).toBe('investigation');
      expect(story.blocks.length).toBeGreaterThanOrEqual(4);
      expect(story.wordCount).toBeGreaterThan(0);
      expect(story.readingTimeMinutes).toBeGreaterThanOrEqual(1);

      // Verify the blocks were saved to the database
      const fetched = await db.stories.findById(story.id, testOrgId);
      expect(fetched).toBeDefined();
      expect(fetched?.blocks.length).toBe(story.blocks.length);
    });
  });

  describe('F11: Liveblog Real-Time Dispatches Core Logic', () => {
    it('appends and retrieves live entries in reverse-chronological order', async () => {
      const liveblogService = new LiveblogService(db);

      const entry1 = await liveblogService.addEntry(
        testStoryId,
        {
          headline: 'Polls Open in Key Districts',
          content: 'Voters across the eastern metropolitan region report smooth queues.',
          isKeyEvent: false,
        },
        { id: 'usr_reporter_1', name: 'Danielle Reporter' },
        testOrgId
      );

      const entry2 = await liveblogService.addEntry(
        testStoryId,
        {
          headline: 'BREAKING: Early Exit Projections Released',
          content: 'Initial data models suggest historic turnout of 78.4%.',
          isKeyEvent: true,
        },
        { id: 'usr_editor_bob', name: 'Bob Editor' },
        testOrgId
      );

      const entries = await liveblogService.listEntries(testStoryId);
      expect(entries.length).toBe(2);
      // Reverse chronological order: newest entry first
      expect(entries[0].id).toBe(entry2.id);
      expect(entries[0].isKeyEvent).toBe(true);
      expect(entries[1].id).toBe(entry1.id);
    });

    it('rejects liveblog entry on non-existent story', async () => {
      const liveblogService = new LiveblogService(db);
      await expect(
        liveblogService.addEntry(
          'sty_ghost_999',
          { headline: 'Ghost', content: 'Ghost', isKeyEvent: false },
          { id: 'usr_1', name: 'Name' },
          testOrgId
        )
      ).rejects.toThrow(/not found/i);
    });
  });

  describe('REST API Endpoints: Templates & Liveblogs', () => {
    it('lists templates via GET /api/templates', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/templates',
        headers: { authorization: `Bearer ${readerToken}` },
      });

      expect(res.statusCode).toBe(200);
      const list = JSON.parse(res.body);
      expect(list.length).toBe(5);
    });

    it('instantiates story via POST /api/templates/instantiate', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/templates/instantiate',
        headers: { authorization: `Bearer ${editorToken}` },
        payload: {
          templateId: 'breaking_news_alert',
          title: 'Major Solar Flare Causes Satellite Telemetry Disruptions',
          summary: 'Space weather observatory confirms class X-8 geomagnetic pulse.',
          topicIds: ['space-weather'],
        },
      });

      expect(res.statusCode).toBe(201);
      const body = JSON.parse(res.body);
      expect(body.id).toBeDefined();
      expect(body.articleType).toBe('breaking_news');
      expect(body.blocks.length).toBeGreaterThanOrEqual(3);
    });

    it('adds and lists liveblog entries via REST API', async () => {
      // 1. Post entry
      const postRes = await app.inject({
        method: 'POST',
        url: `/api/stories/${testStoryId}/liveblog/entries`,
        headers: { authorization: `Bearer ${editorToken}` },
        payload: {
          headline: 'Press Briefing Announced for 18:00 UTC',
          content: 'Electoral commissioner to address verified tally progress.',
          isKeyEvent: true,
        },
      });

      expect(postRes.statusCode).toBe(201);
      const posted = JSON.parse(postRes.body);
      expect(posted.id).toBeDefined();
      expect(posted.headline).toBe('Press Briefing Announced for 18:00 UTC');

      // 2. Get entries
      const getRes = await app.inject({
        method: 'GET',
        url: `/api/stories/${testStoryId}/liveblog/entries`,
        headers: { authorization: `Bearer ${readerToken}` },
      });

      expect(getRes.statusCode).toBe(200);
      const entries = JSON.parse(getRes.body);
      expect(entries.length).toBe(1);
      expect(entries[0].id).toBe(posted.id);
    });
  });

  describe('MCP Tools: Content Templates & Liveblogs', () => {
    it('executes template and liveblog tools over MCP protocol', async () => {
      const server = new McpServer({
        name: 'test-templates-mcp',
        version: '1.0.0',
      });

      const principal = {
        id: 'usr_ai_newsroom',
        organizationId: testOrgId,
        role: 'ai_agent' as const,
        clientType: 'gemini' as const,
        scopes: ['news:read', 'news:write'] as Array<'news:read' | 'news:write'>,
      };

      registerTemplateTools(server, db, () => principal);
      registerLiveblogTools(server, db, () => principal);

      const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
      const client = new Client({ name: 'mcp-test-client', version: '1.0.0' }, { capabilities: {} });

      await server.connect(serverTransport);
      await client.connect(clientTransport);

      try {
        // 1. list_content_templates
        const listTplRes = await client.callTool({
          name: 'list_content_templates',
          arguments: {},
        });
        const tplData = JSON.parse((listTplRes as any).content[0].text);
        expect(tplData.total).toBe(5);

        // 2. instantiate_story_from_template
        const instRes = await client.callTool({
          name: 'instantiate_story_from_template',
          arguments: {
            templateId: 'fact_check_report',
            title: 'Fact-Check: Viral Claim About Renewable Energy Grid Reliability',
            summary: 'Assessing empirical transmission stability figures from grid operators.',
          },
        });
        const instData = JSON.parse((instRes as any).content[0].text);
        expect(instData.success).toBe(true);
        expect(instData.storyId).toBeDefined();
        expect(instData.articleType).toBe('fact_check');

        // 3. post_liveblog_entry
        const lbPostRes = await client.callTool({
          name: 'post_liveblog_entry',
          arguments: {
            storyId: testStoryId,
            headline: 'Official Ballot Counting Underway in 45 Constituencies',
            content: 'District monitors report zero mechanical tally anomalies.',
            isKeyEvent: true,
          },
        });
        const lbPostData = JSON.parse((lbPostRes as any).content[0].text);
        expect(lbPostData.success).toBe(true);
        expect(lbPostData.entry.headline).toContain('Ballot Counting');

        // 4. list_liveblog_entries
        const lbListRes = await client.callTool({
          name: 'list_liveblog_entries',
          arguments: { storyId: testStoryId },
        });
        const lbListData = JSON.parse((lbListRes as any).content[0].text);
        expect(lbListData.total).toBeGreaterThanOrEqual(1);
      } finally {
        await client.close();
        await server.close();
      }
    });
  });
});
