import type { DatabaseService } from '@ai-news/database';
import type {
  StoryCollection,
  StoryCollectionWithStories,
  CreateCollectionInput,
  StorySummary,
} from '@ai-news/schemas';
import { toStorySummary } from '@ai-news/schemas';

export type CollectionActor = { id: string; role: string };

/**
 * Only the collection's curator (or an admin/editor) may modify or delete it.
 */
export function isCollectionCurator(
  collection: Pick<StoryCollection, 'curatorId'>,
  actor: CollectionActor
): boolean {
  return collection.curatorId === actor.id || actor.role === 'admin' || actor.role === 'editor';
}

export class CollectionService {
  constructor(private readonly db: DatabaseService) {}

  /**
   * Create a new reading list or themed story collection.
   */
  async createCollection(
    curatorId: string,
    input: CreateCollectionInput,
    curatorName?: string
  ): Promise<StoryCollection> {
    const slug = input.name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    // Resolve a human-readable curator name (callers often only have the user id).
    let resolvedName = curatorName;
    if (!resolvedName || resolvedName === curatorId) {
      try {
        const user = await this.db.users.findById(curatorId);
        resolvedName = user?.name || curatorId;
      } catch {
        resolvedName = resolvedName || curatorId;
      }
    }

    return this.db.collections.create({
      name: input.name,
      slug: `${slug}-${Math.random().toString(36).slice(2, 6)}`,
      description: input.description,
      curatorId,
      curatorName: resolvedName,
      isPublic: input.isPublic !== undefined ? input.isPublic : true,
      storyIds: input.storyIds || [],
    });
  }

  /**
   * Get collection details populated with its stories.
   *
   * The stories are summaries — a collection can hold dozens of them, and
   * their blocks are fetched on demand when a story is opened.
   */
  async getCollectionWithStories(
    id: string,
    orgId: string = 'org_default'
  ): Promise<StoryCollectionWithStories | null> {
    const collection = await this.db.collections.findById(id);
    if (!collection) return null;

    const stories: StorySummary[] = [];
    for (const storyId of collection.storyIds) {
      const story = await this.db.stories.findById(storyId, orgId);
      if (story) stories.push(toStorySummary(story));
    }

    return {
      ...collection,
      stories,
    };
  }

  /**
   * Get collection by slug populated with its stories.
   */
  async getCollectionBySlug(
    slug: string,
    orgId: string = 'org_default'
  ): Promise<StoryCollectionWithStories | null> {
    const collection = await this.db.collections.findBySlug(slug);
    if (!collection) return null;

    const stories: StorySummary[] = [];
    for (const storyId of collection.storyIds) {
      const story = await this.db.stories.findById(storyId, orgId);
      if (story) stories.push(toStorySummary(story));
    }

    return {
      ...collection,
      stories,
    };
  }

  /**
   * List public collections for discovery.
   */
  async listPublicCollections(limit: number = 20, offset: number = 0): Promise<StoryCollection[]> {
    return this.db.collections.listPublic(limit, offset);
  }

  /**
   * Get a bare collection (no story population) — used for permission checks.
   */
  async getCollection(id: string): Promise<StoryCollection | null> {
    return this.db.collections.findById(id);
  }

  /**
   * List collections created by a specific user or editor.
   */
  async listUserCollections(userId: string): Promise<StoryCollection[]> {
    return this.db.collections.listByUser(userId);
  }

  /**
   * Add a story to an existing collection.
   */
  async addStory(collectionId: string, storyId: string): Promise<StoryCollection> {
    const updated = await this.db.collections.addStory(collectionId, storyId);
    if (!updated) {
      throw new Error(`Collection with id ${collectionId} was not found`);
    }
    return updated;
  }

  /**
   * Remove a story from a collection.
   */
  async removeStory(collectionId: string, storyId: string): Promise<StoryCollection> {
    const updated = await this.db.collections.removeStory(collectionId, storyId);
    if (!updated) {
      throw new Error(`Collection with id ${collectionId} was not found`);
    }
    return updated;
  }

  /**
   * Delete a collection.
   */
  async deleteCollection(id: string): Promise<boolean> {
    return this.db.collections.delete(id);
  }
}
