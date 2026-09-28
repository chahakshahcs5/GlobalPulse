import { z } from 'zod';
import { StoryStatusSchema, StorySchema } from './story';

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

export const KanbanBoardSchema = z.object({
  columns: z.object({
    DRAFT: z.array(StorySchema),
    IN_REVIEW: z.array(StorySchema),
    SCHEDULED: z.array(StorySchema),
    PUBLISHED: z.array(StorySchema),
    ARCHIVED: z.array(StorySchema),
  }),
  totalCount: z.number(),
});
export type KanbanBoard = z.infer<typeof KanbanBoardSchema>;

export const CalendarScheduleSchema = z.object({
  scheduledStories: z.array(StorySchema),
  publishedStories: z.array(StorySchema),
});
export type CalendarSchedule = z.infer<typeof CalendarScheduleSchema>;

export const TransitionStatusInputSchema = z.object({
  status: StoryStatusSchema,
  scheduledPublishAt: z.string().optional(),
});
export type TransitionStatusInput = z.infer<typeof TransitionStatusInputSchema>;
