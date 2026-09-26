import type {
  Story,
  StoryVersion,
  StoryBlock,
  Event,
  Topic,
  Entity,
  Source,
  Citation,
  Claim,
  AuditLog,
  IdempotencyRecord,
  SearchStoriesInput,
  StorySearchResultItem,
  FindSimilarStoriesInput,
} from '@ai-news/schemas';
import type { PaginatedResult } from '@ai-news/shared';

export interface IStoryRepository {
  findById(id: string, orgId?: string): Promise<Story | null>;
  findBySlug(slug: string, orgId: string): Promise<Story | null>;
  create(story: Story): Promise<Story>;
  update(story: Story): Promise<Story>;
  delete(id: string, orgId: string): Promise<boolean>;

  // Versions
  createVersion(version: StoryVersion): Promise<StoryVersion>;
  getVersion(storyId: string, versionNumber: number): Promise<StoryVersion | null>;
  getVersions(storyId: string): Promise<StoryVersion[]>;

  // Blocks
  getBlocks(storyId: string): Promise<StoryBlock[]>;
  saveBlocks(storyId: string, blocks: StoryBlock[]): Promise<StoryBlock[]>;

  // Search & Query
  search(params: SearchStoriesInput, orgId: string): Promise<PaginatedResult<StorySearchResultItem>>;
  findSimilar(params: FindSimilarStoriesInput, orgId: string): Promise<StorySearchResultItem[]>;
}

export interface IEventRepository {
  findById(id: string, orgId?: string): Promise<Event | null>;
  create(event: Event): Promise<Event>;
  update(event: Event): Promise<Event>;
  list(orgId: string, limit?: number): Promise<Event[]>;
  search(query: string, orgId: string): Promise<Event[]>;
}

export interface ITopicRepository {
  findById(id: string, orgId?: string): Promise<Topic | null>;
  findBySlug(slug: string, orgId: string): Promise<Topic | null>;
  create(topic: Topic): Promise<Topic>;
  update(topic: Topic): Promise<Topic>;
  list(orgId: string): Promise<Topic[]>;
  search(query: string, orgId: string): Promise<Topic[]>;
}

export interface IEntityRepository {
  findById(id: string, orgId?: string): Promise<Entity | null>;
  findBySlug(slug: string, orgId: string): Promise<Entity | null>;
  create(entity: Entity): Promise<Entity>;
  update(entity: Entity): Promise<Entity>;
  list(orgId: string): Promise<Entity[]>;
  search(query: string, orgId: string): Promise<Entity[]>;
}

export interface ISourceRepository {
  findById(id: string, orgId?: string): Promise<Source | null>;
  findByUrl(url: string, orgId: string): Promise<Source | null>;
  create(source: Source): Promise<Source>;
  update(source: Source): Promise<Source>;
  list(orgId: string, limit?: number): Promise<Source[]>;
  search(query: string, orgId: string): Promise<Source[]>;

  // Citations & Claims
  createCitation(citation: Citation): Promise<Citation>;
  getCitationsForStory(storyId: string): Promise<Citation[]>;
  createClaim(claim: Claim): Promise<Claim>;
  getClaimsForSource(sourceId: string): Promise<Claim[]>;
}

export interface IIdempotencyRepository {
  get(key: string, orgId: string): Promise<IdempotencyRecord | null>;
  save(record: IdempotencyRecord): Promise<void>;
}

export interface IAuditRepository {
  log(entry: AuditLog): Promise<void>;
  query(orgId: string, limit?: number): Promise<AuditLog[]>;
}
