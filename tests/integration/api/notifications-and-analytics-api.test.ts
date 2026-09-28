import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { FastifyInstance } from 'fastify';
import { buildServer } from '../../../apps/api/src/server';

describe('Notifications, Analytics, and User Management API Endpoints (Integration Tests)', () => {
  let app: FastifyInstance;
  let storyId: string;
  let invitedUserId: string;

  beforeAll(async () => {
    app = buildServer();
    await app.ready();

    // Create a story to use across analytics and breaking alert tests
    const createRes = await app.inject({
      method: 'POST',
      url: '/api/stories',
      headers: { authorization: 'Bearer admin-token' },
      payload: {
        title: 'Central Bank Digital Currency Pilot Across Asian Financial Hubs',
        summary: 'Multilateral cross-border settlement test yields sub-second clearing times.',
        articleType: 'business',
        blocks: [
          {
            id: 'b1',
            blockType: 'paragraph',
            sortOrder: 0,
            data: { text: 'Cross-border liquidity tests confirmed stable settlement.' },
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

  it('serves story analytics via GET /api/analytics/stories/:id', async () => {
    const res = await app.inject({
      method: 'GET',
      url: `/api/analytics/stories/${storyId}`,
    });

    expect(res.statusCode).toBe(200);
    const data = JSON.parse(res.body);
    expect(data.storyId).toBe(storyId);
    expect(data.viewsCount).toBeGreaterThan(0);
    expect(data.viralityScore).toBeGreaterThanOrEqual(0);
  });

  it('serves trending stories via GET /api/analytics/trending', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/analytics/trending?limit=5',
    });

    expect(res.statusCode).toBe(200);
    const data = JSON.parse(res.body);
    expect(Array.isArray(data)).toBe(true);
  });

  it('serves executive newsroom metrics via GET /api/analytics/newsroom with auth', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/analytics/newsroom',
      headers: { authorization: 'Bearer editor-token' },
    });

    expect(res.statusCode).toBe(200);
    const data = JSON.parse(res.body);
    expect(data.totalStories).toBeGreaterThanOrEqual(1);
    expect(data.activeCategoriesCount).toBeGreaterThanOrEqual(1);
  });

  it('broadcasts breaking news alerts via POST /api/notifications/breaking', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/notifications/breaking',
      headers: { authorization: 'Bearer admin-token' },
      payload: {
        storyId,
        headline: 'BREAKING: Regional Digital Currency Settlements Go Live',
        urgency: 'urgent',
      },
    });

    expect(res.statusCode).toBe(200);
    const data = JSON.parse(res.body);
    expect(data.id).toBeDefined();
    expect(data.type).toBe('breaking_news');
    expect(data.severity).toBe('urgent');
  });

  it('retrieves recent newsroom notifications via GET /api/notifications', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/notifications?limit=10',
    });

    expect(res.statusCode).toBe(200);
    const data = JSON.parse(res.body);
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThanOrEqual(1);
  });

  it('manages staff and roles via /api/users endpoints', async () => {
    // 1. List users
    const listRes = await app.inject({
      method: 'GET',
      url: '/api/users',
      headers: { authorization: 'Bearer admin-token' },
    });
    expect(listRes.statusCode).toBe(200);
    const users = JSON.parse(listRes.body);
    expect(users.length).toBeGreaterThanOrEqual(3);

    // 2. Invite user
    const inviteRes = await app.inject({
      method: 'POST',
      url: '/api/users/invite',
      headers: { authorization: 'Bearer admin-token' },
      payload: {
        name: 'Rachel Adams',
        email: 'rachel.adams@news.platform',
        role: 'journalist',
        bio: 'Financial markets correspondent',
      },
    });
    expect(inviteRes.statusCode).toBe(201);
    const invited = JSON.parse(inviteRes.body);
    expect(invited.id).toBeDefined();
    invitedUserId = invited.id;

    // 3. Promote role to editor
    const roleRes = await app.inject({
      method: 'PUT',
      url: `/api/users/${invitedUserId}/role`,
      headers: { authorization: 'Bearer admin-token' },
      payload: { role: 'editor' },
    });
    expect(roleRes.statusCode).toBe(200);
    const updated = JSON.parse(roleRes.body);
    expect(updated.role).toBe('editor');
  });
});
