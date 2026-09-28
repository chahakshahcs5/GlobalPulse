import { describe, it, expect, beforeEach } from 'vitest';
import { FastifyInstance } from 'fastify';
import { buildServer } from '../../../apps/api/src/server';
import { db } from '@ai-news/database';
import { AuthService } from '@ai-news/auth';
import { NewsletterService, CollectionService } from '@ai-news/stories';
import {
  generateOpenGraphMeta,
  renderOpenGraphHtmlTags,
  generateSocialShareLinks,
} from '@ai-news/shared';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerEngagementTools } from '../../../apps/mcp-server/src/tools/engagement.tools';

describe('Newsletter System, Social Sharing & Reader Collections (F14, F15, F16)', () => {
  let app: FastifyInstance;
  const testOrgId = 'org_default';

  let editorToken: string;
  let testStoryId: string;

  beforeEach(async () => {
    db.clear();
    app = buildServer({ logger: false });
    await app.ready();

    editorToken = AuthService.generateToken({
      id: 'usr_editor_clara',
      organizationId: testOrgId,
      role: 'editor',
      clientType: 'human_web',
      scopes: ['news:read', 'news:write'],
    });

    const now = new Date().toISOString();

    const story = await db.stories.create({
      id: 'sty_frontier_tech_99',
      organizationId: testOrgId,
      slug: 'quantum-computing-breakthrough',
      title: 'Quantum Computing Breakthrough Achieves Fault Tolerance',
      summary: 'Researchers demonstrate 1000-qubit fault-tolerant quantum error correction.',
      status: 'PUBLISHED',
      articleType: 'technology',
      authorId: 'usr_editor_clara',
      createdByClient: 'human_web',
      createdVia: 'web',
      currentVersionNumber: 1,
      topicIds: ['quantum', 'technology'],
      entityIds: ['ent_qubit'],
      sourceIds: [],
      blocks: [],
      heroImageUrl: 'https://images.globalpulse.com/quantum.jpg',
      publishedAt: now,
      createdAt: now,
      updatedAt: now,
    });
    testStoryId = story.id;
  });

  describe('F14: Newsletter System Core Logic', () => {
    it('subscribes reader, handles duplicate subscription with topic merge, and unsubscribes', async () => {
      const service = new NewsletterService(db);

      // Subscribe first time
      const sub1 = await service.subscribe('reader@example.com', 'daily', ['technology']);
      expect(sub1.email).toBe('reader@example.com');
      expect(sub1.active).toBe(true);
      expect(sub1.categories).toEqual(['technology']);

      // Duplicate subscribe with new topic should merge
      const sub2 = await service.subscribe('reader@example.com', 'weekly', ['science']);
      expect(sub2.frequency).toBe('weekly');
      expect(sub2.categories).toContain('technology');
      expect(sub2.categories).toContain('science');

      // Unsubscribe
      const unsubSuccess = await service.unsubscribe('reader@example.com');
      expect(unsubSuccess).toBe(true);

      const status = await service.getSubscription('reader@example.com');
      expect(status?.active).toBe(false);
    });

    it('generates automated daily digest from published newsroom stories', async () => {
      const service = new NewsletterService(db);

      const digest = await service.generateDigest('daily', 'technology', '2026-09-28', testOrgId);
      expect(digest.id).toMatch(/^ndig_/);
      expect(digest.frequency).toBe('daily');
      expect(digest.headline).toContain('Technology');
      expect(digest.curatedStoryIds).toContain(testStoryId);
      expect(digest.stories.length).toBeGreaterThanOrEqual(1);
      expect(digest.stories[0].title).toBe('Quantum Computing Breakthrough Achieves Fault Tolerance');

      // Check latest digest retrieval
      const latest = await service.getLatestDigest('daily', 'technology');
      expect(latest?.id).toBe(digest.id);
    });
  });

  describe('F15: Social Sharing & Dynamic OpenGraph Meta', () => {
    it('generates rich OpenGraph tags and social sharing URLs', async () => {
      const story = await db.stories.findById(testStoryId, testOrgId);
      expect(story).toBeDefined();

      const og = generateOpenGraphMeta({
        story: story!,
        baseUrl: 'https://news.globalpulse.com',
        siteName: 'GlobalPulse News',
      });

      expect(og.title).toContain('Quantum Computing Breakthrough');
      expect(og.type).toBe('article');
      expect(og.image).toBe('https://images.globalpulse.com/quantum.jpg');
      expect(og.twitterCard).toBe('summary_large_image');
      expect(og.section).toBe('technology');

      const htmlTags = renderOpenGraphHtmlTags(og);
      expect(htmlTags).toContain('<meta property="og:title"');
      expect(htmlTags).toContain('<meta property="og:image"');
      expect(htmlTags).toContain('<meta name="twitter:card" content="summary_large_image" />');

      const links = generateSocialShareLinks(og.url, story!.title, story!.summary);
      expect(links.twitter).toContain('twitter.com/intent/tweet');
      expect(links.linkedin).toContain('linkedin.com/sharing/share-offsite');
      expect(links.facebook).toContain('facebook.com/sharer');
      expect(links.whatsapp).toContain('api.whatsapp.com/send');
    });

    it('records share analytics and increments share metrics', async () => {
      const share1 = await db.engagement.recordShare(testStoryId, 'twitter', 'usr_alice');
      expect(share1.shareCount).toBe(1);

      const share2 = await db.engagement.recordShare(testStoryId, 'linkedin', 'usr_bob');
      expect(share2.shareCount).toBe(2);

      const count = await db.engagement.getShareCount(testStoryId);
      expect(count).toBe(2);
    });
  });

  describe('F16: Reading Lists & Story Collections Core Logic', () => {
    it('creates collections, appends/removes stories, and populates story records', async () => {
      const service = new CollectionService(db);

      const collection = await service.createCollection(
        'usr_editor_clara',
        {
          name: 'Frontier AI & Quantum 2026',
          description: 'Curated breakthroughs shaping the next decade.',
          storyIds: [testStoryId],
          isPublic: true,
        },
        'Clara Editor'
      );

      expect(collection.id).toMatch(/^col_/);
      expect(collection.name).toBe('Frontier AI & Quantum 2026');
      expect(collection.storyIds).toEqual([testStoryId]);

      // Add another story
      const updated = await service.addStory(collection.id, 'sty_another_story');
      expect(updated.storyIds).toContain('sty_another_story');

      // Populate full stories
      const populated = await service.getCollectionWithStories(collection.id, testOrgId);
      expect(populated?.stories.length).toBe(1);
      expect(populated?.stories[0].title).toBe('Quantum Computing Breakthrough Achieves Fault Tolerance');

      // Remove story
      const removed = await service.removeStory(collection.id, 'sty_another_story');
      expect(removed.storyIds).not.toContain('sty_another_story');

      // Delete collection
      const deleted = await service.deleteCollection(collection.id);
      expect(deleted).toBe(true);

      const check = await service.getCollectionWithStories(collection.id);
      expect(check).toBeNull();
    });
  });

  describe('REST API Endpoints: Newsletters, Sharing & Collections', () => {
    it('manages newsletter subscriptions and generates digests via REST API', async () => {
      // 1. Subscribe
      const subRes = await app.inject({
        method: 'POST',
        url: '/api/newsletter/subscribe',
        payload: {
          email: 'subscriber@globalpulse.news',
          frequency: 'daily',
          categories: ['technology'],
        },
      });
      expect(subRes.statusCode).toBe(200);
      const subJson = JSON.parse(subRes.payload);
      expect(subJson.success).toBe(true);
      expect(subJson.subscription.email).toBe('subscriber@globalpulse.news');

      // 2. Generate digest (requires editor auth)
      const digRes = await app.inject({
        method: 'POST',
        url: '/api/newsletter/generate-digest',
        headers: { authorization: `Bearer ${editorToken}` },
        payload: {
          frequency: 'daily',
          category: 'technology',
        },
      });
      expect(digRes.statusCode).toBe(200);
      const digJson = JSON.parse(digRes.payload);
      expect(digJson.headline).toContain('Technology');

      // 3. Get latest digest
      const latestRes = await app.inject({
        method: 'GET',
        url: '/api/newsletter/latest?frequency=daily&category=technology',
      });
      expect(latestRes.statusCode).toBe(200);
      const latestJson = JSON.parse(latestRes.payload);
      expect(latestJson.id).toBe(digJson.id);
    });

    it('records story shares and returns OpenGraph metadata and share URLs via REST API', async () => {
      const shareRes = await app.inject({
        method: 'POST',
        url: `/api/stories/${testStoryId}/share`,
        headers: { authorization: `Bearer ${editorToken}` },
        payload: { platform: 'twitter' },
      });
      expect(shareRes.statusCode).toBe(200);
      const shareJson = JSON.parse(shareRes.payload);
      expect(shareJson.storyId).toBe(testStoryId);
      expect(shareJson.shareCount).toBe(1);
      expect(shareJson.shareUrls.twitter).toBeDefined();
      expect(shareJson.meta.title).toContain('Quantum Computing Breakthrough');

      const metaRes = await app.inject({
        method: 'GET',
        url: `/api/stories/${testStoryId}/share`,
        headers: { authorization: `Bearer ${editorToken}` },
      });
      expect(metaRes.statusCode).toBe(200);
      const metaJson = JSON.parse(metaRes.payload);
      expect(metaJson.shareCount).toBe(1);
    });

    it('creates, inspects, and manages collections via REST API', async () => {
      // 1. Create collection
      const createRes = await app.inject({
        method: 'POST',
        url: '/api/collections',
        headers: { authorization: `Bearer ${editorToken}` },
        payload: {
          name: 'AI & Quantum Roundup',
          description: 'Special weekend editorial collection',
          storyIds: [testStoryId],
          isPublic: true,
        },
      });
      expect(createRes.statusCode).toBe(201);
      const colJson = JSON.parse(createRes.payload);
      expect(colJson.id).toMatch(/^col_/);

      // 2. Fetch collection with stories
      const getRes = await app.inject({
        method: 'GET',
        url: `/api/collections/${colJson.id}`,
      });
      expect(getRes.statusCode).toBe(200);
      const getJson = JSON.parse(getRes.payload);
      expect(getJson.name).toBe('AI & Quantum Roundup');
      expect(getJson.stories.length).toBe(1);

      // 3. Add story to collection
      const addRes = await app.inject({
        method: 'POST',
        url: `/api/collections/${colJson.id}/stories`,
        headers: { authorization: `Bearer ${editorToken}` },
        payload: { storyId: 'sty_extra_story' },
      });
      expect(addRes.statusCode).toBe(200);
      const addJson = JSON.parse(addRes.payload);
      expect(addJson.storyIds).toContain('sty_extra_story');

      // 4. Remove story
      const remRes = await app.inject({
        method: 'DELETE',
        url: `/api/collections/${colJson.id}/stories/sty_extra_story`,
        headers: { authorization: `Bearer ${editorToken}` },
      });
      expect(remRes.statusCode).toBe(200);
    });
  });

  describe('MCP Tools: Newsletters, Sharing & Collections', () => {
    it('executes newsletter, social sharing, and collection curation over MCP protocol', async () => {
      const server = new McpServer({ name: 'test-mcp-server', version: '1.0.0' });
      registerEngagementTools(server, db, () => ({
        id: 'usr_ai_curator',
        organizationId: testOrgId,
        role: 'editor',
        clientType: 'custom_mcp',
        scopes: ['news:read', 'news:write'],
      }));

      const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
      await server.connect(serverTransport);

      const client = new Client({ name: 'test-client', version: '1.0.0' }, { capabilities: {} });
      await client.connect(clientTransport);

      // 1. subscribe_newsletter
      const subResult = (await client.callTool({
        name: 'subscribe_newsletter',
        arguments: {
          email: 'agent-reader@globalpulse.news',
          frequency: 'weekly',
          categories: ['technology'],
        },
      })) as { content: Array<{ type: string; text: string }> };

      const subData = JSON.parse(subResult.content[0].text);
      expect(subData.subscription.email).toBe('agent-reader@globalpulse.news');

      // 2. curate_newsletter_digest
      const digestResult = (await client.callTool({
        name: 'curate_newsletter_digest',
        arguments: {
          frequency: 'daily',
          category: 'technology',
        },
      })) as { content: Array<{ type: string; text: string }> };

      const digestData = JSON.parse(digestResult.content[0].text);
      expect(digestData.digest.headline).toContain('Technology');

      // 3. generate_social_share_meta
      const metaResult = (await client.callTool({
        name: 'generate_social_share_meta',
        arguments: {
          storyId: testStoryId,
        },
      })) as { content: Array<{ type: string; text: string }> };

      const metaData = JSON.parse(metaResult.content[0].text);
      expect(metaData.meta.title).toContain('Quantum Computing Breakthrough');
      expect(metaData.shareUrls.twitter).toBeDefined();

      // 4. curate_collection
      const colResult = (await client.callTool({
        name: 'curate_collection',
        arguments: {
          name: 'AI Agent Curation',
          description: 'Autonomous compilation of top quantum stories',
          storyIds: [testStoryId],
        },
      })) as { content: Array<{ type: string; text: string }> };

      const colData = JSON.parse(colResult.content[0].text);
      expect(colData.collection.name).toBe('AI Agent Curation');

      // 5. add_story_to_collection
      const addResult = (await client.callTool({
        name: 'add_story_to_collection',
        arguments: {
          collectionId: colData.collection.id,
          storyId: 'sty_another_story_id',
        },
      })) as { content: Array<{ type: string; text: string }> };

      const addData = JSON.parse(addResult.content[0].text);
      expect(addData.collection.storyIds).toContain('sty_another_story_id');

      await client.close();
      await server.close();
    });
  });
});
