import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { FastifyInstance } from 'fastify';
import { buildServer } from '../../../apps/api/src/server';

describe('Reader Engagement & Moderation Integration Tests', () => {
  let app: FastifyInstance;
  let storyId: string;
  let commentId: string;

  beforeAll(async () => {
    app = buildServer();
    await app.ready();

    // Create a published story for reader engagement testing
    const createRes = await app.inject({
      method: 'POST',
      url: '/api/stories',
      headers: { authorization: 'Bearer admin-token' },
      payload: {
        title: 'Global Semiconductor Consortium Advances Joint Architecture',
        summary: 'Leading fabrication plants align on open RISC-V standards.',
        articleType: 'technology',
        blocks: [
          {
            id: 'blk_semi_01',
            blockType: 'paragraph',
            sortOrder: 0,
            data: { text: 'New architecture specifications released today.', format: 'markdown' },
          },
        ],
      },
    });
    const story = JSON.parse(createRes.body);
    storyId = story.id;

    // Publish story
    await app.inject({
      method: 'POST',
      url: `/api/stories/${storyId}/publish`,
      headers: { authorization: 'Bearer editor-token' },
    });
  });

  afterAll(async () => {
    await app.close();
  });

  it('creates a reader comment on POST /api/stories/:id/comments with XSS sanitization', async () => {
    const res = await app.inject({
      method: 'POST',
      url: `/api/stories/${storyId}/comments`,
      headers: { authorization: 'Bearer reader-token' },
      payload: {
        content: 'This architecture breakthrough significantly reduces licensing friction! <script>alert("xss")</script>',
        authorName: 'SiliconArchitect',
      },
    });
    expect(res.statusCode).toBe(201);
    const comment = JSON.parse(res.body);
    expect(comment.id).toMatch(/^cmt_/);
    expect(comment.content).toBe('This architecture breakthrough significantly reduces licensing friction!');
    expect(comment.authorName).toBe('SiliconArchitect');
    commentId = comment.id;
  });

  it('lists comments on GET /api/stories/:id/comments', async () => {
    const res = await app.inject({
      method: 'GET',
      url: `/api/stories/${storyId}/comments`,
      headers: { authorization: 'Bearer reader-token' },
    });
    expect(res.statusCode).toBe(200);
    const comments = JSON.parse(res.body);
    expect(comments.length).toBeGreaterThanOrEqual(1);
    expect(comments.some((c: any) => c.id === commentId)).toBe(true);
  });

  it('moderates a comment via PUT /api/comments/:commentId/moderate', async () => {
    const res = await app.inject({
      method: 'PUT',
      url: `/api/comments/${commentId}/moderate`,
      headers: { authorization: 'Bearer editor-token' },
      payload: {
        status: 'flagged',
        reason: 'Under editorial verification',
      },
    });
    expect(res.statusCode).toBe(200);
    const moderated = JSON.parse(res.body);
    expect(moderated.status).toBe('flagged');
    expect(moderated.moderationReason).toBe('Under editorial verification');
  });

  it('toggles reactions and retrieves summary on /api/stories/:id/reactions', async () => {
    // Toggle reaction on
    const toggleRes = await app.inject({
      method: 'POST',
      url: `/api/stories/${storyId}/reactions`,
      headers: { authorization: 'Bearer reader-token' },
      payload: { reactionType: 'insightful' },
    });
    expect(toggleRes.statusCode).toBe(200);
    const toggleData = JSON.parse(toggleRes.body);
    expect(toggleData.active).toBe(true);

    // Get summary
    const getRes = await app.inject({
      method: 'GET',
      url: `/api/stories/${storyId}/reactions`,
      headers: { authorization: 'Bearer reader-token' },
    });
    expect(getRes.statusCode).toBe(200);
    const summary = JSON.parse(getRes.body);
    expect(summary.counts.insightful).toBeGreaterThanOrEqual(1);
  });

  it('toggles and lists server-persisted bookmarks on /api/bookmarks', async () => {
    const toggleRes = await app.inject({
      method: 'POST',
      url: `/api/bookmarks/${storyId}`,
      headers: { authorization: 'Bearer reader-token' },
    });
    expect(toggleRes.statusCode).toBe(200);
    expect(JSON.parse(toggleRes.body).bookmarked).toBe(true);

    const listRes = await app.inject({
      method: 'GET',
      url: '/api/bookmarks',
      headers: { authorization: 'Bearer reader-token' },
    });
    expect(listRes.statusCode).toBe(200);
    const bookmarks = JSON.parse(listRes.body);
    expect(bookmarks.some((b: any) => b.storyId === storyId)).toBe(true);
  });
});
