import type { StoryCollection } from '@ai-news/schemas';
import type { ICollectionRepository } from '../../interfaces/collection.repository';
import { randomUUID } from 'crypto';

export class MemoryCollectionRepository implements ICollectionRepository {
  private collections = new Map<string, StoryCollection>(); // id -> collection

  async create(
    data: Omit<StoryCollection, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }
  ): Promise<StoryCollection> {
    const now = new Date().toISOString();
    const id = data.id || `col_${randomUUID().replace(/-/g, '').slice(0, 12)}`;
    const collection: StoryCollection = {
      ...data,
      id,
      storyIds: data.storyIds || [],
      isPublic: data.isPublic !== undefined ? data.isPublic : true,
      createdAt: now,
      updatedAt: now,
    };
    this.collections.set(id, collection);
    return { ...collection };
  }

  async findById(id: string, orgId?: string): Promise<StoryCollection | null> {
    const col = this.collections.get(id);
    if (!col) return null;
    if (orgId && col.organizationId !== orgId) return null;
    return { ...col };
  }

  async findBySlug(slug: string, orgId: string): Promise<StoryCollection | null> {
    for (const col of this.collections.values()) {
      if (col.slug === slug && col.organizationId === orgId) return { ...col };
    }
    return null;
  }

  async listPublic(
    orgId: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<StoryCollection[]> {
    const list: StoryCollection[] = [];
    for (const col of this.collections.values()) {
      if (col.isPublic && col.organizationId === orgId) {
        list.push({ ...col });
      }
    }
    list.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    return list.slice(offset, offset + limit);
  }

  async listByUser(userId: string, orgId: string): Promise<StoryCollection[]> {
    const list: StoryCollection[] = [];
    for (const col of this.collections.values()) {
      if (col.curatorId === userId && col.organizationId === orgId) {
        list.push({ ...col });
      }
    }
    list.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    return list;
  }

  async addStory(
    collectionId: string,
    storyId: string,
    orgId: string
  ): Promise<StoryCollection | null> {
    const col = this.collections.get(collectionId);
    if (!col || col.organizationId !== orgId) return null;
    if (!col.storyIds.includes(storyId)) {
      // Copy-on-write: never mutate the stored record in place, otherwise an
      // in-flight transaction snapshot shares the array and rollback misses
      // the change.
      const updated: StoryCollection = {
        ...col,
        storyIds: [...col.storyIds, storyId],
        updatedAt: new Date().toISOString(),
      };
      this.collections.set(collectionId, updated);
      return { ...updated };
    }
    return { ...col };
  }

  async removeStory(
    collectionId: string,
    storyId: string,
    orgId: string
  ): Promise<StoryCollection | null> {
    const col = this.collections.get(collectionId);
    if (!col || col.organizationId !== orgId) return null;
    const filtered = col.storyIds.filter((id) => id !== storyId);
    const updated: StoryCollection = {
      ...col,
      storyIds: filtered,
      updatedAt: new Date().toISOString(),
    };
    this.collections.set(collectionId, updated);
    return { ...updated };
  }

  async delete(id: string, orgId: string): Promise<boolean> {
    const col = this.collections.get(id);
    if (!col || col.organizationId !== orgId) return false;
    return this.collections.delete(id);
  }

  snapshot(): Map<string, StoryCollection> {
    // Copy records (and their arrays) so transaction rollback cannot leak
    // in-place mutations that happened after the snapshot was taken.
    return new Map(
      Array.from(this.collections.entries()).map(([k, v]) => [
        k,
        { ...v, storyIds: [...v.storyIds] },
      ])
    );
  }

  restore(snapshot: Map<string, StoryCollection>): void {
    this.collections = new Map(
      Array.from(snapshot.entries()).map(([k, v]) => [k, { ...v, storyIds: [...v.storyIds] }])
    );
  }

  clear(): void {
    this.collections.clear();
  }
}
