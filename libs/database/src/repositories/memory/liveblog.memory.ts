import type { LiveblogEntry } from '@ai-news/schemas';
import type { ILiveblogRepository } from '../../interfaces/liveblog.repository';

export class MemoryLiveblogRepository implements ILiveblogRepository {
  private entries: LiveblogEntry[] = [];

  async addEntry(entry: LiveblogEntry): Promise<LiveblogEntry> {
    const cloned = { ...entry, author: { ...entry.author } };
    this.entries.push(cloned);
    return { ...cloned };
  }

  async listEntries(storyId: string, limit = 100): Promise<LiveblogEntry[]> {
    const matching = this.entries.filter((e) => e.storyId === storyId);
    // Sort reverse-chronologically (newest updates first for liveblogs, newest inserted first if same ms)
    matching.sort((a, b) => {
      const diff = new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      if (diff !== 0) return diff;
      return this.entries.indexOf(b) - this.entries.indexOf(a);
    });
    return matching.slice(0, limit).map((e) => ({ ...e, author: { ...e.author } }));
  }

  async deleteEntry(id: string): Promise<boolean> {
    const idx = this.entries.findIndex((e) => e.id === id);
    if (idx >= 0) {
      this.entries.splice(idx, 1);
      return true;
    }
    return false;
  }

  snapshot(): LiveblogEntry[] {
    return [...this.entries];
  }

  restore(snapshot: LiveblogEntry[]): void {
    this.entries = [...snapshot];
  }

  clear(): void {
    this.entries = [];
  }
}
