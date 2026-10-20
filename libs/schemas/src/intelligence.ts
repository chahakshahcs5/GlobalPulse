import { z } from 'zod';

/**
 * Claim-level fact checking.
 *
 * A claim is deliberately independent of any single article revision: several
 * stories can reference the same claim, and evidence can be added over time.
 * Confidence is optional and only meaningful when its methodology is recorded.
 */
export const ClaimStatusSchema = z.enum([
  'UNVERIFIED',
  'SUPPORTED',
  'PARTIALLY_SUPPORTED',
  'CONTRADICTED',
  'UNSUPPORTED',
  'DISPUTED',
]);
export type ClaimStatus = z.infer<typeof ClaimStatusSchema>;

export const EvidenceStanceSchema = z.enum(['SUPPORTS', 'CONTRADICTS', 'CONTEXT']);
export type EvidenceStance = z.infer<typeof EvidenceStanceSchema>;

export const EvidenceTypeSchema = z.enum([
  'DOCUMENT',
  'DATASET',
  'TESTIMONY',
  'EXPERT_ANALYSIS',
  'VIDEO',
  'AUDIO',
  'IMAGE',
  'STATISTIC',
  'OTHER',
]);
export type EvidenceType = z.infer<typeof EvidenceTypeSchema>;

export const TimelineEventTypeSchema = z.enum([
  'DEVELOPMENT',
  'OFFICIAL_STATEMENT',
  'LEGAL_ACTION',
  'ELECTION',
  'DISASTER',
  'SCIENCE',
  'ECONOMIC',
  'CONFLICT',
  'OTHER',
]);
export type TimelineEventType = z.infer<typeof TimelineEventTypeSchema>;

export const PerspectiveStanceSchema = z.enum([
  'SUPPORTS',
  'OPPOSES',
  'NEUTRAL',
  'MIXED',
  'UNKNOWN',
]);
export type PerspectiveStance = z.infer<typeof PerspectiveStanceSchema>;

