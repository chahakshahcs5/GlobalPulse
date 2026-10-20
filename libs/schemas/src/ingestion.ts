import { z } from 'zod';

export const IngestionFeedTypeSchema = z.enum(['rss', 'atom', 'json_api', 'webhook']);
export type IngestionFeedType = z.infer<typeof IngestionFeedTypeSchema>;

export const IngestionItemStatusSchema = z.enum([
  'NEW',
  'DUPLICATE',
  'CLUSTERED',
  'PROMOTED',
  'REJECTED',
]);
export type IngestionItemStatus = z.infer<typeof IngestionItemStatusSchema>;

export const IngestionSignalsSchema = z.object({
  entityIds: z.array(z.string()).default([]),
  topicIds: z.array(z.string()).default([]),
  similarityScore: z.number().min(0).max(1).optional(),
  matchedStoryId: z.string().optional(),
  matchedClusterId: z.string().optional(),
  independentSourceCount: z.number().int().nonnegative().default(1),
  officialSource: z.boolean().default(false),
});
export type IngestionSignals = z.infer<typeof IngestionSignalsSchema>;

export const IngestionFeedSchema = z.object({
  id: z.string().min(1),
  organizationId: z.string().min(1),
  name: z.string().min(1).max(200),
  url: z.string().url(),
  type: IngestionFeedTypeSchema.default('rss'),
  active: z.boolean().default(true),
  defaultTopicIds: z.array(z.string()).default([]),
  defaultEntityIds: z.array(z.string()).default([]),
  defaultSourceType: z.string().default('NEWS_ARTICLE'),
  fetchIntervalMinutes: z.number().int().min(5).max(1440).default(15),
  lastFetchedAt: z.string().optional(),
  lastStatus: z.string().optional(),
  etag: z.string().optional(),
  lastModified: z.string().optional(),
  createdBy: z.string().min(1),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type IngestionFeed = z.infer<typeof IngestionFeedSchema>;

export const CreateIngestionFeedInputSchema = z.object({
  name: z.string().min(1).max(200),
  url: z.string().url(),
  type: IngestionFeedTypeSchema.optional().default('rss'),
  active: z.boolean().optional().default(true),
  defaultTopicIds: z.array(z.string()).optional().default([]),
  defaultEntityIds: z.array(z.string()).optional().default([]),
  defaultSourceType: z.string().optional().default('NEWS_ARTICLE'),
  fetchIntervalMinutes: z.number().int().min(5).max(1440).optional().default(15),
});
export type CreateIngestionFeedInput = z.input<typeof CreateIngestionFeedInputSchema>;

export const IngestionItemSchema = z.object({
  id: z.string().min(1),
  organizationId: z.string().min(1),
  feedId: z.string().min(1),
  externalId: z.string().optional(),
  url: z.string().url(),
  title: z.string().min(1).max(500),
  summary: z.string().max(10000).optional(),
  contentText: z.string().max(100000).optional(),
  author: z.string().max(300).optional(),
  publishedAt: z.string().optional(),
  retrievedAt: z.string(),
  dedupeHash: z.string().min(1),
  status: IngestionItemStatusSchema.default('NEW'),
  signals: IngestionSignalsSchema,
  claimTexts: z.array(z.string()).default([]),
  raw: z.record(z.unknown()).optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type IngestionItem = z.infer<typeof IngestionItemSchema>;

export const IngestFeedResultSchema = z.object({
  feedId: z.string(),
  fetchedAt: z.string(),
  fetched: z.number().int().nonnegative(),
  created: z.number().int().nonnegative(),
  duplicates: z.number().int().nonnegative(),
  clustered: z.number().int().nonnegative(),
  items: z.array(IngestionItemSchema),
});
export type IngestFeedResult = z.infer<typeof IngestFeedResultSchema>;

export const PromoteIngestionItemInputSchema = z.object({
  itemId: z.string().min(1),
  createDraftStory: z.boolean().optional().default(false),
  topicIds: z.array(z.string()).optional().default([]),
  entityIds: z.array(z.string()).optional().default([]),
});
export type PromoteIngestionItemInput = z.input<typeof PromoteIngestionItemInputSchema>;

export const PromoteIngestionItemResultSchema = z.object({
  item: IngestionItemSchema,
  sourceId: z.string(),
  storyId: z.string().optional(),
  storySlug: z.string().optional(),
});
export type PromoteIngestionItemResult = z.infer<typeof PromoteIngestionItemResultSchema>;

export const BreakingNewsCandidateSchema = z.object({
  id: z.string().min(1),
  organizationId: z.string().min(1),
  title: z.string().min(1),
  summary: z.string().min(1),
  eventId: z.string().optional(),
  storyIds: z.array(z.string()).default([]),
  sourceIds: z.array(z.string()).default([]),
  independentSourceCount: z.number().int().nonnegative(),
  storyVelocity: z.number().nonnegative(),
  entityIds: z.array(z.string()).default([]),
  severity: z.string().default('MODERATE'),
  lastUpdatedAt: z.string(),
  confidenceMethodology: z.string(),
  reviewStatus: z.enum(['CANDIDATE', 'APPROVED', 'REJECTED']).default('CANDIDATE'),
});
export type BreakingNewsCandidate = z.infer<typeof BreakingNewsCandidateSchema>;
