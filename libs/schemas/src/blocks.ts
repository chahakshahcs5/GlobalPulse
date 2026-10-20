import { z } from 'zod';
import { ClaimStatusSchema, PerspectiveStanceSchema } from './intelligence';

/**
 * Provenance attached to any externally sourced block. AI agents and humans
 * both use this shape; renderers surface it and API clients can audit it.
 */
export const DataProvenanceSchema = z.object({
  source: z.string().max(300).optional(),
  dataset: z.string().max(300).optional(),
  provider: z.string().max(300).optional(),
  sourceIds: z.array(z.string()).optional(),
  retrievedAt: z.string().optional(),
  publishedAt: z.string().optional(),
  lastUpdated: z.string().optional(),
  methodology: z.string().max(4000).optional(),
  license: z.string().max(500).optional(),
});
export type DataProvenance = z.infer<typeof DataProvenanceSchema>;

export const BlockAccessibilitySchema = z.object({
  title: z.string().max(300).optional(),
  description: z.string().max(2000).optional(),
  textSummary: z.string().max(10000).optional(),
});
export type BlockAccessibility = z.infer<typeof BlockAccessibilitySchema>;

export const BaseBlockSchema = z.object({
  id: z.string().min(1),
  blockType: z.string(),
  sortOrder: z.number().int().nonnegative(),
  metadata: z.record(z.unknown()).optional(),
  citationIds: z.array(z.string()).optional(),
  // The fields below extend the original block envelope without breaking
  // historic payloads: every one is optional and defaults are applied by
  // renderers/services rather than the schema.
  version: z.number().int().positive().optional(),
  sourceIds: z.array(z.string()).optional(),
  accessibility: BlockAccessibilitySchema.optional(),
  provenance: DataProvenanceSchema.optional(),
  createdBy: z.string().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
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
    layout: z.enum(['grid', 'carousel', 'masonry']).optional(),
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

export const AnnotatedImageBlockSchema = BaseBlockSchema.extend({
  blockType: z.literal('annotated_image'),
  data: z.object({
    url: z.string().url(),
    altText: z.string().min(1),
    caption: z.string().optional(),
    credit: z.string().optional(),
    annotations: z
      .array(
        z.object({
          id: z.string().min(1),
          xPercent: z.number().min(0).max(100),
          yPercent: z.number().min(0).max(100),
          label: z.string().min(1),
          description: z.string().optional(),
          sourceId: z.string().optional(),
        })
      )
      .min(1),
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
      'pie',
      'kpi',
      'comparison',
      'slope',
      'bump',
      'dot_plot',
      'lollipop',
      'diverging_bar',
      'radar',
      'small_multiples',
      'sparkline',
    ]),
    title: z.string().min(1),
    subtitle: z.string().optional(),
    caption: z.string().optional(),
    xAxis: z.object({
      key: z.string().min(1),
      label: z.string().min(1),
      type: z.enum(['category', 'time', 'linear']).optional(),
      unit: z.string().optional(),
    }),
    yAxis: z.object({
      label: z.string().min(1),
      unit: z.string().optional(),
      format: z.string().optional(),
      min: z.number().optional(),
      max: z.number().optional(),
    }),
    legend: z
      .object({
        show: z.boolean().default(true),
        position: z.enum(['top', 'bottom', 'right']).optional(),
      })
      .optional(),
    series: z
      .array(
        z.object({
          name: z.string().min(1),
          key: z.string().min(1),
          // Must be a plain CSS color (hex / rgb(a) / hsl(a) / keyword).
          // Free-form strings are interpolated into SVG fill/stroke attributes;
          // anything else could break out of the attribute and inject markup.
          color: z
            .string()
            .regex(
              /^(#(?:[0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})|(?:rgba?|hsla?)\(\s*[\d.%\s,/]+\)|[a-z]+)$/i
            )
            .optional(),
        })
      )
      .min(1),
    values: z.array(z.record(z.unknown())).min(1),
    facetField: z.string().optional(),
    sourceAttribution: z.string().optional(),
    methodology: z.string().max(4000).optional(),
    lastUpdated: z.string().optional(),
  }),
});

export const TableBlockSchema = BaseBlockSchema.extend({
  blockType: z.literal('table'),
  data: z.object({
    title: z.string().optional(),
    headers: z.array(z.string()).min(1),
    rows: z.array(z.array(z.string())).min(1),
    footer: z.string().optional(),
    sortable: z.boolean().optional(),
    filterable: z.boolean().optional(),
    searchable: z.boolean().optional(),
    pageSize: z.number().int().min(1).max(500).optional(),
    caption: z.string().optional(),
    sourceAttribution: z.string().optional(),
    methodology: z.string().max(4000).optional(),
    lastUpdated: z.string().optional(),
    downloadable: z.boolean().optional(),
  }),
});

export const TimelineBlockSchema = BaseBlockSchema.extend({
  blockType: z.literal('timeline'),
  data: z.object({
    title: z.string().optional(),
    description: z.string().optional(),
    items: z
      .array(
        z.object({
          date: z.string().min(1),
          headline: z.string().min(1),
          body: z.string().min(1),
          eventType: z.string().optional(),
          location: z.string().optional(),
          entityIds: z.array(z.string()).optional(),
          sourceIds: z.array(z.string()).optional(),
          citationIds: z.array(z.string()).optional(),
          mediaUrl: z.string().url().optional(),
        })
      )
      .min(1),
    sourceAttribution: z.string().optional(),
    methodology: z.string().max(4000).optional(),
  }),
});

export const MapBlockSchema = BaseBlockSchema.extend({
  blockType: z.literal('map'),
  data: z.object({
    title: z.string().optional(),
    mapType: z.enum(['points', 'choropleth', 'heatmap', 'route', 'comparison']).optional(),
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
          severity: z.string().optional(),
          entityIds: z.array(z.string()).optional(),
          sourceIds: z.array(z.string()).optional(),
        })
      )
      .optional(),
    layers: z
      .array(
        z.object({
          id: z.string().min(1),
          type: z.enum(['fill', 'line', 'circle', 'heatmap']),
          geojson: z.record(z.unknown()),
          property: z.string().optional(),
          colorScale: z.array(z.string()).optional(),
        })
      )
      .optional(),
    routes: z
      .array(
        z.object({
          id: z.string().min(1),
          name: z.string().min(1),
          coordinates: z.array(z.tuple([z.number(), z.number()])).min(2),
          description: z.string().optional(),
        })
      )
      .optional(),
    comparisonRegionIds: z.array(z.string()).optional(),
    sourceAttribution: z.string().optional(),
    methodology: z.string().max(4000).optional(),
    lastUpdated: z.string().optional(),
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
    description: z.string().optional(),
    steps: z
      .array(
        z.object({
          stepNumber: z.number().int(),
          title: z.string().min(1),
          description: z.string().min(1),
          status: z.enum(['pending', 'active', 'completed', 'blocked']).optional(),
          sourceIds: z.array(z.string()).optional(),
          citationIds: z.array(z.string()).optional(),
          imageUrl: z.string().url().optional(),
          branches: z
            .array(
              z.object({
                label: z.string().min(1),
                description: z.string().optional(),
                nextStep: z.number().int().optional(),
              })
            )
            .optional(),
        })
      )
      .min(2),
  }),
});

