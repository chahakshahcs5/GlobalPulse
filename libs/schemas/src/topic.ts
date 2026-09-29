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
export type CreateTopicInput = z.input<typeof CreateTopicInputSchema>;
export type CreateTopicOutput = z.output<typeof CreateTopicInputSchema>;

export const TopicSentimentStatsSchema = z.object({
  positive: z.number().nonnegative().default(0),
  cautious: z.number().nonnegative().default(0),
  critical: z.number().nonnegative().default(0),
  neutral: z.number().nonnegative().default(0),
});
export type TopicSentimentStats = z.infer<typeof TopicSentimentStatsSchema>;

export const TopicTimelineMilestoneSchema = z.object({
  date: z.string().min(1),
  headline: z.string().min(1),
  storyId: z.string().optional(),
  storySlug: z.string().optional(),
  sourcePublisher: z.string().optional(),
});
export type TopicTimelineMilestone = z.infer<typeof TopicTimelineMilestoneSchema>;

export const TopicKnowledgeGraphNodeSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  slug: z.string().min(1),
  storyCount: z.number().int().nonnegative().default(0),
  category: z.string().optional(),
});
export type TopicKnowledgeGraphNode = z.infer<typeof TopicKnowledgeGraphNodeSchema>;

export const TopicKnowledgeGraphEdgeSchema = z.object({
  source: z.string().min(1),
  target: z.string().min(1),
  weight: z.number().positive().default(1),
});
export type TopicKnowledgeGraphEdge = z.infer<typeof TopicKnowledgeGraphEdgeSchema>;

export const TopicKnowledgeGraphSchema = z.object({
  nodes: z.array(TopicKnowledgeGraphNodeSchema),
  edges: z.array(TopicKnowledgeGraphEdgeSchema),
});
export type TopicKnowledgeGraph = z.infer<typeof TopicKnowledgeGraphSchema>;

export const TopicDossierSchema = z.object({
  topic: TopicSchema,
  storyCount: z.number().int().nonnegative(),
  timeline: z.array(TopicTimelineMilestoneSchema),
  sentiment: TopicSentimentStatsSchema,
  keyEntities: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      type: z.string(),
      avatarUrl: z.string().url().optional(),
    })
  ),
  relatedTopics: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      slug: z.string(),
      coOccurrenceCount: z.number(),
    })
  ),
});
export type TopicDossier = z.infer<typeof TopicDossierSchema>;
