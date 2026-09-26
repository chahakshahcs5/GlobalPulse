import type { Topic } from '@ai-news/schemas';

export interface ITopicRepository {
  findById(id: string, orgId?: string): Promise<Topic | null>;
  findBySlug(slug: string, orgId: string): Promise<Topic | null>;
  create(topic: Topic): Promise<Topic>;
  update(topic: Topic): Promise<Topic>;
  list(orgId: string): Promise<Topic[]>;
  search(query: string, orgId: string): Promise<Topic[]>;
}
