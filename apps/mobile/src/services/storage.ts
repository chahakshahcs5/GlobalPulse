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

  public saveStory(story: OfflineStory): void {
    this.cache.set(story.id, {
      ...story,
      savedAt: new Date().toISOString(),
    });
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
    return this.cache.delete(id);
  }

  public toggleBookmark(id: string): boolean {
    if (this.bookmarks.has(id)) {
      this.bookmarks.delete(id);
      return false;
    } else {
      this.bookmarks.add(id);
      return true;
    }
  }

  public isBookmarked(id: string): boolean {
    return this.bookmarks.has(id);
  }

  public markAsRead(id: string): void {
    const story = this.cache.get(id);
    if (story) {
      story.readStatus = true;
    }
  }

  public clearAll(): void {
    this.cache.clear();
    this.bookmarks.clear();
  }
}

export const offlineStorage = new OfflineStorageService();
