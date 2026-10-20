import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { FastifyInstance } from 'fastify';
import { buildServer } from '../../../apps/api/src/server';
import { AuthService } from '@ai-news/auth';

describe('Story Intelligence REST API', () => {
  let app: FastifyInstance;
  let storyId: string;
  let otherOrgToken: string;

  beforeAll(async () => {
    app = buildServer();
    await app.ready();

    const createRes = await app.inject({
      method: 'POST',
      url: '/api/stories',
      headers: { authorization: 'Bearer dev-editor' },
      payload: {
        title: 'Regulator fines exchange over reporting failures',
        summary: 'The regulator imposed a penalty after an internal review.',
        articleType: 'breaking_news',
      },
    });
    expect(createRes.statusCode).toBe(201);
    storyId = JSON.parse(createRes.body).id;

    otherOrgToken = AuthService.generateToken({
      id: 'usr_other_org',
      organizationId: 'org_other_tenant',
      role: 'editor',
      clientType: 'human_web',
      scopes: ['news:read', 'news:write'],
    });
  });

  afterAll(async () => {
    await app.close();
  });

  describe('claims & evidence', () => {
    it('creates a claim through the REST API', async () => {
      const res = await app.inject({
        method: 'POST',
        url: `/api/stories/${storyId}/claims`,
        headers: { authorization: 'Bearer dev-editor' },
        payload: { text: 'The fine totalled 4.2 million.' },
      });

      expect(res.statusCode).toBe(201);
      const claim = JSON.parse(res.body);
      expect(claim.id).toMatch(/^clm_/);
      expect(claim.status).toBe('UNVERIFIED');
      expect(claim.storyId).toBe(storyId);
    });

    it('rejects a supported claim without evidence', async () => {
      const res = await app.inject({
        method: 'POST',
        url: `/api/stories/${storyId}/claims`,
        headers: { authorization: 'Bearer dev-editor' },
        payload: { text: 'The fine totalled 9.9 million.', status: 'SUPPORTED' },
      });

      expect(res.statusCode).toBe(422);
      const problem = JSON.parse(res.body);
      expect(problem.detail.toLowerCase()).toContain('source');
    });
    it('rejects malformed claim payloads', async () => {
      const res = await app.inject({
        method: 'POST',
        url: `/api/stories/${storyId}/claims`,
        headers: { authorization: 'Bearer dev-editor' },
        payload: { text: '' },
      });

      expect(res.statusCode).toBe(400);
      expect(JSON.parse(res.body).code).toBe('VALIDATION_ERROR');
    });

    it('lists claims and evidence for a story', async () => {
      const claimsRes = await app.inject({
        method: 'GET',
        url: `/api/stories/${storyId}/claims`,
        headers: { authorization: 'Bearer dev-editor' },
      });
      expect(claimsRes.statusCode).toBe(200);
      expect(JSON.parse(claimsRes.body).length).toBe(1);

      const evidenceRes = await app.inject({
        method: 'GET',
        url: `/api/stories/${storyId}/evidence`,
        headers: { authorization: 'Bearer dev-editor' },
      });
      expect(evidenceRes.statusCode).toBe(200);
      expect(Array.isArray(JSON.parse(evidenceRes.body))).toBe(true);
    });

    it('requires write scope to create claims', async () => {
      const readOnlyToken = AuthService.generateToken({
        id: 'usr_read_only',
        organizationId: 'org_default',
        role: 'reader',
        clientType: 'human_web',
        scopes: ['news:read'],
      });

      const res = await app.inject({
        method: 'POST',
        url: `/api/stories/${storyId}/claims`,
        headers: { authorization: `Bearer ${readOnlyToken}` },
        payload: { text: 'A claim from a reader.' },
      });

      expect(res.statusCode).toBe(403);
    });

    it('does not leak intelligence across tenants', async () => {
      const res = await app.inject({
        method: 'GET',
        url: `/api/stories/${storyId}/intelligence`,
        headers: { authorization: `Bearer ${otherOrgToken}` },
      });

      expect(res.statusCode).toBe(404);
    });
  });

  describe('timeline & perspectives', () => {
    it('adds and reads timeline events', async () => {
      const createRes = await app.inject({
        method: 'POST',
        url: `/api/stories/${storyId}/timeline`,
        headers: { authorization: 'Bearer dev-editor' },
        payload: {
          title: 'Regulator publishes findings',
          description: 'The full decision was published online.',
          eventType: 'OFFICIAL_STATEMENT',
        },
      });
      expect(createRes.statusCode).toBe(201);

      const listRes = await app.inject({
        method: 'GET',
        url: `/api/stories/${storyId}/timeline`,
        headers: { authorization: 'Bearer dev-editor' },
      });
      expect(listRes.statusCode).toBe(200);
      expect(JSON.parse(listRes.body).length).toBe(1);
    });

    it('adds and reads editorial perspectives', async () => {
      const createRes = await app.inject({
        method: 'POST',
        url: `/api/stories/${storyId}/perspectives`,
        headers: { authorization: 'Bearer dev-editor' },
        payload: {
          label: 'Exchange statement',
          summary: 'The exchange said it accepted the findings.',
          stance: 'NEUTRAL',
        },
      });
      expect(createRes.statusCode).toBe(201);

      const listRes = await app.inject({
        method: 'GET',
        url: `/api/stories/${storyId}/perspectives`,
        headers: { authorization: 'Bearer dev-editor' },
      });
      expect(listRes.statusCode).toBe(200);
      expect(JSON.parse(listRes.body).length).toBe(1);
    });
  });

  describe('aggregated intelligence', () => {
    it('returns the consolidated intelligence payload', async () => {
      const res = await app.inject({
        method: 'GET',
        url: `/api/stories/${storyId}/intelligence`,
        headers: { authorization: 'Bearer dev-editor' },
      });

      expect(res.statusCode).toBe(200);
      const payload = JSON.parse(res.body);
      expect(payload.storyId).toBe(storyId);
      expect(payload.claims.length).toBe(1);
      expect(payload.timeline.length).toBe(1);
      expect(payload.perspectives.length).toBe(1);
      expect(payload.metrics.claimCount).toBe(1);
      expect(payload.metrics.timelineEventCount).toBe(1);
      expect(payload.whatChanged).toBeDefined();
    });

    it('returns the what-changed summary', async () => {
      const res = await app.inject({
        method: 'GET',
        url: `/api/stories/${storyId}/what-changed`,
        headers: { authorization: 'Bearer dev-editor' },
      });

      expect(res.statusCode).toBe(200);
      const payload = JSON.parse(res.body);
      expect(payload.storyId).toBe(storyId);
      expect(Array.isArray(payload.items)).toBe(true);
    });
  });

  describe('block registry', () => {
    it('serves the block catalog', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/blocks',
        headers: { authorization: 'Bearer dev-editor' },
      });

      expect(res.statusCode).toBe(200);
      const catalog = JSON.parse(res.body);
      expect(catalog.count).toBeGreaterThanOrEqual(41);
      expect(catalog.blocks.map((block: { type: string }) => block.type)).toContain('evidence');
    });

    it('serves a single block definition and reports unknown types', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/blocks/timeline',
        headers: { authorization: 'Bearer dev-editor' },
      });
      expect(res.statusCode).toBe(200);
      expect(JSON.parse(res.body).type).toBe('timeline');

      const unknown = await app.inject({
        method: 'GET',
        url: '/api/blocks/not_a_block',
        headers: { authorization: 'Bearer dev-editor' },
      });
      expect(unknown.statusCode).toBe(200);
      expect(JSON.parse(unknown.body).error).toBe('NOT_FOUND');
    });
  });

  describe('alerts, graph and ingestion', () => {
    it('creates an alert rule and lists it', async () => {
      const createRes = await app.inject({
        method: 'POST',
        url: '/api/alerts/rules',
        headers: { authorization: 'Bearer dev-editor' },
        payload: {
          name: 'Regulatory fines',
          conditions: { keywords: ['fine'] },
          channels: ['in_app'],
        },
      });
      expect(createRes.statusCode).toBe(201);

      const listRes = await app.inject({
        method: 'GET',
        url: '/api/alerts/rules',
        headers: { authorization: 'Bearer dev-editor' },
      });
      expect(listRes.statusCode).toBe(200);
      expect(JSON.parse(listRes.body).length).toBeGreaterThanOrEqual(1);
    });

    it('rejects unsafe ingestion feed URLs', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/ingestion/feeds',
        headers: { authorization: 'Bearer dev-editor' },
        payload: { name: 'Loopback', url: 'http://127.0.0.1:9200/feed.xml' },
      });

      expect(res.statusCode).toBe(422);
      expect(JSON.parse(res.body).detail.toLowerCase()).toContain('unsafe feed url');
    });

    it('adds and queries knowledge graph edges', async () => {
      const createRes = await app.inject({
        method: 'POST',
        url: '/api/graph/edges',
        headers: { authorization: 'Bearer dev-editor' },
        payload: {
          fromType: 'STORY',
          fromId: storyId,
          relation: 'mentions',
          toType: 'ENTITY',
          toId: 'ent_regulator',
        },
      });
      expect(createRes.statusCode).toBe(201);

      const listRes = await app.inject({
        method: 'GET',
        url: '/api/graph/edges?fromType=STORY',
        headers: { authorization: 'Bearer dev-editor' },
      });
      expect(listRes.statusCode).toBe(200);
      expect(JSON.parse(listRes.body).length).toBeGreaterThanOrEqual(1);
    });
  });
});
