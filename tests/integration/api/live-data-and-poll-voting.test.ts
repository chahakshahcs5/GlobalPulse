import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { FastifyInstance } from 'fastify';
import { buildServer } from '../../../apps/api/src/server';

/**
 * Live data and reader poll voting over the REST API.
 *
 * Both features used to be nominal: polls counted votes in the reader's
 * browser, and "live" blocks rendered a snapshot that never changed. These
 * tests cover the server-backed behaviour end to end.
 */
describe('Live feeds and poll voting (API)', () => {
  let app: FastifyInstance;
  let storyId: string;
  let pollBlockId: string;

  beforeAll(async () => {
    app = buildServer();
    await app.ready();

    const createRes = await app.inject({
      method: 'POST',
      url: '/api/stories',
      headers: { authorization: 'Bearer dev-admin' },
      payload: {
        title: 'Grid operators publish a live demand signal',
        summary: 'A live data story with a reader poll attached.',
        articleType: 'technology',
        blocks: [
          {
            id: 'blk_live_01',
            blockType: 'live_data',
            sortOrder: 0,
            data: {
              title: 'Live Grid Demand',
              refreshIntervalSeconds: 30,
              liveKey: 'grid_demand',
              items: [
                {
                  id: 'peak',
                  label: 'Peak demand',
                  provider: 'Grid Operator',
                  value: 41200,
                  change: 1.4,
                  unit: 'MW',
                  asOf: '2026-10-20T10:00:00.000Z',
                },
              ],
            },
          },
          {
            id: 'blk_poll_01',
            blockType: 'poll',
            sortOrder: 1,
            data: {
              pollId: 'pol_grid_2026',
              question: 'Will peak demand exceed 45 GW this winter?',
              options: [
                { id: 'opt_1', text: 'Yes', voteCount: 10 },
                { id: 'opt_2', text: 'No', voteCount: 5 },
              ],
              totalVotes: 15,
              closed: false,
            },
          },
        ],
      },
    });
    storyId = JSON.parse(createRes.body).id;
    pollBlockId = 'blk_poll_01';
  });

  afterAll(async () => {
    await app.close();
  });

  // ---------------------------------------------------------------------------
  // Live feeds
  // ---------------------------------------------------------------------------

  it('publishes a live feed and serves it back', async () => {
    const put = await app.inject({
      method: 'PUT',
      url: '/api/live/feeds/grid_demand',
      headers: { authorization: 'Bearer dev-editor' },
      payload: {
        title: 'Grid Demand',
        provider: 'Grid Operator',
        refreshIntervalSeconds: 30,
        items: [
          {
            id: 'peak',
            label: 'Peak demand',
            value: 43800,
            previousValue: 41200,
            change: 6.3,
            unit: 'MW',
            asOf: '2026-10-20T10:30:00.000Z',
          },
        ],
      },
    });
    expect(put.statusCode).toBe(200);

    const get = await app.inject({
      method: 'GET',
      url: '/api/live/feeds/grid_demand',
      headers: { authorization: 'Bearer dev-reader' },
    });
    expect(get.statusCode).toBe(200);

    const feed = JSON.parse(get.body);
    expect(feed.key).toBe('grid_demand');
    expect(feed.items[0].value).toBe(43800);
  });

  it('lists the registered live feeds', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/live/feeds',
      headers: { authorization: 'Bearer dev-reader' },
    });
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body).some((f: { key: string }) => f.key === 'grid_demand')).toBe(true);
  });

  it('rejects a live feed with no items', async () => {
    const res = await app.inject({
      method: 'PUT',
      url: '/api/live/feeds/broken',
      headers: { authorization: 'Bearer dev-editor' },
      payload: { title: 'Broken', items: [] },
    });
    expect(res.statusCode).toBeGreaterThanOrEqual(400);
  });

  it('refuses a live feed write without write scope', async () => {
    const res = await app.inject({
      method: 'PUT',
      url: '/api/live/feeds/grid_demand',
      headers: { authorization: 'Bearer dev-reader' },
      payload: { items: [{ id: 'x', label: 'X', value: 1 }] },
    });
    expect(res.statusCode).toBeGreaterThanOrEqual(400);
  });

  // ---------------------------------------------------------------------------
  // Poll voting
  // ---------------------------------------------------------------------------

  it('returns the poll tally with the baseline counts', async () => {
    const res = await app.inject({
      method: 'GET',
      url: `/api/stories/${storyId}/blocks/${pollBlockId}/poll`,
      headers: { authorization: 'Bearer dev-reader' },
    });
    expect(res.statusCode).toBe(200);

    const tally = JSON.parse(res.body);
    expect(tally.totalVotes).toBe(15);
    expect(tally.options.find((o: { id: string }) => o.id === 'opt_1').voteCount).toBe(10);
    expect(tally.userVotedOptionId).toBeNull();
  });

  it('records a vote and folds it into the tally', async () => {
    const res = await app.inject({
      method: 'POST',
      url: `/api/stories/${storyId}/blocks/${pollBlockId}/poll`,
      headers: { authorization: 'Bearer dev-reader' },
      payload: { optionId: 'opt_1' },
    });
    expect(res.statusCode).toBe(200);

    const tally = JSON.parse(res.body);
    expect(tally.totalVotes).toBe(16);
    expect(tally.options.find((o: { id: string }) => o.id === 'opt_1').voteCount).toBe(11);
    expect(tally.userVotedOptionId).toBe('opt_1');
  });

  it("replaces a reader's previous choice instead of counting it twice", async () => {
    const res = await app.inject({
      method: 'POST',
      url: `/api/stories/${storyId}/blocks/${pollBlockId}/poll`,
      headers: { authorization: 'Bearer dev-reader' },
      payload: { optionId: 'opt_2' },
    });
    expect(res.statusCode).toBe(200);

    const tally = JSON.parse(res.body);
    expect(tally.totalVotes).toBe(16);
    expect(tally.options.find((o: { id: string }) => o.id === 'opt_1').voteCount).toBe(10);
    expect(tally.options.find((o: { id: string }) => o.id === 'opt_2').voteCount).toBe(6);
    expect(tally.userVotedOptionId).toBe('opt_2');
  });

  it('rejects a vote for an option that is not on the poll', async () => {
    const res = await app.inject({
      method: 'POST',
      url: `/api/stories/${storyId}/blocks/${pollBlockId}/poll`,
      headers: { authorization: 'Bearer dev-reader' },
      payload: { optionId: 'opt_ghost' },
    });
    expect(res.statusCode).toBeGreaterThanOrEqual(400);
  });

  it('never rewrites the published story payload when a vote comes in', async () => {
    const res = await app.inject({
      method: 'GET',
      url: `/api/stories/${storyId}`,
      headers: { authorization: 'Bearer dev-reader' },
    });
    expect(res.statusCode).toBe(200);

    const story = JSON.parse(res.body);
    const poll = story.blocks.find((b: { id: string }) => b.id === pollBlockId);
    // The article keeps the counts it was published with.
    expect(poll.data.totalVotes).toBe(15);
    expect(poll.data.options.find((o: { id: string }) => o.id === 'opt_1').voteCount).toBe(10);
  });
});
