import type { LiveFeedItem } from '@ai-news/schemas';
import type { ILiveFeedRepository, LiveFeedRecord } from '../../interfaces/live-feed.repository';

export class MemoryLiveFeedRepository implements ILiveFeedRepository {
  private feeds = new Map<string, LiveFeedRecord>();

  async getFeed(key: string): Promise<LiveFeedRecord | null> {
    const feed = this.feeds.get(key);
    return feed ? { ...feed, items: feed.items.map((i) => ({ ...i })) } : null;
  }

  async listFeeds(organizationId?: string): Promise<LiveFeedRecord[]> {
    return Array.from(this.feeds.values())
      .filter(
        (feed) => !organizationId || !feed.organizationId || feed.organizationId === organizationId
      )
      .map((feed) => ({ ...feed, items: feed.items.map((i) => ({ ...i })) }));
  }

  async saveFeed(feed: LiveFeedRecord): Promise<LiveFeedRecord> {
    const stored: LiveFeedRecord = {
      ...feed,
      items: feed.items.map((i: LiveFeedItem) => ({ ...i })),
    };
    this.feeds.set(stored.key, stored);
    return { ...stored, items: stored.items.map((i) => ({ ...i })) };
  }

  snapshot(): Map<string, LiveFeedRecord> {
    return new Map(this.feeds);
  }

  restore(snapshot: Map<string, LiveFeedRecord>): void {
    this.feeds = new Map(snapshot);
  }

  clear(): void {
    this.feeds.clear();
  }
}
