import type { DatabaseService } from '@ai-news/database';
import type { LiveFeed, LiveFeedItem, LiveFeedUpdate } from '@ai-news/schemas';
import { broadcastRealtime } from './realtime-bus';

export type { LiveFeed, LiveFeedItem, LiveFeedUpdate } from '@ai-news/schemas';

/**
 * Live feed registry.
 *
 * `live_data` and `live_ticker` blocks render the values that were baked
 * into the story payload when it was published. Binding a block to a live
 * feed key lets the platform push fresher numbers to readers without
 * republishing the article: the feed is updated by the newsroom, a worker,
 * or an AI agent, and every subscribed reader is patched over SSE.
 *
 * Feeds are persisted so a published story still resolves its feed after a
 * deploy, and so the API and the MCP server operate on the same feed.
 */
export interface LiveFeedContext {
  organizationId?: string;
}

/** Realtime channel a feed is published on. */
export function liveFeedChannel(key: string): string {
  return `live_${key}`;
}

export class LiveFeedService {
  constructor(private readonly db: DatabaseService) {}

  async getFeed(key: string, ctx?: LiveFeedContext): Promise<LiveFeed | null> {
    const feed = await this.db.liveFeeds.getFeed(key, ctx?.organizationId);
    return feed ? this.toLiveFeed(feed) : null;
  }

  async listFeeds(ctx?: LiveFeedContext): Promise<LiveFeed[]> {
    const feeds = await this.db.liveFeeds.listFeeds(ctx?.organizationId);
    return feeds.map((feed) => this.toLiveFeed(feed));
  }

  /**
   * Create or replace a feed and notify subscribers.
   *
   * The broadcast carries the whole feed so a reader that connects late can
   * render from the event alone rather than waiting for the next poll.
   */
  async setFeed(key: string, update: LiveFeedUpdate, ctx?: LiveFeedContext): Promise<LiveFeed> {
    const previous = await this.db.liveFeeds.getFeed(key, ctx?.organizationId);
    const now = new Date().toISOString();

    const saved = await this.db.liveFeeds.saveFeed({
      key,
      title: update.title ?? previous?.title ?? key,
      provider: update.provider ?? previous?.provider,
      items: update.items,
      asOf: update.asOf ?? now,
      refreshIntervalSeconds:
        update.refreshIntervalSeconds ?? previous?.refreshIntervalSeconds ?? 60,
      license: update.license ?? previous?.license,
      methodology: update.methodology ?? previous?.methodology,
      sourceAttribution: update.sourceAttribution ?? previous?.sourceAttribution,
      organizationId: ctx?.organizationId ?? previous?.organizationId,
      updatedAt: now,
    });

    const feed = this.toLiveFeed(saved);
    broadcastRealtime(liveFeedChannel(key), 'live.feed', feed);

    return feed;
  }

  private toLiveFeed(record: {
    key: string;
    title: string;
    provider?: string;
    items: LiveFeedItem[];
    asOf: string;
    refreshIntervalSeconds: number;
    license?: string;
    methodology?: string;
    sourceAttribution?: string;
    organizationId?: string;
    updatedAt: string;
  }): LiveFeed {
    return {
      key: record.key,
      title: record.title,
      provider: record.provider,
      items: record.items.map((item) => ({ ...item })),
      asOf: record.asOf,
      refreshIntervalSeconds: record.refreshIntervalSeconds,
      license: record.license,
      methodology: record.methodology,
      sourceAttribution: record.sourceAttribution,
      organizationId: record.organizationId,
      updatedAt: record.updatedAt,
    };
  }
}
