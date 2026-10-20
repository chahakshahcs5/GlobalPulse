import { z } from 'zod';

export const GraphNodeTypeSchema = z.enum([
  'PERSON',
  'ORGANIZATION',
  'COMPANY',
  'COUNTRY',
  'TECHNOLOGY',
  'PRODUCT',
  'INSTITUTION',
  'ENTITY',
  'PUBLISHER',
  'SOURCE',
  'STORY',
  'EVENT',
  'TOPIC',
  'LOCATION',
  'CLAIM',
  'EVIDENCE',
  'CITATION',
]);
export type GraphNodeType = z.infer<typeof GraphNodeTypeSchema>;

export const GraphRelationSchema = z.enum([
  'works_for',
  'mentioned_in',
  'covers',
  'mentions',
  'supported_by',
  'contradicted_by',
  'originates_from',
  'published_by',
  'located_at',
  'part_of',
  'related_to',
  'has_claim',
  'has_evidence',
  'cites',
  'follows',
  'occurred_at',
  'custom',
]);
export type GraphRelation = z.infer<typeof GraphRelationSchema>;

export const KnowledgeEdgeSchema = z.object({
  id: z.string().min(1),
  organizationId: z.string().min(1),
  fromType: GraphNodeTypeSchema,
  fromId: z.string().min(1),
  relation: GraphRelationSchema,
  toType: GraphNodeTypeSchema,
  toId: z.string().min(1),
  weight: z.number().min(0).max(1).default(1),
  metadata: z.record(z.unknown()).optional(),
  createdAt: z.string(),
});
export type KnowledgeEdge = z.infer<typeof KnowledgeEdgeSchema>;

export const CreateKnowledgeEdgeInputSchema = z.object({
  fromType: GraphNodeTypeSchema,
  fromId: z.string().min(1),
  relation: GraphRelationSchema,
  toType: GraphNodeTypeSchema,
  toId: z.string().min(1),
  weight: z.number().min(0).max(1).optional().default(1),
  metadata: z.record(z.unknown()).optional(),
});
export type CreateKnowledgeEdgeInput = z.input<typeof CreateKnowledgeEdgeInputSchema>;

export const GraphNodeSchema = z.object({
  type: GraphNodeTypeSchema,
  id: z.string().min(1),
  label: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
});
export type GraphNode = z.infer<typeof GraphNodeSchema>;

export const GraphTraversalSchema = z.object({
  root: GraphNodeSchema,
  depth: z.number().int().min(0).max(5),
  nodes: z.array(GraphNodeSchema),
  edges: z.array(KnowledgeEdgeSchema),
  truncated: z.boolean().default(false),
});
export type GraphTraversal = z.infer<typeof GraphTraversalSchema>;

export const GraphQueryInputSchema = z.object({
  nodeType: GraphNodeTypeSchema.optional(),
  nodeId: z.string().optional(),
  relation: GraphRelationSchema.optional(),
  query: z.string().max(300).optional(),
  depth: z.number().int().min(0).max(5).optional().default(1),
  limit: z.number().int().min(1).max(500).optional().default(100),
});
export type GraphQueryInput = z.infer<typeof GraphQueryInputSchema>;
