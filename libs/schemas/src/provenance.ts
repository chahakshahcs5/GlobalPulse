import { z } from 'zod';

export const AIStoryProvenanceSchema = z.object({
  id: z.string(),
  storyId: z.string(),
  generatorModel: z.string().min(1),
  promptHash: z.string().min(1),
  confidenceScore: z.number().min(0).max(1),
  humanReviewedBy: z.string().optional(),
  watermarkSignature: z.string().min(1),
  c2paManifestUrl: z.string().url().optional(),
  generationTimestamp: z.string(),
  createdAt: z.string(),
});
export type AIStoryProvenance = z.infer<typeof AIStoryProvenanceSchema>;

export const RecordStoryProvenanceInputSchema = z.object({
  generatorModel: z.string().min(1),
  prompt: z.string().min(1),
  confidenceScore: z.number().min(0).max(1).default(0.95),
  humanReviewedBy: z.string().optional(),
  c2paManifestUrl: z.string().url().optional(),
});
export type RecordStoryProvenanceInput = z.infer<typeof RecordStoryProvenanceInputSchema>;
