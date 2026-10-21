import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { DatabaseService } from '@ai-news/database';
import { LiveFeedService, setRealtimeBroadcaster } from '@ai-news/stories';

/**
 * Live feeds back the `live_data` and `live_ticker` blocks.
 *
 * A feed must survive a restart (it is persisted, not held in process
 * memory) and every update must reach readers over the realtime channel.
 */
describe('Live feeds', () => {
  let db: DatabaseService;
  let liveFeeds: LiveFeedService;
  let broadcasts: Array<{ channel: string; eventName: string; data: unknown }>;

  beforeEach(() => {
    db = new DatabaseService();
    liveFeeds = new LiveFeedService(db);
    broadcasts = [];
    setRealtimeBroadcaster((channel, eventName, data) => {
      broadcasts.push({ channel, eventName, data });
    });
  });

  afterEach(() => {
    setRealtimeBroadcaster(null);
  });

  const feedUpdate = {
    title: 'Markets',
    provider: 'GlobalPulse Markets Desk',
    items: [
      {
        id: 'brent',
        label: 'Brent Crude',
        value: 82.4,
        previousValue: 80.1,
        change: 2.87,
        unit: '$',
      },
    ],
    refreshIntervalSeconds: 30,
    sourceAttribution: 'GlobalPulse Markets Desk',
  };

  it('stores a feed and reads it back', async () => {
    const saved = await liveFeeds.setFeed('markets', feedUpdate);

    expect(saved.key).toBe('markets');
    expect(saved.title).toBe('Markets');
    expect(saved.items).toHaveLength(1);

    const read = await liveFeeds.getFeed('markets');
    expect(read?.items[0].id).toBe('brent');
    expect(read?.items[0].value).toBe(82.4);
  });

  it('returns null for an unknown feed', async () => {
    expect(await liveFeeds.getFeed('nope')).toBeNull();
  });

  it('broadcasts every update on the feed channel', async () => {
    await liveFeeds.setFeed('markets', feedUpdate);

    expect(broadcasts).toHaveLength(1);
    expect(broadcasts[0].channel).toBe('live_markets');
    expect(broadcasts[0].eventName).toBe('live.feed');

    const payload = broadcasts[0].data as { key: string; items: unknown[] };
    expect(payload.key).toBe('markets');
    expect(payload.items).toHaveLength(1);
  });

  it('replaces the values on a subsequent update', async () => {
    await liveFeeds.setFeed('markets', feedUpdate);

    const updated = await liveFeeds.setFeed('markets', {
      items: [{ id: 'brent', label: 'Brent Crude', value: 85.9, change: 4.2 }],
    });

    expect(updated.items[0].value).toBe(85.9);
    expect(broadcasts).toHaveLength(2);

    const read = await liveFeeds.getFeed('markets');
    expect(read?.items[0].value).toBe(85.9);
    // Metadata that was not re-sent is carried over.
    expect(read?.title).toBe('Markets');
    expect(read?.provider).toBe('GlobalPulse Markets Desk');
  });

  it('lists registered feeds', async () => {
    await liveFeeds.setFeed('markets', feedUpdate);
    await liveFeeds.setFeed('energy', {
      ...feedUpdate,
      title: 'Energy',
      items: [{ id: 'grid', label: 'Grid share', value: 51 }],
    });

    const feeds = await liveFeeds.listFeeds();
    expect(feeds).toHaveLength(2);
    expect(feeds.map((f) => f.key).sort()).toEqual(['energy', 'markets']);
  });

  it('survives a restart because the feed is persisted', async () => {
    await liveFeeds.setFeed('markets', feedUpdate);

    // A fresh service over the same database — as after an API restart.
    const restarted = new LiveFeedService(db);
    const read = await restarted.getFeed('markets');

    expect(read).not.toBeNull();
    expect(read?.items[0].id).toBe('brent');
  });

  it("does not leak one feed's values into another", async () => {
    await liveFeeds.setFeed('markets', feedUpdate);
    await liveFeeds.setFeed('energy', {
      items: [{ id: 'grid', label: 'Grid share', value: 51 }],
    });

    const markets = await liveFeeds.getFeed('markets');
    expect(markets?.items).toHaveLength(1);
    expect(markets?.items[0].id).toBe('brent');
  });
});
