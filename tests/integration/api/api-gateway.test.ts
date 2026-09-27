import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { FastifyInstance } from 'fastify';
import { buildServer } from '../../../apps/api/src/server';

describe('Modular Production API Gateway Integration Tests', () => {
  let app: FastifyInstance;
  let createdStoryId: string;

  beforeAll(async () => {
    app = buildServer();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Health & Observability Probes', () => {
    it('responds with system and database status on GET /health', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/health',
      });
      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.status).toBe('healthy');
      expect(body.services.database).toBeDefined();
      expect(body.system.memory).toBeDefined();
    });

    it('responds with liveness probe on GET /health/live', async () => {
      const res = await app.inject({ method: 'GET', url: '/health/live' });
      expect(res.statusCode).toBe(200);
      expect(JSON.parse(res.body).status).toBe('alive');
    });

    it('responds with readiness probe on GET /health/ready', async () => {
      const res = await app.inject({ method: 'GET', url: '/health/ready' });
      expect(res.statusCode).toBe(200);
      expect(JSON.parse(res.body).status).toBe('ready');
    });
  });

  describe('Discovery & OpenAPI Specifications', () => {
    it('exposes RFC 8414 & OpenAI OAuth Protected Resource metadata', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/.well-known/oauth-protected-resource',
      });
      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.resource).toBeDefined();
      expect(body.scopes_supported).toContain('news:read');
      expect(body.scopes_supported).toContain('news:write');
      expect(body.scopes_supported).toContain('news:publish');
      expect(body.scopes_supported).toContain('news:sources');
    });

    it('serves OpenAPI 3.1 schema on GET /docs/openapi.json', async () => {
      const res = await app.inject({ method: 'GET', url: '/docs/openapi.json' });
      expect(res.statusCode).toBe(200);
      const doc = JSON.parse(res.body);
      expect(doc.openapi).toBe('3.1.0');
      expect(doc.info.title).toContain('AI News Platform');
      expect(doc.paths['/api/stories']).toBeDefined();
    });
  });

  describe('Story Lifecycle & Block Management', () => {
    it('creates a new draft story with valid authorization', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/stories',
        headers: { authorization: 'Bearer test-token' },
        payload: {
          title: 'Quantum Advantage Milestone Confirmed',
          summary: 'Neutral-atom quantum processor achieves 1,000 logical qubits error-mitigated.',
          articleType: 'technology',
        },
      });
      expect(res.statusCode).toBe(201);
      const story = JSON.parse(res.body);
      expect(story.id).toBeDefined();
      expect(story.status).toBe('DRAFT');
      expect(story.currentVersionNumber).toBe(1);
      createdStoryId = story.id;
    });

    it('appends an interactive chart block to the story', async () => {
      const res = await app.inject({
        method: 'POST',
        url: `/api/stories/${createdStoryId}/blocks`,
        headers: { authorization: 'Bearer test-token' },
        payload: {
          id: 'chart_quantum_fidelity',
          blockType: 'chart',
          sortOrder: 0,
          data: {
            chartType: 'bar',
            title: 'Qubit Fidelity Comparison (%)',
            xAxis: { key: 'platform', label: 'Platform Architecture', type: 'category' },
            yAxis: { label: 'Two-Qubit Gate Fidelity (%)' },
            series: [{ name: 'Fidelity', key: 'score' }],
            values: [
              { platform: 'Superconducting', score: 99.4 },
              { platform: 'Trapped-Ion', score: 99.8 },
              { platform: 'Neutral-Atom', score: 99.92 },
            ],
          },
        },
      });
      expect(res.statusCode).toBe(201);
      const block = JSON.parse(res.body);
      expect(block.id).toBe('chart_quantum_fidelity');
      expect(block.blockType).toBe('chart');
    });

    it('creates an editorial revision version (v2)', async () => {
      const res = await app.inject({
        method: 'POST',
        url: `/api/stories/${createdStoryId}/versions`,
        headers: { authorization: 'Bearer test-token' },
        payload: {
          title: 'Quantum Advantage Milestone Confirmed: Verified in Peer Review',
          summary: 'Neutral-atom processor benchmark verified across 4 independent national laboratories.',
          changeSummary: 'Updated title and confirmed laboratory peer review corroboration.',
          blocks: [
            {
              id: 'text_intro',
              blockType: 'paragraph',
              sortOrder: 0,
              data: {
                format: 'markdown',
                text: 'In an unprecedented development, quantum benchmarks have crossed commercial thresholds.',
              },
            },
          ],
        },
      });
      expect(res.statusCode).toBe(201);
      const version = JSON.parse(res.body);
      expect(version.versionNumber).toBe(2);
      expect(version.changeSummary).toContain('Updated title');
    });

    it('publishes the story', async () => {
      const res = await app.inject({
        method: 'POST',
        url: `/api/stories/${createdStoryId}/publish`,
        headers: { authorization: 'Bearer test-token' },
        payload: { idempotencyKey: 'pub_test_quantum_1' },
      });
      expect(res.statusCode).toBe(200);
      const published = JSON.parse(res.body);
      expect(published.status).toBe('PUBLISHED');
    });

    it('retrieves the published story by ID', async () => {
      const res = await app.inject({
        method: 'GET',
        url: `/api/stories/${createdStoryId}`,
        headers: { authorization: 'Bearer test-token' },
      });
      expect(res.statusCode).toBe(200);
      const fetched = JSON.parse(res.body);
      expect(fetched.id).toBe(createdStoryId);
      expect(fetched.status).toBe('PUBLISHED');
      expect(fetched.blocks.length).toBeGreaterThan(0);
    });

    it('retrieves version history for the story', async () => {
      const res = await app.inject({
        method: 'GET',
        url: `/api/stories/${createdStoryId}/versions`,
        headers: { authorization: 'Bearer test-token' },
      });
      expect(res.statusCode).toBe(200);
      const versions = JSON.parse(res.body);
      expect(versions.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Taxonomy & Entity Modules', () => {
    it('creates and lists topics', async () => {
      const createRes = await app.inject({
        method: 'POST',
        url: '/api/topics',
        headers: { authorization: 'Bearer test-token' },
        payload: {
          name: 'Artificial Intelligence & Robotics',
          description: 'Autonomous agents, foundational models, and robotics.',
        },
      });
      expect(createRes.statusCode).toBe(201);
      const topic = JSON.parse(createRes.body);
      expect(topic.id).toBeDefined();

      const listRes = await app.inject({
        method: 'GET',
        url: '/api/topics',
        headers: { authorization: 'Bearer test-token' },
      });
      expect(listRes.statusCode).toBe(200);
      const topics = JSON.parse(listRes.body);
      expect(topics.some((t: { name?: string }) => t.name === 'Artificial Intelligence & Robotics')).toBe(true);
    });

    it('creates and lists entities', async () => {
      const createRes = await app.inject({
        method: 'POST',
        url: '/api/entities',
        headers: { authorization: 'Bearer test-token' },
        payload: {
          name: 'OpenAI Foundation',
          type: 'ORGANIZATION',
          description: 'AI research and deployment company.',
        },
      });
      expect(createRes.statusCode).toBe(201);
      const entity = JSON.parse(createRes.body);
      expect(entity.id).toBeDefined();

      const listRes = await app.inject({
        method: 'GET',
        url: '/api/entities',
        headers: { authorization: 'Bearer test-token' },
      });
      expect(listRes.statusCode).toBe(200);
      const entities = JSON.parse(listRes.body);
      expect(entities.some((e: { name?: string }) => e.name === 'OpenAI Foundation')).toBe(true);
    });

    it('creates and attaches primary sources', async () => {
      const createRes = await app.inject({
        method: 'POST',
        url: '/api/sources',
        headers: { authorization: 'Bearer test-token' },
        payload: {
          url: 'https://nature.com/articles/quantum-computing-2026',
          title: 'Demonstration of fault-tolerant quantum operations',
          publisher: 'Nature Publishing Group',
          sourceType: 'ACADEMIC_PAPER',
        },
      });
      expect(createRes.statusCode).toBe(201);
      const source = JSON.parse(createRes.body);
      expect(source.id).toBeDefined();
    });
  });

  describe('Search & Deduplication Endpoints', () => {
    it('executes hybrid story search', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/search/stories?query=Quantum',
        headers: { authorization: 'Bearer test-token' },
      });
      expect(res.statusCode).toBe(200);
      const result = JSON.parse(res.body);
      expect(result.items).toBeDefined();
      expect(result.items.length).toBeGreaterThan(0);
    });

    it('finds similar stories for deduplication checks', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/search/stories/similar',
        headers: { authorization: 'Bearer test-token' },
        payload: {
          title: 'Quantum processor achievement announced',
          summary: 'Neutral-atom processors benchmark logical qubits.',
          threshold: 0.2,
        },
      });
      expect(res.statusCode).toBe(200);
      const matches = JSON.parse(res.body);
      expect(Array.isArray(matches)).toBe(true);
      expect(matches.length).toBeGreaterThan(0);
    });

    it('performs federated search across stories, topics, entities, and sources', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/search/federated?q=Quantum',
        headers: { authorization: 'Bearer test-token' },
      });
      expect(res.statusCode).toBe(200);
      const result = JSON.parse(res.body);
      expect(result.stories).toBeDefined();
      expect(result.topics).toBeDefined();
      expect(result.entities).toBeDefined();
    });
  });

  describe('Media & Background Variant Processing', () => {
    it('registers media asset and queues processing variants', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/media',
        headers: { authorization: 'Bearer test-token' },
        payload: {
          url: 'https://images.globalpulse.news/quantum-lab.png',
          mediaType: 'image',
          altText: 'Neutral atom vacuum chamber',
          formats: ['webp', 'avif'],
        },
      });
      expect(res.statusCode).toBe(201);
      const body = JSON.parse(res.body);
      expect(body.success).toBe(true);
      expect(body.data.variants.length).toBe(3);
    });
  });

  describe('Real-time SSE Status & Audit Trails', () => {
    it('reports connected clients status on GET /api/realtime/status', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/realtime/status',
      });
      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.connectedClients).toBeDefined();
    });

    it('queries immutable audit logs for enterprise compliance with admin token', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/audit',
        headers: { authorization: 'Bearer admin-token' },
      });
      expect(res.statusCode).toBe(200);
      const logs = JSON.parse(res.body);
      expect(Array.isArray(logs)).toBe(true);
      expect(logs.length).toBeGreaterThan(0);
    });

    it('rejects audit query without news:admin scope with 403 Forbidden', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/audit',
        headers: { authorization: 'Bearer test-token' },
      });
      expect(res.statusCode).toBe(403);
      const problem = JSON.parse(res.body);
      expect(problem.status).toBe(403);
      expect(problem.detail).toContain('Insufficient role privileges');
    });
  });

  describe('RFC 7807 Problem Details & Error Handling', () => {
    it('returns RFC 7807 404 Problem Details for non-existent story', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/stories/sty_non_existent_9999',
        headers: { authorization: 'Bearer test-token' },
      });
      expect(res.statusCode).toBe(404);
      const problem = JSON.parse(res.body);
      expect(problem.type).toContain('not-found');
      expect(problem.status).toBe(404);
      expect(problem.detail).toContain('sty_non_existent_9999');
      expect(problem.timestamp).toBeDefined();
    });

    it('returns RFC 7807 400 Problem Details for invalid payload schema', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/stories',
        headers: { authorization: 'Bearer test-token' },
        payload: {
          title: '', // Invalid: empty title violates min length
          summary: 'Missing requirements',
        },
      });
      expect(res.statusCode).toBe(400);
      const problem = JSON.parse(res.body);
      expect(problem.code).toBe('VALIDATION_ERROR');
      expect(problem.status).toBe(400);
      expect(problem.errors.length).toBeGreaterThan(0);
    });

    it('returns RFC 7807 401 Problem Details for expired bearer token', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/stories',
        headers: { authorization: 'Bearer expired_token' },
      });
      expect(res.statusCode).toBe(401);
      const problem = JSON.parse(res.body);
      expect(problem.status).toBe(401);
      expect(problem.detail).toContain('Token has expired');
    });
  });

  describe('Taxonomy, Topics & Knowledge Graph Endpoints', () => {
    let createdTopicId: string;

    it('creates a new taxonomy topic via POST /api/topics', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/topics',
        headers: { authorization: 'Bearer test-token' },
        payload: {
          name: 'Generative AI & LLMs',
          description: 'Autonomous agents, foundation models, and AI news platforms',
          aliases: ['GenAI', 'LLM'],
        },
      });
      expect(res.statusCode).toBe(201);
      const topic = JSON.parse(res.body);
      expect(topic.id).toMatch(/^top_/);
      expect(topic.slug).toBe('generative-ai-llms');
      createdTopicId = topic.id;
    });

    it('retrieves topics list via GET /api/topics', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/topics',
        headers: { authorization: 'Bearer test-token' },
      });
      expect(res.statusCode).toBe(200);
      const topics = JSON.parse(res.body);
      expect(Array.isArray(topics)).toBe(true);
      expect(topics.some((t: { id: string }) => t.id === createdTopicId)).toBe(true);
    });

    it('retrieves single topic by ID via GET /api/topics/:id', async () => {
      const res = await app.inject({
        method: 'GET',
        url: `/api/topics/${createdTopicId}`,
        headers: { authorization: 'Bearer test-token' },
      });
      expect(res.statusCode).toBe(200);
      const topic = JSON.parse(res.body);
      expect(topic.id).toBe(createdTopicId);
      expect(topic.name).toBe('Generative AI & LLMs');
    });
  });

  describe('Verified Sources, Attachments & Citations Endpoints', () => {
    let createdSourceId: string;

    it('registers a verified source via POST /api/sources', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/sources',
        headers: { authorization: 'Bearer test-token' },
        payload: {
          url: 'https://news.mit.edu/2026/quantum-neutral-atom-computing',
          title: 'MIT Researchers Achieve Fault-Tolerant Quantum Neutral-Atom Architecture',
          publisher: 'MIT News',
          author: 'David L. Chandler',
        },
      });
      expect(res.statusCode).toBe(201);
      const source = JSON.parse(res.body);
      expect(source.id).toMatch(/^src_/);
      expect(source.publisher).toBe('MIT News');
      createdSourceId = source.id;
    });

    it('lists registered sources via GET /api/sources', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/sources',
        headers: { authorization: 'Bearer test-token' },
      });
      expect(res.statusCode).toBe(200);
      const sources = JSON.parse(res.body);
      expect(Array.isArray(sources)).toBe(true);
      expect(sources.length).toBeGreaterThan(0);
    });

    it('retrieves source by ID via GET /api/sources/:id', async () => {
      const res = await app.inject({
        method: 'GET',
        url: `/api/sources/${createdSourceId}`,
        headers: { authorization: 'Bearer test-token' },
      });
      expect(res.statusCode).toBe(200);
      const source = JSON.parse(res.body);
      expect(source.id).toBe(createdSourceId);
      expect(source.title).toContain('MIT Researchers');
    });

    it('attaches source to story via POST /api/sources/attach', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/sources/attach',
        headers: { authorization: 'Bearer test-token' },
        payload: {
          storyId: createdStoryId,
          sourceId: createdSourceId,
        },
      });
      expect(res.statusCode).toBe(201);
      const body = JSON.parse(res.body);
      expect(body.success).toBe(true);
      expect(body.sourceId).toBe(createdSourceId);
    });
  });

  describe('Entities & Named Entity Recognition Endpoints', () => {
    let createdEntityId: string;

    it('creates an entity via POST /api/entities', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/entities',
        headers: { authorization: 'Bearer test-token' },
        payload: {
          name: 'European Space Agency',
          type: 'ORGANIZATION',
          description: 'Intergovernmental organisation dedicated to space exploration',
        },
      });
      expect(res.statusCode).toBe(201);
      const entity = JSON.parse(res.body);
      expect(entity.id).toMatch(/^ent_/);
      expect(entity.name).toBe('European Space Agency');
      createdEntityId = entity.id;
    });

    it('lists entities via GET /api/entities', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/entities',
        headers: { authorization: 'Bearer test-token' },
      });
      expect(res.statusCode).toBe(200);
      const entities = JSON.parse(res.body);
      expect(Array.isArray(entities)).toBe(true);
      expect(entities.some((e: { id: string }) => e.id === createdEntityId)).toBe(true);
    });

    it('retrieves entity by ID via GET /api/entities/:id', async () => {
      const res = await app.inject({
        method: 'GET',
        url: `/api/entities/${createdEntityId}`,
        headers: { authorization: 'Bearer test-token' },
      });
      expect(res.statusCode).toBe(200);
      const entity = JSON.parse(res.body);
      expect(entity.id).toBe(createdEntityId);
      expect(entity.type).toBe('ORGANIZATION');
    });
  });

  describe('Events & Historical Timeline Endpoints', () => {
    let createdEventId: string;

    it('creates a timeline event via POST /api/events', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/events',
        headers: { authorization: 'Bearer test-token' },
        payload: {
          title: 'Quantum Advantage Treaty Ratification',
          summary: 'Multilateral agreement establishing quantum non-proliferation norms',
          occurredAt: '2026-04-10T14:00:00Z',
        },
      });
      expect(res.statusCode).toBe(201);
      const event = JSON.parse(res.body);
      expect(event.id).toMatch(/^evt_/);
      expect(event.title).toBe('Quantum Advantage Treaty Ratification');
      createdEventId = event.id;
    });

    it('lists events via GET /api/events', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/events',
        headers: { authorization: 'Bearer test-token' },
      });
      expect(res.statusCode).toBe(200);
      const events = JSON.parse(res.body);
      expect(Array.isArray(events)).toBe(true);
      expect(events.some((e: { id: string }) => e.id === createdEventId)).toBe(true);
    });

    it('retrieves event by ID via GET /api/events/:id', async () => {
      const res = await app.inject({
        method: 'GET',
        url: `/api/events/${createdEventId}`,
        headers: { authorization: 'Bearer test-token' },
      });
      expect(res.statusCode).toBe(200);
      const event = JSON.parse(res.body);
      expect(event.id).toBe(createdEventId);
      expect(event.summary).toBe('Multilateral agreement establishing quantum non-proliferation norms');
    });
  });

  describe('Semantic Search & Federated Discovery Endpoints', () => {
    it('executes federated multi-domain search across stories, topics, entities, and sources', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/search/federated?q=Quantum',
        headers: { authorization: 'Bearer test-token' },
      });
      expect(res.statusCode).toBe(200);
      const result = JSON.parse(res.body);
      expect(result.stories).toBeDefined();
      expect(result.events).toBeDefined();
      expect(result.topics).toBeDefined();
      expect(result.entities).toBeDefined();
      expect(result.sources).toBeDefined();
    });

    it('finds similar stories via POST /api/search/similar', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/search/similar',
        headers: { authorization: 'Bearer test-token' },
        payload: {
          storyId: createdStoryId,
          limit: 5,
        },
      });
      expect(res.statusCode).toBe(200);
      const similar = JSON.parse(res.body);
      expect(Array.isArray(similar)).toBe(true);
    });
  });
});
