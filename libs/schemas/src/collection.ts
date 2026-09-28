import { z } from 'zod';
import { StorySchema } from './story';

export const StoryCollectionSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  slug: z.string().min(1),
  description: z.string().optional(),
  curatorId: z.string(),
  curatorName: z.string().optional(),
  isPublic: z.boolean().default(true),
  storyIds: z.array(z.string()).default([]),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type StoryCollection = z.infer<typeof StoryCollectionSchema>;

export const StoryCollectionWithStoriesSchema = StoryCollectionSchema.extend({
  stories: z.array(StorySchema),
});
export type StoryCollectionWithStories = z.infer<typeof StoryCollectionWithStoriesSchema>;

export const CreateCollectionInputSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  isPublic: z.boolean().default(true),
  storyIds: z.array(z.string()).default([]),
});
export type CreateCollectionInput = z.infer<typeof CreateCollectionInputSchema>;

export const AddStoryToCollectionInputSchema = z.object({
  storyId: z.string().min(1),
});
export type AddStoryToCollectionInput = z.infer<typeof AddStoryToCollectionInputSchema>;
