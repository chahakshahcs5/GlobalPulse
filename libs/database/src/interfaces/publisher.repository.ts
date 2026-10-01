import type { Publisher } from '@ai-news/schemas';

export interface IPublisherRepository {
  findById(id: string, orgId?: string): Promise<Publisher | null>;
  findBySlug(slug: string, orgId: string): Promise<Publisher | null>;
  findByDomain(domain: string, orgId: string): Promise<Publisher | null>;
  create(publisher: Publisher): Promise<Publisher>;
  update(publisher: Publisher): Promise<Publisher>;
  list(orgId: string, category?: string, limit?: number): Promise<Publisher[]>;
  search(query: string, orgId: string): Promise<Publisher[]>;
}
