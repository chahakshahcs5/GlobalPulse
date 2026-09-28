import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { FastifyInstance } from 'fastify';
import { buildServer } from '../../../apps/api/src/server';
import { db } from '@ai-news/database';
import { AuthService } from '@ai-news/auth';
import {
  computeStoryReadingMetrics,
  calculateWordCount,
  calculateReadingTimeMinutes,
  generateNewsArticleJsonLd,
} from '@ai-news/shared';

describe('Google News Core Discovery & Syndication (F22, F23, F24, F6, F7)', () => {
  let app: FastifyInstance;
  let testStoryId: string;
  const testOrgId = 'org_default';

  beforeEach(async () => {
    db.clear();
    app = buildServer({ logger: false });
    await app.ready();

    // Create a published test story
    const now = new Date().toISOString();
    const created = await db.stories.create({
      id: 'sty_discovery_1',
      organizationId: testOrgId,
      slug: 'autonomous-quantum-breakthrough',
      title: 'Autonomous Quantum Breakthrough Announced by Global Research Consortium',
      summary: 'Scientists reveal breakthrough room-temperature superconductor and quantum computing chip architecture.',
      status: 'PUBLISHED',
      articleType: 'technology',
      authorId: 'usr_editor_1',
      createdByClient: 'gemini',
      createdVia: 'mcp',
      currentVersionNumber: 1,
      topicIds: ['quantum', 'computing', 'physics'],
      entityIds: ['ent_mit', 'ent_cern'],
      sourceIds: [],
      blocks: [
        {
          id: 'blk_1',
          blockType: 'paragraph',
          sortOrder: 0,
          data: {
            format: 'plain',
            text: 'In a landmark international press conference, researchers revealed a historic milestone in quantum coherence. The discovery promises exponential speedups for encryption and climate modeling.',
          },
          citationIds: [],
        },
        {
          id: 'blk_2',
          blockType: 'image',
          sortOrder: 1,
          data: {
            url: 'https://images.platform.org/quantum-chip.jpg',
            altText: 'Cleanroom microscopic view of the qubit matrix.',
            caption: 'Cleanroom microscopic view of the qubit matrix.',
            aspectRatio: '16:9',
          },
          citationIds: [],
        },
      ],
      heroImageUrl: 'https://images.platform.org/hero-quantum.jpg',
      publishedAt: now,
      createdAt: now,
      updatedAt: now,
      wordCount: 85,
      readingTimeMinutes: 2,
    });
    testStoryId = created.id;
  });

  afterEach(async () => {
    await app.close();
    db.clear();
  });

  describe('F6: Reading Time & Word Count Calculation', () => {
    it('calculates word count across text strings and story blocks', () => {
      const plainText = 'The quick brown fox jumps over the lazy dog.';
      expect(calculateWordCount(plainText)).toBe(9);

      const blocks = [
        { blockType: 'heading', data: { text: 'Key Findings and Discoveries' } },
        { blockType: 'paragraph', data: { text: 'First paragraph with some text.' } },
        { blockType: 'quote', data: { quote: 'This is a notable quotation.', caption: 'By John Doe' } },
      ];
      // 4 + 5 + 5 + 3 = 17 words
      expect(calculateWordCount(blocks)).toBe(17);
    });

    it('calculates reading time accounting for word count and visual media pauses', () => {
      // 200 words = 1 minute base
      expect(calculateReadingTimeMinutes(200, 0)).toBe(1);
      // 500 words at 200 WPM = 2.5 min -> 3 minutes
      expect(calculateReadingTimeMinutes(500, 0)).toBe(3);
      // 100 words + 4 images (48 seconds = 0.8 min) -> 0.5 + 0.8 = 1.3 min -> 2 minutes
      expect(calculateReadingTimeMinutes(100, 4)).toBe(2);
    });

    it('computes complete metrics from title, summary, and multimedia blocks', () => {
      const metrics = computeStoryReadingMetrics({
        title: 'Breaking Headline News Alert',
        summary: 'A short summary of the developing story.',
        blocks: [
          { blockType: 'paragraph', data: { text: 'Detailed analysis content goes here.' } },
          { blockType: 'image', data: { caption: 'Chart illustration' } },
        ],
      });

      expect(metrics.wordCount).toBeGreaterThan(15);
      expect(metrics.readingTimeMinutes).toBeGreaterThanOrEqual(1);
    });
  });

  describe('F24: Schema.org NewsArticle JSON-LD Structured Data', () => {
    it('generates compliant NewsArticle JSON-LD structure', () => {
      const jsonLd = generateNewsArticleJsonLd({
        story: {
          id: testStoryId,
          slug: 'autonomous-quantum-breakthrough',
          title: 'Autonomous Quantum Breakthrough',
          summary: 'Breakthrough in quantum computing.',
          articleType: 'technology',
          heroImageUrl: 'https://example.com/quantum.jpg',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          publishedAt: new Date().toISOString(),
          authorId: 'usr_sarah_chen',
          topicIds: ['quantum', 'tech'],
          wordCount: 150,
          readingTimeMinutes: 2,
        },
        baseUrl: 'https://globalpulse.news',
        publisherName: 'GlobalPulse Newsroom',
      });

      expect(jsonLd['@context']).toBe('https://schema.org');
      expect(jsonLd['@type']).toBe('NewsArticle');
      expect(jsonLd.headline).toBe('Autonomous Quantum Breakthrough');
      expect(jsonLd.mainEntityOfPage['@id']).toBe('https://globalpulse.news/stories/autonomous-quantum-breakthrough');
      expect(jsonLd.timeRequired).toBe('PT2M');
      expect(jsonLd.wordCount).toBe(150);
      expect(jsonLd.keywords).toContain('quantum');
    });

    it('returns JSON-LD via HTTP GET /api/stories/:id/structured-data', async () => {
      const res = await app.inject({
        method: 'GET',
        url: `/api/stories/${testStoryId}/structured-data`,
      });

      expect(res.statusCode).toBe(200);
      expect(res.headers['content-type']).toContain('application/ld+json');
      const body = JSON.parse(res.body);
      expect(body['@type']).toBe('NewsArticle');
      expect(body.headline).toContain('Autonomous Quantum Breakthrough');
    });
  });

  describe('F22 & F23: Syndication Feeds & Google News Sitemap', () => {
    it('GET /sitemap-news.xml returns Google News XML schema with 48-hour recency filter', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/sitemap-news.xml',
      });

      expect(res.statusCode).toBe(200);
      expect(res.headers['content-type']).toContain('application/xml');
      expect(res.body).toContain('xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"');
      expect(res.body).toContain('<news:news>');
      expect(res.body).toContain('<news:publication>');
      expect(res.body).toContain('<news:name>GlobalPulse News</news:name>');
      expect(res.body).toContain('<news:language>en</news:language>');
      expect(res.body).toContain('<news:title>Autonomous Quantum Breakthrough Announced by Global Research Consortium</news:title>');
    });

    it('GET /feeds/topics/:topic/rss.xml returns topic-filtered RSS feed with media enclosure', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/feeds/topics/quantum/rss.xml',
      });

      expect(res.statusCode).toBe(200);
      expect(res.headers['content-type']).toContain('application/rss+xml');
      expect(res.body).toContain('<rss version="2.0"');
      expect(res.body).toContain('Topic: quantum');
      expect(res.body).toContain('<enclosure url="https://images.platform.org/hero-quantum.jpg" type="image/jpeg"');
    });

    it('GET /api/feeds/atom returns valid Atom 1.0 feed', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/feeds/atom',
      });

      expect(res.statusCode).toBe(200);
      expect(res.headers['content-type']).toContain('application/atom+xml');
      expect(res.body).toContain('<feed xmlns="http://www.w3.org/2005/Atom">');
      expect(res.body).toContain('<title>Autonomous Quantum Breakthrough');
    });
  });

  describe('F7: Reading Progress & History Tracking', () => {
    const readerToken = AuthService.generateToken({
      id: 'usr_reader_99',
      organizationId: testOrgId,
      role: 'reader',
      clientType: 'human_web',
      scopes: ['news:read'],
    });

    it('saves reader scroll progress and marks completion', async () => {
      const saveRes = await app.inject({
        method: 'POST',
        url: `/api/stories/${testStoryId}/progress`,
        headers: { authorization: `Bearer ${readerToken}` },
        payload: { percentage: 65, completed: false },
      });

      expect(saveRes.statusCode).toBe(200);
      const saved = JSON.parse(saveRes.body);
      expect(saved.percentage).toBe(65);
      expect(saved.completed).toBe(false);

      // Fetch progress
      const getRes = await app.inject({
        method: 'GET',
        url: `/api/stories/${testStoryId}/progress`,
        headers: { authorization: `Bearer ${readerToken}` },
      });

      expect(getRes.statusCode).toBe(200);
      const fetched = JSON.parse(getRes.body);
      expect(fetched.percentage).toBe(65);
    });

    it('marks article as read via /mark-read endpoint', async () => {
      const markRes = await app.inject({
        method: 'POST',
        url: `/api/stories/${testStoryId}/mark-read`,
        headers: { authorization: `Bearer ${readerToken}` },
      });

      expect(markRes.statusCode).toBe(200);
      const body = JSON.parse(markRes.body);
      expect(body.percentage).toBe(100);
      expect(body.completed).toBe(true);

      // Check reading history
      const historyRes = await app.inject({
        method: 'GET',
        url: '/api/me/reading-history',
        headers: { authorization: `Bearer ${readerToken}` },
      });

      expect(historyRes.statusCode).toBe(200);
      const history = JSON.parse(historyRes.body);
      expect(history.length).toBe(1);
      expect(history[0].storyId).toBe(testStoryId);
      expect(history[0].completed).toBe(true);
    });
  });

  describe('MCP Syndication & Reading Progress Tools', () => {
    it('executes get_news_sitemap, get_story_structured_data, and record_reading_progress via MCP', async () => {
      const { Client } = await import('@modelcontextprotocol/sdk/client/index.js');
      const { InMemoryTransport } = await import('@modelcontextprotocol/sdk/inMemory.js');
      const { McpServer } = await import('@modelcontextprotocol/sdk/server/mcp.js');
      const { registerSyndicationTools } = await import('../../../apps/mcp-server/src/tools/syndication.tools');
      const { registerEngagementTools } = await import('../../../apps/mcp-server/src/tools/engagement.tools');

      const server = new McpServer({
        name: 'test-syndication-server',
        version: '1.0.0',
      });

      const principal = {
        id: 'usr_mcp_test',
        organizationId: testOrgId,
        role: 'editor' as const,
        clientType: 'gemini' as const,
        scopes: ['news:read', 'news:write'] as Array<'news:read' | 'news:write'>,
      };

      const getPrincipal = () => principal;
      registerSyndicationTools(server, db, getPrincipal);
      registerEngagementTools(server, db, getPrincipal);

      const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
      const client = new Client({ name: 'test-agent', version: '1.0.0' }, { capabilities: {} });

      await server.connect(serverTransport);
      await client.connect(clientTransport);

      try {
        // Test Google News sitemap tool
        const sitemapResult = await client.callTool({
          name: 'get_news_sitemap',
          arguments: { limit: 10 },
        });
        const sitemapData = JSON.parse((sitemapResult as any).content[0].text);
        expect(sitemapData.totalEligible).toBeGreaterThanOrEqual(1);
        expect(sitemapData.entries[0].storyId).toBe(testStoryId);

        // Test structured data tool
        const structuredResult = await client.callTool({
          name: 'get_story_structured_data',
          arguments: { storyId: testStoryId },
        });
        const structuredData = JSON.parse((structuredResult as any).content[0].text);
        expect(structuredData.schemaType).toBe('NewsArticle');
        expect(structuredData.structuredData['@type']).toBe('NewsArticle');

        // Test record reading progress tool
        const progressResult = await client.callTool({
          name: 'record_reading_progress',
          arguments: {
            storyId: testStoryId,
            percentage: 80,
            completed: false,
          },
        });
        const progressData = JSON.parse((progressResult as any).content[0].text);
        expect(progressData.progress.percentage).toBe(80);

        // Test get reading history tool
        const historyResult = await client.callTool({
          name: 'get_reading_history',
          arguments: { limit: 10 },
        });
        const historyData = JSON.parse((historyResult as any).content[0].text);
        expect(historyData.totalItems).toBeGreaterThanOrEqual(1);
      } finally {
        await client.close();
        await server.close();
      }
    });
  });
});