export const VideoBlockSchema = BaseBlockSchema.extend({
  blockType: z.literal('video'),
  data: z.object({
    url: z.string().url().or(z.string().startsWith('/')),
    posterUrl: z.string().url().or(z.string().startsWith('/')).optional(),
    aspectRatio: z.enum(['16:9', '9:16', '1:1']).default('16:9'),
    caption: z.string().optional(),
    durationSeconds: z.number().positive().optional(),
    transcription: z.string().optional(),
    transcriptSegments: z
      .array(
        z.object({
          startSeconds: z.number().nonnegative(),
          endSeconds: z.number().nonnegative().optional(),
          speaker: z.string().optional(),
          text: z.string().min(1),
        })
      )
      .optional(),
    chapters: z
      .array(
        z.object({
          startSeconds: z.number().nonnegative(),
          title: z.string().min(1),
          description: z.string().optional(),
        })
      )
      .optional(),
  }),
});

export const AudioCuePointSchema = z.object({
  timeMs: z.number().nonnegative(),
  text: z.string().min(1),
  blockRefId: z.string().optional(),
});
export type AudioCuePoint = z.infer<typeof AudioCuePointSchema>;

export const AudioChapterSchema = z.object({
  startSeconds: z.number().nonnegative(),
  title: z.string().min(1),
  description: z.string().optional(),
});
export type AudioChapter = z.infer<typeof AudioChapterSchema>;

