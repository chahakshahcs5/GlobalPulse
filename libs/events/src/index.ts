import type {
  Event,
  CreateEventInput,
  EventMapFilter,
  EventMapPoint,
  EventHeatmapCell,
  EventSeverity,
} from '@ai-news/schemas';
import { CreateEventInputSchema, EventMapFilterSchema, severityRank } from '@ai-news/schemas';
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

  /**
   * Global event map (§13).
   *
   * Returns the points a map layer renders: located events filtered by
   * category, severity, time window, and geographic area, enriched with the
   * counts a legend and a detail panel need (stories, sources, entities).
   */
  async listEventsForMap(
    orgId: string,
    filter: Partial<EventMapFilter> = {}
  ): Promise<EventMapPoint[]> {
    const validated = EventMapFilterSchema.parse(filter);
    const events = await this.db.events.listForMap(orgId, validated);

    return events.map((event) => ({
      id: event.id,
      title: event.title,
      summary: event.summary,
      status: event.status,
      category: event.category,
      severity: event.severity,
      occurredAt: event.occurredAt,
      location: event.location,
      coordinates: event.coordinates,
      storyIds: event.storyIds ?? [],
      sourceIds: event.sourceIds ?? [],
      entityIds: event.entityIds ?? [],
      topicIds: event.topicIds ?? [],
      storyCount: event.storyIds?.length ?? 0,
      sourceCount: event.sourceIds?.length ?? 0,
      entityCount: event.entityIds?.length ?? 0,
      metadata: event.metadata,
    }));
  }

  /**
   * Heatmap / clustering aggregation: events grouped into a geographic grid so
   * a map can render density without shipping every raw point.
   */
  async getEventHeatmap(
    orgId: string,
    filter: Partial<EventMapFilter> & { precision?: number } = {}
  ): Promise<{ cells: EventHeatmapCell[]; totalEvents: number; precision: number }> {
    const { precision = 1, ...rest } = filter;
    const validated = EventMapFilterSchema.parse({
      ...rest,
      limit: rest.limit ?? 2000,
    });
    const events = await this.db.events.listForMap(orgId, validated);

    const cells = new Map<string, EventHeatmapCell>();
    for (const event of events) {
      if (!event.coordinates) continue;
      const [lng, lat] = event.coordinates;
      const cellLat = Math.round(lat / precision) * precision;
      const cellLng = Math.round(lng / precision) * precision;
      const key = `${cellLat}_${cellLng}`;

      const existing = cells.get(key);
      if (existing) {
        existing.eventCount += 1;
        if (event.category && !existing.categories.includes(event.category)) {
          existing.categories.push(event.category);
        }
        if (
          event.severity &&
          (!existing.highestSeverity ||
            severityRank(event.severity) > severityRank(existing.highestSeverity))
        ) {
          existing.highestSeverity = event.severity as EventSeverity;
        }
      } else {
        cells.set(key, {
          cell: key,
          latitude: cellLat,
          longitude: cellLng,
          eventCount: 1,
          highestSeverity: event.severity,
          categories: event.category ? [event.category] : [],
        });
      }
    }

    return {
      cells: Array.from(cells.values()).sort((a, b) => b.eventCount - a.eventCount),
      totalEvents: events.length,
      precision,
    };
  }
}
