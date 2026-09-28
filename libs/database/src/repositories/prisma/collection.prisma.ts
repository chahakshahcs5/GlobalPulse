import type { StoryCollection } from '@ai-news/schemas';
import type { ICollectionRepository } from '../../interfaces/collection.repository';
import { MemoryCollectionRepository } from '../memory/collection.memory';

export class PrismaCollectionRepository implements ICollectionRepository {
  private fallbackMemory = new MemoryCollectionRepository();

  constructor(private readonly prismaGetter: () => Record<string, unknown>) {}

  private get prisma(): Record<string, unknown> {
    return this.prismaGetter();
  }

  private get collectionClient(): any {
    return (this.prisma as any).storyCollection;
  }

  async create(
    data: Omit<StoryCollection, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }
  ): Promise<StoryCollection> {
    if (!this.collectionClient) {
      return this.fallbackMemory.create(data);
    }
    try {
      const now = new Date();
      const id = data.id || `col_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      const row = await this.collectionClient.create({
        data: {
          id,
          name: data.name,
          slug: data.slug,
          description: data.description,
          curatorId: data.curatorId,
          curatorName: data.curatorName,
          isPublic: data.isPublic !== undefined ? data.isPublic : true,
          storyIds: data.storyIds || [],
          createdAt: now,
          updatedAt: now,
        },
      });

      return {
        id: row.id,
        name: row.name,
        slug: row.slug,
        description: row.description || undefined,
        curatorId: row.curatorId,
        curatorName: row.curatorName || undefined,
        isPublic: row.isPublic,
        storyIds: row.storyIds as string[],
        createdAt: row.createdAt instanceof Date ? row.createdAt.toISOString() : String(row.createdAt),
        updatedAt: row.updatedAt instanceof Date ? row.updatedAt.toISOString() : String(row.updatedAt),
      };
    } catch {
      return this.fallbackMemory.create(data);
    }
  }

  async findById(id: string): Promise<StoryCollection | null> {
    if (!this.collectionClient) {
      return this.fallbackMemory.findById(id);
    }
    try {
      const row = await this.collectionClient.findUnique({ where: { id } });
      if (!row) return null;
      return {
        id: row.id,
        name: row.name,
        slug: row.slug,
        description: row.description || undefined,
        curatorId: row.curatorId,
        curatorName: row.curatorName || undefined,
        isPublic: row.isPublic,
        storyIds: row.storyIds as string[],
        createdAt: row.createdAt instanceof Date ? row.createdAt.toISOString() : String(row.createdAt),
        updatedAt: row.updatedAt instanceof Date ? row.updatedAt.toISOString() : String(row.updatedAt),
      };
    } catch {
      return this.fallbackMemory.findById(id);
    }
  }

  async findBySlug(slug: string): Promise<StoryCollection | null> {
    if (!this.collectionClient) {
      return this.fallbackMemory.findBySlug(slug);
    }
    try {
      const row = await this.collectionClient.findFirst({ where: { slug } });
      if (!row) return null;
      return {
        id: row.id,
        name: row.name,
        slug: row.slug,
        description: row.description || undefined,
        curatorId: row.curatorId,
        curatorName: row.curatorName || undefined,
        isPublic: row.isPublic,
        storyIds: row.storyIds as string[],
        createdAt: row.createdAt instanceof Date ? row.createdAt.toISOString() : String(row.createdAt),
        updatedAt: row.updatedAt instanceof Date ? row.updatedAt.toISOString() : String(row.updatedAt),
      };
    } catch {
      return this.fallbackMemory.findBySlug(slug);
    }
  }

  async listPublic(limit: number = 20, offset: number = 0): Promise<StoryCollection[]> {
    if (!this.collectionClient) {
      return this.fallbackMemory.listPublic(limit, offset);
    }
    try {
      const rows = await this.collectionClient.findMany({
        where: { isPublic: true },
        orderBy: { updatedAt: 'desc' },
        skip: offset,
        take: limit,
      });

      return rows.map((row: any) => ({
        id: row.id,
        name: row.name,
        slug: row.slug,
        description: row.description || undefined,
        curatorId: row.curatorId,
        curatorName: row.curatorName || undefined,
        isPublic: row.isPublic,
        storyIds: row.storyIds as string[],
        createdAt: row.createdAt instanceof Date ? row.createdAt.toISOString() : String(row.createdAt),
        updatedAt: row.updatedAt instanceof Date ? row.updatedAt.toISOString() : String(row.updatedAt),
      }));
    } catch {
      return this.fallbackMemory.listPublic(limit, offset);
    }
  }

  async listByUser(userId: string): Promise<StoryCollection[]> {
    if (!this.collectionClient) {
      return this.fallbackMemory.listByUser(userId);
    }
    try {
      const rows = await this.collectionClient.findMany({
        where: { curatorId: userId },
        orderBy: { updatedAt: 'desc' },
      });

      return rows.map((row: any) => ({
        id: row.id,
        name: row.name,
        slug: row.slug,
        description: row.description || undefined,
        curatorId: row.curatorId,
        curatorName: row.curatorName || undefined,
        isPublic: row.isPublic,
        storyIds: row.storyIds as string[],
        createdAt: row.createdAt instanceof Date ? row.createdAt.toISOString() : String(row.createdAt),
        updatedAt: row.updatedAt instanceof Date ? row.updatedAt.toISOString() : String(row.updatedAt),
      }));
    } catch {
      return this.fallbackMemory.listByUser(userId);
    }
  }

  async addStory(collectionId: string, storyId: string): Promise<StoryCollection | null> {
    if (!this.collectionClient) {
      return this.fallbackMemory.addStory(collectionId, storyId);
    }
    try {
      const col = await this.findById(collectionId);
      if (!col) return null;
      if (!col.storyIds.includes(storyId)) {
        col.storyIds.push(storyId);
        await this.collectionClient.update({
          where: { id: collectionId },
          data: {
            storyIds: col.storyIds,
            updatedAt: new Date(),
          },
        });
        col.updatedAt = new Date().toISOString();
      }
      return col;
    } catch {
      return this.fallbackMemory.addStory(collectionId, storyId);
    }
  }

  async removeStory(collectionId: string, storyId: string): Promise<StoryCollection | null> {
    if (!this.collectionClient) {
      return this.fallbackMemory.removeStory(collectionId, storyId);
    }
    try {
      const col = await this.findById(collectionId);
      if (!col) return null;
      col.storyIds = col.storyIds.filter((id) => id !== storyId);
      await this.collectionClient.update({
        where: { id: collectionId },
        data: {
          storyIds: col.storyIds,
          updatedAt: new Date(),
        },
      });
      col.updatedAt = new Date().toISOString();
      return col;
    } catch {
      return this.fallbackMemory.removeStory(collectionId, storyId);
    }
  }

  async delete(id: string): Promise<boolean> {
    if (!this.collectionClient) {
      return this.fallbackMemory.delete(id);
    }
    try {
      await this.collectionClient.delete({ where: { id } });
      return true;
    } catch {
      return this.fallbackMemory.delete(id);
    }
  }
}
