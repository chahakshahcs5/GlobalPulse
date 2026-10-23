import type { LiveFeedItem } from '@ai-news/schemas';
import type { ILiveFeedRepository, LiveFeedRecord } from '../../interfaces/live-feed.repository';

export class MemoryLiveFeedRepository implements ILiveFeedRepository {
  private feeds = new Map<string, LiveFeedRecord>();

  private storageKey(key: string, organizationId?: string): string {
    return organizationId ? `${organizationId}:${key}` : key;
  }

  async getFeed(key: string, organizationId?: string): Promise<LiveFeedRecord | null> {
    if (organizationId) {
      const feed = this.feeds.get(this.storageKey(key, organizationId));
      if (feed) return { ...feed, items: feed.items.map((i) => ({ ...i })) };
    }
    const legacy = this.feeds.get(key);
    if (
      legacy &&
      (!organizationId || !legacy.organizationId || legacy.organizationId === organizationId)
    ) {
      return { ...legacy, items: legacy.items.map((i) => ({ ...i })) };
    }
    return null;
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
    const key = this.storageKey(stored.key, stored.organizationId);
    this.feeds.set(key, stored);
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
