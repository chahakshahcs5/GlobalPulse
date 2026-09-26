import { z } from 'zod';

export const EventStatusSchema = z.enum(['ACTIVE', 'RESOLVED', 'HISTORICAL']);
export type EventStatus = z.infer<typeof EventStatusSchema>;

export const EventSchema = z.object({
  id: z.string().min(1),
  organizationId: z.string().min(1),
  title: z.string().min(1),
  summary: z.string().min(1),
  status: EventStatusSchema.default('ACTIVE'),
  occurredAt: z.string(),
  location: z.string().optional(),
  coordinates: z.tuple([z.number(), z.number()]).optional(), // [lng, lat]
  topicIds: z.array(z.string()).default([]),
  entityIds: z.array(z.string()).default([]),
  storyIds: z.array(z.string()).default([]),
  sourceIds: z.array(z.string()).default([]),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type Event = z.infer<typeof EventSchema>;

export const CreateEventInputSchema = z.object({
  title: z.string().min(1).max(300),
  summary: z.string().min(1).max(2000),
  status: EventStatusSchema.default('ACTIVE'),
  occurredAt: z.string().optional(),
  location: z.string().optional(),
  coordinates: z.tuple([z.number(), z.number()]).optional(),
  topicIds: z.array(z.string()).optional().default([]),
  entityIds: z.array(z.string()).optional().default([]),
  idempotencyKey: z.string().optional(),
});
export type CreateEventInput = z.infer<typeof CreateEventInputSchema>;
