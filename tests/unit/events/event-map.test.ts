import { describe, it, expect, beforeEach } from 'vitest';
import { DatabaseService } from '@ai-news/database';
import { EventService } from '@ai-news/events';
import type { Event } from '@ai-news/schemas';

const ORG = 'org_map_test';
const OTHER_ORG = 'org_map_other';

function buildEvent(overrides: Partial<Event>): Event {
  const now = new Date().toISOString();
  return {
    id: `evt_${Math.random().toString(36).slice(2, 10)}`,
    organizationId: ORG,
    title: 'Event',
    summary: 'Event summary',
    status: 'ACTIVE',
    occurredAt: now,
    topicIds: [],
    entityIds: [],
    storyIds: [],
    sourceIds: [],
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

describe('Global event map (§13)', () => {
  let db: DatabaseService;
  let events: EventService;

  beforeEach(() => {
    db = new DatabaseService();
    events = new EventService(db);
  });

  it('returns only located events by default', async () => {
    await db.events.create(
      buildEvent({ id: 'evt_located', coordinates: [139.7, 35.6], category: 'earthquake' })
    );
    await db.events.create(buildEvent({ id: 'evt_no_location', category: 'election' }));

    const points = await events.listEventsForMap(ORG);

    expect(points).toHaveLength(1);
    expect(points[0].id).toBe('evt_located');
    expect(points[0].coordinates).toEqual([139.7, 35.6]);
  });

  it('filters by category and severity', async () => {
    await db.events.create(
      buildEvent({
        id: 'evt_quake',
        coordinates: [139.7, 35.6],
        category: 'earthquake',
        severity: 'CRITICAL',
      })
    );
    await db.events.create(
      buildEvent({
        id: 'evt_election',
        coordinates: [-74.0, 40.7],
        category: 'election',
        severity: 'LOW',
      })
    );

    const byCategory = await events.listEventsForMap(ORG, { categories: ['earthquake'] });
    expect(byCategory).toHaveLength(1);
    expect(byCategory[0].id).toBe('evt_quake');

    const bySeverity = await events.listEventsForMap(ORG, { severities: ['CRITICAL'] });
    expect(bySeverity).toHaveLength(1);
    expect(bySeverity[0].id).toBe('evt_quake');
  });

  it('filters by time window', async () => {
    await db.events.create(
      buildEvent({
        id: 'evt_old',
        coordinates: [10, 10],
        occurredAt: '2020-01-01T00:00:00.000Z',
      })
    );
    await db.events.create(
      buildEvent({
        id: 'evt_recent',
        coordinates: [11, 11],
        occurredAt: '2026-10-20T00:00:00.000Z',
      })
    );

    const points = await events.listEventsForMap(ORG, {
      fromDate: '2026-01-01T00:00:00.000Z',
    });

    expect(points).toHaveLength(1);
    expect(points[0].id).toBe('evt_recent');
  });

  it('filters by bounding box', async () => {
    await db.events.create(buildEvent({ id: 'evt_inside', coordinates: [139.7, 35.6] }));
    await db.events.create(buildEvent({ id: 'evt_outside', coordinates: [-74.0, 40.7] }));

    const points = await events.listEventsForMap(ORG, {
      bbox: [130, 30, 145, 40],
    });

    expect(points).toHaveLength(1);
    expect(points[0].id).toBe('evt_inside');
  });

  it('exposes the counts a map legend and detail panel need', async () => {
    await db.events.create(
      buildEvent({
        id: 'evt_rich',
        coordinates: [139.7, 35.6],
        storyIds: ['sty_1', 'sty_2'],
        sourceIds: ['src_1'],
        entityIds: ['ent_1', 'ent_2'],
      })
    );

    const [point] = await events.listEventsForMap(ORG);

    expect(point.storyCount).toBe(2);
    expect(point.sourceCount).toBe(1);
    expect(point.entityCount).toBe(2);
    expect(point.storyIds).toEqual(['sty_1', 'sty_2']);
  });

  it('aggregates events into heatmap cells', async () => {
    await db.events.create(
      buildEvent({ id: 'evt_h1', coordinates: [139.6, 35.6], severity: 'LOW' })
    );
    await db.events.create(
      buildEvent({ id: 'evt_h2', coordinates: [139.8, 35.7], severity: 'CRITICAL' })
    );
    await db.events.create(
      buildEvent({ id: 'evt_h3', coordinates: [10.0, 10.0], severity: 'LOW' })
    );

    const heatmap = await events.getEventHeatmap(ORG, { precision: 1 });

    expect(heatmap.precision).toBe(1);
    expect(heatmap.totalEvents).toBe(3);
    expect(heatmap.cells).toHaveLength(2);

    const busiest = heatmap.cells[0];
    expect(busiest.eventCount).toBe(2);
    expect(busiest.highestSeverity).toBe('CRITICAL');
  });

  it('never leaks another tenant’s events', async () => {
    await db.events.create(
      buildEvent({ id: 'evt_other', organizationId: OTHER_ORG, coordinates: [1, 1] })
    );
    await db.events.create(buildEvent({ id: 'evt_mine', coordinates: [2, 2] }));

    const points = await events.listEventsForMap(ORG);
    expect(points).toHaveLength(1);
    expect(points[0].id).toBe('evt_mine');
  });
});
