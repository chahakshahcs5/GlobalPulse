import { z } from 'zod';

export const WebhookEventEnum = z.enum([
  'story.published',
  'story.updated',
  'story.needs_review',
  'breaking_news.alert',
  'cluster.created',
]);
export type WebhookEvent = z.infer<typeof WebhookEventEnum>;

export const WebhookSubscriptionSchema = z.object({
  id: z.string(),
  url: z.string().url(),
  events: z.array(WebhookEventEnum),
  secret: z.string().min(16),
  active: z.boolean().default(true),
  organizationId: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type WebhookSubscription = z.infer<typeof WebhookSubscriptionSchema>;

export const RegisterWebhookInputSchema = z.object({
  url: z.string().url(),
  events: z.array(WebhookEventEnum).min(1),
  secret: z.string().min(16).optional(),
});
export type RegisterWebhookInput = z.infer<typeof RegisterWebhookInputSchema>;

export const WebhookDispatchLogSchema = z.object({
  id: z.string(),
  subscriptionId: z.string(),
  event: WebhookEventEnum,
  payload: z.record(z.unknown()),
  statusCode: z.number().int().optional(),
  success: z.boolean(),
  error: z.string().optional(),
  timestamp: z.string(),
});
export type WebhookDispatchLog = z.infer<typeof WebhookDispatchLogSchema>;
