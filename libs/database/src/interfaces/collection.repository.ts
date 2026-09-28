import type { StoryCollection } from '@ai-news/schemas';

export interface ICollectionRepository {
  create(
    data: Omit<StoryCollection, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }
  ): Promise<StoryCollection>;
  findById(id: string): Promise<StoryCollection | null>;
  findBySlug(slug: string): Promise<StoryCollection | null>;
  listPublic(limit?: number, offset?: number): Promise<StoryCollection[]>;
  listByUser(userId: string): Promise<StoryCollection[]>;
  addStory(collectionId: string, storyId: string): Promise<StoryCollection | null>;
  removeStory(collectionId: string, storyId: string): Promise<StoryCollection | null>;
  delete(id: string): Promise<boolean>;
}
