import { z } from 'zod';

export const RegionalEditionCodeSchema = z.enum([
  'global',
  'us',
  'uk',
  'eu',
  'in',
  'apac',
]);
export type RegionalEditionCode = z.infer<typeof RegionalEditionCodeSchema>;

export const RegionalEditionSchema = z.object({
  code: RegionalEditionCodeSchema,
  name: z.string(),
  country: z.string(),
  defaultLanguage: z.string(),
  currency: z.string(),
  timezone: z.string(),
});
export type RegionalEdition = z.infer<typeof RegionalEditionSchema>;

export const SUPPORTED_REGIONAL_EDITIONS: RegionalEdition[] = [
  { code: 'global', name: 'Global Edition (International)', country: 'WW', defaultLanguage: 'en', currency: 'USD', timezone: 'UTC' },
  { code: 'us', name: 'United States Edition', country: 'US', defaultLanguage: 'en', currency: 'USD', timezone: 'America/New_York' },
  { code: 'uk', name: 'United Kingdom Edition', country: 'GB', defaultLanguage: 'en', currency: 'GBP', timezone: 'Europe/London' },
  { code: 'eu', name: 'European Union Edition', country: 'EU', defaultLanguage: 'en', currency: 'EUR', timezone: 'Europe/Brussels' },
  { code: 'in', name: 'India Edition', country: 'IN', defaultLanguage: 'en', currency: 'INR', timezone: 'Asia/Kolkata' },
  { code: 'apac', name: 'Asia-Pacific Edition', country: 'SG', defaultLanguage: 'en', currency: 'SGD', timezone: 'Asia/Singapore' },
];

export const StoryLocalizationSchema = z.object({
  id: z.string(),
  storyId: z.string(),
  locale: z.string(),
  region: RegionalEditionCodeSchema.optional(),
  title: z.string(),
  summary: z.string(),
  createdAt: z.string(),
});
export type StoryLocalization = z.infer<typeof StoryLocalizationSchema>;
