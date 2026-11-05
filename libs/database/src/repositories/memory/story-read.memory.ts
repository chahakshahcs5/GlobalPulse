import type { IStoryReadRepository, StoryReadRecord } from '../../interfaces/story-read.repository';
import { randomUUID } from 'crypto';

export class MemoryStoryReadRepository implements IStoryReadRepository {
  private reads = new Map<string, StoryReadRecord>();

  async recordRead(input: {
    organizationId: string;
    userId: string;
    storyId: string;
    monthKey: string;
  }): Promise<StoryReadRecord> {
    const key = `${input.userId}:${input.storyId}:${input.monthKey}`;
    const existing = this.reads.get(key);
    if (existing) return { ...existing };

    const record: StoryReadRecord = {
      id: `read_${randomUUID().replace(/-/g, '').slice(0, 16)}`,
      organizationId: input.organizationId,
      userId: input.userId,
      storyId: input.storyId,
      monthKey: input.monthKey,
      readAt: new Date().toISOString(),
    };
    this.reads.set(key, record);
    return { ...record };
  }

  async countDistinctStories(userId: string, monthKey: string, orgId: string): Promise<number> {
    return (await this.listStoryIds(userId, monthKey, orgId)).length;
  }

  async listStoryIds(userId: string, monthKey: string, orgId: string): Promise<string[]> {
    const ids = new Set<string>();
    for (const record of this.reads.values()) {
      if (
        record.userId === userId &&
        record.monthKey === monthKey &&
        record.organizationId === orgId
      ) {
        ids.add(record.storyId);
      }
    }
    return Array.from(ids);
  }

  snapshot(): Map<string, StoryReadRecord> {
    return new Map(Array.from(this.reads.entries()).map(([key, value]) => [key, { ...value }]));
  }

  restore(snapshot: Map<string, StoryReadRecord>): void {
    this.reads = new Map(Array.from(snapshot.entries()).map(([key, value]) => [key, { ...value }]));
  }

  clear(): void {
    this.reads.clear();
  }
}
