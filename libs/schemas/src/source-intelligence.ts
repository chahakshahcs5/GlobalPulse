import { z } from 'zod';

export const CorrectionTypeSchema = z.enum(['CORRECTION', 'RETRACTION', 'CLARIFICATION', 'UPDATE']);
export type CorrectionType = z.infer<typeof CorrectionTypeSchema>;

export const SourceCorrectionSchema = z.object({
  id: z.string().min(1),
  organizationId: z.string().min(1),
  publisherId: z.string().optional(),
  sourceId: z.string().optional(),
  storyId: z.string().optional(),
  type: CorrectionTypeSchema,
  description: z.string().min(1).max(4000),
  issuedAt: z.string(),
  url: z.string().url().optional(),
  recordedBy: z.string().min(1),
  createdAt: z.string(),
});
export type SourceCorrection = z.infer<typeof SourceCorrectionSchema>;

export const CreateSourceCorrectionInputSchema = z.object({
  publisherId: z.string().optional(),
  sourceId: z.string().optional(),
  storyId: z.string().optional(),
  type: CorrectionTypeSchema,
  description: z.string().min(1).max(4000),
  issuedAt: z.string().optional(),
  url: z.string().url().optional(),
});
export type CreateSourceCorrectionInput = z.infer<typeof CreateSourceCorrectionInputSchema>;

export const SourceIntelligenceMetricsSchema = z.object({
  sourceCount: z.number().int().nonnegative(),
  citedSourceCount: z.number().int().nonnegative(),
  citationCount: z.number().int().nonnegative(),
  storyCount: z.number().int().nonnegative(),
  correctionCount: z.number().int().nonnegative(),
  retractionCount: z.number().int().nonnegative(),
  correctionRate: z.number().min(0).max(1),
  languages: z.record(z.number()),
  sourceTypes: z.record(z.number()),
  coverageAreas: z.array(z.object({ topicId: z.string(), storyCount: z.number() })),
  lastPublishedAt: z.string().optional(),
});
export type SourceIntelligenceMetrics = z.infer<typeof SourceIntelligenceMetricsSchema>;

export const SourceIntelligenceSchema = z.object({
  publisher: z.object({
    id: z.string(),
    name: z.string(),
    slug: z.string(),
    domain: z.string(),
    description: z.string().optional(),
    country: z.string().optional(),
    language: z.string(),
    websiteUrl: z.string().optional(),
    ownership: z.string().optional(),
    methodology: z.string().optional(),
    correctionPolicyUrl: z.string().optional(),
    foundedYear: z.number().int().optional(),
    isVerified: z.boolean(),
  }),
  metrics: SourceIntelligenceMetricsSchema,
  corrections: z.array(SourceCorrectionSchema),
  sources: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      url: z.string(),
      sourceType: z.string(),
      publishedAt: z.string().optional(),
      retrievedAt: z.string(),
    })
  ),
  methodologyNotes: z.array(z.string()).default([]),
});
export type SourceIntelligence = z.infer<typeof SourceIntelligenceSchema>;
