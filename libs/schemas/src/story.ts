import { z } from 'zod';
import { StoryBlockSchema } from './blocks';

export const StoryStatusSchema = z.enum([
  'DRAFT',
  'IN_REVIEW',
  'SCHEDULED',
  'PUBLISHED',
  'ARCHIVED',
]);
export type StoryStatus = z.infer<typeof StoryStatusSchema>;

export const ArticleTypeSchema = z.enum([
  'breaking_news',
  'developing_story',
  'explainer',
  'analysis',
  'background',
  'deep_dive',
  'data_story',
  'visual_story',
  'timeline',
  'technology',
  'science',
  'business',
  'markets',
  'sports',
  'politics',
  'culture',
  'local',
  'weekly_digest',
  'topic_briefing',
  'liveblog',
  'fact_check',
  'opinion',
  'investigation',
]);
export type ArticleType = z.infer<typeof ArticleTypeSchema>;

export const ClientTypeSchema = z.enum([
  'gemini',
  'gemini_spark',
  'chatgpt',
  'claude',
  'custom_mcp',
  'human_web',
  'human_mobile',
  'internal_service',
]);
export type ClientType = z.infer<typeof ClientTypeSchema>;

export const CreatedViaSchema = z.enum(['mcp', 'web', 'mobile', 'api', 'admin']);
export type CreatedVia = z.infer<typeof CreatedViaSchema>;

export const StoryVersionSchema = z.object({
  id: z.string().min(1),
  storyId: z.string().min(1),
  versionNumber: z.number().int().positive(),
  title: z.string().min(1),
  summary: z.string().min(1),
  blocks: z.array(StoryBlockSchema),
  changeSummary: z.string().optional(),
  clientType: ClientTypeSchema,
  authorId: z.string().min(1),
  createdAt: z.string(),
});
export type StoryVersion = z.infer<typeof StoryVersionSchema>;

export const StorySchema = z.object({
  id: z.string().min(1),
  organizationId: z.string().min(1),
  slug: z.string().min(1),
  title: z.string().min(1),
  summary: z.string().min(1),
  status: StoryStatusSchema,
  articleType: ArticleTypeSchema,
  eventId: z.string().optional(),
  currentVersionNumber: z.number().int().positive(),
  currentVersionId: z.string().optional(),
  topicIds: z.array(z.string()).default([]),
  entityIds: z.array(z.string()).default([]),
  sourceIds: z.array(z.string()).default([]),
  blocks: z.array(StoryBlockSchema).default([]),
  heroImageUrl: z.string().url().optional(),
  createdVia: CreatedViaSchema,
  createdByClient: ClientTypeSchema,
  authorId: z.string().min(1),
  idempotencyKey: z.string().optional(),
  publishedAt: z.string().optional(),
  scheduledPublishAt: z.string().optional(),
  wordCount: z.number().int().nonnegative().optional(),
  readingTimeMinutes: z.number().int().nonnegative().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type Story = z.infer<typeof StorySchema>;

// Input schemas for validation
export const CreateStoryInputSchema = z.object({
  title: z.string().min(1, 'Title is required').max(300),
  summary: z.string().min(1, 'Summary is required').max(2000),
  articleType: ArticleTypeSchema.default('developing_story'),
  eventId: z.string().optional(),
  topicIds: z.array(z.string()).optional().default([]),
  entityIds: z.array(z.string()).optional().default([]),
  sourceIds: z.array(z.string()).optional().default([]),
  blocks: z.array(StoryBlockSchema).optional().default([]),
  heroImageUrl: z.string().url().optional(),
  idempotencyKey: z.string().max(200).optional(),
});
export type CreateStoryInput = z.input<typeof CreateStoryInputSchema>;
export type CreateStoryOutput = z.output<typeof CreateStoryInputSchema>;

export const UpdateStoryInputSchema = z.object({
  title: z.string().min(1).max(300).optional(),
  summary: z.string().min(1).max(2000).optional(),
  articleType: ArticleTypeSchema.optional(),
  eventId: z.string().optional(),
  topicIds: z.array(z.string()).optional(),
  entityIds: z.array(z.string()).optional(),
  heroImageUrl: z.string().url().optional(),
});
export type UpdateStoryInput = z.infer<typeof UpdateStoryInputSchema>;

export const CreateStoryVersionInputSchema = z.object({
  title: z.string().min(1).optional(),
  summary: z.string().min(1).optional(),
  blocks: z.array(StoryBlockSchema).optional(),
  changeSummary: z.string().min(1, 'Change summary is required when committing a version update'),
  idempotencyKey: z.string().max(200).optional(),
});
export type CreateStoryVersionInput = z.infer<typeof CreateStoryVersionInputSchema>;

export const PublishStoryInputSchema = z.object({
  idempotencyKey: z.string().max(200).optional(),
  embargoUntil: z.string().optional(),
});
export type PublishStoryInput = z.infer<typeof PublishStoryInputSchema>;
