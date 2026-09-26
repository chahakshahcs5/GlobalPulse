import { z } from 'zod';
import {
  CreateStoryInputSchema,
  UpdateStoryInputSchema,
  CreateStoryVersionInputSchema,
  StoryFilterSchema,
} from '@ai-news/schemas';

export {
  CreateStoryInputSchema,
  UpdateStoryInputSchema,
  CreateStoryVersionInputSchema,
  StoryFilterSchema,
};

export const PublishStoryInputSchema = z.object({
  idempotencyKey: z.string().optional(),
});

export type PublishStoryInput = z.infer<typeof PublishStoryInputSchema>;

export const ReorderBlocksInputSchema = z.object({
  blockIds: z.array(z.string().min(1)),
});

export type ReorderBlocksInput = z.infer<typeof ReorderBlocksInputSchema>;
