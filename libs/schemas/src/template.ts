import { z } from 'zod';
import { StoryBlockSchema } from './blocks';
import { ArticleTypeSchema } from './story';

export const ContentTemplateSchema = z.object({
  id: z.string(),
  name: z.string(),
  articleType: ArticleTypeSchema,
  description: z.string(),
  suggestedCategory: z.string(),
  defaultBlocks: z.array(StoryBlockSchema),
  promptGuidance: z.string(),
});
export type ContentTemplate = z.infer<typeof ContentTemplateSchema>;

export const InstantiateTemplateInputSchema = z.object({
  templateId: z.string().min(1),
  title: z.string().min(1),
  summary: z.string().min(1),
  topicIds: z.array(z.string()).default([]),
  entityIds: z.array(z.string()).default([]),
  category: z.string().optional(),
  heroImageUrl: z.string().url().optional(),
});
export type InstantiateTemplateInput = z.infer<typeof InstantiateTemplateInputSchema>;
