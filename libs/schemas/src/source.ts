import { z } from 'zod';

export const SourceTypeSchema = z.enum([
  'NEWS_ARTICLE',
  'OFFICIAL_DOCUMENT',
  'PRESS_RELEASE',
  'ACADEMIC_PAPER',
  'DATASET',
  'INTERVIEW',
  'TRANSCRIPT',
  'OTHER',
]);
export type SourceType = z.infer<typeof SourceTypeSchema>;

export const SourceSchema = z.object({
  id: z.string().min(1),
  organizationId: z.string().min(1),
  url: z.string().url(),
  canonicalUrl: z.string().url().optional(),
  title: z.string().min(1),
  publisher: z.string().min(1),
  publisherId: z.string().optional(),
  domain: z.string().optional(),
  author: z.string().optional(),
  publishedAt: z.string().optional(),
  retrievedAt: z.string(),
  language: z.string().default('en'),
  sourceType: SourceTypeSchema.default('NEWS_ARTICLE'),
  licenseMetadata: z.string().optional(),
  permissibleExcerpt: z.string().max(1000).optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type Source = z.infer<typeof SourceSchema>;

export const CreateSourceInputSchema = z.object({
  url: z.string().url(),
  canonicalUrl: z.string().url().optional(),
  title: z.string().min(1).max(300),
  publisher: z.string().min(1).max(200),
  publisherId: z.string().optional(),
  domain: z.string().optional(),
  author: z.string().max(200).optional(),
  publishedAt: z.string().optional(),
  language: z.string().default('en'),
  sourceType: SourceTypeSchema.default('NEWS_ARTICLE'),
  licenseMetadata: z.string().optional(),
  permissibleExcerpt: z.string().max(1000).optional(),
});
export type CreateSourceInput = z.input<typeof CreateSourceInputSchema>;
export type CreateSourceOutput = z.output<typeof CreateSourceInputSchema>;

export const CitationSchema = z.object({
  id: z.string().min(1),
  organizationId: z.string().min(1),
  storyId: z.string().min(1),
  blockId: z.string().optional(),
  sourceId: z.string().min(1),
  claimText: z.string().min(1),
  confidenceScore: z.number().min(0).max(1).optional(),
  createdAt: z.string(),
});
export type Citation = z.infer<typeof CitationSchema>;

export const ClaimSchema = z.object({
  id: z.string().min(1),
  organizationId: z.string().min(1),
  claimText: z.string().min(1),
  sourceIds: z.array(z.string()).min(1),
  verifiedStatus: z.enum(['UNVERIFIED', 'VERIFIED_EXTERNAL', 'DISPUTED']).default('UNVERIFIED'),
  editorialNotes: z.string().optional(),
  createdAt: z.string(),
});
export type Claim = z.infer<typeof ClaimSchema>;
