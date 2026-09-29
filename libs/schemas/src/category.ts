import { z } from 'zod';

export const CategoryCodeSchema = z.enum([
  'top_stories',
  'world',
  'business',
  'technology',
  'science',
  'health',
  'sports',
  'entertainment',
  'india',
]);
export type CategoryCode = z.infer<typeof CategoryCodeSchema>;

export const SubCategorySchema = z.object({
  slug: z.string().min(1),
  name: z.string().min(1),
  parentCode: CategoryCodeSchema,
  description: z.string().default(''),
});
export type SubCategory = z.infer<typeof SubCategorySchema>;

export const CategorySchema = z.object({
  slug: z.string().min(1),
  name: z.string().min(1),
  code: CategoryCodeSchema,
  description: z.string().default(''),
  icon: z.string().optional(),
  sortOrder: z.number().int().default(0),
  storyCount: z.number().int().nonnegative().default(0),
  isPinned: z.boolean().default(false),
  subCategories: z.array(z.string()).default([]),
});
export type Category = z.infer<typeof CategorySchema>;

export const SpecialDeskSchema = z.object({
  id: z.string().min(1),
  slug: z.string().min(1),
  name: z.string().min(1),
  description: z.string().default(''),
  themeColor: z.string().default('#3b82f6'),
  bannerImageUrl: z.string().url().optional(),
  pinnedStoryIds: z.array(z.string()).default([]),
  liveTickerSymbol: z.string().optional(),
  activeUntil: z.string().optional(),
  isLive: z.boolean().default(true),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type SpecialDesk = z.infer<typeof SpecialDeskSchema>;

export const CreateSpecialDeskInputSchema = z.object({
  name: z.string().min(1).max(100),
  slug: z.string().min(1).max(100).optional(),
  description: z.string().max(1000).optional(),
  themeColor: z
    .string()
    .regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/)
    .default('#3b82f6')
    .optional(),
  bannerImageUrl: z.string().url().optional(),
  pinnedStoryIds: z.array(z.string()).optional().default([]),
  liveTickerSymbol: z.string().optional(),
  activeUntil: z.string().optional(),
});
export type CreateSpecialDeskInput = z.input<typeof CreateSpecialDeskInputSchema>;

export const CANONICAL_CATEGORIES: Category[] = [
  {
    slug: 'top-stories',
    code: 'top_stories',
    name: 'Top Stories',
    description: 'Latest developing stories and essential global dispatches.',
    icon: 'Star',
    sortOrder: 1,
    storyCount: 0,
    isPinned: true,
    subCategories: ['Breaking Dispatches', 'Lead Developing', 'Verified Updates'],
  },
  {
    slug: 'technology',
    code: 'technology',
    name: 'Technology',
    description: 'Artificial intelligence, semiconductors, hardware and digital policy.',
    icon: 'Cpu',
    sortOrder: 2,
    storyCount: 0,
    isPinned: true,
    subCategories: [
      'Artificial Intelligence',
      'Semiconductors',
      'Cybersecurity',
      'Quantum Computing',
      'Digital Policy',
    ],
  },
  {
    slug: 'business',
    code: 'business',
    name: 'Business',
    description: 'Financial markets, global trade, macroeconomics and enterprise earnings.',
    icon: 'TrendingUp',
    sortOrder: 3,
    storyCount: 0,
    isPinned: true,
    subCategories: [
      'Global Markets',
      'Macroeconomics',
      'Venture Capital',
      'Energy & Commodities',
      'Trade Policy',
    ],
  },
  {
    slug: 'world',
    code: 'world',
    name: 'World',
    description: 'International diplomacy, geopolitics, multilateral treaties and governance.',
    icon: 'Globe',
    sortOrder: 4,
    storyCount: 0,
    isPinned: true,
    subCategories: [
      'Diplomatic Summits',
      'Multilateral Treaties',
      'Global Governance',
      'Defense Alliances',
    ],
  },
  {
    slug: 'science',
    code: 'science',
    name: 'Science',
    description: 'Space exploration, quantum computing, renewable energy and biotechnology.',
    icon: 'Atom',
    sortOrder: 5,
    storyCount: 0,
    isPinned: false,
    subCategories: [
      'Space Exploration',
      'Climate Dynamics',
      'Renewable Systems',
      'Genomics & Biotech',
    ],
  },
  {
    slug: 'health',
    code: 'health',
    name: 'Health',
    description: 'Global epidemiology, medical breakthroughs, clinical trials and public wellness.',
    icon: 'HeartPulse',
    sortOrder: 6,
    storyCount: 0,
    isPinned: false,
    subCategories: [
      'Epidemiology',
      'Clinical Trials',
      'Medical Technology',
      'Global Health Policy',
    ],
  },
  {
    slug: 'sports',
    code: 'sports',
    name: 'Sports',
    description: 'International tournaments, championships, analytics and athletics dispatches.',
    icon: 'Trophy',
    sortOrder: 7,
    storyCount: 0,
    isPinned: false,
    subCategories: ['Championships', 'Olympic Athletics', 'Analytics & Scouting', 'Global Leagues'],
  },
  {
    slug: 'entertainment',
    code: 'entertainment',
    name: 'Entertainment',
    description: 'Cinema, streaming media, arts, culture and creative industries.',
    icon: 'Film',
    sortOrder: 8,
    storyCount: 0,
    isPinned: false,
    subCategories: [
      'Cinema & Festivals',
      'Streaming Media',
      'Cultural Exhibitions',
      'Creative Policy',
    ],
  },
  {
    slug: 'india',
    code: 'india',
    name: 'India',
    description: 'Policy, digital public infrastructure, economy and science in India.',
    icon: 'Compass',
    sortOrder: 9,
    storyCount: 0,
    isPinned: false,
    subCategories: [
      'Digital Public Infrastructure',
      'Economic Policy',
      'Space Dispatches',
      'Tech Ecosystem',
    ],
  },
];
