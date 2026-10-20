import { z } from 'zod';

export const EventStatusSchema = z.enum(['ACTIVE', 'RESOLVED', 'HISTORICAL']);
export type EventStatus = z.infer<typeof EventStatusSchema>;

export const EventSeveritySchema = z.enum(['LOW', 'MODERATE', 'MAJOR', 'CRITICAL']);
export type EventSeverity = z.infer<typeof EventSeveritySchema>;

export const EventSchema = z.object({
  id: z.string().min(1),
  organizationId: z.string().min(1),
  title: z.string().min(1),
  slug: z.string().optional(),
  summary: z.string().min(1),
  status: EventStatusSchema.default('ACTIVE'),
  /** Editorial event category, e.g. conflict, election, earthquake, markets. */
  category: z.string().max(80).optional(),
  severity: EventSeveritySchema.optional(),
  occurredAt: z.string(),
  location: z.string().optional(),
  coordinates: z.tuple([z.number(), z.number()]).optional(), // [lng, lat]
  topicIds: z.array(z.string()).default([]),
  entityIds: z.array(z.string()).default([]),
  storyIds: z.array(z.string()).default([]),
  sourceIds: z.array(z.string()).default([]),
  /** Additional structured measurements (magnitude, depth, wind speed, ...). */
  metadata: z.record(z.unknown()).optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type Event = z.infer<typeof EventSchema>;

export const CreateEventInputSchema = z.object({
  title: z.string().min(1).max(300),
  summary: z.string().min(1).max(2000),
  status: EventStatusSchema.default('ACTIVE'),
  category: z.string().max(80).optional(),
  severity: EventSeveritySchema.optional(),
  occurredAt: z.string().optional(),
  location: z.string().optional(),
  coordinates: z.tuple([z.number(), z.number()]).optional(),
  topicIds: z.array(z.string()).optional().default([]),
  entityIds: z.array(z.string()).optional().default([]),
  metadata: z.record(z.unknown()).optional(),
  idempotencyKey: z.string().optional(),
});
export type CreateEventInput = z.input<typeof CreateEventInputSchema>;
export const CreateEventInputOutputSchema = CreateEventInputSchema;
export type CreateEventOutput = z.output<typeof CreateEventInputSchema>;

/**
 * Filters for the global event map (§13).
 *
 * All filters are optional and combine with AND; array filters match when any
 * element matches. `bbox` is `[west, south, east, north]` in degrees.
 */
export const EventMapFilterSchema = z.object({
  categories: z.array(z.string().min(1)).optional().default([]),
  severities: z.array(EventSeveritySchema).optional().default([]),
  statuses: z.array(EventStatusSchema).optional().default([]),
  /** Only events that occurred at or after this ISO timestamp. */
  fromDate: z.string().optional(),
  /** Only events that occurred at or before this ISO timestamp. */
  toDate: z.string().optional(),
  /** Bounding box [west, south, east, north] in degrees. */
  bbox: z.tuple([z.number(), z.number(), z.number(), z.number()]).optional(),
  /** Restrict to events that have coordinates. */
  locatedOnly: z.boolean().optional().default(true),
  limit: z.number().int().min(1).max(2000).optional().default(500),
});
export type EventMapFilter = z.infer<typeof EventMapFilterSchema>;

/** A single point on the global event map. */
export const EventMapPointSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  summary: z.string().min(1),
  status: EventStatusSchema,
  category: z.string().optional(),
  severity: EventSeveritySchema.optional(),
  occurredAt: z.string(),
  location: z.string().optional(),
  coordinates: z.tuple([z.number(), z.number()]).optional(),
  storyIds: z.array(z.string()).default([]),
  sourceIds: z.array(z.string()).default([]),
  entityIds: z.array(z.string()).default([]),
  topicIds: z.array(z.string()).default([]),
  /** Related stories / sources / entities counts, ready for a map legend. */
  storyCount: z.number().int().nonnegative().default(0),
  sourceCount: z.number().int().nonnegative().default(0),
  entityCount: z.number().int().nonnegative().default(0),
  metadata: z.record(z.unknown()).optional(),
});
export type EventMapPoint = z.infer<typeof EventMapPointSchema>;

/** Aggregated heatmap cell: events grouped into a geographic grid. */
export const EventHeatmapCellSchema = z.object({
  /** Grid cell key, e.g. "35.6_139.7" (lat_lng at the configured precision). */
  cell: z.string().min(1),
  latitude: z.number(),
  longitude: z.number(),
  eventCount: z.number().int().nonnegative(),
  highestSeverity: EventSeveritySchema.optional(),
  categories: z.array(z.string()).default([]),
});
export type EventHeatmapCell = z.infer<typeof EventHeatmapCellSchema>;