export const AudioBlockSchema = BaseBlockSchema.extend({
  blockType: z.literal('audio'),
  data: z.object({
    url: z.string().url().or(z.string().startsWith('/')),
    title: z.string().min(1),
    narrator: z.string().optional(),
    durationSeconds: z.number().positive().optional(),
    transcript: z.string().optional(),
    language: z.string().default('en'),
    cuePoints: z.array(AudioCuePointSchema).optional(),
    chapters: z.array(AudioChapterSchema).optional(),
    speakers: z
      .array(
        z.object({
          id: z.string().min(1),
          name: z.string().min(1),
          role: z.string().optional(),
        })
      )
      .optional(),
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
    unit: z.string().optional(),
    trend: z.enum(['up', 'down', 'neutral']).optional(),
    trendValue: z.string().optional(),
    comparison: z.string().optional(),
    period: z.string().optional(),
    context: z.string().optional(),
    sourceAttribution: z.string().optional(),
    sourceIds: z.array(z.string()).optional(),
    methodology: z.string().max(4000).optional(),
    lastUpdated: z.string().optional(),
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

export const ImageDiffBlockSchema = BaseBlockSchema.extend({
  blockType: z.literal('image_diff'),
  data: z.object({
    beforeUrl: z.string().url(),
    afterUrl: z.string().url(),
    beforeLabel: z.string().default('Before'),
    afterLabel: z.string().default('After'),
    caption: z.string().optional(),
    orientation: z.enum(['horizontal', 'vertical']).default('horizontal'),
    defaultSplitPercent: z.number().min(0).max(100).default(50),
    credit: z.string().optional(),
  }),
});

export const LiveTickerItemSchema = z.object({
  symbol: z.string().min(1),
  label: z.string().min(1),
  value: z.number(),
  delta: z.number(),
  unit: z.string().optional(),
  sparkline: z.array(z.number()).optional().default([]),
  lastUpdated: z.string().optional(),
});
export type LiveTickerItem = z.infer<typeof LiveTickerItemSchema>;

export const LiveTickerBlockSchema = BaseBlockSchema.extend({
  blockType: z.literal('live_ticker'),
  data: z.object({
    title: z.string().optional(),
    refreshIntervalSeconds: z.number().int().min(5).max(3600).default(30),
    items: z.array(LiveTickerItemSchema).min(1),
  }),
});

export const PollOptionSchema = z.object({
  id: z.string().min(1),
  text: z.string().min(1),
  voteCount: z.number().int().nonnegative().default(0),
});
export type PollOption = z.infer<typeof PollOptionSchema>;

export const PollBlockSchema = BaseBlockSchema.extend({
  blockType: z.literal('poll'),
  data: z.object({
    pollId: z.string().min(1),
    question: z.string().min(1),
    options: z.array(PollOptionSchema).min(2),
    totalVotes: z.number().int().nonnegative().default(0),
    userVotedOptionId: z.string().optional(),
    expiresAt: z.string().optional(),
    closed: z.boolean().default(false),
  }),
});

export const DocumentHighlightSchema = z.object({
  page: z.number().int().positive(),
  excerpt: z.string().min(1),
  note: z.string().optional(),
  tag: z.string().optional(),
});
export type DocumentHighlight = z.infer<typeof DocumentHighlightSchema>;

export const DocumentViewerBlockSchema = BaseBlockSchema.extend({
  blockType: z.literal('document_viewer'),
  data: z.object({
    documentUrl: z.string().url(),
    title: z.string().min(1),
    pageCount: z.number().int().positive(),
    documentType: z
      .enum([
        'court_filing',
        'treaty',
        'financial_disclosure',
        'leak',
        'whitepaper',
        'regulatory_directive',
      ])
      .default('whitepaper'),
    description: z.string().optional(),
    highlights: z.array(DocumentHighlightSchema).default([]),
    sourceAttribution: z.string().optional(),
  }),
});

/**
 * Reusable data explorer. The full dataset lives in `rows` (never only in a
 * rendered chart) so readers can inspect, filter and download the same values.
 */
export const DataExplorerBlockSchema = BaseBlockSchema.extend({
  blockType: z.literal('data_explorer'),
  data: z.object({
    title: z.string().min(1),
    subtitle: z.string().optional(),
    description: z.string().optional(),
    dataset: z.object({
      id: z.string().optional(),
      name: z.string().min(1),
      sourceAttribution: z.string().optional(),
      methodology: z.string().max(4000).optional(),
      license: z.string().max(500).optional(),
      lastUpdated: z.string().optional(),
    }),
    dimensions: z
      .array(
        z.object({
          key: z.string().min(1),
          label: z.string().min(1),
          type: z.enum(['category', 'time', 'number']).default('category'),
        })
      )
      .min(1),
    metrics: z
      .array(
        z.object({
          key: z.string().min(1),
          label: z.string().min(1),
          unit: z.string().optional(),
          format: z.string().optional(),
        })
      )
      .min(1),
    defaultDimension: z.string().min(1),
    defaultMetric: z.string().min(1),
    rows: z.array(z.record(z.union([z.string(), z.number(), z.boolean(), z.null()]))).min(1),
    filters: z
      .array(
        z.object({
          key: z.string().min(1),
          label: z.string().min(1),
          values: z.array(z.string()).min(1),
        })
      )
      .optional(),
    downloadableFormats: z.array(z.enum(['csv', 'json'])).default(['csv']),
  }),
});

export const CalculatorInputSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  type: z.enum(['number', 'range', 'select']).default('number'),
  unit: z.string().optional(),
  defaultValue: z.union([z.number(), z.string()]),
  min: z.number().optional(),
  max: z.number().optional(),
  step: z.number().positive().optional(),
  options: z
    .array(
      z.object({
        label: z.string().min(1),
        value: z.union([z.number(), z.string()]),
      })
    )
    .optional(),
});
export type CalculatorInput = z.infer<typeof CalculatorInputSchema>;

export const CalculatorBlockSchema = BaseBlockSchema.extend({
  blockType: z.literal('calculator'),
  data: z.object({
    title: z.string().min(1),
    description: z.string().optional(),
    inputs: z.array(CalculatorInputSchema).min(1),
    outputs: z
      .array(
        z.object({
          id: z.string().min(1),
          label: z.string().min(1),
          expression: z.string().min(1),
          unit: z.string().optional(),
          description: z.string().optional(),
          precision: z.number().int().min(0).max(8).optional(),
        })
      )
      .min(1),
    explanation: z.string().max(5000).optional(),
    assumptions: z.array(z.string()).default([]),
    sourceAttribution: z.string().optional(),
    methodology: z.string().max(4000).optional(),
  }),
});

export const RankingBlockSchema = BaseBlockSchema.extend({
  blockType: z.literal('ranking'),
  data: z.object({
    title: z.string().min(1),
    subtitle: z.string().optional(),
    items: z
      .array(
        z.object({
          rank: z.number().int().positive(),
          previousRank: z.number().int().positive().optional(),
          name: z.string().min(1),
          value: z.number().optional(),
          unit: z.string().optional(),
          entityId: z.string().optional(),
          storyId: z.string().optional(),
          note: z.string().optional(),
        })
      )
      .min(1),
    methodology: z.string().max(4000).optional(),
    sourceAttribution: z.string().optional(),
    lastUpdated: z.string().optional(),
  }),
});

export const FinancialBlockSchema = BaseBlockSchema.extend({
  blockType: z.literal('financial'),
  data: z.object({
    title: z.string().min(1),
    entityId: z.string().optional(),
    currency: z.string().min(1),
    asOf: z.string().min(1),
    metrics: z
      .array(
        z.object({
          label: z.string().min(1),
          value: z.number(),
          unit: z.string().optional(),
          change: z.number().optional(),
          changePeriod: z.string().optional(),
          sourceId: z.string().optional(),
        })
      )
      .min(1),
    series: z
      .array(
        z.object({
          period: z.string().min(1),
          value: z.number(),
          metric: z.string().optional(),
        })
      )
      .optional(),
    sourceAttribution: z.string().optional(),
    methodology: z.string().max(4000).optional(),
  }),
});

export const ElectionBlockSchema = BaseBlockSchema.extend({
  blockType: z.literal('election'),
  data: z.object({
    title: z.string().min(1),
    electionType: z.string().min(1),
    region: z.string().min(1),
    electionDate: z.string().min(1),
    totalSeats: z.number().int().positive().optional(),
    turnout: z.number().min(0).max(100).optional(),
    results: z
      .array(
        z.object({
          party: z.string().min(1),
          candidate: z.string().optional(),
          votes: z.number().nonnegative().optional(),
          voteShare: z.number().min(0).max(100).optional(),
          seats: z.number().int().nonnegative().optional(),
          seatChange: z.number().int().optional(),
        })
      )
      .min(1),
    historical: z
      .array(
        z.object({
          year: z.number().int(),
          winner: z.string().optional(),
          turnout: z.number().min(0).max(100).optional(),
          seats: z.record(z.number()).optional(),
        })
      )
      .optional(),
    sourceAttribution: z.string().optional(),
    methodology: z.string().max(4000).optional(),
    lastUpdated: z.string().optional(),
  }),
});

export const DisasterMetricSchema = z.object({
  label: z.string().min(1),
  value: z.number(),
  unit: z.string().min(1),
  timestamp: z.string().optional(),
  sourceId: z.string().optional(),
});
export type DisasterMetric = z.infer<typeof DisasterMetricSchema>;

export const DisasterBlockSchema = BaseBlockSchema.extend({
  blockType: z.literal('disaster'),
  data: z.object({
    title: z.string().min(1),
    disasterType: z.enum(['earthquake', 'storm', 'flood', 'fire', 'drought', 'other']),
    status: z.enum(['ACTIVE', 'RESOLVED', 'MONITORING']).default('ACTIVE'),
    severity: z.enum(['LOW', 'MODERATE', 'MAJOR', 'CRITICAL']).optional(),
    occurredAt: z.string().min(1),
    location: z.string().optional(),
    coordinates: z.tuple([z.number(), z.number()]).optional(),
    metrics: z.array(DisasterMetricSchema).min(1),
    affectedAreas: z.array(z.string()).default([]),
    updates: z
      .array(
        z.object({
          timestamp: z.string().min(1),
          title: z.string().min(1),
          description: z.string().optional(),
          sourceId: z.string().optional(),
        })
      )
      .default([]),
    sourceAttribution: z.string().optional(),
    methodology: z.string().max(4000).optional(),
  }),
});

export const ScienceBlockSchema = BaseBlockSchema.extend({
  blockType: z.literal('science'),
  data: z.object({
    title: z.string().min(1),
    field: z.string().optional(),
    findings: z.array(z.string()).min(1),
    measurements: z
      .array(
        z.object({
          label: z.string().min(1),
          value: z.number(),
          unit: z.string(),
          uncertainty: z.number().optional(),
        })
      )
      .default([]),
    equation: z.string().optional(),
    diagramUrl: z.string().url().optional(),
    paperUrl: z.string().url().optional(),
    authors: z.array(z.string()).default([]),
    institutions: z.array(z.string()).default([]),
    publishedAt: z.string().optional(),
    methodology: z.string().max(4000).optional(),
    sourceAttribution: z.string().optional(),
  }),
});

export const InterviewBlockSchema = BaseBlockSchema.extend({
  blockType: z.literal('interview'),
  data: z.object({
    title: z.string().min(1),
    interviewee: z.object({
      name: z.string().min(1),
      role: z.string().optional(),
      entityId: z.string().optional(),
    }),
    format: z.enum(['text', 'audio', 'video']).default('text'),
    mediaUrl: z.string().url().optional(),
    transcript: z.string().optional(),
    segments: z
      .array(
        z.object({
          question: z.string().min(1),
          answer: z.string().min(1),
          speaker: z.string().optional(),
          timestampSeconds: z.number().nonnegative().optional(),
          sourceId: z.string().optional(),
        })
      )
      .min(1),
    sourceAttribution: z.string().optional(),
  }),
});

export const LiveDataItemSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  provider: z.string().min(1),
  value: z.union([z.number(), z.string()]),
  previousValue: z.number().optional(),
  change: z.number().optional(),
  unit: z.string().optional(),
  asOf: z.string().min(1),
  sourceUrl: z.string().url().optional(),
  methodology: z.string().max(2000).optional(),
  license: z.string().max(500).optional(),
});
export type LiveDataItem = z.infer<typeof LiveDataItemSchema>;

