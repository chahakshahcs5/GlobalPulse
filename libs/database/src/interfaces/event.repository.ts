import type { Event } from '@ai-news/schemas';

export interface IEventRepository {
  findById(id: string, orgId?: string): Promise<Event | null>;
  findBySlug(slug: string, orgId: string): Promise<Event | null>;
  create(event: Event): Promise<Event>;
  update(event: Event): Promise<Event>;
  list(orgId: string, limit?: number): Promise<Event[]>;
  search(query: string, orgId: string): Promise<Event[]>;
}
