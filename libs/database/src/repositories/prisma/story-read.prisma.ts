import type { IStoryReadRepository, StoryReadRecord } from '../../interfaces/story-read.repository';

interface PrismaStoryReadRow {
  id: string;
  organizationId: string;
  userId: string;
  storyId: string;
  monthKey: string;
  readAt: Date | string;
}

export class PrismaStoryReadRepository implements IStoryReadRepository {
  constructor(private readonly prismaGetter: () => Record<string, unknown>) {}

  private get client():
    | {
        upsert: (args: {
          where: Record<string, unknown>;
          create: Record<string, unknown>;
          update: Record<string, unknown>;
        }) => Promise<PrismaStoryReadRow>;
        findMany: (args: { where: Record<string, unknown> }) => Promise<PrismaStoryReadRow[]>;
      }
    | undefined {
    return (this.prismaGetter() as Record<string, unknown>).storyRead as typeof this.client;
  }

  private map(row: PrismaStoryReadRow): StoryReadRecord {
    return {
      id: row.id,
      organizationId: row.organizationId,
      userId: row.userId,
      storyId: row.storyId,
      monthKey: row.monthKey,
      readAt: row.readAt instanceof Date ? row.readAt.toISOString() : String(row.readAt),
    };
  }

  async recordRead(input: {
    organizationId: string;
    userId: string;
    storyId: string;
    monthKey: string;
  }): Promise<StoryReadRecord> {
    if (!this.client) throw new Error('Prisma StoryRead client is unavailable');
    const now = new Date();
    const row = await this.client.upsert({
      where: {
        userId_storyId_monthKey: {
          userId: input.userId,
          storyId: input.storyId,
          monthKey: input.monthKey,
        },
      },
      create: {
        organizationId: input.organizationId,
        userId: input.userId,
        storyId: input.storyId,
        monthKey: input.monthKey,
        readAt: now,
      },
      update: {},
    });
    return this.map(row);
  }

  async countDistinctStories(userId: string, monthKey: string, orgId: string): Promise<number> {
    return (await this.listStoryIds(userId, monthKey, orgId)).length;
  }

  async listStoryIds(userId: string, monthKey: string, orgId: string): Promise<string[]> {
    if (!this.client) return [];
    const rows = await this.client.findMany({
      where: { userId, monthKey, organizationId: orgId },
    });
    return Array.from(new Set(rows.map((row) => row.storyId)));
  }

  snapshot(): Map<string, StoryReadRecord> {
    return new Map();
  }

  restore(_snapshot: Map<string, StoryReadRecord>): void {
    // Prisma is the source of truth; snapshots are only used by the memory engine.
  }

  clear(): void {
    // No destructive truncation in the Prisma path.
  }
}
