import { z } from 'zod';
import { StoryStatusSchema, ArticleTypeSchema } from './story';

/**
 * How a list of stories is ordered.
 *
 * The newsroom asks for different orders at different moments: the story
 * that was just edited, the story that is due to be reviewed, the alphabet.
 */
export const StorySortOrderSchema = z.enum([
  'updated_desc',
  'updated_asc',
  'created_desc',
  'created_asc',
  'title_asc',
  'title_desc',
  'status_asc',
]);
export type StorySortOrder = z.infer<typeof StorySortOrderSchema>;

export const SearchStoriesInputSchema = z.object({
  query: z.string().optional(),
  status: StoryStatusSchema.optional(),
  articleType: ArticleTypeSchema.optional(),
  topicId: z.string().optional(),
  entityId: z.string().optional(),
  sourceId: z.string().optional(),
  fromDate: z.string().optional(),
  toDate: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(500).default(20),
  offset: z.coerce.number().int().min(0).optional(),
  cursor: z.string().optional(),
  sort: StorySortOrderSchema.optional(),
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
  limit?: number;
  offset?: number;
  cursor?: string;
  nextCursor?: string;
  hasMore: boolean;
}
