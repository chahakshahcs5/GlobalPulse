import type { LiveblogEntry } from '@ai-news/schemas';

export interface ILiveblogRepository {
  addEntry(entry: LiveblogEntry): Promise<LiveblogEntry>;
  listEntries(storyId: string, limit?: number): Promise<LiveblogEntry[]>;
  deleteEntry(id: string): Promise<boolean>;
}
