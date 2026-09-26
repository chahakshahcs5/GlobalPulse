import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { FastifyInstance } from 'fastify';
import { buildServer } from '../apps/api/src/server.js';

describe('API Gateway & Protected Resource Endpoints', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = buildServer();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('responds with healthy status on GET /health', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/health',
    });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.status).toBe('healthy');
  });

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
  });

  it('handles end-to-end story workflow over HTTP', async () => {
    // 1. Create Story
    const createRes = await app.inject({
      method: 'POST',
      url: '/api/stories',
      headers: {
        authorization: 'Bearer test-token',
      },
      payload: {
        title: 'Central Bank Digital Currency Pilot Launched',
        summary: 'Cross-border wholesale transactions testing begins.',
        articleType: 'business',
      },
    });
    expect(createRes.statusCode).toBe(201);
    const story = JSON.parse(createRes.body);
    expect(story.id).toBeDefined();
    expect(story.status).toBe('DRAFT');

    // 2. Add Chart Block
    const blockRes = await app.inject({
      method: 'POST',
      url: `/api/stories/${story.id}/blocks`,
      headers: {
        authorization: 'Bearer test-token',
      },
      payload: {
        id: 'chart_cbdc',
        blockType: 'chart',
        sortOrder: 0,
        data: {
          chartType: 'line',
          title: 'Settlement Latency (ms)',
          xAxis: { key: 'round', label: 'Batch Round', type: 'category' },
          yAxis: { label: 'Milliseconds' },
          series: [{ name: 'Latency', key: 'ms' }],
          values: [{ round: '1', ms: 450 }, { round: '2', ms: 180 }, { round: '3', ms: 85 }],
        },
      },
    });
    expect(blockRes.statusCode).toBe(201);

    // 3. Publish Story
    const publishRes = await app.inject({
      method: 'POST',
      url: `/api/stories/${story.id}/publish`,
      headers: {
        authorization: 'Bearer test-token',
      },
      payload: {
        idempotencyKey: 'pub_key_1',
      },
    });
    expect(publishRes.statusCode).toBe(200);
    const publishedStory = JSON.parse(publishRes.body);
    expect(publishedStory.status).toBe('PUBLISHED');

    // 4. Retrieve by ID
    const getRes = await app.inject({
      method: 'GET',
      url: `/api/stories/${story.id}`,
      headers: {
        authorization: 'Bearer test-token',
      },
    });
    expect(getRes.statusCode).toBe(200);
    const fetched = JSON.parse(getRes.body);
    expect(fetched.title).toBe('Central Bank Digital Currency Pilot Launched');
    expect(fetched.blocks.length).toBe(1);
  });
});
