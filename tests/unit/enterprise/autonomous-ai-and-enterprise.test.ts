import { describe, it, expect, beforeEach } from 'vitest';
import { FastifyInstance } from 'fastify';
import { buildServer } from '../../../apps/api/src/server';
import { db } from '@ai-news/database';
import { AuthService, validateTenantAccess } from '@ai-news/auth';
import { WebhookService } from '@ai-news/stories';
import {
  createPromptHash,
  generateProvenanceWatermark,
  verifyProvenanceWatermark,
} from '@ai-news/shared';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerEnterpriseTools } from '../../../apps/mcp-server/src/tools/enterprise.tools';

describe('Autonomous AI & Enterprise Newsroom Ecosystem (F18, F19, F20, F21, F5)', () => {
  let app: FastifyInstance;
  const testOrgId = 'org_newsroom_alpha';
  const otherOrgId = 'org_newsroom_beta';

  let editorToken: string;
  let adminToken: string;
  let testStoryId: string;

  beforeEach(async () => {
    db.clear();
    app = buildServer({ logger: false });
    await app.ready();

    editorToken = AuthService.generateToken({
      id: 'usr_editor_elena',
      organizationId: testOrgId,
      role: 'editor',
      clientType: 'human_web',
      scopes: ['news:read', 'news:write'],
    });

    adminToken = AuthService.generateToken({
      id: 'usr_admin_marcus',
      organizationId: testOrgId,
      role: 'admin',
      clientType: 'human_web',
      scopes: ['news:read', 'news:write', 'news:admin'],
    });

    const now = new Date().toISOString();

    const story = await db.stories.create({
      id: 'sty_frontier_llm_01',
      organizationId: testOrgId,
      slug: 'autonomous-newsroom-agents',
      title: 'Autonomous AI Agents Transform 24/7 Global Newsrooms',
      summary:
        'Next-generation LLMs coordinate verification, clustering, and multi-format publishing.',
      status: 'PUBLISHED',
      articleType: 'analysis',
      authorId: 'usr_editor_elena',
      createdByClient: 'human_web',
      createdVia: 'web',
      currentVersionNumber: 1,
      topicIds: ['ai', 'journalism'],
      entityIds: ['ent_deepmind'],
      sourceIds: [],
      blocks: [],
      publishedAt: now,
      createdAt: now,
      updatedAt: now,
    });
    testStoryId = story.id;
  });

  describe('F19: AI Provenance & Cryptographic Watermarking', () => {
    it('generates cryptographic HMAC watermark and detects malicious tampering', () => {
      const prompt = 'Synthesize recent papers on autonomous agents in journalism';
      const promptHash = createPromptHash(prompt);
      const timestamp = new Date().toISOString();
      const model = 'gemini-1.5-pro';

      const signature = generateProvenanceWatermark(testStoryId, promptHash, model, timestamp);

      const record = {
        id: 'prov_test_1',
        storyId: testStoryId,
        generatorModel: model,
        promptHash,
        confidenceScore: 0.98,
        watermarkSignature: signature,
        generationTimestamp: timestamp,
        createdAt: timestamp,
      };

      // 1. Valid record verifies cleanly
      expect(verifyProvenanceWatermark(record)).toBe(true);

      // 2. Tampered model fails verification
      const tamperedModel = { ...record, generatorModel: 'unauthorized-model' };
      expect(verifyProvenanceWatermark(tamperedModel)).toBe(false);

      // 3. Tampered prompt hash fails verification
      const tamperedPrompt = { ...record, promptHash: '000000000000000000' };
      expect(verifyProvenanceWatermark(tamperedPrompt)).toBe(false);
    });

    it('records and verifies provenance via REST API', async () => {
      // 1. Post provenance
      const postRes = await app.inject({
        method: 'POST',
        url: `/api/stories/${testStoryId}/provenance`,
        headers: { authorization: `Bearer ${editorToken}` },
        payload: {
          generatorModel: 'gemini-1.5-pro',
          prompt: 'Write in-depth analysis of autonomous newsroom agents',
          confidenceScore: 0.97,
          humanReviewedBy: 'usr_editor_elena',
          c2paManifestUrl:
            'https://credentials.globalpulse.news/manifests/sty_frontier_llm_01.json',
        },
      });
      expect(postRes.statusCode).toBe(200);
      const postJson = JSON.parse(postRes.payload);
      expect(postJson.watermarkSignature).toBeDefined();
      expect(postJson.storyId).toBe(testStoryId);

      // 2. Get provenance
      const getRes = await app.inject({
        method: 'GET',
        url: `/api/stories/${testStoryId}/provenance`,
      });
      expect(getRes.statusCode).toBe(200);
      const getJson = JSON.parse(getRes.payload);
      expect(getJson.verified).toBe(true);
      expect(getJson.provenance.generatorModel).toBe('gemini-1.5-pro');
      expect(getJson.provenance.humanReviewedBy).toBe('usr_editor_elena');
    });
  });

  describe('F20: MCP Webhooks & Event Subscriptions', () => {
    it('registers webhooks, lists active subscriptions, and dispatches events', async () => {
      const service = new WebhookService(db);

      // 1. Register subscription
      const sub = await service.registerWebhook(testOrgId, {
        url: 'https://newsroom-subscriber.example.com/events',
        events: ['story.published', 'breaking_news.alert'],
      });
      expect(sub.id).toMatch(/^wh_/);
      expect(sub.events).toContain('story.published');

      // 2. List webhooks
      const list = await service.listWebhooks(testOrgId);
      expect(list.length).toBe(1);
      expect(list[0].id).toBe(sub.id);

      // 3. Dispatch event
      const logs = await service.dispatch(
        'story.published',
        { storyId: testStoryId, title: 'Breaking event' },
        testOrgId
      );
      expect(logs.length).toBe(1);
      expect(logs[0].success).toBe(true);
      expect(logs[0].statusCode).toBe(200);

      // 4. Delete webhook
      const deleted = await service.deleteWebhook(sub.id, testOrgId);
      expect(deleted).toBe(true);
      const afterList = await service.listWebhooks(testOrgId);
      expect(afterList.length).toBe(0);
    });

    it('manages webhooks via REST API', async () => {
      // 1. Register webhook
      const regRes = await app.inject({
        method: 'POST',
        url: '/api/mcp/webhooks',
        headers: { authorization: `Bearer ${adminToken}` },
        payload: {
          url: 'https://webhook.site/test-hook',
          events: ['story.published', 'story.needs_review'],
        },
      });
      expect(regRes.statusCode).toBe(201);
      const regJson = JSON.parse(regRes.payload);
      expect(regJson.id).toMatch(/^wh_/);

      // 2. List webhooks
      const listRes = await app.inject({
        method: 'GET',
        url: '/api/mcp/webhooks',
        headers: { authorization: `Bearer ${adminToken}` },
      });
      expect(listRes.statusCode).toBe(200);
      const listJson = JSON.parse(listRes.payload);
      expect(listJson.length).toBe(1);

      // 3. Dispatch test event
      const dispatchRes = await app.inject({
        method: 'POST',
        url: '/api/mcp/webhooks/test-dispatch',
        headers: { authorization: `Bearer ${adminToken}` },
        payload: {
          event: 'story.published',
          payload: { storyId: testStoryId },
        },
      });
      expect(dispatchRes.statusCode).toBe(200);
      const dispatchJson = JSON.parse(dispatchRes.payload);
      expect(dispatchJson.length).toBe(1);
      expect(dispatchJson[0].success).toBe(true);
    });
  });

  describe('F21: Multi-Tenant Org Scoping & Isolation', () => {
    it('enforces strict tenant boundary access control', () => {
      const principalAlpha = {
        id: 'usr_alpha',
        organizationId: testOrgId,
        role: 'editor' as const,
        clientType: 'human_web' as const,
        scopes: ['news:read' as const, 'news:write' as const],
      };

      // 1. Accessing own tenant passes
      expect(() => validateTenantAccess(principalAlpha, testOrgId)).not.toThrow();

      // 2. Accessing foreign tenant is blocked with ForbiddenError
      expect(() => validateTenantAccess(principalAlpha, otherOrgId)).toThrow(/Access denied/);
    });
  });

  describe('F5: Localization & Regional News Filtering', () => {
    it('returns supported international news editions via REST API', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/editions',
      });
      expect(res.statusCode).toBe(200);
      const editions = JSON.parse(res.payload);
      expect(editions.length).toBeGreaterThanOrEqual(6);
      const editionCodes = editions.map((e: { code: string }) => e.code);
      expect(editionCodes).toContain('global');
      expect(editionCodes).toContain('us');
      expect(editionCodes).toContain('uk');
      expect(editionCodes).toContain('in');

      // Individual edition endpoint
      const inRes = await app.inject({
        method: 'GET',
        url: '/api/editions/in',
      });
      expect(inRes.statusCode).toBe(200);
      const inData = JSON.parse(inRes.payload);
      expect(inData.country).toBe('IN');
      expect(inData.currency).toBe('INR');
    });
  });

  describe('MCP Enterprise Tools: Sampling, Provenance, Webhooks & Localization', () => {
    it('executes enterprise AI capabilities over MCP protocol', async () => {
      const server = new McpServer({ name: 'enterprise-mcp-server', version: '1.0.0' });
      registerEnterpriseTools(server, db, () => ({
        id: 'usr_mcp_gemini',
        organizationId: testOrgId,
        role: 'admin',
        clientType: 'gemini',
        scopes: ['news:read', 'news:write', 'news:admin'],
      }));

      const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
      await server.connect(serverTransport);

      const client = new Client({ name: 'test-client', version: '1.0.0' }, { capabilities: {} });
      await client.connect(clientTransport);

      // 1. F18: request_editorial_review
      const reviewResult = (await client.callTool({
        name: 'request_editorial_review',
        arguments: {
          storyDraft:
            'Global news platforms are experiencing unprecedented architectural consolidation under agentic workflows.',
          styleGuide: 'AP',
        },
      })) as { content: Array<{ type: string; text: string }> };

      const reviewData = JSON.parse(reviewResult.content[0].text);
      expect(reviewData.status).toBe('completed');
      expect(reviewData.review.styleGuide).toBe('AP');

      // 2. F18: request_headline_alternatives
      const headlineResult = (await client.callTool({
        name: 'request_headline_alternatives',
        arguments: {
          currentHeadline: 'Markets Rally on Frontier AI Advancements',
          count: 3,
        },
      })) as { content: Array<{ type: string; text: string }> };

      const headlineData = JSON.parse(headlineResult.content[0].text);
      expect(headlineData.variants.length).toBe(3);

      // 3. F19: record_story_provenance & verify_story_provenance
      const provResult = (await client.callTool({
        name: 'record_story_provenance',
        arguments: {
          storyId: testStoryId,
          generatorModel: 'gemini-1.5-pro',
          prompt: 'Generate autonomous newsroom overview',
          confidenceScore: 0.99,
        },
      })) as { content: Array<{ type: string; text: string }> };

      const provData = JSON.parse(provResult.content[0].text);
      expect(provData.provenance.watermarkSignature).toBeDefined();

      const verifyResult = (await client.callTool({
        name: 'verify_story_provenance',
        arguments: { storyId: testStoryId },
      })) as { content: Array<{ type: string; text: string }> };

      const verifyData = JSON.parse(verifyResult.content[0].text);
      expect(verifyData.valid).toBe(true);

      // 4. F20: register_event_webhook & list_event_webhooks
      const whResult = (await client.callTool({
        name: 'register_event_webhook',
        arguments: {
          url: 'https://mcp-subscriber.example.com/alerts',
          events: ['story.published'],
        },
      })) as { content: Array<{ type: string; text: string }> };

      const whData = JSON.parse(whResult.content[0].text);
      expect(whData.subscription.url).toBe('https://mcp-subscriber.example.com/alerts');

      const listWhResult = (await client.callTool({
        name: 'list_event_webhooks',
        arguments: {},
      })) as { content: Array<{ type: string; text: string }> };

      const listWhData = JSON.parse(listWhResult.content[0].text);
      expect(listWhData.total).toBeGreaterThanOrEqual(1);

      // 5. F21: get_tenant_quota_status
      const tenantResult = (await client.callTool({
        name: 'get_tenant_quota_status',
        arguments: {},
      })) as { content: Array<{ type: string; text: string }> };

      const tenantData = JSON.parse(tenantResult.content[0].text);
      expect(tenantData.isolationVerified).toBe(true);
      expect(tenantData.organizationId).toBe(testOrgId);

      // 6. F5: list_regional_editions & get_regional_stories
      const editionsResult = (await client.callTool({
        name: 'list_regional_editions',
        arguments: {},
      })) as { content: Array<{ type: string; text: string }> };

      const editionsData = JSON.parse(editionsResult.content[0].text);
      expect(editionsData.total).toBe(6);

      const regionalStoriesResult = (await client.callTool({
        name: 'get_regional_stories',
        arguments: { region: 'us', limit: 5 },
      })) as { content: Array<{ type: string; text: string }> };

      const regionalStoriesData = JSON.parse(regionalStoriesResult.content[0].text);
      expect(regionalStoriesData.region).toBe('us');
      expect(regionalStoriesData.stories.length).toBeGreaterThanOrEqual(1);

      await client.close();
      await server.close();
    });
  });
});
