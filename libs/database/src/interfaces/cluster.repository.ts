import type { StoryCluster } from '@ai-news/schemas';

export interface IClusterRepository {
  getById(id: string, orgId?: string): Promise<StoryCluster | null>;
  findByStoryId(storyId: string, orgId?: string): Promise<StoryCluster | null>;
  create(cluster: StoryCluster): Promise<StoryCluster>;
  update(cluster: StoryCluster): Promise<StoryCluster>;
  list(orgId?: string, limit?: number): Promise<StoryCluster[]>;
  delete(id: string, orgId?: string): Promise<boolean>;
}
