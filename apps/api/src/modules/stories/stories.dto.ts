import { z } from 'zod';
import {
  CreateStoryInputSchema,
  UpdateStoryInputSchema,
  CreateStoryVersionInputSchema,
  SearchStoriesInputSchema,
} from '@ai-news/schemas';

export const StoryFilterSchema = SearchStoriesInputSchema;
export type StoryFilter = z.infer<typeof StoryFilterSchema>;

export { CreateStoryInputSchema, UpdateStoryInputSchema, CreateStoryVersionInputSchema };

export const PublishStoryInputSchema = z.object({
  idempotencyKey: z.string().optional(),
});

export type PublishStoryInput = z.infer<typeof PublishStoryInputSchema>;

export const ReorderBlocksInputSchema = z.object({
  blockIds: z.array(z.string().min(1)),
});

export type ReorderBlocksInput = z.infer<typeof ReorderBlocksInputSchema>;
