import type { Story } from '@ai-news/schemas';
import { offlineStorage, type OfflineStory } from './storage';

export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ||
  (typeof window !== 'undefined' && window.location?.hostname === 'localhost'
    ? 'http://localhost:3000'
    : 'http://localhost:3000');

export function mapApiStoryToOffline(
  story: Partial<Story> & { id: string; title: string }
): OfflineStory {
  return {
    id: story.id,
    slug: story.slug || story.id,
    title: story.title,
    summary: story.summary || '',
    articleType: story.articleType || 'breaking',
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
    if (options.category) queryParams.set('category', options.category);
    if (options.topic) queryParams.set('topic', options.topic);

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
      const res = await fetch(`${API_BASE_URL}/api/search?q=${encodeURIComponent(query)}`, {
        headers: { Accept: 'application/json' },
      });
      if (res.ok) {
        const json = await res.json();
        const results = Array.isArray(json) ? json : json.data || json.items || [];
        return results.map(mapApiStoryToOffline);
      }
    } catch {
      // Fallback: search local offline storage
    }

    const q = query.toLowerCase();
    return offlineStorage
      .getAllSavedStories()
      .filter((s) => s.title.toLowerCase().includes(q) || s.summary.toLowerCase().includes(q));
  }

  public isNetworkConnected(): boolean {
    return this.isOnline;
  }
}

export const mobileApi = new MobileApiService();
