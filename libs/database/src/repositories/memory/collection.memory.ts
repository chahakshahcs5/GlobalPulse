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

  async findById(id: string): Promise<StoryCollection | null> {
    const col = this.collections.get(id);
    return col ? { ...col } : null;
  }

  async findBySlug(slug: string): Promise<StoryCollection | null> {
    for (const col of this.collections.values()) {
      if (col.slug === slug) return { ...col };
    }
    return null;
  }

  async listPublic(limit: number = 20, offset: number = 0): Promise<StoryCollection[]> {
    const list: StoryCollection[] = [];
    for (const col of this.collections.values()) {
      if (col.isPublic) {
        list.push({ ...col });
      }
    }
    list.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    return list.slice(offset, offset + limit);
  }

  async listByUser(userId: string): Promise<StoryCollection[]> {
    const list: StoryCollection[] = [];
    for (const col of this.collections.values()) {
      if (col.curatorId === userId) {
        list.push({ ...col });
      }
    }
    list.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    return list;
  }

  async addStory(collectionId: string, storyId: string): Promise<StoryCollection | null> {
    const col = this.collections.get(collectionId);
    if (!col) return null;
    if (!col.storyIds.includes(storyId)) {
      col.storyIds.push(storyId);
      col.updatedAt = new Date().toISOString();
      this.collections.set(collectionId, col);
    }
    return { ...col };
  }

  async removeStory(collectionId: string, storyId: string): Promise<StoryCollection | null> {
    const col = this.collections.get(collectionId);
    if (!col) return null;
    col.storyIds = col.storyIds.filter((id) => id !== storyId);
    col.updatedAt = new Date().toISOString();
    this.collections.set(collectionId, col);
    return { ...col };
  }

  async delete(id: string): Promise<boolean> {
    return this.collections.delete(id);
  }

  clear(): void {
    this.collections.clear();
  }
}
