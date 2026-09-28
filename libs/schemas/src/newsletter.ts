import { z } from 'zod';

export const NewsletterSubscriptionSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  frequency: z.enum(['daily', 'weekly']),
  categories: z.array(z.string()),
  active: z.boolean().default(true),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type NewsletterSubscription = z.infer<typeof NewsletterSubscriptionSchema>;

export const SubscribeNewsletterInputSchema = z.object({
  email: z.string().email(),
  frequency: z.enum(['daily', 'weekly']).default('daily'),
  categories: z.array(z.string()).default([]),
});
export type SubscribeNewsletterInput = z.infer<typeof SubscribeNewsletterInputSchema>;

export const UnsubscribeNewsletterInputSchema = z.object({
  email: z.string().email(),
});
export type UnsubscribeNewsletterInput = z.infer<typeof UnsubscribeNewsletterInputSchema>;

export const NewsletterDigestStorySchema = z.object({
  id: z.string(),
  title: z.string(),
  summary: z.string(),
  url: z.string(),
  category: z.string(),
  publishedAt: z.string(),
});
export type NewsletterDigestStory = z.infer<typeof NewsletterDigestStorySchema>;

export const NewsletterDigestSchema = z.object({
  id: z.string(),
  frequency: z.enum(['daily', 'weekly']),
  date: z.string(),
  category: z.string().optional(),
  headline: z.string(),
  curatedStoryIds: z.array(z.string()),
  stories: z.array(NewsletterDigestStorySchema),
  generatedAt: z.string(),
});
export type NewsletterDigest = z.infer<typeof NewsletterDigestSchema>;

export const GenerateDigestInputSchema = z.object({
  frequency: z.enum(['daily', 'weekly']).default('daily'),
  category: z.string().optional(),
  targetDate: z.string().optional(),
});
export type GenerateDigestInput = z.infer<typeof GenerateDigestInputSchema>;
