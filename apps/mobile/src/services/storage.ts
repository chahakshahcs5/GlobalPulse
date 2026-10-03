import type { StoryBlock } from '@ai-news/schemas';

export interface OfflineStory {
  id: string;
  slug: string;
  title: string;
  summary: string;
  articleType: string;
  heroImageUrl?: string;
  currentVersionNumber: number;
  blocks: StoryBlock[];
  savedAt: string;
  readStatus: boolean;
}

export class OfflineStorageService {
  private cache: Map<string, OfflineStory> = new Map();
  private bookmarks: Set<string> = new Set();
  private readonly storageKeyCache = 'globalpulse_mobile_offline_cache';
  private readonly storageKeyBookmarks = 'globalpulse_mobile_bookmarks';

  constructor() {
    this.hydrateFromStorage();
  }

  private hydrateFromStorage(): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const rawCache = window.localStorage.getItem(this.storageKeyCache);
        if (rawCache) {
          const parsed = JSON.parse(rawCache);
          if (Array.isArray(parsed)) {
            for (const story of parsed) {
              this.cache.set(story.id, story);
            }
          }
        }
        const rawBookmarks = window.localStorage.getItem(this.storageKeyBookmarks);
        if (rawBookmarks) {
          const parsed = JSON.parse(rawBookmarks);
          if (Array.isArray(parsed)) {
            this.bookmarks = new Set(parsed);
          }
        }
      } catch {
        // Fallback to memory
      }
    }
  }

  private persistToStorage(): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.setItem(
          this.storageKeyCache,
          JSON.stringify(Array.from(this.cache.values()))
        );
        window.localStorage.setItem(
          this.storageKeyBookmarks,
          JSON.stringify(Array.from(this.bookmarks))
        );
      } catch {
        // Ignore quota/storage errors
      }
    }
  }

  public saveStory(story: OfflineStory): void {
    this.cache.set(story.id, {
      ...story,
      savedAt: new Date().toISOString(),
    });
    this.persistToStorage();
  }

  public getStory(id: string): OfflineStory | undefined {
    return this.cache.get(id);
  }

  public getAllSavedStories(): OfflineStory[] {
    return Array.from(this.cache.values()).sort(
      (a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime()
    );
  }

  public removeStory(id: string): boolean {
    this.bookmarks.delete(id);
    const result = this.cache.delete(id);
    this.persistToStorage();
    return result;
  }

  public toggleBookmark(id: string): boolean {
    let bookmarked: boolean;
    if (this.bookmarks.has(id)) {
      this.bookmarks.delete(id);
      bookmarked = false;
    } else {
      this.bookmarks.add(id);
      bookmarked = true;
    }
    this.persistToStorage();
    return bookmarked;
  }

  public isBookmarked(id: string): boolean {
    return this.bookmarks.has(id);
  }

  public markAsRead(id: string): void {
    const story = this.cache.get(id);
    if (story) {
      story.readStatus = true;
      this.persistToStorage();
    }
  }

  public clearAll(): void {
    this.cache.clear();
    this.bookmarks.clear();
    this.persistToStorage();
  }
}

export const offlineStorage = new OfflineStorageService();
