import { z } from 'zod';
import { StoryStatusSchema, ArticleTypeSchema } from './story';

export const SearchStoriesInputSchema = z.object({
  query: z.string().optional(),
  status: StoryStatusSchema.optional(),
  articleType: ArticleTypeSchema.optional(),
  topicId: z.string().optional(),
  entityId: z.string().optional(),
  sourceId: z.string().optional(),
  fromDate: z.string().optional(),
  toDate: z.string().optional(),
  limit: z.number().int().min(1).max(100).default(20),
  cursor: z.string().optional(),
});
export type SearchStoriesInput = z.input<typeof SearchStoriesInputSchema>;

export const FindSimilarStoriesInputSchema = z.object({
  title: z.string().min(1),
  summary: z.string().optional(),
  threshold: z.number().min(0).max(1).default(0.7),
  limit: z.number().int().min(1).max(20).default(5),
});
export type FindSimilarStoriesInput = z.input<typeof FindSimilarStoriesInputSchema>;

export const StorySearchResultItemSchema = z.object({
  storyId: z.string(),
  title: z.string(),
  summary: z.string(),
  status: StoryStatusSchema,
  articleType: ArticleTypeSchema,
  currentVersionNumber: z.number(),
  publishedAt: z.string().optional(),
  updatedAt: z.string(),
  topicIds: z.array(z.string()),
  entityIds: z.array(z.string()),
  sourceCount: z.number(),
  similarityScore: z.number().optional(),
});
export type StorySearchResultItem = z.infer<typeof StorySearchResultItemSchema>;

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  hasMore: boolean;
}
