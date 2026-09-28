import { z } from 'zod';

export const BaseBlockSchema = z.object({
  id: z.string().min(1),
  blockType: z.string(),
  sortOrder: z.number().int().nonnegative(),
  metadata: z.record(z.unknown()).optional(),
  citationIds: z.array(z.string()).optional(),
});

export const HeadingBlockSchema = BaseBlockSchema.extend({
  blockType: z.literal('heading'),
  data: z.object({
    level: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]),
    text: z.string().min(1),
    subtext: z.string().optional(),
  }),
});

export const ParagraphBlockSchema = BaseBlockSchema.extend({
  blockType: z.literal('paragraph'),
  data: z.object({
    text: z.string().min(1),
    format: z.enum(['markdown', 'plain']).default('markdown'),
  }),
});

export const SummaryBlockSchema = BaseBlockSchema.extend({
  blockType: z.literal('summary'),
  data: z.object({
    headline: z.string().min(1),
    bulletPoints: z.array(z.string()).min(1),
    sentiment: z.enum(['neutral', 'positive', 'cautious', 'critical']).optional(),
  }),
});

export const QuoteBlockSchema = BaseBlockSchema.extend({
  blockType: z.literal('quote'),
  data: z.object({
    quote: z.string().min(1),
    attribution: z.string().min(1),
    title: z.string().optional(),
    avatarUrl: z.string().url().optional(),
    sourceUrl: z.string().url().optional(),
  }),
});

export const ImageBlockSchema = BaseBlockSchema.extend({
  blockType: z.literal('image'),
  data: z.object({
    url: z.string().url(),
    altText: z.string().min(1),
    caption: z.string().optional(),
    aspectRatio: z.enum(['16:9', '4:3', '1:1', '9:16', '21:9']).default('16:9'),
    credit: z.string().optional(),
    sourceAttribution: z.string().optional(),
  }),
});

export const GalleryBlockSchema = BaseBlockSchema.extend({
  blockType: z.literal('gallery'),
  data: z.object({
    title: z.string().optional(),
    images: z
      .array(
        z.object({
          url: z.string().url(),
          altText: z.string().min(1),
          caption: z.string().optional(),
          credit: z.string().optional(),
        })
      )
      .min(2),
  }),
});

export const ChartBlockSchema = BaseBlockSchema.extend({
  blockType: z.literal('chart'),
  data: z.object({
    chartType: z.enum([
      'line',
      'area',
      'bar',
      'stacked_bar',
      'grouped_bar',
      'scatter',
      'heatmap',
      'histogram',
      'waterfall',
      'donut',
      'kpi',
      'comparison',
      'slope',
    ]),
    title: z.string().min(1),
    subtitle: z.string().optional(),
    caption: z.string().optional(),
    xAxis: z.object({
      key: z.string().min(1),
      label: z.string().min(1),
      type: z.enum(['category', 'time', 'linear']).optional(),
    }),
    yAxis: z.object({
      label: z.string().min(1),
      unit: z.string().optional(),
      format: z.string().optional(),
      min: z.number().optional(),
      max: z.number().optional(),
    }),
    series: z
      .array(
        z.object({
          name: z.string().min(1),
          key: z.string().min(1),
          color: z.string().optional(),
        })
      )
      .min(1),
    values: z.array(z.record(z.unknown())).min(1),
    sourceAttribution: z.string().optional(),
  }),
});

export const TableBlockSchema = BaseBlockSchema.extend({
  blockType: z.literal('table'),
  data: z.object({
    title: z.string().optional(),
    headers: z.array(z.string()).min(1),
    rows: z.array(z.array(z.string())).min(1),
    footer: z.string().optional(),
  }),
});

export const TimelineBlockSchema = BaseBlockSchema.extend({
  blockType: z.literal('timeline'),
  data: z.object({
    title: z.string().optional(),
    items: z
      .array(
        z.object({
          date: z.string().min(1),
          headline: z.string().min(1),
          body: z.string().min(1),
          entityIds: z.array(z.string()).optional(),
          sourceIds: z.array(z.string()).optional(),
          mediaUrl: z.string().url().optional(),
        })
      )
      .min(1),
  }),
});

