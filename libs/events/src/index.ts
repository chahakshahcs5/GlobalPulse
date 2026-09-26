import type { Event, CreateEventInput } from '@ai-news/schemas';
import { CreateEventInputSchema } from '@ai-news/schemas';
import type { DatabaseService } from '@ai-news/database';
import { NotFoundError, generateId } from '@ai-news/shared';

export class EventService {
  constructor(private readonly db: DatabaseService) {}

  async createEvent(input: CreateEventInput, orgId: string): Promise<Event> {
    const validated = CreateEventInputSchema.parse(input);
    const id = generateId('evt');
    const now = new Date().toISOString();

    const event: Event = {
      id,
      organizationId: orgId,
      title: validated.title,
      summary: validated.summary,
      status: validated.status || 'ACTIVE',
      occurredAt: validated.occurredAt || now,
      location: validated.location,
      coordinates: validated.coordinates,
      topicIds: validated.topicIds || [],
      entityIds: validated.entityIds || [],
      storyIds: [],
      sourceIds: [],
      createdAt: now,
      updatedAt: now,
    };

    return this.db.events.create(event);
  }

  async getEvent(id: string, orgId?: string): Promise<Event> {
    const event = await this.db.events.findById(id, orgId);
    if (!event) {
      throw new NotFoundError('Event', id);
    }
    return event;
  }

  async listEvents(orgId: string, limit = 50): Promise<Event[]> {
    return this.db.events.list(orgId, limit);
  }

  async searchEvents(query: string, orgId: string): Promise<Event[]> {
    return this.db.events.search(query, orgId);
  }
}
