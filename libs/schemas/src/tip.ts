import { z } from 'zod';

export const CitizenTipUrgencySchema = z.enum(['routine', 'elevated', 'breaking']);
export type CitizenTipUrgency = z.infer<typeof CitizenTipUrgencySchema>;

export const CitizenTipStatusSchema = z.enum([
  'received',
  'under_review',
  'verified_developing',
  'dismissed',
]);
export type CitizenTipStatus = z.infer<typeof CitizenTipStatusSchema>;

export const CitizenTipAnonymitySchema = z.enum(['full_anonymous', 'confidential_source']);
export type CitizenTipAnonymity = z.infer<typeof CitizenTipAnonymitySchema>;

export const CitizenTipAttachmentSchema = z.object({
  filename: z.string().min(1),
  mimeType: z.string().min(1),
  sizeBytes: z.number().int().positive(),
  checksumSha256: z.string().min(1),
});
export type CitizenTipAttachment = z.infer<typeof CitizenTipAttachmentSchema>;

export const CitizenTipSchema = z.object({
  id: z.string().min(1),
  organizationId: z.string().min(1),
  headline: z.string().min(1).max(300),
  details: z.string().min(1).max(10000),
  category: z.string().min(1).default('general'),
  urgency: CitizenTipUrgencySchema.default('routine'),
  anonymityMode: CitizenTipAnonymitySchema.default('full_anonymous'),
  verificationChecksum: z.string().min(8),
  contactAlias: z.string().max(100).optional(),
  attachments: z.array(CitizenTipAttachmentSchema).default([]),
  status: CitizenTipStatusSchema.default('received'),
  editorialNotes: z.string().max(2000).optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type CitizenTip = z.infer<typeof CitizenTipSchema>;

export const SubmitCitizenTipInputSchema = z.object({
  headline: z.string().min(1, 'Headline is required').max(300),
  details: z.string().min(1, 'Details are required').max(10000),
  category: z.string().min(1).default('general'),
  urgency: CitizenTipUrgencySchema.default('routine'),
  anonymityMode: CitizenTipAnonymitySchema.default('full_anonymous'),
  verificationChecksum: z.string().min(8),
  contactAlias: z.string().max(100).optional(),
  attachments: z.array(CitizenTipAttachmentSchema).optional().default([]),
});
export type SubmitCitizenTipInput = z.input<typeof SubmitCitizenTipInputSchema>;

export const ReviewCitizenTipInputSchema = z.object({
  status: CitizenTipStatusSchema,
  editorialNotes: z.string().max(2000).optional(),
});
export type ReviewCitizenTipInput = z.infer<typeof ReviewCitizenTipInputSchema>;
