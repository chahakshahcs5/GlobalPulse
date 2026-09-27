import type {
  Story,
  StoryVersion,
  StoryBlock,
  SearchStoriesInput,
  FindSimilarStoriesInput,
  StorySearchResultItem,
} from '@ai-news/schemas';
import type { PaginatedResult } from '@ai-news/shared';

export interface StoryFilter {
  status?: string;
  articleType?: string;
  topicId?: string;
  entityId?: string;
  sourceId?: string;
  limit?: number;
  cursor?: string;
  query?: string;
}

export interface IStoryRepository {
  findById(id: string, orgId?: string): Promise<Story | null>;
  findBySlug(slug: string, orgId?: string): Promise<Story | null>;
  create(story: Story): Promise<Story>;
  update(story: Story): Promise<Story>;
  delete(id: string, orgId?: string): Promise<boolean>;
  list(filter?: StoryFilter, orgId?: string): Promise<Story[]>;

  // Block management
  saveBlocks(storyId: string, blocks: StoryBlock[]): Promise<void>;
  getBlocks(storyId: string): Promise<StoryBlock[]>;

  // Version management
  createVersion(version: StoryVersion): Promise<StoryVersion>;
  getVersions(storyId: string): Promise<StoryVersion[]>;
  getVersion(storyId: string, versionNumber: number): Promise<StoryVersion | null>;

  // Topic & Entity Associations
  linkTopic(storyId: string, topicId: string): Promise<void>;
  linkEntity(storyId: string, entityId: string): Promise<void>;
  linkSource(storyId: string, sourceId: string): Promise<void>;

  // Search & Similarity
  search(params: SearchStoriesInput, orgId?: string): Promise<PaginatedResult<StorySearchResultItem>>;
  findSimilar(params: FindSimilarStoriesInput, orgId: string): Promise<StorySearchResultItem[]>;
}