export const LiveDataBlockSchema = BaseBlockSchema.extend({
  blockType: z.literal('live_data'),
  data: z.object({
    title: z.string().optional(),
    refreshIntervalSeconds: z.number().int().min(5).max(3600).default(60),
    items: z.array(LiveDataItemSchema).min(1),
    sourceAttribution: z.string().optional(),
  }),
});

export const EvidenceBlockItemSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1),
  stance: z.enum(['SUPPORTS', 'CONTRADICTS', 'CONTEXT']).default('CONTEXT'),
  sourceId: z.string().optional(),
  url: z.string().url().optional(),
  excerpt: z.string().optional(),
  type: z.string().optional(),
});
export type EvidenceBlockItem = z.infer<typeof EvidenceBlockItemSchema>;

export const EvidenceBlockSchema = BaseBlockSchema.extend({
  blockType: z.literal('evidence'),
  data: z.object({
    title: z.string().min(1),
    summary: z.string().optional(),
    claims: z
      .array(
        z.object({
          claimId: z.string().optional(),
          text: z.string().min(1),
          status: ClaimStatusSchema,
          confidence: z.number().min(0).max(1).optional(),
          confidenceMethodology: z.string().optional(),
        })
      )
      .default([]),
    evidence: z.array(EvidenceBlockItemSchema).default([]),
    methodology: z.string().max(4000).optional(),
    sourceAttribution: z.string().optional(),
  }),
});

