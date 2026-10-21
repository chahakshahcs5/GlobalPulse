import type { Comment, PollTally, Story } from '@ai-news/schemas';
import { offlineStorage, type OfflineStory } from './storage';

export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000';

/** Current values of a live feed backing a `live_data` / `live_ticker` block. */
export interface LiveFeed {
  key: string;
  title: string;
  provider?: string;
  items: Array<{
    id: string;
    label: string;
    value: number | string;
    previousValue?: number | string;
    change?: number;
    unit?: string;
    provider?: string;
    asOf?: string;
    sparkline?: number[];
  }>;
  asOf: string;
  refreshIntervalSeconds: number;
  sourceAttribution?: string;
}

export function mapApiStoryToOffline(
  story: Partial<Story> & { id: string; title: string }
): OfflineStory {
  return {
    id: story.id,
    slug: story.slug || story.id,
    title: story.title,
    summary: story.summary || '',
    articleType: story.articleType || 'breaking_news',
    heroImageUrl: story.heroImageUrl,
    currentVersionNumber: story.currentVersionNumber || 1,
    blocks: story.blocks || [],
    savedAt: story.publishedAt || story.updatedAt || new Date().toISOString(),
    readStatus: offlineStorage.getStory(story.id)?.readStatus || false,
  };
}

export interface FetchStoriesOptions {
  limit?: number;
  category?: string;
  topic?: string;
}

export class MobileApiService {
  private isOnline = true;

  public async fetchStories(options: FetchStoriesOptions = {}): Promise<{
    stories: OfflineStory[];
    isOnline: boolean;
  }> {
    const limit = options.limit || 50;
    const queryParams = new URLSearchParams({
      limit: String(limit),
      status: 'PUBLISHED',
    });
    // The stories filter understands articleType/topicId zod schemas — the raw
    // category/topic params the client used to send were silently stripped.
    if (options.category) queryParams.set('articleType', options.category);
    if (options.topic) queryParams.set('topicId', options.topic);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      const res = await fetch(`${API_BASE_URL}/api/stories?${queryParams.toString()}`, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          'x-client-id': 'human_mobile',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        throw new Error(`API responded with HTTP status ${res.status}`);
      }

      const json = await res.json();
      const rawStories: Story[] = Array.isArray(json)
        ? json
        : Array.isArray(json.data)
          ? json.data
          : Array.isArray(json.items)
            ? json.items
            : [];

      const mapped = rawStories.map(mapApiStoryToOffline);
      // Persist to local offline storage cache
      for (const story of mapped) {
        offlineStorage.saveStory(story);
      }
      this.isOnline = true;
      return { stories: mapped, isOnline: true };
    } catch {
      // Failed to reach API (offline or local network unavailable)
      this.isOnline = false;
    }

    // Graceful offline fallback to previously cached stories
    const cached = offlineStorage.getAllSavedStories();
    return { stories: cached, isOnline: false };
  }

  public async searchStories(query: string): Promise<OfflineStory[]> {
    if (!query.trim()) return [];

    try {
      const res = await fetch(
        `${API_BASE_URL}/api/search/stories?query=${encodeURIComponent(query)}&limit=20`,
        {
          headers: { Accept: 'application/json' },
        }
      );
      if (res.ok) {
        const json = await res.json();
        const results = Array.isArray(json) ? json : json.data || json.items || [];
        // Search results are references (storyId), not full story objects
        return results.map((item: { storyId: string } & Record<string, unknown>) =>
          mapApiStoryToOffline({ ...(item as object), id: item.storyId } as never)
        );
      }
    } catch {
      // Fallback: search local offline storage
    }

    const q = query.toLowerCase();
    return offlineStorage
      .getAllSavedStories()
      .filter((s) => s.title.toLowerCase().includes(q) || s.summary.toLowerCase().includes(q));
  }

  /**
   * Live tally for a poll block.
   *
   * Votes are counted on the server, so the counts stored in the story
   * payload are only the baseline. Reading the tally keeps mobile in step
   * with the web reader.
   */
  public async fetchPollTally(storyId: string, blockId: string): Promise<PollTally | null> {
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/stories/${encodeURIComponent(storyId)}/blocks/${encodeURIComponent(blockId)}/poll`,
        {
          method: 'GET',
          headers: {
            Accept: 'application/json',
            'x-client-id': 'human_mobile',
          },
        }
      );
      if (!res.ok) return null;
      return (await res.json()) as PollTally;
    } catch {
      return null;
    }
  }

  /** Comments on a story, for the in-story live comment block. */
  public async fetchStoryComments(storyId: string): Promise<Comment[]> {
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/stories/${encodeURIComponent(storyId)}/comments`,
        {
          method: 'GET',
          headers: {
            Accept: 'application/json',
            'x-client-id': 'human_mobile',
          },
        }
      );
      if (!res.ok) return [];
      const json = await res.json();
      return Array.isArray(json) ? (json as Comment[]) : [];
    } catch {
      return [];
    }
  }

  /**
   * Current values of a live feed.
   *
   * `live_ticker` / `live_data` blocks bound to a feed key show these values
   * instead of the snapshot stored in the story payload.
   */
  public async fetchLiveFeed(key: string): Promise<LiveFeed | null> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/live/feeds/${encodeURIComponent(key)}`, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          'x-client-id': 'human_mobile',
        },
      });
      if (!res.ok) return null;
      return (await res.json()) as LiveFeed;
    } catch {
      return null;
    }
  }

  public isNetworkConnected(): boolean {
    return this.isOnline;
  }
}

export const mobileApi = new MobileApiService();
