import { z } from 'zod';

export const TopicSchema = z.object({
  id: z.string().min(1),
  organizationId: z.string().min(1),
  slug: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  aliases: z.array(z.string()).default([]),
  parentTopicId: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type Topic = z.infer<typeof TopicSchema>;

export const CreateTopicInputSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(1000).optional(),
  aliases: z.array(z.string()).optional().default([]),
  parentTopicId: z.string().optional(),
});
export type CreateTopicInput = z.infer<typeof CreateTopicInputSchema>;
