export interface StoryEmbeddingRecord {
  id: string;
  organizationId: string;
  storyId: string;
  versionNumber: number;
  dimensions: number;
  embedding: number[];
  tokens: string[];
  model: string;
  createdAt: string;
  updatedAt: string;
}

export interface IStoryEmbeddingRepository {
  upsert(
    record: Omit<StoryEmbeddingRecord, 'id' | 'createdAt' | 'updatedAt'> & {
      id?: string;
      createdAt?: string;
      updatedAt?: string;
    }
  ): Promise<StoryEmbeddingRecord>;
  findByStoryVersion(
    storyId: string,
    versionNumber: number,
    orgId?: string
  ): Promise<StoryEmbeddingRecord | null>;
  listByOrganization(orgId: string): Promise<StoryEmbeddingRecord[]>;
  deleteByStory(storyId: string, orgId?: string): Promise<number>;
  snapshot(): Map<string, StoryEmbeddingRecord>;
  restore(snapshot: Map<string, StoryEmbeddingRecord>): void;
  clear(): void;
}
