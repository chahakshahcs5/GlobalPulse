'use client';

import React from 'react';
import {
  getLiveFeed,
  subscribeToRealtimeEvents,
  type LiveFeed,
  type LiveFeedItem,
} from '../../lib/api-client';

export interface UseLiveFeedResult {
  /** The freshest feed items, or `null` when the block is not bound to a feed. */
  items: LiveFeedItem[] | null;
  asOf: string | null;
  provider: string | null;
  sourceAttribution: string | null;
  /** True once a live feed has been received for this block. */
  isLive: boolean;
}

/**
 * Subscribe a live block to a platform live feed.
 *
 * A `live_data` / `live_ticker` block without a `liveKey` keeps rendering the
 * snapshot stored in the story payload. With a `liveKey` the block picks up
 * fresher values from the feed:
 *
 *  1. an initial fetch, so a reader landing mid-story sees current numbers;
 *  2. the realtime channel, so values arrive the moment they are published;
 *  3. a polling fallback, so the block still refreshes if the realtime
 *     connection is unavailable.
 */
export function useLiveFeed(
  liveKey: string | undefined,
  refreshIntervalSeconds: number
): UseLiveFeedResult {
  const [feed, setFeed] = React.useState<LiveFeed | null>(null);

  // Initial load + polling fallback.
  React.useEffect(() => {
    if (!liveKey) return;
    let cancelled = false;

    const load = () => {
      getLiveFeed(liveKey)
        .then((next) => {
          if (!cancelled) setFeed(next);
        })
        .catch(() => {
          // The feed may not exist yet; the payload snapshot stays visible.
        });
    };

    load();
    const timer = setInterval(load, Math.max(15, refreshIntervalSeconds) * 1000);

    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [liveKey, refreshIntervalSeconds]);

  // Realtime push.
  React.useEffect(() => {
    if (!liveKey) return;

    const unsubscribe = subscribeToRealtimeEvents([`live_${liveKey}`], (event) => {
      if (event.type !== 'live.feed') return;
      const payload = event.data as LiveFeed | undefined;
      if (!payload || payload.key !== liveKey) return;
      setFeed(payload);
    });

    return unsubscribe;
  }, [liveKey]);

  return {
    items: feed?.items ?? null,
    asOf: feed?.asOf ?? null,
    provider: feed?.provider ?? null,
    sourceAttribution: feed?.sourceAttribution ?? null,
    isLive: feed !== null,
  };
}
