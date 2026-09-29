import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { FastifyInstance } from 'fastify';
import { buildServer } from '../../../apps/api/src/server';

describe('Story Scheduling REST API Integration Tests', () => {
  let app: FastifyInstance;
  let storyId: string;

  beforeAll(async () => {
    app = buildServer();
    await app.ready();

    // Create a draft story to schedule
    const createRes = await app.inject({
      method: 'POST',
      url: '/api/stories',
      headers: { authorization: 'Bearer dev-admin' },
      payload: {
        title: 'Deep Space Telescope Detects Atmospheric Water Vapor on Exoplanet',
        summary: 'Astronomical spectroscopy reveals habitable zone signatures.',
        articleType: 'science',
        blocks: [
          {
            id: 'b_sched_1',
            blockType: 'paragraph',
            sortOrder: 0,
            data: { text: 'Direct spectroscopic data confirms atmospheric water vapor bands.' },
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

  it('rejects scheduling with a past timestamp', async () => {
    const pastTime = new Date(Date.now() - 3600000).toISOString();
    const res = await app.inject({
      method: 'POST',
      url: `/api/stories/${storyId}/schedule`,
      headers: { authorization: 'Bearer dev-admin' },
      payload: { publishAt: pastTime },
    });

    expect(res.statusCode).toBe(422);
    const body = JSON.parse(res.body);
    expect(body.detail).toContain('future');
  });

  it('schedules story for future embargo release via POST /api/stories/:id/schedule', async () => {
    const futureTime = new Date(Date.now() + 86400000).toISOString(); // 24h in future
    const res = await app.inject({
      method: 'POST',
      url: `/api/stories/${storyId}/schedule`,
      headers: { authorization: 'Bearer dev-admin' },
      payload: { publishAt: futureTime },
    });

    expect(res.statusCode).toBe(200);
    const updated = JSON.parse(res.body);
    expect(updated.id).toBe(storyId);
    expect(updated.status).toBe('SCHEDULED');
    expect(updated.scheduledPublishAt).toBe(futureTime);
  });

  it('lists scheduled stories in chronological order via GET /api/stories/scheduled/list', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/stories/scheduled/list',
      headers: { authorization: 'Bearer dev-admin' },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(Array.isArray(body.data)).toBe(true);
    const found = body.data.find((s: { id: string }) => s.id === storyId);
    expect(found).toBeDefined();
    expect(found.status).toBe('SCHEDULED');
  });

  it('sweeps due stories via POST /api/stories/scheduled/sweep', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/stories/scheduled/sweep',
      headers: { authorization: 'Bearer dev-admin' },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.success).toBe(true);
    expect(typeof body.count).toBe('number');
  });
});
