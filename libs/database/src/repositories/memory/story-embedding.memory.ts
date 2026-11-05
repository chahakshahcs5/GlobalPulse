import type {
  IStoryEmbeddingRepository,
  StoryEmbeddingRecord,
} from '../../interfaces/story-embedding.repository';
import { randomUUID } from 'crypto';

export class MemoryStoryEmbeddingRepository implements IStoryEmbeddingRepository {
  private embeddings = new Map<string, StoryEmbeddingRecord>();

  async upsert(
    record: Omit<StoryEmbeddingRecord, 'id' | 'createdAt' | 'updatedAt'> & {
      id?: string;
      createdAt?: string;
      updatedAt?: string;
    }
  ): Promise<StoryEmbeddingRecord> {
    const key = `${record.storyId}:${record.versionNumber}`;
    const existing = this.embeddings.get(key);
    const now = new Date().toISOString();
    const saved: StoryEmbeddingRecord = {
      ...record,
      id: existing?.id || record.id || `emb_${randomUUID().replace(/-/g, '').slice(0, 16)}`,
      createdAt: existing?.createdAt || record.createdAt || now,
      updatedAt: now,
    };
    this.embeddings.set(key, saved);
    return { ...saved };
  }

  async findByStoryVersion(
    storyId: string,
    versionNumber: number,
    orgId?: string
  ): Promise<StoryEmbeddingRecord | null> {
    const found = this.embeddings.get(`${storyId}:${versionNumber}`);
    if (!found) return null;
    if (orgId && found.organizationId !== orgId) return null;
    return { ...found };
  }

  async listByOrganization(orgId: string): Promise<StoryEmbeddingRecord[]> {
    return Array.from(this.embeddings.values())
      .filter((record) => record.organizationId === orgId)
      .map((record) => ({ ...record }));
  }

  async deleteByStory(storyId: string, orgId?: string): Promise<number> {
    let deleted = 0;
    for (const [key, record] of this.embeddings.entries()) {
      if (record.storyId !== storyId) continue;
      if (orgId && record.organizationId !== orgId) continue;
      this.embeddings.delete(key);
      deleted++;
    }
    return deleted;
  }

  snapshot(): Map<string, StoryEmbeddingRecord> {
    return new Map(
      Array.from(this.embeddings.entries()).map(([key, value]) => [key, { ...value }])
    );
  }

  restore(snapshot: Map<string, StoryEmbeddingRecord>): void {
    this.embeddings = new Map(
      Array.from(snapshot.entries()).map(([key, value]) => [key, { ...value }])
    );
  }

  clear(): void {
    this.embeddings.clear();
  }
}
