import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { FastifyInstance } from 'fastify';
import { buildServer } from '../../../apps/api/src/server';
import { AuthService } from '@ai-news/auth';
import { db } from '@ai-news/database';
import { StoryIntelligenceService, StoryService, UserService } from '@ai-news/stories';

const ORG = 'org_extensions_test';

describe('Intelligence extensions: evidence chain, event map, reader notifications', () => {
  let app: FastifyInstance;
  let authHeaders: Record<string, string>;
  let storyId: string;
  let claimId: string;

  const editorCtx = {
    organizationId: ORG,
    actorId: 'usr_extensions_editor',
    clientType: 'human_web' as const,
  };

  beforeAll(async () => {
    app = buildServer();
    await app.ready();

    const token = AuthService.generateToken({
      id: 'usr_extensions_editor',
      organizationId: ORG,
      role: 'editor',
      clientType: 'human_web',
      scopes: ['news:read', 'news:write', 'news:publish', 'news:sources', 'news:topics'],
    });
    authHeaders = { 'Content-Type': 'application/json', authorization: `Bearer ${token}` };

    const stories = new StoryService(db);
    const intelligence = new StoryIntelligenceService(db);

    const story = await stories.createStory(
      {
        title: 'Exchange fined after outage',
        summary: 'The regulator fined the exchange 4.2 million.',
        entityIds: ['ent_extensions_exchange'],
        sourceIds: ['src_extensions_filing'],
      },
      {
        organizationId: ORG,
        authorId: 'usr_extensions_editor',
        clientType: 'human_web',
        createdVia: 'api',
      }
    );
    storyId = story.id;

    await db.sources.create({
      id: 'src_extensions_filing',
      organizationId: ORG,
      url: 'https://example.org/filing',
      title: 'Regulator filing',
      publisher: 'Regulator',
      retrievedAt: new Date().toISOString(),
      language: 'en',
      sourceType: 'OFFICIAL_DOCUMENT',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    await db.entities.create({
      id: 'ent_extensions_exchange',
      organizationId: ORG,
      slug: 'extensions-exchange',
      name: 'Extensions Exchange',
      type: 'ORGANIZATION',
      description: 'A regulated exchange.',
      aliases: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const claim = await intelligence.createClaim(
      storyId,
      {
        text: 'The regulator fined the exchange 4.2 million.',
        sourceIds: ['src_extensions_filing'],
      },
      editorCtx
    );
    claimId = claim.id;
    await intelligence.addEvidence(
      storyId,
      { claimId: claim.id, type: 'DOCUMENT', title: 'Filer filing', stance: 'SUPPORTS' },
      editorCtx
    );

    // A located event for the global map.
    await db.events.create({
      id: 'evt_extensions',
      organizationId: ORG,
      title: 'Exchange outage',
      summary: 'Trading halted for 40 minutes.',
      status: 'ACTIVE',
      category: 'markets',
      severity: 'MAJOR',
      occurredAt: new Date().toISOString(),
      location: 'Metro City',
      coordinates: [139.7, 35.6],
      topicIds: [],
      entityIds: [],
      storyIds: [storyId],
      sourceIds: ['src_extensions_filing'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  });

  afterAll(async () => {
    await app.close();
  });

  describe('evidence chain', () => {
    it('serves the claim evidence chain', async () => {
      const res = await app.inject({
        method: 'GET',
        url: `/api/claims/${claimId}/evidence`,
        headers: authHeaders,
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.claim.id).toBe(claimId);
      expect(body.evidence).toHaveLength(1);
      expect(body.evidence[0].stance).toBe('SUPPORTS');
    });

    it('serves the claims that cite a source', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/sources/src_extensions_filing/claims',
        headers: authHeaders,
      });

      expect(res.statusCode).toBe(200);
      const claims = JSON.parse(res.body);
      expect(claims).toHaveLength(1);
      expect(claims[0].id).toBe(claimId);
    });

    it('serves the stories that mention an entity', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/entities/ent_extensions_exchange/stories',
        headers: authHeaders,
      });

      expect(res.statusCode).toBe(200);
      const stories = JSON.parse(res.body);
      expect(stories).toHaveLength(1);
      expect(stories[0].id).toBe(storyId);
    });

    it('answers the same questions over GraphQL', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/graphql',
        headers: authHeaders,
        payload: {
          query: `query Chain($claimId: String!, $sourceId: String!, $entityId: String!) {
            getClaimEvidence(claimId: $claimId) { claim { id } evidence { id } }
            getSourceClaims(sourceId: $sourceId) { id }
            getEntityStories(entityId: $entityId) { id }
          }`,
          variables: {
            claimId,
            sourceId: 'src_extensions_filing',
            entityId: 'ent_extensions_exchange',
          },
        },
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.errors).toBeUndefined();
      expect(body.data.getClaimEvidence.evidence).toHaveLength(1);
      expect(body.data.getSourceClaims).toHaveLength(1);
      expect(body.data.getEntityStories).toHaveLength(1);
    });
  });

  describe('global event map', () => {
    it('serves map points', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/events/map',
        headers: authHeaders,
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.count).toBe(1);
      expect(body.points[0].id).toBe('evt_extensions');
      expect(body.points[0].storyCount).toBe(1);
      expect(body.points[0].sourceCount).toBe(1);
    });

    it('filters map points by category and severity', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/events/map?categories=earthquake',
        headers: authHeaders,
      });

      expect(res.statusCode).toBe(200);
      expect(JSON.parse(res.body).count).toBe(0);
    });

    it('serves heatmap cells', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/events/map/heatmap?precision=1',
        headers: authHeaders,
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.totalEvents).toBe(1);
      expect(body.cells).toHaveLength(1);
      expect(body.cells[0].highestSeverity).toBe('MAJOR');
    });
  });

  describe('reader notifications', () => {
    it('notifies a follower when a development is recorded and lists it for them', async () => {
      const readerToken = AuthService.generateToken({
        id: 'usr_extensions_reader',
        organizationId: ORG,
        role: 'reader',
        clientType: 'human_mobile',
        scopes: ['news:read'],
      });
      const readerHeaders = { authorization: `Bearer ${readerToken}` };

      const users = new UserService(db);
      await users.followTarget('usr_extensions_reader', 'story', storyId);

      const intelligence = new StoryIntelligenceService(db);
      await intelligence.addTimelineEvent(
        storyId,
        {
          title: 'Trading resumes after the outage',
          description: 'The exchange reopened trading at 10:15.',
          eventType: 'DEVELOPMENT',
        },
        { ...editorCtx, clientType: 'custom_mcp' }
      );

      const res = await app.inject({
        method: 'GET',
        url: '/api/notifications/mine',
        headers: readerHeaders,
      });

      expect(res.statusCode).toBe(200);
      const notifications = JSON.parse(res.body);
      expect(notifications).toHaveLength(1);
      expect(notifications[0].type).toBe('story_update');
      expect(notifications[0].storyId).toBe(storyId);
      expect(notifications[0].message).toBe('Trading resumes after the outage');
    });

    it('does not leak another reader’s notifications', async () => {
      const otherToken = AuthService.generateToken({
        id: 'usr_extensions_other_reader',
        organizationId: ORG,
        role: 'reader',
        clientType: 'human_mobile',
        scopes: ['news:read'],
      });

      const res = await app.inject({
        method: 'GET',
        url: '/api/notifications/mine',
        headers: { authorization: `Bearer ${otherToken}` },
      });

      expect(res.statusCode).toBe(200);
      expect(JSON.parse(res.body)).toHaveLength(0);
    });
  });

  describe('newsroom analytics', () => {
    it('exposes the editorial and intelligence metrics', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/analytics/newsroom',
        headers: authHeaders,
      });

      expect(res.statusCode).toBe(200);
      const metrics = JSON.parse(res.body);
      expect(metrics).toHaveProperty('storyVelocityPerDay');
      expect(metrics).toHaveProperty('avgDraftToPublishHours');
      expect(metrics).toHaveProperty('avgReviewTimeHours');
      expect(metrics).toHaveProperty('correctionRate');
      expect(metrics).toHaveProperty('evidenceCoverage');
      expect(metrics).toHaveProperty('sourceDiversity');
    });
  });
});