export const PerspectiveBlockSchema = BaseBlockSchema.extend({
  blockType: z.literal('perspective'),
  data: z.object({
    title: z.string().optional(),
    perspectives: z
      .array(
        z.object({
          label: z.string().min(1),
          summary: z.string().min(1),
          stance: PerspectiveStanceSchema.default('UNKNOWN'),
          sourceIds: z.array(z.string()).default([]),
          quoteExcerpt: z.string().optional(),
        })
      )
      .min(1),
    methodology: z.string().max(4000).optional(),
  }),
});

export const FactCheckBlockSchema = BaseBlockSchema.extend({
  blockType: z.literal('fact_check'),
  data: z.object({
    claim: z.string().min(1),
    claimant: z.string().optional(),
    status: ClaimStatusSchema,
    confidence: z.number().min(0).max(1).optional(),
    confidenceMethodology: z.string().optional(),
    summary: z.string().min(1),
    evidenceSummary: z.string().optional(),
    sources: z.array(z.string()).default([]),
    methodology: z.string().max(4000).optional(),
    reviewedAt: z.string().optional(),
    reviewer: z.string().optional(),
  }),
});

// ---------------------------------------------------------------------------
// Media expansion: video gallery, podcast, waveform, transcript, dataset
// ---------------------------------------------------------------------------

