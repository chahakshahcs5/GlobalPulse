import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { FastifyInstance } from 'fastify';
import { buildServer } from '../../../apps/api/src/server';

describe('Editorial Review & Moderation Workflow Integration Tests', () => {
  let app: FastifyInstance;
  let storyId: string;

  beforeAll(async () => {
    app = buildServer();
    await app.ready();

    // Create a draft story to use across workflow tests
    const createRes = await app.inject({
      method: 'POST',
      url: '/api/stories',
      headers: { authorization: 'Bearer dev-admin' },
      payload: {
        title: 'Autonomous Energy Grid Pilot in Northern Europe',
        summary: 'Smart grid infrastructure deployed across three municipalities.',
        articleType: 'technology',
        blocks: [
          {
            id: 'blk_grid_01',
            blockType: 'paragraph',
            sortOrder: 0,
            data: {
              text: 'Regional energy grid pilots reported steady power distribution.',
              format: 'markdown',
            },
          },
        ],
      },
    });
    expect(createRes.statusCode).toBe(201);
    const story = JSON.parse(createRes.body);
    storyId = story.id;
  });

  afterAll(async () => {
    await app.close();
  });

  it('submits a draft story for review via POST /api/stories/:id/submit-review', async () => {
    const res = await app.inject({
      method: 'POST',
      url: `/api/stories/${storyId}/submit-review`,
      headers: { authorization: 'Bearer dev-editor' },
    });
    expect(res.statusCode).toBe(200);
    const story = JSON.parse(res.body);
    expect(story.status).toBe('IN_REVIEW');
  });

  it('lists pending stories on GET /api/stories/review-queue', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/stories/review-queue',
      headers: { authorization: 'Bearer dev-editor' },
    });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.data.some((s: any) => s.id === storyId)).toBe(true);
  });

  it('rejects a story back to draft via POST /api/stories/:id/reject with feedback', async () => {
    const res = await app.inject({
      method: 'POST',
      url: `/api/stories/${storyId}/reject`,
      headers: { authorization: 'Bearer dev-editor' },
      payload: { feedback: 'Please verify the primary energy data source.' },
    });
    expect(res.statusCode).toBe(200);
    const story = JSON.parse(res.body);
    expect(story.status).toBe('DRAFT');
  });

  it('approves and publishes a story via POST /api/stories/:id/approve', async () => {
    // Re-submit to review
    await app.inject({
      method: 'POST',
      url: `/api/stories/${storyId}/submit-review`,
      headers: { authorization: 'Bearer dev-editor' },
    });

    // Approve & publish
    const res = await app.inject({
      method: 'POST',
      url: `/api/stories/${storyId}/approve`,
      headers: { authorization: 'Bearer dev-editor' },
    });
    expect(res.statusCode).toBe(200);
    const story = JSON.parse(res.body);
    expect(story.status).toBe('PUBLISHED');
    expect(story.publishedAt).toBeDefined();
  });
});
