import type { Event, EventMapFilter } from '@ai-news/schemas';

export interface IEventRepository {
  findById(id: string, orgId?: string): Promise<Event | null>;
  findBySlug(slug: string, orgId: string): Promise<Event | null>;
  create(event: Event): Promise<Event>;
  update(event: Event): Promise<Event>;
  list(orgId: string, limit?: number): Promise<Event[]>;
  /** Events for the global map: filtered by category, severity, time and area. */
  listForMap(orgId: string, filter: EventMapFilter): Promise<Event[]>;
  search(query: string, orgId: string): Promise<Event[]>;
}
