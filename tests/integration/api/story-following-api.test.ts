import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { FastifyInstance } from 'fastify';
import { buildServer } from '../../../apps/api/src/server';
import { AuthService } from '@ai-news/auth';
import { db } from '@ai-news/database';
import { StoryService } from '@ai-news/stories';

describe('Story & cluster following REST API', () => {
  let app: FastifyInstance;
  let authHeaders: Record<string, string>;
  let storyId: string;
  let clusterId: string;

  beforeAll(async () => {
    app = buildServer();
    await app.ready();

    const token = AuthService.generateToken({
      id: 'usr_follow_api',
      organizationId: 'org_default',
      role: 'reader',
      clientType: 'human_mobile',
      scopes: ['news:read'],
    });
    authHeaders = { 'Content-Type': 'application/json', authorization: `Bearer ${token}` };

    const stories = new StoryService(db);
    const story = await stories.createStory(
      { title: 'Trade negotiations continue', summary: 'A story a reader follows.' },
      {
        organizationId: 'org_default',
        authorId: 'usr_reporter',
        clientType: 'human_web',
        createdVia: 'api',
      }
    );
    storyId = story.id;

    const now = new Date().toISOString();
    clusterId = 'clu_trade';
    await db.clusters.create({
      id: clusterId,
      organizationId: 'org_default',
      title: 'Trade negotiations',
      summary: 'Ongoing coverage',
      leadStoryId: story.id,
      storyIds: [story.id],
      perspectives: [],
      timeline: [],
      createdAt: now,
      updatedAt: now,
    });
  });

  afterAll(async () => {
    await app.close();
  });

  it('follows a story', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/users/follow',
      headers: authHeaders,
      payload: { targetType: 'story', targetId: storyId },
    });

    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body).targetType).toBe('story');
  });

  it('follows a story cluster', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/users/follow',
      headers: authHeaders,
      payload: { targetType: 'cluster', targetId: clusterId },
    });

    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body).targetType).toBe('cluster');
  });

  it('rejects an unsupported follow target type', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/users/follow',
      headers: authHeaders,
      payload: { targetType: 'galaxy', targetId: 'x' },
    });

    expect(res.statusCode).toBe(400);
  });

  it('reports whether the reader follows a target', async () => {
    const res = await app.inject({
      method: 'GET',
      url: `/api/users/following/story/${storyId}`,
      headers: authHeaders,
    });

    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body).following).toBe(true);
  });

  it('lists follows including story and cluster targets', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/users/following',
      headers: authHeaders,
    });

    expect(res.statusCode).toBe(200);
    const following = JSON.parse(res.body) as Array<{ targetType: string }>;
    const types = following.map((record) => record.targetType);
    expect(types).toContain('story');
    expect(types).toContain('cluster');
  });

  it('unfollows a story', async () => {
    const res = await app.inject({
      method: 'DELETE',
      url: `/api/users/follow/story/${storyId}`,
      // No Content-Type: a bodyless DELETE must not declare a JSON payload.
      headers: { authorization: authHeaders.authorization },
    });

    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body).success).toBe(true);

    const check = await app.inject({
      method: 'GET',
      url: `/api/users/following/story/${storyId}`,
      headers: authHeaders,
    });
    expect(JSON.parse(check.body).following).toBe(false);
  });

  it('resolves follows into displayable entries', async () => {
    await app.inject({
      method: 'POST',
      url: '/api/users/follow',
      headers: authHeaders,
      payload: { targetType: 'story', targetId: storyId },
    });

    const res = await app.inject({
      method: 'GET',
      url: '/api/users/following/resolved',
      headers: authHeaders,
    });

    expect(res.statusCode).toBe(200);
    const resolved = JSON.parse(res.body) as Array<{
      targetType: string;
      label: string;
      href?: string;
    }>;

    const story = resolved.find((entry) => entry.targetType === 'story');
    expect(story).toBeDefined();
    expect(story?.label).toBe('Trade negotiations continue');
    expect(story?.href).toContain('/stories/');
  });
});
