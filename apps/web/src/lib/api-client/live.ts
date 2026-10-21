/**
 * API Client — Live Feeds
 *
 * Live feeds back the `live_data` and `live_ticker` blocks. A block bound to
 * a feed key receives fresher values over the realtime channel; these calls
 * cover the initial load and the polling fallback.
 */
import { request } from './core';

export interface LiveFeedItem {
  id: string;
  label: string;
  value: number | string;
  previousValue?: number | string;
  change?: number;
  unit?: string;
  provider?: string;
  asOf?: string;
  sparkline?: number[];
}

export interface LiveFeed {
  key: string;
  title: string;
  provider?: string;
  items: LiveFeedItem[];
  asOf: string;
  refreshIntervalSeconds: number;
  license?: string;
  methodology?: string;
  sourceAttribution?: string;
}

export async function getLiveFeed(key: string): Promise<LiveFeed> {
  return request<LiveFeed>(`/api/live/feeds/${encodeURIComponent(key)}`);
}

export async function listLiveFeeds(): Promise<LiveFeed[]> {
  return request<LiveFeed[]>('/api/live/feeds');
}
