export interface StoryReadRecord {
  id: string;
  organizationId: string;
  userId: string;
  storyId: string;
  monthKey: string;
  readAt: string;
}

export interface IStoryReadRepository {
  /** Idempotent: reading the same story twice in a month counts once. */
  recordRead(input: {
    organizationId: string;
    userId: string;
    storyId: string;
    monthKey: string;
  }): Promise<StoryReadRecord>;
  countDistinctStories(userId: string, monthKey: string, orgId: string): Promise<number>;
  listStoryIds(userId: string, monthKey: string, orgId: string): Promise<string[]>;
  snapshot(): Map<string, StoryReadRecord>;
  restore(snapshot: Map<string, StoryReadRecord>): void;
  clear(): void;
}