export const MapBlockSchema = BaseBlockSchema.extend({
  blockType: z.literal('map'),
  data: z.object({
    title: z.string().optional(),
    center: z.tuple([z.number(), z.number()]), // [lng, lat]
    zoom: z.number().min(0).max(22),
    style: z.enum(['dark', 'light', 'satellite', 'streets']).default('dark'),
    markers: z
      .array(
        z.object({
          coordinates: z.tuple([z.number(), z.number()]),
          title: z.string().min(1),
          description: z.string().optional(),
          icon: z.string().optional(),
        })
      )
      .optional(),
    layers: z
      .array(
        z.object({
          id: z.string().min(1),
          type: z.enum(['fill', 'line', 'circle', 'heatmap']),
          geojson: z.record(z.unknown()),
        })
      )
      .optional(),
  }),
});

export const DiagramBlockSchema = BaseBlockSchema.extend({
  blockType: z.literal('diagram'),
  data: z.object({
    title: z.string().optional(),
    format: z.enum(['mermaid', 'svg_declarative', 'flowchart', 'sequence']).default('mermaid'),
    definition: z.string().min(1),
    caption: z.string().optional(),
  }),
});

export const FlowBlockSchema = BaseBlockSchema.extend({
  blockType: z.literal('flow'),
  data: z.object({
    title: z.string().optional(),
    steps: z
      .array(
        z.object({
          stepNumber: z.number().int(),
          title: z.string().min(1),
          description: z.string().min(1),
          status: z.enum(['pending', 'active', 'completed', 'blocked']).optional(),
        })
      )
      .min(2),
  }),
});

export const VideoBlockSchema = BaseBlockSchema.extend({
  blockType: z.literal('video'),
  data: z.object({
    url: z.string().url(),
    posterUrl: z.string().url().optional(),
    aspectRatio: z.enum(['16:9', '9:16', '1:1']).default('16:9'),
    caption: z.string().optional(),
    durationSeconds: z.number().positive().optional(),
    transcription: z.string().optional(),
  }),
});

export const AudioBlockSchema = BaseBlockSchema.extend({
  blockType: z.literal('audio'),
  data: z.object({
    url: z.string().url(),
    title: z.string().min(1),
    narrator: z.string().optional(),
    durationSeconds: z.number().positive().optional(),
    transcript: z.string().optional(),
    language: z.string().default('en'),
  }),
});

export const SlideDeckBlockSchema = BaseBlockSchema.extend({
  blockType: z.literal('slide_deck'),
  data: z.object({
    title: z.string().min(1),
    slides: z
      .array(
        z.object({
          slideNumber: z.number().int(),
          title: z.string().min(1),
          bullets: z.array(z.string()).optional(),
          body: z.string().optional(),
          imageUrl: z.string().url().optional(),
          sourceAttribution: z.string().optional(),
        })
      )
      .min(2),
  }),
});

export const StatisticBlockSchema = BaseBlockSchema.extend({
  blockType: z.literal('statistic'),
  data: z.object({
    value: z.string().min(1),
    label: z.string().min(1),
    trend: z.enum(['up', 'down', 'neutral']).optional(),
    trendValue: z.string().optional(),
    context: z.string().optional(),
    sourceAttribution: z.string().optional(),
  }),
});

export const ComparisonBlockSchema = BaseBlockSchema.extend({
  blockType: z.literal('comparison'),
  data: z.object({
    title: z.string().optional(),
    subjectA: z.object({
      name: z.string().min(1),
      points: z.array(z.string()).min(1),
    }),
    subjectB: z.object({
      name: z.string().min(1),
      points: z.array(z.string()).min(1),
    }),
  }),
});

export const CalloutBlockSchema = BaseBlockSchema.extend({
  blockType: z.literal('callout'),
  data: z.object({
    style: z.enum(['info', 'warning', 'tip', 'critical']).default('info'),
    title: z.string().optional(),
    text: z.string().min(1),
  }),
});

export const CitationBlockSchema = BaseBlockSchema.extend({
  blockType: z.literal('citation'),
  data: z.object({
    claim: z.string().min(1),
    sourceIds: z.array(z.string()).min(1),
    quoteExcerpt: z.string().optional(),
  }),
});

export const SourceBlockSchema = BaseBlockSchema.extend({
  blockType: z.literal('source'),
  data: z.object({
    sourceId: z.string().min(1),
    title: z.string().min(1),
    publisher: z.string().min(1),
    url: z.string().url(),
    publishedAt: z.string().optional(),
  }),
});

