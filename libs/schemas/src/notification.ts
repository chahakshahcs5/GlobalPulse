import { z } from 'zod';

export const NotificationTypeSchema = z.enum([
  'breaking_news',
  'editorial_alert',
  'fact_check_flag',
  'review_requested',
  'story_published',
  'system',
]);
export type NotificationType = z.infer<typeof NotificationTypeSchema>;

export const NotificationSeveritySchema = z.enum(['info', 'warning', 'urgent']);
export type NotificationSeverity = z.infer<typeof NotificationSeveritySchema>;

export const EditorialNotificationSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  type: NotificationTypeSchema,
  severity: NotificationSeveritySchema,
  title: z.string().min(1),
  message: z.string().min(1),
  storyId: z.string().optional(),
  authorId: z.string(),
  targetRole: z.string().optional(),
  isRead: z.boolean().default(false),
  createdAt: z.string(),
});
export type EditorialNotification = z.infer<typeof EditorialNotificationSchema>;

export const BroadcastBreakingNewsInputSchema = z.object({
  storyId: z.string().min(1),
  headline: z.string().min(1).max(250),
  urgency: NotificationSeveritySchema.default('urgent'),
});
export type BroadcastBreakingNewsInput = z.infer<typeof BroadcastBreakingNewsInputSchema>;

export const SendEditorialAlertInputSchema = z.object({
  title: z.string().min(1).max(200),
  message: z.string().min(1).max(1000),
  severity: NotificationSeveritySchema.default('warning'),
  storyId: z.string().optional(),
  targetRole: z.string().optional(),
});
export type SendEditorialAlertInput = z.infer<typeof SendEditorialAlertInputSchema>;
