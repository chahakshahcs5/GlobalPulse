import { z } from 'zod';
import { StorySchema } from './story';

export const ClusterPerspectiveSchema = z.object({
  storyId: z.string().optional(),
  publisher: z.string(),
  headline: z.string(),
  excerpt: z.string().optional(),
  sourceType: z.string().default('wire'),
  url: z.string().default('#'),
  timeAgo: z.string().optional(),
  angle: z.string().default('neutral'),
  stance: z.string().optional(),
  publishedAt: z.string().optional(),
});
export type ClusterPerspective = z.infer<typeof ClusterPerspectiveSchema>;

export const ClusterTimelineItemSchema = z.object({
  date: z.string(),
  event: z.string(),
  source: z.string(),
  storyId: z.string().optional(),
});
export type ClusterTimelineItem = z.infer<typeof ClusterTimelineItemSchema>;

export const StoryClusterSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  title: z.string(),
  summary: z.string().optional(),
  leadStoryId: z.string(),
  storyIds: z.array(z.string()).default([]),
  topic: z.string().optional(),
  category: z.string().optional(),
  perspectives: z.array(ClusterPerspectiveSchema).default([]),
  timeline: z.array(ClusterTimelineItemSchema).default([]),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type StoryCluster = z.infer<typeof StoryClusterSchema>;

export const CreateClusterInputSchema = z.object({
  title: z.string().min(1),
  summary: z.string().optional(),
  leadStoryId: z.string(),
  storyIds: z.array(z.string()).default([]),
  topic: z.string().optional(),
  category: z.string().optional(),
  perspectives: z.array(ClusterPerspectiveSchema).optional(),
  timeline: z.array(ClusterTimelineItemSchema).optional(),
});
export type CreateClusterInput = z.infer<typeof CreateClusterInputSchema>;

export const FullCoverageResultSchema = z.object({
  clusterId: z.string(),
  storyId: z.string(),
  title: z.string(),
  summary: z.string(),
  leadStory: StorySchema,
  relatedStories: z.array(StorySchema),
  perspectives: z.array(ClusterPerspectiveSchema),
  timeline: z.array(ClusterTimelineItemSchema),
});
export type FullCoverageResult = z.infer<typeof FullCoverageResultSchema>;