/**
 * Timestamped transcript segment. Shared by video, audio, podcast, and the
 * standalone transcript block so a timestamp reference always means the same
 * thing across media types.
 */
export const MediaTranscriptSegmentSchema = z.object({
  startSeconds: z.number().nonnegative(),
  endSeconds: z.number().nonnegative().optional(),
  speaker: z.string().optional(),
  text: z.string().min(1),
});
export type MediaTranscriptSegment = z.infer<typeof MediaTranscriptSegmentSchema>;

/** Chapter marker for video, audio, and podcast media. */
export const MediaChapterSchema = z.object({
  startSeconds: z.number().nonnegative(),
  title: z.string().min(1),
  description: z.string().optional(),
});
export type MediaChapter = z.infer<typeof MediaChapterSchema>;

export const MediaSpeakerSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  role: z.string().optional(),
});
export type MediaSpeaker = z.infer<typeof MediaSpeakerSchema>;

export const VideoGalleryItemSchema = z.object({
  id: z.string().min(1),
  url: z.string().url().or(z.string().startsWith('/')),
  title: z.string().min(1).max(300),
  posterUrl: z.string().url().or(z.string().startsWith('/')).optional(),
  durationSeconds: z.number().positive().optional(),
  caption: z.string().max(2000).optional(),
  credit: z.string().max(300).optional(),
  chapters: z.array(MediaChapterSchema).optional(),
  transcriptSegments: z.array(MediaTranscriptSegmentSchema).optional(),
});
export type VideoGalleryItem = z.infer<typeof VideoGalleryItemSchema>;

