import type { StoryCollection } from '@ai-news/schemas';

export interface ICollectionRepository {
  create(
    data: Omit<StoryCollection, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }
  ): Promise<StoryCollection>;
  findById(id: string, orgId?: string): Promise<StoryCollection | null>;
  findBySlug(slug: string, orgId: string): Promise<StoryCollection | null>;
  listPublic(orgId: string, limit?: number, offset?: number): Promise<StoryCollection[]>;
  listByUser(userId: string, orgId: string): Promise<StoryCollection[]>;
  addStory(collectionId: string, storyId: string, orgId: string): Promise<StoryCollection | null>;
  removeStory(
    collectionId: string,
    storyId: string,
    orgId: string
  ): Promise<StoryCollection | null>;
  delete(id: string, orgId: string): Promise<boolean>;
}
