import { z } from 'zod';

export const FactCheckRatingSchema = z.enum([
  'TRUE',
  'MOSTLY_TRUE',
  'MIXTURE',
  'MOSTLY_FALSE',
  'FALSE',
  'UNVERIFIED',
]);
export type FactCheckRating = z.infer<typeof FactCheckRatingSchema>;

export const FactCheckClaimSchema = z.object({
  id: z.string(),
  claim: z.string(),
  claimant: z.string(),
  rating: FactCheckRatingSchema,
  summary: z.string(),
  checker: z.string(),
  sources: z.array(z.string()).default([]),
  url: z.string().optional(),
  checkedAt: z.string(),
});
export type FactCheckClaim = z.infer<typeof FactCheckClaimSchema>;

export const CredibilityFactorSchema = z.object({
  factor: z.string(),
  impact: z.number(),
  description: z.string(),
});
export type CredibilityFactor = z.infer<typeof CredibilityFactorSchema>;

export const StoryCredibilityAssessmentSchema = z.object({
  storyId: z.string(),
  score: z.number().min(0).max(100),
  level: z.enum(['high', 'medium', 'low']),
  factors: z.array(CredibilityFactorSchema),
  claims: z.array(FactCheckClaimSchema).default([]),
  evaluatedAt: z.string(),
});
export type StoryCredibilityAssessment = z.infer<typeof StoryCredibilityAssessmentSchema>;

export const DuplicateMatchSchema = z.object({
  storyId: z.string(),
  title: z.string(),
  similarityPercentage: z.number(),
  sharedPhrases: z.array(z.string()),
});
export type DuplicateMatch = z.infer<typeof DuplicateMatchSchema>;

export const DuplicateCheckResultSchema = z.object({
  isDuplicate: z.boolean(),
  maxSimilarity: z.number(),
  recommendation: z.enum(['allow', 'review_required', 'reject']),
  matches: z.array(DuplicateMatchSchema),
  checkedAt: z.string(),
});
export type DuplicateCheckResult = z.infer<typeof DuplicateCheckResultSchema>;

export const CheckDuplicateInputSchema = z.object({
  title: z.string().min(1),
  content: z.string().min(1),
  storyIdToExclude: z.string().optional(),
  threshold: z.number().min(0).max(100).default(75).optional(),
});
export type CheckDuplicateInput = z.infer<typeof CheckDuplicateInputSchema>;