export const VideoGalleryBlockSchema = BaseBlockSchema.extend({
  blockType: z.literal('video_gallery'),
  data: z.object({
    title: z.string().min(1).max(300).optional(),
    description: z.string().max(2000).optional(),
    videos: z.array(VideoGalleryItemSchema).min(1).max(24),
    sourceAttribution: z.string().optional(),
  }),
});

export const PodcastEpisodeSchema = z.object({
  showTitle: z.string().min(1).max(300),
  episodeTitle: z.string().min(1).max(300),
  episodeNumber: z.number().int().positive().optional(),
  seasonNumber: z.number().int().nonnegative().optional(),
  description: z.string().max(5000).optional(),
  audioUrl: z.string().url().or(z.string().startsWith('/')),
  artworkUrl: z.string().url().optional(),
  episodeUrl: z.string().url().optional(),
  durationSeconds: z.number().positive().optional(),
  publishedAt: z.string().optional(),
  transcript: z.string().optional(),
  chapters: z.array(MediaChapterSchema).optional(),
  speakers: z.array(MediaSpeakerSchema).optional(),
  explicit: z.boolean().optional(),
  sourceAttribution: z.string().optional(),
});
export type PodcastEpisode = z.infer<typeof PodcastEpisodeSchema>;

export const PodcastBlockSchema = BaseBlockSchema.extend({
  blockType: z.literal('podcast'),
  data: z.object({
    title: z.string().min(1).max(300),
    description: z.string().max(5000).optional(),
    episodes: z.array(PodcastEpisodeSchema).min(1).max(50),
    sourceAttribution: z.string().optional(),
  }),
});

export const WaveformSegmentSchema = z.object({
  startSeconds: z.number().nonnegative(),
  endSeconds: z.number().nonnegative().optional(),
  label: z.string().min(1),
  blockRefId: z.string().optional(),
});
export type WaveformSegment = z.infer<typeof WaveformSegmentSchema>;

export const WaveformBlockSchema = BaseBlockSchema.extend({
  blockType: z.literal('waveform'),
  data: z.object({
    title: z.string().min(1).max(300).optional(),
    mediaUrl: z.string().url().or(z.string().startsWith('/')),
    mediaType: z.enum(['audio', 'video']).default('audio'),
    durationSeconds: z.number().positive().optional(),
    /** Normalized amplitude samples (0-1) used to draw the waveform. */
    peaks: z.array(z.number().min(0).max(1)).min(2),
    segments: z.array(WaveformSegmentSchema).default([]),
    sourceAttribution: z.string().optional(),
  }),
});

export const TranscriptSegmentSchema = z.object({
  startSeconds: z.number().nonnegative(),
  endSeconds: z.number().nonnegative().optional(),
  speaker: z.string().optional(),
  text: z.string().min(1),
  /** Transcription confidence, when the producer records one. */
  confidence: z.number().min(0).max(1).optional(),
});
export type TranscriptSegment = z.infer<typeof TranscriptSegmentSchema>;

export const TranscriptBlockSchema = BaseBlockSchema.extend({
  blockType: z.literal('transcript'),
  data: z.object({
    title: z.string().min(1).max(300).optional(),
    mediaType: z.enum(['audio', 'video']).default('audio'),
    /** Reference to the media the transcript belongs to (video/audio URL). */
    mediaUrl: z.string().url().or(z.string().startsWith('/')).optional(),
    language: z.string().default('en'),
    segments: z.array(TranscriptSegmentSchema).min(1),
    speakers: z.array(MediaSpeakerSchema).default([]),
    sourceAttribution: z.string().optional(),
    methodology: z.string().max(4000).optional(),
  }),
});