export const StoryClaimSchema = z.object({
  id: z.string().min(1),
  organizationId: z.string().min(1),
  storyId: z.string().min(1),
  text: z.string().min(1).max(4000),
  status: ClaimStatusSchema.default('UNVERIFIED'),
  confidence: z.number().min(0).max(1).optional(),
  /** How the confidence value was produced, e.g. "2 independent primary documents". */
  confidenceMethodology: z.string().max(1000).optional(),
  methodology: z.string().max(2000).optional(),
  reviewerId: z.string().optional(),
  reviewedAt: z.string().optional(),
  reviewNotes: z.string().max(4000).optional(),
  sourceIds: z.array(z.string()).default([]),
  citationIds: z.array(z.string()).default([]),
  createdBy: z.string().min(1),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type StoryClaim = z.infer<typeof StoryClaimSchema>;

export const CreateStoryClaimInputSchema = z
  .object({
    storyId: z.string().min(1),
    text: z.string().min(1).max(4000),
    status: ClaimStatusSchema.default('UNVERIFIED'),
    confidence: z.number().min(0).max(1).optional(),
    confidenceMethodology: z.string().max(1000).optional(),
    methodology: z.string().max(2000).optional(),
    sourceIds: z.array(z.string()).optional().default([]),
    citationIds: z.array(z.string()).optional().default([]),
  })
  .refine((v) => v.confidence === undefined || Boolean(v.confidenceMethodology?.trim()), {
    message: 'confidenceMethodology is required when a confidence value is supplied',
    path: ['confidenceMethodology'],
  });
export type CreateStoryClaimInput = z.input<typeof CreateStoryClaimInputSchema>;

export const UpdateClaimStatusInputSchema = z
  .object({
    status: ClaimStatusSchema,
    confidence: z.number().min(0).max(1).optional(),
    confidenceMethodology: z.string().max(1000).optional(),
    methodology: z.string().max(2000).optional(),
    reviewNotes: z.string().max(4000).optional(),
    sourceIds: z.array(z.string()).optional(),
    citationIds: z.array(z.string()).optional(),
  })
  .refine((v) => v.confidence === undefined || Boolean(v.confidenceMethodology?.trim()), {
    message: 'confidenceMethodology is required when a confidence value is supplied',
    path: ['confidenceMethodology'],
  });
export type UpdateClaimStatusInput = z.infer<typeof UpdateClaimStatusInputSchema>;

export const EvidenceSchema = z.object({
  id: z.string().min(1),
  organizationId: z.string().min(1),
  storyId: z.string().min(1),
  claimId: z.string().optional(),
  sourceId: z.string().optional(),
  citationId: z.string().optional(),
  type: EvidenceTypeSchema.default('OTHER'),
  title: z.string().min(1).max(300),
  description: z.string().max(4000).optional(),
  url: z.string().url().optional(),
  excerpt: z.string().max(10000).optional(),
  stance: EvidenceStanceSchema.default('CONTEXT'),
  strength: z.number().min(0).max(1).optional(),
  methodology: z.string().max(2000).optional(),
  retrievedAt: z.string().optional(),
  publishedAt: z.string().optional(),
  createdBy: z.string().min(1),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type Evidence = z.infer<typeof EvidenceSchema>;

export const CreateEvidenceInputSchema = z.object({
  storyId: z.string().min(1),
  claimId: z.string().optional(),
  sourceId: z.string().optional(),
  citationId: z.string().optional(),
  type: EvidenceTypeSchema.default('OTHER'),
  title: z.string().min(1).max(300),
  description: z.string().max(4000).optional(),
  url: z.string().url().optional(),
  excerpt: z.string().max(10000).optional(),
  stance: EvidenceStanceSchema.default('CONTEXT'),
  strength: z.number().min(0).max(1).optional(),
  methodology: z.string().max(2000).optional(),
  retrievedAt: z.string().optional(),
  publishedAt: z.string().optional(),
});
export type CreateEvidenceInput = z.input<typeof CreateEvidenceInputSchema>;

export const StoryTimelineEventSchema = z.object({
  id: z.string().min(1),
  organizationId: z.string().min(1),
  storyId: z.string().min(1),
  title: z.string().min(1).max(300),
  description: z.string().min(1).max(5000),
  eventType: TimelineEventTypeSchema.default('DEVELOPMENT'),
  occurredAt: z.string(),
  location: z.string().max(300).optional(),
  coordinates: z.tuple([z.number(), z.number()]).optional(),
  entityIds: z.array(z.string()).default([]),
  sourceIds: z.array(z.string()).default([]),
  citationIds: z.array(z.string()).default([]),
  mediaUrl: z.string().url().optional(),
  authorId: z.string().min(1),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type StoryTimelineEvent = z.infer<typeof StoryTimelineEventSchema>;

export const CreateTimelineEventInputSchema = z.object({
  storyId: z.string().min(1),
  title: z.string().min(1).max(300),
  description: z.string().min(1).max(5000),
  eventType: TimelineEventTypeSchema.default('DEVELOPMENT'),
  occurredAt: z.string().optional(),
  location: z.string().max(300).optional(),
  coordinates: z.tuple([z.number(), z.number()]).optional(),
  entityIds: z.array(z.string()).optional().default([]),
  sourceIds: z.array(z.string()).optional().default([]),
  citationIds: z.array(z.string()).optional().default([]),
  mediaUrl: z.string().url().optional(),
});
export type CreateTimelineEventInput = z.input<typeof CreateTimelineEventInputSchema>;

export const UpdateTimelineEventInputSchema = CreateTimelineEventInputSchema.omit({
  storyId: true,
})
  .partial()
  .extend({ id: z.string().min(1) });
export type UpdateTimelineEventInput = z.infer<typeof UpdateTimelineEventInputSchema>;

export const EditorialPerspectiveSchema = z.object({
  id: z.string().min(1),
  organizationId: z.string().min(1),
  storyId: z.string().min(1),
  label: z.string().min(1).max(200),
  summary: z.string().min(1).max(5000),
  stance: PerspectiveStanceSchema.default('UNKNOWN'),
  sourceIds: z.array(z.string()).default([]),
  citationIds: z.array(z.string()).default([]),
  quoteExcerpt: z.string().max(2000).optional(),
  createdBy: z.string().min(1),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type EditorialPerspective = z.infer<typeof EditorialPerspectiveSchema>;

export const CreateEditorialPerspectiveInputSchema = z.object({
  storyId: z.string().min(1),
  label: z.string().min(1).max(200),
  summary: z.string().min(1).max(5000),
  stance: PerspectiveStanceSchema.default('UNKNOWN'),
  sourceIds: z.array(z.string()).optional().default([]),
  citationIds: z.array(z.string()).optional().default([]),
  quoteExcerpt: z.string().max(2000).optional(),
});
export type CreateEditorialPerspectiveInput = z.input<typeof CreateEditorialPerspectiveInputSchema>;

export const StoryChangeItemSchema = z.object({
  changeType: z.enum(['added', 'updated', 'corrected', 'retracted']),
  description: z.string().min(1),
  affectedSection: z.string().optional(),
  occurredAt: z.string().optional(),
  sourceIds: z.array(z.string()).optional(),
});
export type StoryChangeItem = z.infer<typeof StoryChangeItemSchema>;

export const StoryWhatChangedSchema = z.object({
  storyId: z.string().min(1),
  previousVersionNumber: z.number().int().nonnegative(),
  currentVersionNumber: z.number().int().positive(),
  updatedAt: z.string(),
  latestDevelopment: StoryTimelineEventSchema.optional(),
  items: z.array(StoryChangeItemSchema),
  affectedEntityIds: z.array(z.string()).default([]),
  supportingSourceIds: z.array(z.string()).default([]),
});
export type StoryWhatChanged = z.infer<typeof StoryWhatChangedSchema>;

export const StoryIntelligenceMetricsSchema = z.object({
  sourceCount: z.number().int().nonnegative(),
  claimCount: z.number().int().nonnegative(),
  supportedClaimCount: z.number().int().nonnegative(),
  contestedClaimCount: z.number().int().nonnegative(),
  evidenceCount: z.number().int().nonnegative(),
  timelineEventCount: z.number().int().nonnegative(),
  perspectiveCount: z.number().int().nonnegative(),
  updateCount: z.number().int().nonnegative(),
});
export type StoryIntelligenceMetrics = z.infer<typeof StoryIntelligenceMetricsSchema>;

export const ClaimWithEvidenceSchema = StoryClaimSchema.extend({
  evidence: z.array(EvidenceSchema).default([]),
});
export type ClaimWithEvidence = z.infer<typeof ClaimWithEvidenceSchema>;

export const StoryIntelligenceSchema = z.object({
  storyId: z.string().min(1),
  organizationId: z.string().min(1),
  title: z.string().min(1),
  summary: z.string().min(1),
  status: z.string().min(1),
  claims: z.array(ClaimWithEvidenceSchema),
  evidence: z.array(EvidenceSchema),
  timeline: z.array(StoryTimelineEventSchema),
  perspectives: z.array(EditorialPerspectiveSchema),
  whatChanged: StoryWhatChangedSchema,
  metrics: StoryIntelligenceMetricsSchema,
});
export type StoryIntelligence = z.infer<typeof StoryIntelligenceSchema>;

/**
 * Statuses that require at least one piece of supporting or contradicting
 * evidence. Enforced in the domain service so every entry point (REST, MCP,
 * GraphQL, background ingestion) gets the same guarantee.
 */
export const EVIDENCE_REQUIRED_CLAIM_STATUSES: ReadonlySet<ClaimStatus> = new Set([
  'SUPPORTED',
  'PARTIALLY_SUPPORTED',
  'CONTRADICTED',
]);

export function severityRank(value: string): number {
  switch (value.toUpperCase()) {
    case 'CRITICAL':
      return 4;
    case 'MAJOR':
    case 'HIGH':
    case 'URGENT':
      return 3;
    case 'MODERATE':
    case 'MEDIUM':
      return 2;
    case 'LOW':
    case 'INFO':
      return 1;
    default:
      return 0;
  }
}
