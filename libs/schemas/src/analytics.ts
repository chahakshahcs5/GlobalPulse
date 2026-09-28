import { z } from 'zod';

export const StoryAnalyticsSchema = z.object({
  storyId: z.string(),
  title: z.string(),
  slug: z.string(),
  viewsCount: z.number().int().nonnegative(),
  uniqueReaders: z.number().int().nonnegative(),
  commentsCount: z.number().int().nonnegative(),
  reactionsCount: z.number().int().nonnegative(),
  bookmarksCount: z.number().int().nonnegative(),
  avgReadTimeSeconds: z.number().nonnegative(),
  viralityScore: z.number().min(0).max(100),
  lastViewedAt: z.string().optional(),
});
export type StoryAnalytics = z.infer<typeof StoryAnalyticsSchema>;

export const TrendingStorySchema = z.object({
  storyId: z.string(),
  title: z.string(),
  slug: z.string(),
  category: z.string().optional(),
  heroImageUrl: z.string().optional(),
  viralityScore: z.number(),
  publishedAt: z.string().optional(),
  commentsCount: z.number(),
  reactionsCount: z.number(),
});
export type TrendingStory = z.infer<typeof TrendingStorySchema>;

export const NewsroomMetricsSchema = z.object({
  totalStories: z.number(),
  publishedStories: z.number(),
  draftStories: z.number(),
  reviewQueueCount: z.number(),
  scheduledStoriesCount: z.number(),
  totalComments: z.number(),
  totalReactions: z.number(),
  totalBookmarks: z.number(),
  activeCategoriesCount: z.number(),
  totalReads: z.number().optional().default(0),
  avgReadingTimeMinutes: z.number().optional().default(0),
  activeJournalists: z.number().optional().default(0),
  activeAiAgents: z.number().optional().default(0),
  generatedAt: z.string(),
});
export type NewsroomMetrics = z.infer<typeof NewsroomMetricsSchema>;