export const DatasetColumnSchema = z.object({
  key: z.string().min(1),
  label: z.string().min(1),
  type: z.enum(['string', 'number', 'boolean', 'date']).default('string'),
});
export type DatasetColumn = z.infer<typeof DatasetColumnSchema>;

export const DatasetBlockSchema = BaseBlockSchema.extend({
  blockType: z.literal('dataset'),
  data: z.object({
    title: z.string().min(1).max(300),
    description: z.string().max(4000).optional(),
    downloadUrl: z.string().url().optional(),
    formats: z.array(z.enum(['csv', 'json', 'xlsx'])).default(['csv']),
    columns: z.array(DatasetColumnSchema).default([]),
    previewRows: z
      .array(z.record(z.union([z.string(), z.number(), z.boolean(), z.null()])))
      .default([]),
    license: z.string().max(500).optional(),
    methodology: z.string().max(4000).optional(),
    lastUpdated: z.string().optional(),
    sourceAttribution: z.string().optional(),
  }),
});

export const StoryBlockSchema = z.discriminatedUnion('blockType', [
  HeadingBlockSchema,
  ParagraphBlockSchema,
  SummaryBlockSchema,
  QuoteBlockSchema,
  ImageBlockSchema,
  GalleryBlockSchema,
  AnnotatedImageBlockSchema,
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
  ImageDiffBlockSchema,
  LiveTickerBlockSchema,
  PollBlockSchema,
  DocumentViewerBlockSchema,
  DataExplorerBlockSchema,
  CalculatorBlockSchema,
  RankingBlockSchema,
  FinancialBlockSchema,
  ElectionBlockSchema,
  DisasterBlockSchema,
  ScienceBlockSchema,
  InterviewBlockSchema,
  LiveDataBlockSchema,
  EvidenceBlockSchema,
  PerspectiveBlockSchema,
  FactCheckBlockSchema,
  VideoGalleryBlockSchema,
  PodcastBlockSchema,
  WaveformBlockSchema,
  TranscriptBlockSchema,
  DatasetBlockSchema,
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
export type ImageDiffBlock = z.infer<typeof ImageDiffBlockSchema>;
export type LiveTickerBlock = z.infer<typeof LiveTickerBlockSchema>;
export type PollBlock = z.infer<typeof PollBlockSchema>;
export type DocumentViewerBlock = z.infer<typeof DocumentViewerBlockSchema>;
export type AnnotatedImageBlock = z.infer<typeof AnnotatedImageBlockSchema>;
export type DataExplorerBlock = z.infer<typeof DataExplorerBlockSchema>;
export type CalculatorBlock = z.infer<typeof CalculatorBlockSchema>;
export type RankingBlock = z.infer<typeof RankingBlockSchema>;
export type FinancialBlock = z.infer<typeof FinancialBlockSchema>;
export type ElectionBlock = z.infer<typeof ElectionBlockSchema>;
export type DisasterBlock = z.infer<typeof DisasterBlockSchema>;
export type ScienceBlock = z.infer<typeof ScienceBlockSchema>;
export type InterviewBlock = z.infer<typeof InterviewBlockSchema>;
export type LiveDataBlock = z.infer<typeof LiveDataBlockSchema>;
export type EvidenceBlock = z.infer<typeof EvidenceBlockSchema>;
export type PerspectiveBlock = z.infer<typeof PerspectiveBlockSchema>;
export type FactCheckBlock = z.infer<typeof FactCheckBlockSchema>;
export type VideoGalleryBlock = z.infer<typeof VideoGalleryBlockSchema>;
export type PodcastBlock = z.infer<typeof PodcastBlockSchema>;
export type WaveformBlock = z.infer<typeof WaveformBlockSchema>;
export type TranscriptBlock = z.infer<typeof TranscriptBlockSchema>;
export type DatasetBlock = z.infer<typeof DatasetBlockSchema>;
