import { z } from 'zod';

/**
 * Live feed contract.
 *
 * A live feed supplies the current values for a `live_data` or `live_ticker`
 * story block. The block stores the snapshot it was published with; the feed
 * carries the fresher numbers, delivered over the realtime channel.
 */
export const LiveFeedItemSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  value: z.union([z.number(), z.string()]),
  previousValue: z.union([z.number(), z.string()]).optional(),
  /** Percentage change against `previousValue`. */
  change: z.number().optional(),
  unit: z.string().optional(),
  provider: z.string().optional(),
  asOf: z.string().optional(),
  /** Recent samples, used to draw a sparkline. */
  sparkline: z.array(z.number()).optional(),
});
export type LiveFeedItem = z.infer<typeof LiveFeedItemSchema>;

export const LiveFeedSchema = z.object({
  key: z.string().min(1),
  title: z.string().min(1),
  provider: z.string().optional(),
  items: z.array(LiveFeedItemSchema).min(1),
  /** ISO timestamp of the moment these values were produced. */
  asOf: z.string(),
  refreshIntervalSeconds: z.number().int().min(5).max(3600).default(60),
  license: z.string().optional(),
  methodology: z.string().optional(),
  sourceAttribution: z.string().optional(),
  organizationId: z.string().optional(),
  updatedAt: z.string().optional(),
});
export type LiveFeed = z.infer<typeof LiveFeedSchema>;

export const LiveFeedUpdateSchema = z.object({
  title: z.string().min(1).optional(),
  provider: z.string().optional(),
  items: z.array(LiveFeedItemSchema).min(1),
  asOf: z.string().optional(),
  refreshIntervalSeconds: z.number().int().min(5).max(3600).optional(),
  license: z.string().optional(),
  methodology: z.string().optional(),
  sourceAttribution: z.string().optional(),
});
export type LiveFeedUpdate = z.infer<typeof LiveFeedUpdateSchema>;
