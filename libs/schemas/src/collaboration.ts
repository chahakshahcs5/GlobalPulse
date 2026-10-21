import { z } from 'zod';
import { StoryStatusSchema, StorySummarySchema } from './story';

export const StoryLockUserSchema = z.object({
  id: z.string(),
  name: z.string(),
  role: z.string(),
  clientType: z.string(),
});
export type StoryLockUser = z.infer<typeof StoryLockUserSchema>;

export const StoryLockSchema = z.object({
  storyId: z.string(),
  lockedBy: StoryLockUserSchema,
  acquiredAt: z.string(),
  expiresAt: z.string(),
});
export type StoryLock = z.infer<typeof StoryLockSchema>;

export const StoryPresenceUserSchema = z.object({
  id: z.string(),
  name: z.string(),
  lastSeenAt: z.string(),
});
export type StoryPresenceUser = z.infer<typeof StoryPresenceUserSchema>;

export const StoryPresenceSchema = z.object({
  storyId: z.string(),
  activeUsers: z.array(StoryPresenceUserSchema),
});
export type StoryPresence = z.infer<typeof StoryPresenceSchema>;

/**
 * The newsroom pipeline, grouped by workflow status.
 *
 * Each column holds story *summaries*. A board can show hundreds of stories,
 * and none of them need their blocks to be shown on a card.
 */
export const KanbanBoardSchema: z.ZodObject<{
  columns: z.ZodObject<{
    DRAFT: z.ZodArray<typeof StorySummarySchema>;
    IN_REVIEW: z.ZodArray<typeof StorySummarySchema>;
    SCHEDULED: z.ZodArray<typeof StorySummarySchema>;
    PUBLISHED: z.ZodArray<typeof StorySummarySchema>;
    ARCHIVED: z.ZodArray<typeof StorySummarySchema>;
  }>;
  totalCount: z.ZodNumber;
}> = z.object({
  columns: z.object({
    DRAFT: z.array(StorySummarySchema),
    IN_REVIEW: z.array(StorySummarySchema),
    SCHEDULED: z.array(StorySummarySchema),
    PUBLISHED: z.array(StorySummarySchema),
    ARCHIVED: z.array(StorySummarySchema),
  }),
  totalCount: z.number(),
});
export type KanbanBoard = z.infer<typeof KanbanBoardSchema>;

/**
 * The editorial calendar: what is scheduled, and what has shipped.
 *
 * As with the board, these are summaries.
 */
export const CalendarScheduleSchema: z.ZodObject<{
  scheduledStories: z.ZodArray<typeof StorySummarySchema>;
  publishedStories: z.ZodArray<typeof StorySummarySchema>;
}> = z.object({
  scheduledStories: z.array(StorySummarySchema),
  publishedStories: z.array(StorySummarySchema),
});
export type CalendarSchedule = z.infer<typeof CalendarScheduleSchema>;

export const TransitionStatusInputSchema = z.object({
  status: StoryStatusSchema,
  scheduledPublishAt: z.string().optional(),
});
export type TransitionStatusInput = z.infer<typeof TransitionStatusInputSchema>;
