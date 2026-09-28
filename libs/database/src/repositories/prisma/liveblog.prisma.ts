import type { LiveblogEntry } from '@ai-news/schemas';
import type { ILiveblogRepository } from '../../interfaces/liveblog.repository';
import { MemoryLiveblogRepository } from '../memory/liveblog.memory';

interface PrismaLiveblogRow {
  id: string;
  storyId: string;
  headline: string;
  content: string;
  isKeyEvent: boolean;
  authorId: string;
  authorName?: string | null;
  authorAvatar?: string | null;
  timestamp: Date;
}

export class PrismaLiveblogRepository implements ILiveblogRepository {
  private fallbackMemory = new MemoryLiveblogRepository();

  constructor(private readonly prismaGetter: () => Record<string, unknown>) {}

  private get prisma(): Record<string, unknown> {
    return this.prismaGetter();
  }

  private get liveblogClient(): {
    create: (args: { data: Record<string, unknown> }) => Promise<PrismaLiveblogRow>;
    findMany: (args: { where: Record<string, unknown>; take?: number; orderBy?: Record<string, unknown> }) => Promise<PrismaLiveblogRow[]>;
    delete: (args: { where: Record<string, unknown> }) => Promise<unknown>;
  } | undefined {
    return (this.prisma as any).liveblogEntry;
  }

  private mapToEntry(row: PrismaLiveblogRow): LiveblogEntry {
    return {
      id: row.id,
      storyId: row.storyId,
      headline: row.headline,
      content: row.content,
      isKeyEvent: row.isKeyEvent,
      author: {
        id: row.authorId,
        name: row.authorName || 'Liveblog Reporter',
        avatarUrl: row.authorAvatar || undefined,
      },
      timestamp: row.timestamp instanceof Date ? row.timestamp.toISOString() : String(row.timestamp),
    };
  }

  async addEntry(entry: LiveblogEntry): Promise<LiveblogEntry> {
    if (!this.liveblogClient) {
      return this.fallbackMemory.addEntry(entry);
    }
    try {
      const row = await this.liveblogClient.create({
        data: {
          id: entry.id,
          storyId: entry.storyId,
          headline: entry.headline,
          content: entry.content,
          isKeyEvent: entry.isKeyEvent,
          authorId: entry.author.id,
          authorName: entry.author.name,
          authorAvatar: entry.author.avatarUrl,
          timestamp: new Date(entry.timestamp),
        },
      });
      return this.mapToEntry(row);
    } catch {
      return this.fallbackMemory.addEntry(entry);
    }
  }

  async listEntries(storyId: string, limit = 100): Promise<LiveblogEntry[]> {
    if (!this.liveblogClient) {
      return this.fallbackMemory.listEntries(storyId, limit);
    }
    try {
      const rows = await this.liveblogClient.findMany({
        where: { storyId },
        take: limit,
        orderBy: { timestamp: 'desc' },
      });
      return rows.map((r) => this.mapToEntry(r));
    } catch {
      return this.fallbackMemory.listEntries(storyId, limit);
    }
  }

  async deleteEntry(id: string): Promise<boolean> {
    if (!this.liveblogClient) {
      return this.fallbackMemory.deleteEntry(id);
    }
    try {
      await this.liveblogClient.delete({ where: { id } });
      return true;
    } catch {
      return this.fallbackMemory.deleteEntry(id);
    }
  }
}
