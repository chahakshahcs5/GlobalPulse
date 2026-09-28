import type { Event } from '@ai-news/schemas';
import type { IEventRepository } from '../../interfaces/event.repository';

export class MemoryEventRepository implements IEventRepository {
  private events = new Map<string, Event>();

  async findById(id: string, orgId?: string): Promise<Event | null> {
    const event = this.events.get(id);
    if (!event) return null;
    if (orgId && event.organizationId !== orgId) return null;
    return { ...event };
  }

  async findBySlug(slug: string, orgId: string): Promise<Event | null> {
    for (const event of this.events.values()) {
      if (event.slug === slug && event.organizationId === orgId) {
        return { ...event };
      }
    }
    return null;
  }

  async create(event: Event): Promise<Event> {
    if (this.events.has(event.id)) {
      throw new Error(`Event with id ${event.id} already exists`);
    }
    this.events.set(event.id, { ...event });
    return { ...event };
  }

  async update(event: Event): Promise<Event> {
    if (!this.events.has(event.id)) {
      throw new Error(`Event with id ${event.id} does not exist`);
    }
    this.events.set(event.id, { ...event });
    return { ...event };
  }

  async list(orgId: string, limit: number = 50): Promise<Event[]> {
    return Array.from(this.events.values())
      .filter((e) => e.organizationId === orgId)
      .slice(0, limit);
  }

  async search(query: string, orgId: string): Promise<Event[]> {
    const q = query.toLowerCase();
    return Array.from(this.events.values()).filter(
      (e) =>
        e.organizationId === orgId &&
        (e.title.toLowerCase().includes(q) ||
          (e.summary && e.summary.toLowerCase().includes(q)))
    );
  }

  snapshot(): Map<string, Event> {
    return new Map(this.events);
  }

  restore(snapshot: Map<string, Event>): void {
    this.events = new Map(snapshot);
  }

  clear(): void {
    this.events.clear();
  }
}
