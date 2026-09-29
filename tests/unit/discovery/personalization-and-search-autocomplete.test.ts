import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { FastifyInstance } from 'fastify';
import { buildServer } from '../../../apps/api/src/server';
import { db } from '@ai-news/database';
import { AuthService } from '@ai-news/auth';
import { PersonalizationService } from '@ai-news/stories';
import { SearchService } from '@ai-news/search';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerStoryTools } from '../../../apps/mcp-server/src/tools/story.tools';
import { registerSearchTools } from '../../../apps/mcp-server/src/tools/search.tools';

describe('Personalized "For You" Feed & Search Autocomplete (F2, F3)', () => {
  let app: FastifyInstance;
  const testOrgId = 'org_default';

  let readerToken: string;
  const readerId = 'usr_ai_enthusiast';

  beforeEach(async () => {
    db.clear();
    app = buildServer({ logger: false });
    await app.ready();

    // Create a reader user with specific preferences
    await db.users.create({
      id: readerId,
      organizationId: testOrgId,
      name: 'Alex AI Enthusiast',
      email: 'alex@ai.enthusiast',
      role: 'reader',
      clientType: 'human_web',
      status: 'active',
      preferences: {
        categories: ['technology', 'science'],
        emailFrequency: 'daily',
        readingHistoryEnabled: true,
        theme: 'system',
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    readerToken = AuthService.generateToken({
      id: readerId,
      organizationId: testOrgId,
      role: 'reader',
      clientType: 'human_web',
      scopes: ['news:read', 'news:search'],
    });

    // Reader follows "quantum-computing" topic and "ent_cern" entity
    await db.users.followTarget(readerId, 'topic', 'quantum-computing');
    await db.users.followTarget(readerId, 'entity', 'ent_cern');

    // Create sample published stories across categories
    const now = new Date().toISOString();
    const twoDaysAgo = new Date(Date.now() - 48 * 3600 * 1000).toISOString();

    // Story 1: Tech + Followed Topic "quantum-computing" + Followed Entity "ent_cern"
    await db.stories.create({
      id: 'sty_quantum_cern',
      organizationId: testOrgId,
      slug: 'cern-quantum-breakthrough',
      title: 'CERN Achieves Unprecedented Quantum Entanglement Density',
      summary: 'New quantum physics record set at the Large Hadron Collider.',
      status: 'PUBLISHED',
      articleType: 'technology',
      authorId: 'usr_sarah_chen',
      createdByClient: 'gemini',
      createdVia: 'mcp',
      currentVersionNumber: 1,
      topicIds: ['quantum-computing', 'physics'],
      entityIds: ['ent_cern'],
      sourceIds: [],
      blocks: [],
      publishedAt: now,
      createdAt: now,
      updatedAt: now,
      wordCount: 300,
      readingTimeMinutes: 2,
    });

    // Story 2: Sports (unfollowed category, older)
    await db.stories.create({
      id: 'sty_sports_marathon',
      organizationId: testOrgId,
      slug: 'world-marathon-record-broken',
      title: 'World Marathon Record Shattered in Berlin',
      summary: 'Athletics championship sees historic speed in marathon course.',
      status: 'PUBLISHED',
      articleType: 'sports',
      authorId: 'usr_editor_1',
      createdByClient: 'gemini',
      createdVia: 'mcp',
      currentVersionNumber: 1,
      topicIds: ['athletics'],
      entityIds: ['ent_berlin'],
      sourceIds: [],
      blocks: [],
      publishedAt: twoDaysAgo,
      createdAt: twoDaysAgo,
      updatedAt: twoDaysAgo,
      wordCount: 200,
      readingTimeMinutes: 1,
    });

    // Story 3: Science + Preferred category
    await db.stories.create({
      id: 'sty_space_james_webb',
      organizationId: testOrgId,
      slug: 'james-webb-discovers-ancient-galaxy',
      title: 'James Webb Telescope Spots Earliest Known Galaxy Cluster',
      summary: 'Astrophysicists observe cosmic dawn formations.',
      status: 'PUBLISHED',
      articleType: 'science',
      authorId: 'usr_sarah_chen',
      createdByClient: 'gemini',
      createdVia: 'mcp',
      currentVersionNumber: 1,
      topicIds: ['astronomy', 'space'],
      entityIds: ['ent_nasa'],
      sourceIds: [],
      blocks: [],
      publishedAt: now,
      createdAt: now,
      updatedAt: now,
      wordCount: 250,
      readingTimeMinutes: 2,
    });
  });

  afterEach(async () => {
    await app.close();
    db.clear();
  });

  describe('F2: PersonalizationService Core Ranking Logic', () => {
    it('ranks stories matching followed topics and entities higher than non-followed stories', async () => {
      const service = new PersonalizationService(db);
      const feed = await service.getPersonalizedFeed({
        userId: readerId,
        organizationId: testOrgId,
        limit: 10,
      });

      expect(feed.items.length).toBe(3);
      // Story 1 (CERN + Quantum) has highest relevance for reader
      expect(feed.items[0].id).toBe('sty_quantum_cern');
      // Story 3 (Science - preferred category) should rank above Story 2 (Sports)
      expect(feed.items[1].id).toBe('sty_space_james_webb');
      expect(feed.items[2].id).toBe('sty_sports_marathon');
    });

    it('excludes completed reading history stories unless includeCompleted is set', async () => {
      // Mark Story 1 as completed for reader
      await db.engagement.saveReadingProgress(readerId, 'sty_quantum_cern', 100, true);

      const service = new PersonalizationService(db);

      // By default without includeCompleted, completed story is filtered
      const feedUnread = await service.getPersonalizedFeed({
        userId: readerId,
        organizationId: testOrgId,
        includeCompleted: false,
      });

      expect(feedUnread.items.map((s) => s.id)).not.toContain('sty_quantum_cern');

      // With includeCompleted = true, it is included
      const feedAll = await service.getPersonalizedFeed({
        userId: readerId,
        organizationId: testOrgId,
        includeCompleted: true,
      });

      expect(feedAll.items.map((s) => s.id)).toContain('sty_quantum_cern');
    });
  });

  describe('F2: REST API GET /api/stories/personalized', () => {
    it('returns personalized feed with pagination metadata', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/stories/personalized?limit=2',
        headers: { authorization: `Bearer ${readerToken}` },
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.data.length).toBe(2);
      expect(body.data[0].id).toBe('sty_quantum_cern');
      expect(body.meta.nextCursor).toBeDefined();
      expect(body.meta.hasMore).toBe(true);
    });
  });

  describe('F3: Full-Text Search Autocomplete & Instant Suggestions', () => {
    it('returns autocomplete suggestions across categories, topics, and headlines', async () => {
      const searchService = new SearchService(db);

      // 1. Query for "tech" (matches Technology category)
      const catSuggestions = await searchService.getSuggestions('tech', testOrgId);
      expect(catSuggestions.length).toBeGreaterThanOrEqual(1);
      expect(catSuggestions.some((s) => s.text === 'Technology' && s.type === 'category')).toBe(
        true
      );

      // 2. Query for "quantum" (matches headline CERN Achieves Unprecedented Quantum...)
      const quantumSuggestions = await searchService.getSuggestions('quantum', testOrgId);
      expect(quantumSuggestions.length).toBeGreaterThanOrEqual(1);
      expect(quantumSuggestions.some((s) => s.type === 'story' && s.text.includes('Quantum'))).toBe(
        true
      );
    });

    it('exposes suggestions via HTTP GET /api/search/suggestions', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/search/suggestions?q=cern&limit=5',
        headers: { authorization: `Bearer ${readerToken}` },
      });

      expect(res.statusCode).toBe(200);
      const suggestions = JSON.parse(res.body);
      expect(Array.isArray(suggestions)).toBe(true);
      expect(suggestions.some((s: { text: string }) => s.text.toLowerCase().includes('cern'))).toBe(
        true
      );
    });
  });

  describe('MCP Tools: get_personalized_feed & get_search_suggestions', () => {
    it('executes get_personalized_feed and get_search_suggestions via MCP', async () => {
      const server = new McpServer({
        name: 'test-personalization-mcp',
        version: '1.0.0',
      });

      const principal = {
        id: readerId,
        organizationId: testOrgId,
        role: 'reader' as const,
        clientType: 'human_web' as const,
        scopes: ['news:read', 'news:search'] as Array<'news:read' | 'news:search'>,
      };

      registerStoryTools(server, db, () => principal);
      registerSearchTools(server, db, () => principal);

      const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
      const client = new Client(
        { name: 'mcp-test-client', version: '1.0.0' },
        { capabilities: {} }
      );

      await server.connect(serverTransport);
      await client.connect(clientTransport);

      try {
        // Test get_personalized_feed
        const feedResult = await client.callTool({
          name: 'get_personalized_feed',
          arguments: { limit: 5 },
        });
        const feedData = JSON.parse(
          (feedResult as unknown as { content: Array<{ text: string }> }).content[0].text
        );
        expect(feedData.stories.length).toBeGreaterThanOrEqual(1);
        expect(feedData.stories[0].id).toBe('sty_quantum_cern');

        // Test get_search_suggestions
        const suggestResult = await client.callTool({
          name: 'get_search_suggestions',
          arguments: { query: 'cern', limit: 5 },
        });
        const suggestData = JSON.parse(
          (suggestResult as unknown as { content: Array<{ text: string }> }).content[0].text
        );
        expect(suggestData.suggestions.length).toBeGreaterThanOrEqual(1);
        expect(suggestData.suggestions[0].text.toLowerCase()).toContain('cern');
      } finally {
        await client.close();
        await server.close();
      }
    });
  });
});
