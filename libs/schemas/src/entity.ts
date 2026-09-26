import { z } from 'zod';

export const EntityTypeSchema = z.enum([
  'PERSON',
  'ORGANIZATION',
  'COUNTRY',
  'LOCATION',
  'TECHNOLOGY',
  'PRODUCT',
  'INSTITUTION',
]);
export type EntityType = z.infer<typeof EntityTypeSchema>;

export const EntitySchema = z.object({
  id: z.string().min(1),
  organizationId: z.string().min(1),
  name: z.string().min(1),
  slug: z.string().min(1),
  type: EntityTypeSchema,
  description: z.string().optional(),
  aliases: z.array(z.string()).default([]),
  avatarUrl: z.string().url().optional(),
  metadata: z.record(z.unknown()).optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type Entity = z.infer<typeof EntitySchema>;

export const CreateEntityInputSchema = z.object({
  name: z.string().min(1).max(200),
  type: EntityTypeSchema,
  description: z.string().max(2000).optional(),
  aliases: z.array(z.string()).optional().default([]),
  avatarUrl: z.string().url().optional(),
  metadata: z.record(z.unknown()).optional(),
});
export type CreateEntityInput = z.infer<typeof CreateEntityInputSchema>;
