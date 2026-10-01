import { z } from 'zod';
import { SourceSchema } from './source';

export const PublisherCategorySchema = z.enum([
  'general',
  'technology',
  'business',
  'science',
  'politics',
  'opinion',
  'world',
  'official',
]);
export type PublisherCategory = z.infer<typeof PublisherCategorySchema>;

export const PublisherSchema = z.object({
  id: z.string().min(1),
  organizationId: z.string().min(1),
  name: z.string().min(1),
  slug: z.string().min(1),
  domain: z.string().min(1),
  logoUrl: z.string().optional(),
  description: z.string().optional(),
  category: z.string().default('general'),
  country: z.string().optional(),
  language: z.string().default('en'),
  websiteUrl: z.string().url().optional(),
  biasRating: z.string().optional(),
  credibilityScore: z.number().min(0).max(100).optional(),
  isVerified: z.boolean().default(true),
  followerCount: z.number().int().nonnegative().default(0),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type Publisher = z.infer<typeof PublisherSchema>;

export const CreatePublisherInputSchema = z.object({
  name: z.string().min(1).max(200),
  domain: z.string().min(1).max(200),
  slug: z.string().max(200).optional(),
  logoUrl: z.string().optional(),
  description: z.string().max(3000).optional(),
  category: z.string().default('general'),
  country: z.string().max(100).optional(),
  language: z.string().default('en'),
  websiteUrl: z.string().url().optional(),
  biasRating: z.string().max(100).optional(),
  credibilityScore: z.number().min(0).max(100).optional(),
  isVerified: z.boolean().default(true),
});
export type CreatePublisherInput = z.input<typeof CreatePublisherInputSchema>;
export type CreatePublisherOutput = z.output<typeof CreatePublisherInputSchema>;

export const PublisherStoryRefSchema = z.object({
  id: z.string().min(1),
  slug: z.string().min(1),
  title: z.string().min(1),
  summary: z.string(),
  publishedAt: z.string().optional(),
  articleType: z.string(),
  heroImageUrl: z.string().optional(),
});
export type PublisherStoryRef = z.infer<typeof PublisherStoryRefSchema>;

export const PublisherProfileSchema = z.object({
  publisher: PublisherSchema,
  citedArticles: z.array(SourceSchema),
  referencingStories: z.array(PublisherStoryRefSchema),
  followerCount: z.number().int().nonnegative(),
  isFollowing: z.boolean().optional(),
});
export type PublisherProfile = z.infer<typeof PublisherProfileSchema>;
