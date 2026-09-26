import type {
  SearchStoriesInput,
  StorySearchResultItem,
  FindSimilarStoriesInput,
  Event,
  Topic,
  Entity,
  Source,
} from '@ai-news/schemas';
import type { DatabaseService } from '@ai-news/database';
import type { PaginatedResult } from '@ai-news/shared';

export class SearchService {
  constructor(private readonly db: DatabaseService) {}

  async searchStories(
    params: SearchStoriesInput,
    orgId: string
  ): Promise<PaginatedResult<StorySearchResultItem>> {
    return this.db.stories.search(params, orgId);
  }

  async findSimilarStories(
    params: FindSimilarStoriesInput,
    orgId: string
  ): Promise<StorySearchResultItem[]> {
    return this.db.stories.findSimilar(params, orgId);
  }

  async searchEvents(query: string, orgId: string): Promise<Event[]> {
    return this.db.events.search(query, orgId);
  }

  async searchTopics(query: string, orgId: string): Promise<Topic[]> {
    return this.db.topics.search(query, orgId);
  }

  async searchEntities(query: string, orgId: string): Promise<Entity[]> {
    return this.db.entities.search(query, orgId);
  }

  async searchSources(query: string, orgId: string): Promise<Source[]> {
    return this.db.sources.search(query, orgId);
  }
}