export const EntityBlockSchema = BaseBlockSchema.extend({
  blockType: z.literal('entity'),
  data: z.object({
    entityId: z.string().min(1),
    name: z.string().min(1),
    type: z.string().min(1),
    description: z.string().optional(),
    avatarUrl: z.string().url().optional(),
  }),
});

export const WhatChangedBlockSchema = BaseBlockSchema.extend({
  blockType: z.literal('what_changed'),
  data: z.object({
    previousVersionNumber: z.number().int().positive(),
    updatedAt: z.string().min(1),
    items: z
      .array(
        z.object({
          changeType: z.enum(['added', 'updated', 'corrected', 'retracted']),
          description: z.string().min(1),
          affectedSection: z.string().optional(),
        })
      )
      .min(1),
  }),
});

export const RelatedStoriesBlockSchema = BaseBlockSchema.extend({
  blockType: z.literal('related_stories'),
  data: z.object({
    title: z.string().default('Related Stories'),
    storyIds: z.array(z.string()).min(1),
  }),
});

export const EmbedBlockSchema = BaseBlockSchema.extend({
  blockType: z.literal('embed'),
  data: z.object({
    provider: z.enum(['youtube', 'twitter', 'bluesky', 'github', 'generic']),
    url: z.string().url(),
    title: z.string().optional(),
  }),
});

export const StoryBlockSchema = z.discriminatedUnion('blockType', [
  HeadingBlockSchema,
  ParagraphBlockSchema,
  SummaryBlockSchema,
  QuoteBlockSchema,
  ImageBlockSchema,
  GalleryBlockSchema,
  ChartBlockSchema,
  TableBlockSchema,
  TimelineBlockSchema,
  MapBlockSchema,
  DiagramBlockSchema,
  FlowBlockSchema,
  VideoBlockSchema,
  AudioBlockSchema,
  SlideDeckBlockSchema,
  StatisticBlockSchema,
  ComparisonBlockSchema,
  CalloutBlockSchema,
  CitationBlockSchema,
  SourceBlockSchema,
  EntityBlockSchema,
  WhatChangedBlockSchema,
  RelatedStoriesBlockSchema,
  EmbedBlockSchema,
]);

export type StoryBlock = z.infer<typeof StoryBlockSchema>;
export type Block = StoryBlock;
export type BaseBlock = z.infer<typeof BaseBlockSchema>;
export type HeadingBlock = z.infer<typeof HeadingBlockSchema>;
export type ParagraphBlock = z.infer<typeof ParagraphBlockSchema>;
export type SummaryBlock = z.infer<typeof SummaryBlockSchema>;
export type QuoteBlock = z.infer<typeof QuoteBlockSchema>;
export type ImageBlock = z.infer<typeof ImageBlockSchema>;
export type GalleryBlock = z.infer<typeof GalleryBlockSchema>;
export type ChartBlock = z.infer<typeof ChartBlockSchema>;
export type TableBlock = z.infer<typeof TableBlockSchema>;
export type TimelineBlock = z.infer<typeof TimelineBlockSchema>;
export type MapBlock = z.infer<typeof MapBlockSchema>;
export type DiagramBlock = z.infer<typeof DiagramBlockSchema>;
export type FlowBlock = z.infer<typeof FlowBlockSchema>;
export type VideoBlock = z.infer<typeof VideoBlockSchema>;
export type AudioBlock = z.infer<typeof AudioBlockSchema>;
export type SlideDeckBlock = z.infer<typeof SlideDeckBlockSchema>;
export type StatisticBlock = z.infer<typeof StatisticBlockSchema>;
export type ComparisonBlock = z.infer<typeof ComparisonBlockSchema>;
export type CalloutBlock = z.infer<typeof CalloutBlockSchema>;
export type CitationBlock = z.infer<typeof CitationBlockSchema>;
export type SourceBlock = z.infer<typeof SourceBlockSchema>;
export type EntityBlock = z.infer<typeof EntityBlockSchema>;
export type WhatChangedBlock = z.infer<typeof WhatChangedBlockSchema>;
export type RelatedStoriesBlock = z.infer<typeof RelatedStoriesBlockSchema>;
export type EmbedBlock = z.infer<typeof EmbedBlockSchema>;
