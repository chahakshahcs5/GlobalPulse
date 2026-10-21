import type { LiveFeedItem } from '@ai-news/schemas';

/**
 * A live feed backing `live_data` / `live_ticker` story blocks.
 *
 * `items` holds the current values; `asOf` is when they were produced.
 */
export interface LiveFeedRecord {
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
}

export interface ILiveFeedRepository {
  getFeed(key: string): Promise<LiveFeedRecord | null>;
  listFeeds(organizationId?: string): Promise<LiveFeedRecord[]>;
  saveFeed(feed: LiveFeedRecord): Promise<LiveFeedRecord>;
}
