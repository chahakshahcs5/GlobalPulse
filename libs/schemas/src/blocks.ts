import { z } from 'zod';
import { ClaimStatusSchema, PerspectiveStanceSchema } from './intelligence';
import { CommentAuthorRoleSchema } from './engagement';

/**
 * The colours a block may be drawn in.
 *
 * A colour is interpolated into an SVG `fill` or `stroke` attribute, so a
 * free-form string could break out of the attribute and inject arbitrary
 * markup. Only hex, `rgb()`/`rgba()`/`hsl()`/`hsla()` and plain CSS colour
 * keywords are accepted; anything else is rejected by the schema rather than
 * silently mangled at render time.
 */
export const BLOCK_COLOR_PATTERN =
  /^(#(?:[0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})|(?:rgba?|hsla?)\(\s*[\d.%\s,/]+\)|[a-z]+)$/i;

/** A colour a block may be drawn in. */
export const BlockColorSchema = z.string().regex(BLOCK_COLOR_PATTERN);

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

/**
 * How a block is presented, independently of its content.
 *
 * These are the options every block type shares — how wide it sits, how it
 * is aligned in the column, and which theme it is drawn in. They live on the
 * envelope rather than in `data`, because they are the block's *presentation*
 * and not part of what the block says: the same chart payload can appear in
 * two stories with different widths, and the payload should not change.
 *
 * Every field is optional and every value is an enum, so the set of things
 * an editor can do here is small, closed and reviewable. Free-form styling
 * is deliberately not offered: block renderers interpolate values into SVG
 * attributes, so an open-ended string is a correctness and safety risk.
 */
export const BlockPresentationSchema = z.object({
  /**
   * How much of the column the block may use.
   *
   * `column` is the story's own width, `contained` is a narrower measure
   * inside it, and `full` breaks out of it altogether.
   */
  width: z.enum(['contained', 'column', 'full']).optional(),
  /**
   * How the block sits within the column.
   *
   * It only has something to say when the block is narrower than the
   * column — that is, when its width is `contained`.
   */
  align: z.enum(['left', 'center', 'right']).optional(),
  /**
   * The theme the block is drawn in.
   *
   * `inherit` follows the page. `light` and `dark` pin the block's own
   * graphics — the SVG renderers draw their charts, maps and diagrams — to
   * one theme, whichever theme the page is in.
   */
  theme: z.enum(['inherit', 'light', 'dark']).optional(),
});
export type BlockPresentation = z.infer<typeof BlockPresentationSchema>;

export const BaseBlockSchema = z.object({
  id: z.string().min(1),
  blockType: z.string(),
  sortOrder: z.number().int().nonnegative(),
  metadata: z.record(z.unknown()).optional(),
  /** How the block is presented. See `BlockPresentationSchema`. */
  presentation: BlockPresentationSchema.optional(),
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

export const ChartAnnotationSchema = z.object({
  id: z.string().min(1),
  /**
   * The value of the chart's x-axis key for the data point this annotation
   * points at (e.g. "2026" when `xAxis.key` is "year").
   */
  xValue: z.string().min(1),
  /** The series the annotation points at, when the chart has more than one. */
  seriesKey: z.string().optional(),
  /** Short headline for the annotation. */
  label: z.string().min(1),
  /** The explanation revealed when the reader opens the annotation. */
  body: z.string().max(2000),
  /** Registered source id backing the annotation. */
  sourceId: z.string().optional(),
});
export type ChartAnnotation = z.infer<typeof ChartAnnotationSchema>;

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
      'streamgraph',
      'calendar_heatmap',
      'parallel_coordinates',
      'box_plot',
      'funnel',
      'waffle',
      'ridge',
      'chord',
      'voronoi',
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
    /**
     * The key in each row that names the group the row belongs to.
     *
     * A box plot groups its rows into boxes; a chord diagram reads its rows
     * as a matrix of source and target. Both need a second, categorical key
     * alongside the one the value is read from, and neither can be inferred
     * from the axis.
     */
    groupKey: z.string().optional(),
    /**
     * The key in each row that holds a second measurement.
     *
     * A voronoi diagram places each row at the point its two measurements
     * describe; a chord diagram reads the second measurement as the column of
     * its matrix.
     */
    secondaryKey: z.string().optional(),
    /**
     * Click-to-reveal annotations anchored to specific data points — the
     * explainer treatment used to walk a reader through a chart.
     */
    annotations: z.array(ChartAnnotationSchema).optional(),
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
    /**
     * Bind the block to a platform live feed. Readers then receive fresher
     * values over the realtime channel instead of the snapshot stored here.
     */
    liveKey: z.string().min(1).optional(),
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

/**
 * Server-computed poll tally.
 *
 * The `poll` block payload stores the baseline counts that were known when the
 * story was authored (seed votes, or votes cast through another channel).
 * Reader votes recorded against the story are held in a dedicated vote store
 * and added on top of that baseline, so the published article payload never
 * has to be rewritten on every vote.
 */
export const PollTallyOptionSchema = z.object({
  id: z.string().min(1),
  text: z.string().min(1),
  voteCount: z.number().int().nonnegative(),
  percentage: z.number().min(0).max(100),
});
export type PollTallyOption = z.infer<typeof PollTallyOptionSchema>;

export const PollTallySchema = z.object({
  pollId: z.string().min(1),
  blockId: z.string().min(1),
  storyId: z.string().min(1),
  question: z.string().min(1),
  totalVotes: z.number().int().nonnegative(),
  closed: z.boolean(),
  options: z.array(PollTallyOptionSchema),
  /** The signed-in reader's choice, if they have voted. */
  userVotedOptionId: z.string().nullable().default(null),
});
export type PollTally = z.infer<typeof PollTallySchema>;

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

export const SensitivityInputSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  /** Value used at the base case. */
  base: z.number(),
  /** Low end of the explored range. */
  low: z.number(),
  /** High end of the explored range. */
  high: z.number(),
  unit: z.string().optional(),
  /** Free-text note explaining where the range comes from. */
  note: z.string().max(2000).optional(),
});
export type SensitivityInput = z.infer<typeof SensitivityInputSchema>;

export const SensitivityBlockSchema = BaseBlockSchema.extend({
  blockType: z.literal('sensitivity'),
  data: z.object({
    title: z.string().min(1),
    subtitle: z.string().optional(),
    description: z.string().max(4000).optional(),
    /** What the output measures (e.g. "Annual emissions"). */
    outputLabel: z.string().min(1),
    outputUnit: z.string().optional(),
    /** The output at the base case. */
    baseOutput: z.number(),
    /**
     * Expression producing the output from the input ids. Evaluated in the
     * restricted arithmetic sandbox, one variable at a time, to find how far
     * each input moves the outcome.
     */
    expression: z.string().min(1),
    inputs: z.array(SensitivityInputSchema).min(1).max(12),
    methodology: z.string().max(4000).optional(),
    sourceAttribution: z.string().optional(),
  }),
});

export const PredictionSchema = z.object({
  id: z.string().min(1),
  /** What is being predicted (e.g. "AGI capability by 2027"). */
  claim: z.string().min(1),
  /** Who made the prediction. */
  forecaster: z.string().min(1),
  forecasterId: z.string().optional(),
  /** Probability the claim comes true, 0-1. */
  probability: z.number().min(0).max(1),
  /** When the prediction resolves. */
  resolvesAt: z.string().optional(),
  /** When the prediction was made. */
  predictedAt: z.string().optional(),
  /** Whether the prediction has resolved. */
  resolved: z.boolean().default(false),
  /** 1 when the claim came true, 0 when it did not. */
  outcome: z.number().min(0).max(1).optional(),
  /** Registered source id backing the prediction. */
  sourceId: z.string().optional(),
  /** Note about the forecast or its resolution. */
  note: z.string().max(2000).optional(),
});
export type Prediction = z.infer<typeof PredictionSchema>;

export const PredictionLeaderboardBlockSchema = BaseBlockSchema.extend({
  blockType: z.literal('prediction_leaderboard'),
  data: z.object({
    title: z.string().min(1),
    subtitle: z.string().optional(),
    description: z.string().max(4000).optional(),
    predictions: z.array(PredictionSchema).min(1).max(200),
    /** How the score is calculated, shown next to the leaderboard. */
    scoringMethod: z.string().max(2000).optional(),
    methodology: z.string().max(4000).optional(),
    sourceAttribution: z.string().optional(),
  }),
});

export const WhatIfInputSchema = z
  .object({
    id: z.string().min(1),
    label: z.string().min(1),
    /** Lowest value the reader can dial to. */
    min: z.number(),
    /** Highest value the reader can dial to. */
    max: z.number(),
    /** Granularity of the slider. */
    step: z.number().positive().optional(),
    /** Where the slider starts. */
    defaultValue: z.number(),
    unit: z.string().optional(),
    /** Short note explaining the input. */
    note: z.string().max(2000).optional(),
  })
  .refine((input) => input.min <= input.max, {
    message: 'min must not be greater than max',
    path: ['min'],
  })
  .refine((input) => input.defaultValue >= input.min && input.defaultValue <= input.max, {
    // A default outside its own range would render a slider in an impossible
    // position and start the scenario from a value the reader cannot see.
    message: 'defaultValue must fall within the input range',
    path: ['defaultValue'],
  });
export type WhatIfInput = z.infer<typeof WhatIfInputSchema>;

export const WhatIfBreakdownSchema = z.object({
  label: z.string().min(1),
  /** Expression producing this component of the outcome. */
  expression: z.string().min(1),
  color: z.string().optional(),
});
export type WhatIfBreakdown = z.infer<typeof WhatIfBreakdownSchema>;

export const WhatIfBlockSchema = BaseBlockSchema.extend({
  blockType: z.literal('what_if'),
  data: z.object({
    title: z.string().min(1),
    description: z.string().max(4000).optional(),
    inputs: z.array(WhatIfInputSchema).min(1).max(8),
    /**
     * Expression producing the outcome from the input ids. Evaluated in the
     * restricted arithmetic sandbox as the reader moves the sliders.
     */
    expression: z.string().min(1),
    outcomeLabel: z.string().min(1),
    outcomeUnit: z.string().optional(),
    /** Optional breakdown of the outcome into named components. */
    breakdown: z.array(WhatIfBreakdownSchema).max(8).optional(),
    /** The outcome at the default values, shown for comparison. */
    baselineOutcome: z.number().optional(),
    methodology: z.string().max(4000).optional(),
    sourceAttribution: z.string().optional(),
  }),
});

export const LiveCommentsBlockSchema = BaseBlockSchema.extend({
  blockType: z.literal('live_comments'),
  data: z.object({
    title: z.string().min(1),
    description: z.string().max(4000).optional(),
    /** How many of the most recent comments to show. */
    maxComments: z.number().int().min(1).max(50).default(10),
    /** Only show comments from these roles. */
    roles: z.array(CommentAuthorRoleSchema).optional(),
    /** Show a link to the full discussion. */
    showCta: z.boolean().default(true),
  }),
});

export const CorrelationVariableSchema = z.object({
  key: z.string().min(1),
  label: z.string().min(1),
  unit: z.string().optional(),
});
export type CorrelationVariable = z.infer<typeof CorrelationVariableSchema>;

export const CorrelationBlockSchema = BaseBlockSchema.extend({
  blockType: z.literal('correlation'),
  data: z.object({
    title: z.string().min(1),
    subtitle: z.string().optional(),
    description: z.string().max(4000).optional(),
    /** The variables to correlate. */
    variables: z.array(CorrelationVariableSchema).min(2).max(20),
    /**
     * One row per observation, keyed by the variable keys. The platform
     * derives the coefficients, the sample sizes and the significance — a
     * heatmap of hand-written correlation values hides how thin the evidence
     * is.
     */
    observations: z.array(z.record(z.number())).min(2).max(5000),
    /** Optional labels for the observations (e.g. years). */
    rowLabels: z.array(z.string()).optional(),
    /** Show the coefficient and the sample size in each cell, not just colour. */
    showCoefficients: z.boolean().default(true),
    /** The p-value below which a relationship is marked significant. */
    significanceThreshold: z.number().min(0).max(1).default(0.05),
    methodology: z.string().max(4000).optional(),
    sourceAttribution: z.string().optional(),
  }),
});

export const QuizOptionSchema = z.object({
  id: z.string().min(1),
  text: z.string().min(1),
  /** Whether this is the correct answer. */
  correct: z.boolean().default(false),
});
export type QuizOption = z.infer<typeof QuizOptionSchema>;

export const QuizQuestionSchema = z.object({
  id: z.string().min(1),
  question: z.string().min(1),
  options: z.array(QuizOptionSchema).min(2).max(6),
  /** Shown once the question has been answered. */
  explanation: z.string().max(2000).optional(),
  /** Registered source id backing the answer. */
  sourceId: z.string().optional(),
});
export type QuizQuestion = z.infer<typeof QuizQuestionSchema>;

export const QuizBlockSchema = BaseBlockSchema.extend({
  blockType: z.literal('quiz'),
  data: z.object({
    title: z.string().min(1),
    description: z.string().max(4000).optional(),
    questions: z.array(QuizQuestionSchema).min(1).max(20),
    /** Show the reader's score once every question is answered. */
    showScore: z.boolean().default(true),
    /** Let the reader try again after finishing. */
    allowRetry: z.boolean().default(true),
    methodology: z.string().max(4000).optional(),
    sourceAttribution: z.string().optional(),
  }),
});

export const KnowledgeGraphNodeSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  /** The kind of thing: person, organization, company, country, source, story, event… */
  type: z.string().min(1),
  description: z.string().max(2000).optional(),
  url: z.string().url().optional(),
});
export type KnowledgeGraphNode = z.infer<typeof KnowledgeGraphNodeSchema>;

export const KnowledgeGraphEdgeSchema = z.object({
  id: z.string().min(1),
  /** The id of the node the relationship starts at. */
  from: z.string().min(1),
  /** The id of the node the relationship points to. */
  to: z.string().min(1),
  /** The relationship, in words (e.g. "employs", "cited by"). */
  relation: z.string().min(1),
  weight: z.number().optional(),
  /** A short label for the edge, shown on hover or in the list. */
  label: z.string().optional(),
});
export type KnowledgeGraphEdge = z.infer<typeof KnowledgeGraphEdgeSchema>;

export const KnowledgeGraphBlockSchema = BaseBlockSchema.extend({
  blockType: z.literal('knowledge_graph'),
  data: z.object({
    title: z.string().min(1),
    description: z.string().max(4000).optional(),
    nodes: z.array(KnowledgeGraphNodeSchema).min(1).max(120),
    edges: z.array(KnowledgeGraphEdgeSchema).max(400).default([]),
    /** The node the layout centres on. Defaults to the most connected node. */
    focusNodeId: z.string().optional(),
    methodology: z.string().max(4000).optional(),
    sourceAttribution: z.string().optional(),
  }),
});

export const AnimatedMapPointSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  lng: z.number().min(-180).max(180),
  lat: z.number().min(-90).max(90),
  /** The value that drives the marker's size and colour. */
  value: z.number().optional(),
  /** Marks this point as the focus of the story. */
  highlight: z.boolean().default(false),
});
export type AnimatedMapPoint = z.infer<typeof AnimatedMapPointSchema>;

export const AnimatedMapFrameSchema = z.object({
  /** When this frame's state was recorded. */
  at: z.string().min(1),
  /** A short label for the frame (e.g. "March 2026"). */
  label: z.string().optional(),
  /** The points visible in this frame. */
  points: z.array(AnimatedMapPointSchema).default([]),
});
export type AnimatedMapFrame = z.infer<typeof AnimatedMapFrameSchema>;

export const AnimatedMapBlockSchema = BaseBlockSchema.extend({
  blockType: z.literal('animated_map'),
  data: z.object({
    title: z.string().min(1),
    description: z.string().max(4000).optional(),
    /** The frames, in chronological order. */
    frames: z.array(AnimatedMapFrameSchema).min(2).max(60),
    /** What the values represent (e.g. "confirmed cases"). */
    valueLabel: z.string().optional(),
    unit: z.string().optional(),
    /** Play the frames automatically when the block is first seen. */
    autoplay: z.boolean().default(false),
    methodology: z.string().max(4000).optional(),
    sourceAttribution: z.string().optional(),
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
    // Media is served from the platform's own origin, so a relative path is
    // allowed here as it is for every other media block.
    mediaUrl: z.string().url().or(z.string().startsWith('/')).optional(),
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
    /**
     * Bind the block to a platform live feed. Readers then receive fresher
     * values over the realtime channel instead of the snapshot stored here.
     */
    liveKey: z.string().min(1).optional(),
    sourceAttribution: z.string().optional(),
  }),
});

export const UncertaintyPointSchema = z.object({
  id: z.string().min(1).optional(),
  /** What the estimate is about (e.g. "Q3 revenue", "Induction fusion"). */
  label: z.string().min(1),
  /** The point estimate. */
  value: z.number(),
  /** Lower bound of the interval. Must not exceed `value`. */
  low: z.number(),
  /** Upper bound of the interval. Must not be below `value`. */
  high: z.number(),
  /** Sample size behind the estimate, when known. */
  n: z.number().int().nonnegative().optional(),
  /** Registered source id backing this estimate. */
  sourceId: z.string().optional(),
  /** Short editorial caveat shown alongside the estimate. */
  note: z.string().max(2000).optional(),
});
export type UncertaintyPoint = z.infer<typeof UncertaintyPointSchema>;

export const UncertaintyBlockSchema = BaseBlockSchema.extend({
  blockType: z.literal('uncertainty'),
  data: z.object({
    title: z.string().min(1),
    subtitle: z.string().optional(),
    description: z.string().max(4000).optional(),
    /** Unit for every estimate (e.g. "GWh", "$bn", "%"). */
    unit: z.string().optional(),
    /** How the interval should be described (e.g. "95% credible interval"). */
    intervalLabel: z.string().optional(),
    /** Confidence level behind the intervals (0-1). */
    confidenceLevel: z.number().min(0).max(1).optional(),
    points: z.array(UncertaintyPointSchema).min(1).max(50),
    /** A reference line — consensus, target, or baseline. */
    referenceValue: z.number().optional(),
    referenceLabel: z.string().optional(),
    /** How the estimates and intervals were produced. */
    methodology: z.string().max(4000).optional(),
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

/* ------------------------------------------------------------------------- *
 * Flow, hierarchy and structure blocks
 * ------------------------------------------------------------------------- */

export const SankeyNodeSchema = z.object({
  /** A stable identifier, referenced by the links that point at this node. */
  id: z.string().min(1),
  label: z.string().min(1),
  color: BlockColorSchema.optional(),
});
export type SankeyNode = z.infer<typeof SankeyNodeSchema>;

export const SankeyLinkSchema = z.object({
  /** The id of the node the flow leaves. */
  source: z.string().min(1),
  /** The id of the node the flow arrives at. */
  target: z.string().min(1),
  /** How much flows along this link. */
  value: z.number().nonnegative(),
  label: z.string().optional(),
});
export type SankeyLink = z.infer<typeof SankeyLinkSchema>;

export const SankeyBlockSchema = BaseBlockSchema.extend({
  blockType: z.literal('sankey'),
  data: z.object({
    title: z.string().optional(),
    subtitle: z.string().optional(),
    caption: z.string().optional(),
    /**
     * How the flow is drawn.
     *
     * The same numbers read very differently depending on how they are
     * dressed: a wide ribbon says "most of this", a hairline says "there is
     * a connection", and a vertical flow reads top to bottom like a list.
     */
    style: z.enum(['classic', 'vertical', 'minimal', 'organic']).optional(),
    nodes: z.array(SankeyNodeSchema).min(2).max(60),
    links: z.array(SankeyLinkSchema).min(1).max(200),
    /** The unit the flow is measured in, e.g. `£m` or `tonnes`. */
    unit: z.string().optional(),
    /** Draw the value on each link. */
    showValues: z.boolean().optional(),
    sourceAttribution: z.string().optional(),
    methodology: z.string().max(4000).optional(),
    lastUpdated: z.string().optional(),
  }),
});
export type SankeyBlock = z.infer<typeof SankeyBlockSchema>;

export const TreemapNodeSchema = z.object({
  id: z.string().min(1),
  /** The id of the node this one sits inside. Absent for a root. */
  parentId: z.string().optional(),
  label: z.string().min(1),
  /** The size of this node. Absent for a node that only groups its children. */
  value: z.number().nonnegative().optional(),
  color: BlockColorSchema.optional(),
});
export type TreemapNode = z.infer<typeof TreemapNodeSchema>;

export const TreemapBlockSchema = BaseBlockSchema.extend({
  blockType: z.literal('treemap'),
  data: z.object({
    title: z.string().optional(),
    subtitle: z.string().optional(),
    caption: z.string().optional(),
    /**
     * The hierarchy, as a flat list.
     *
     * A flat list rather than a nested tree: it is far easier to edit, to
     * validate and for an agent to author, and the hierarchy is recovered
     * from `parentId` when the tree is drawn.
     */
    nodes: z.array(TreemapNodeSchema).min(1).max(500),
    /**
     * How the rectangles are tiled.
     *
     * The same parts laid out four ways: squarified keeps the rectangles as
     * close to squares as it can, slicing and dicing cut the space into
     * strips and grids, and the binary layout halves the space at each step.
     * The numbers are the same; the picture is not.
     */
    layout: z.enum(['squarify', 'slice', 'dice', 'binary']).optional(),
    unit: z.string().optional(),
    /** Draw the value on each rectangle. */
    showValues: z.boolean().optional(),
    sourceAttribution: z.string().optional(),
    methodology: z.string().max(4000).optional(),
    lastUpdated: z.string().optional(),
  }),
});
export type TreemapBlock = z.infer<typeof TreemapBlockSchema>;

export const NetworkNodeSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  /** A category the node belongs to, used to colour it. */
  group: z.string().optional(),
  /** How prominent the node is, relative to the others. */
  size: z.number().nonnegative().optional(),
  /** A link the node points at, e.g. the story it appears in. */
  url: z.string().url().optional(),
});
export type NetworkNode = z.infer<typeof NetworkNodeSchema>;

export const NetworkLinkSchema = z.object({
  /** The id of the node the connection leaves. */
  source: z.string().min(1),
  /** The id of the node the connection arrives at. */
  target: z.string().min(1),
  /** How strong the connection is, relative to the others. */
  weight: z.number().nonnegative().optional(),
  label: z.string().optional(),
});
export type NetworkLink = z.infer<typeof NetworkLinkSchema>;

export const NetworkGraphBlockSchema = BaseBlockSchema.extend({
  blockType: z.literal('network_graph'),
  data: z.object({
    title: z.string().optional(),
    subtitle: z.string().optional(),
    caption: z.string().optional(),
    nodes: z.array(NetworkNodeSchema).min(2).max(300),
    links: z.array(NetworkLinkSchema).min(1).max(1000),
    /**
     * How the nodes are drawn.
     *
     * Filled nodes are the plainest; outline nodes are hollow rings, which
     * reads better when the graph is dense; and bubble nodes grow with the
     * number of connections, so the hubs are obvious at a glance.
     */
    style: z.enum(['filled', 'outline', 'bubble']).optional(),
    /** How the nodes are arranged. */
    layout: z.enum(['force', 'radial', 'circular']).optional(),
    /** Draw the name next to each node. */
    showLabels: z.boolean().optional(),
    /** Let the reader drag the nodes around and filter the graph. */
    interactive: z.boolean().optional(),
    sourceAttribution: z.string().optional(),
    methodology: z.string().max(4000).optional(),
    lastUpdated: z.string().optional(),
  }),
});
export type NetworkGraphBlock = z.infer<typeof NetworkGraphBlockSchema>;

/* ------------------------------------------------------------------------- *
 * Analysis blocks
 * ------------------------------------------------------------------------- */

export const RegressionPointSchema = z.object({
  x: z.number(),
  y: z.number(),
  label: z.string().optional(),
});
export type RegressionPoint = z.infer<typeof RegressionPointSchema>;

export const RegressionBlockSchema = BaseBlockSchema.extend({
  blockType: z.literal('regression'),
  data: z.object({
    title: z.string().optional(),
    subtitle: z.string().optional(),
    caption: z.string().optional(),
    xLabel: z.string().optional(),
    yLabel: z.string().optional(),
    points: z.array(RegressionPointSchema).min(2).max(2000),
    /** The curve fitted through the points. */
    model: z.enum(['linear', 'quadratic', 'logarithmic', 'exponential']).optional(),
    /** How confident the band around the fit is, as a fraction. */
    confidenceLevel: z.number().min(0.5).max(0.999).optional(),
    /** Draw the band around the fitted curve. */
    showConfidenceBand: z.boolean().optional(),
    /** Draw the residuals beneath the fit. */
    showResiduals: z.boolean().optional(),
    /** Write the fitted equation out. */
    showEquation: z.boolean().optional(),
    sourceAttribution: z.string().optional(),
    methodology: z.string().max(4000).optional(),
    lastUpdated: z.string().optional(),
  }),
});
export type RegressionBlock = z.infer<typeof RegressionBlockSchema>;

export const AnomalyPointSchema = z.object({
  /** The label or date the measurement belongs to. */
  x: z.string().min(1),
  y: z.number(),
});
export type AnomalyPoint = z.infer<typeof AnomalyPointSchema>;

export const AnomalyBlockSchema = BaseBlockSchema.extend({
  blockType: z.literal('anomaly'),
  data: z.object({
    title: z.string().optional(),
    subtitle: z.string().optional(),
    caption: z.string().optional(),
    points: z.array(AnomalyPointSchema).min(3).max(2000),
    /** How an unusual measurement is recognised. */
    method: z.enum(['zscore', 'mad', 'iqr', 'percentile']).optional(),
    /** How far from normal a measurement has to be to count as an anomaly. */
    threshold: z.number().positive().optional(),
    /** How many neighbouring measurements the rolling methods look at. */
    window: z.number().int().min(3).max(200).optional(),
    /** Which direction counts as unusual. */
    direction: z.enum(['both', 'up', 'down']).optional(),
    unit: z.string().optional(),
    sourceAttribution: z.string().optional(),
    methodology: z.string().max(4000).optional(),
    lastUpdated: z.string().optional(),
  }),
});
export type AnomalyBlock = z.infer<typeof AnomalyBlockSchema>;

export const SurveyResponseSchema = z.object({
  option: z.string().min(1),
  count: z.number().int().nonnegative(),
  color: BlockColorSchema.optional(),
});
export type SurveyResponse = z.infer<typeof SurveyResponseSchema>;

export const SurveySegmentSchema = z.object({
  label: z.string().min(1),
  responses: z.array(SurveyResponseSchema).min(1).max(30),
});
export type SurveySegment = z.infer<typeof SurveySegmentSchema>;

export const SurveyResultsBlockSchema = BaseBlockSchema.extend({
  blockType: z.literal('survey_results'),
  data: z.object({
    title: z.string().optional(),
    subtitle: z.string().optional(),
    caption: z.string().optional(),
    /** The question the respondents were asked. */
    question: z.string().min(1),
    /**
     * How the answers are drawn.
     *
     * Bars are the plainest read, a stack shows the split in one bar, a
     * waffle counts squares and a donut turns the whole thing into a ring.
     */
    style: z.enum(['bars', 'stack', 'waffle', 'donut']).optional(),
    responses: z.array(SurveyResponseSchema).min(1).max(30),
    /** A breakdown of the same question by a subgroup. */
    segments: z.array(SurveySegmentSchema).max(20).optional(),
    /** How many people answered. */
    totalRespondents: z.number().int().nonnegative().optional(),
    /** The margin of error, as a percentage. */
    marginOfError: z.number().nonnegative().max(100).optional(),
    /** When the respondents were asked. */
    fieldDates: z.string().optional(),
    sourceAttribution: z.string().optional(),
    methodology: z.string().max(4000).optional(),
    lastUpdated: z.string().optional(),
  }),
});
export type SurveyResultsBlock = z.infer<typeof SurveyResultsBlockSchema>;

/* ------------------------------------------------------------------------- *
 * Immersive blocks
 * ------------------------------------------------------------------------- */

/**
 * The picture a scrollytelling step shows.
 *
 * A union rather than one loose payload because the steps of a scrollytelling
 * piece are the one place a reader is walked through a sequence, and each step
 * is allowed to show a different kind of thing. The editor picks which kind
 * each step is; the renderer draws it.
 */
export const ScrollyVisualSchema = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('chart'),
    /** A complete chart payload, drawn exactly as a chart block draws it. */
    chart: ChartBlockSchema.shape.data,
  }),
  z.object({
    kind: z.literal('image'),
    url: z.string().url(),
    alt: z.string().min(1),
    caption: z.string().optional(),
  }),
  z.object({
    kind: z.literal('stat'),
    value: z.string().min(1),
    label: z.string().min(1),
    /** How the figure has moved, e.g. `+4.2% since 2023`. */
    delta: z.string().optional(),
  }),
  z.object({
    kind: z.literal('text'),
    /** The words shown beside the picture. Never interpreted as markup. */
    text: z.string().max(5000),
  }),
]);
export type ScrollyVisual = z.infer<typeof ScrollyVisualSchema>;

export const ScrollyStepSchema = z.object({
  id: z.string().min(1),
  heading: z.string().optional(),
  body: z.string().optional(),
  visual: ScrollyVisualSchema,
});
export type ScrollyStep = z.infer<typeof ScrollyStepSchema>;

export const ScrollyBlockSchema = BaseBlockSchema.extend({
  blockType: z.literal('scrolly'),
  data: z.object({
    title: z.string().optional(),
    /** The steps of the narrative, in the order the reader meets them. */
    steps: z.array(ScrollyStepSchema).min(1).max(20),
    /**
     * How the steps are arranged against the picture.
     *
     * `sticky` keeps the picture in place while the steps go past it, which
     * is how a scrollytelling piece is read. `stacked` gives every step its
     * own picture, which is how it reads on a phone.
     */
    layout: z.enum(['sticky', 'stacked']).optional(),
    /** Show a marker of how far through the steps the reader is. */
    showProgress: z.boolean().optional(),
    caption: z.string().optional(),
    sourceAttribution: z.string().optional(),
    methodology: z.string().max(4000).optional(),
  }),
});
export type ScrollyBlock = z.infer<typeof ScrollyBlockSchema>;

export const MotionChartBlockSchema = BaseBlockSchema.extend({
  blockType: z.literal('motion_chart'),
  data: z.object({
    title: z.string().optional(),
    subtitle: z.string().optional(),
    caption: z.string().optional(),
    /** The chart that is drawn, and then animated. */
    chart: ChartBlockSchema.shape.data,
    /** How the chart animates itself in. */
    animation: z.enum(['grow', 'draw', 'sweep', 'count', 'fade']).optional(),
    /** How long the animation takes, in milliseconds. */
    durationMs: z.number().int().min(100).max(20000).optional(),
    /** How long after each other the marks start, in milliseconds. */
    staggerMs: z.number().int().min(0).max(2000).optional(),
    /** Start again when the animation ends. */
    loop: z.boolean().optional(),
    /**
     * Honour the reader's system preference for reduced motion.
     *
     * On by default. A reader who has asked their operating system for less
     * movement gets the finished chart, not an animation.
     */
    respectReducedMotion: z.boolean().optional(),
    sourceAttribution: z.string().optional(),
    methodology: z.string().max(4000).optional(),
  }),
});
export type MotionChartBlock = z.infer<typeof MotionChartBlockSchema>;

/**
 * A block that draws whatever the newsroom tells it to draw.
 *
 * The payload is HTML, CSS and JavaScript, run inside an iframe that is
 * sandboxed without `allow-same-origin`. That puts the frame on an opaque
 * origin: it cannot read the page, the reader's cookies or their storage, and
 * it cannot navigate the story out from under them. The block's own data is
 * handed to the frame over `postMessage` and nothing is read back except
 * messages the frame sends itself.
 *
 * This is the one block in the catalogue whose payload is code. It is
 * deliberately *not* run through the text sanitiser — the frame's sandbox is
 * the security boundary, and sanitising the code would defeat the purpose of
 * the block — so it may only be used by principals who are allowed to publish
 * code into a story.
 */
export const SandboxBlockSchema = BaseBlockSchema.extend({
  blockType: z.literal('sandbox'),
  data: z.object({
    title: z.string().optional(),
    /** The markup and styles the frame is given. */
    html: z.string().max(200000),
    /** The script the frame runs, if any. */
    script: z.string().max(200000).optional(),
    /** The data handed to the frame once it has loaded. */
    data: z.record(z.unknown()).optional(),
    /** How tall the frame is, in pixels. */
    height: z.number().int().min(80).max(2000).optional(),
    /** Let the frame run its script. */
    allowScripts: z.boolean().optional(),
    caption: z.string().optional(),
    /** The block in words, for anyone who cannot see what it drew. */
    accessibilityText: z.string().max(5000).optional(),
    sourceAttribution: z.string().optional(),
  }),
});
export type SandboxBlock = z.infer<typeof SandboxBlockSchema>;

export const Scene3DPointSchema = z.object({
  lat: z.number().min(-90).max(90),
  lon: z.number().min(-180).max(180),
  value: z.number().optional(),
  label: z.string().optional(),
  color: BlockColorSchema.optional(),
});
export type Scene3DPoint = z.infer<typeof Scene3DPointSchema>;

export const Scene3DBarSchema = z.object({
  label: z.string().min(1),
  value: z.number(),
  color: BlockColorSchema.optional(),
});
export type Scene3DBar = z.infer<typeof Scene3DBarSchema>;

export const Scene3DBlockSchema = BaseBlockSchema.extend({
  blockType: z.literal('scene_3d'),
  data: z.object({
    title: z.string().optional(),
    subtitle: z.string().optional(),
    /** What kind of scene is drawn. */
    scene: z.enum(['globe', 'points', 'bars', 'model']).optional(),
    /** The places marked on a globe, or the points of a point cloud. */
    points: z.array(Scene3DPointSchema).max(2000).optional(),
    /** The columns of a three-dimensional bar chart. */
    bars: z.array(Scene3DBarSchema).max(200).optional(),
    /** The model to show, as a `.glb` file. */
    modelUrl: z.string().url().optional(),
    /** Turn the scene slowly on its own. */
    autoRotate: z.boolean().optional(),
    /** How far away the camera stands. */
    cameraDistance: z.number().min(0.5).max(200).optional(),
    /** How tall the scene is, in pixels. */
    height: z.number().int().min(120).max(1200).optional(),
    background: BlockColorSchema.optional(),
    /** The picture shown where the scene cannot be drawn, e.g. on a phone. */
    posterUrl: z.string().url().optional(),
    /** The scene in words, for anyone who cannot see it. */
    alt: z.string().max(1000).optional(),
    caption: z.string().optional(),
    sourceAttribution: z.string().optional(),
    methodology: z.string().max(4000).optional(),
  }),
});
export type Scene3DBlock = z.infer<typeof Scene3DBlockSchema>;

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
  AnimatedMapBlockSchema,
  KnowledgeGraphBlockSchema,
  QuizBlockSchema,
  CorrelationBlockSchema,
  SensitivityBlockSchema,
  WhatIfBlockSchema,
  LiveCommentsBlockSchema,
  PredictionLeaderboardBlockSchema,
  FinancialBlockSchema,
  ElectionBlockSchema,
  DisasterBlockSchema,
  ScienceBlockSchema,
  InterviewBlockSchema,
  LiveDataBlockSchema,
  UncertaintyBlockSchema,
  EvidenceBlockSchema,
  PerspectiveBlockSchema,
  FactCheckBlockSchema,
  VideoGalleryBlockSchema,
  PodcastBlockSchema,
  WaveformBlockSchema,
  TranscriptBlockSchema,
  DatasetBlockSchema,
  SankeyBlockSchema,
  TreemapBlockSchema,
  NetworkGraphBlockSchema,
  RegressionBlockSchema,
  AnomalyBlockSchema,
  SurveyResultsBlockSchema,
  ScrollyBlockSchema,
  MotionChartBlockSchema,
  SandboxBlockSchema,
  Scene3DBlockSchema,
]);

export type StoryBlock = z.infer<typeof StoryBlockSchema>;
export type Block = StoryBlock;
export type BaseBlock = z.infer<typeof BaseBlockSchema>;

/**
 * The payload a caller provides for a block.
 *
 * This is the schema's *input* type, not its output type. A field the
 * schema gives a default may be left out by the caller — the platform fills
 * it in on write — so an editor's form must not be forced to spell out every
 * defaulted field by hand.
 */
export type BlockDataInput<T extends z.ZodTypeAny> = z.input<T>['data'];

export type HeadingBlockDataInput = BlockDataInput<typeof HeadingBlockSchema>;
export type ParagraphBlockDataInput = BlockDataInput<typeof ParagraphBlockSchema>;
export type SummaryBlockDataInput = BlockDataInput<typeof SummaryBlockSchema>;
export type QuoteBlockDataInput = BlockDataInput<typeof QuoteBlockSchema>;
export type ImageBlockDataInput = BlockDataInput<typeof ImageBlockSchema>;
export type GalleryBlockDataInput = BlockDataInput<typeof GalleryBlockSchema>;
export type ChartBlockDataInput = BlockDataInput<typeof ChartBlockSchema>;
export type TableBlockDataInput = BlockDataInput<typeof TableBlockSchema>;
export type TimelineBlockDataInput = BlockDataInput<typeof TimelineBlockSchema>;
export type MapBlockDataInput = BlockDataInput<typeof MapBlockSchema>;
export type VideoBlockDataInput = BlockDataInput<typeof VideoBlockSchema>;
export type AudioBlockDataInput = BlockDataInput<typeof AudioBlockSchema>;
export type CalloutBlockDataInput = BlockDataInput<typeof CalloutBlockSchema>;
export type StatisticBlockDataInput = BlockDataInput<typeof StatisticBlockSchema>;
export type CitationBlockDataInput = BlockDataInput<typeof CitationBlockSchema>;
export type SourceBlockDataInput = BlockDataInput<typeof SourceBlockSchema>;
export type EntityBlockDataInput = BlockDataInput<typeof EntityBlockSchema>;
export type ComparisonBlockDataInput = BlockDataInput<typeof ComparisonBlockSchema>;
export type RelatedStoriesBlockDataInput = BlockDataInput<typeof RelatedStoriesBlockSchema>;
export type DocumentViewerBlockDataInput = BlockDataInput<typeof DocumentViewerBlockSchema>;
export type InterviewBlockDataInput = BlockDataInput<typeof InterviewBlockSchema>;
export type FlowBlockDataInput = BlockDataInput<typeof FlowBlockSchema>;
export type DiagramBlockDataInput = BlockDataInput<typeof DiagramBlockSchema>;
export type SlideDeckBlockDataInput = BlockDataInput<typeof SlideDeckBlockSchema>;
export type ImageDiffBlockDataInput = BlockDataInput<typeof ImageDiffBlockSchema>;
export type EmbedBlockDataInput = BlockDataInput<typeof EmbedBlockSchema>;
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
export type AnimatedMapBlock = z.infer<typeof AnimatedMapBlockSchema>;
export type KnowledgeGraphBlock = z.infer<typeof KnowledgeGraphBlockSchema>;
export type QuizBlock = z.infer<typeof QuizBlockSchema>;
export type CorrelationBlock = z.infer<typeof CorrelationBlockSchema>;
export type SensitivityBlock = z.infer<typeof SensitivityBlockSchema>;
export type WhatIfBlock = z.infer<typeof WhatIfBlockSchema>;
export type LiveCommentsBlock = z.infer<typeof LiveCommentsBlockSchema>;
export type PredictionLeaderboardBlock = z.infer<typeof PredictionLeaderboardBlockSchema>;
export type FinancialBlock = z.infer<typeof FinancialBlockSchema>;
export type ElectionBlock = z.infer<typeof ElectionBlockSchema>;
export type DisasterBlock = z.infer<typeof DisasterBlockSchema>;
export type ScienceBlock = z.infer<typeof ScienceBlockSchema>;
export type InterviewBlock = z.infer<typeof InterviewBlockSchema>;
export type LiveDataBlock = z.infer<typeof LiveDataBlockSchema>;
export type UncertaintyBlock = z.infer<typeof UncertaintyBlockSchema>;
export type EvidenceBlock = z.infer<typeof EvidenceBlockSchema>;
export type PerspectiveBlock = z.infer<typeof PerspectiveBlockSchema>;
export type FactCheckBlock = z.infer<typeof FactCheckBlockSchema>;
export type VideoGalleryBlock = z.infer<typeof VideoGalleryBlockSchema>;
export type PodcastBlock = z.infer<typeof PodcastBlockSchema>;
export type WaveformBlock = z.infer<typeof WaveformBlockSchema>;
export type TranscriptBlock = z.infer<typeof TranscriptBlockSchema>;
export type DatasetBlock = z.infer<typeof DatasetBlockSchema>;
export type SankeyBlockDataInput = BlockDataInput<typeof SankeyBlockSchema>;
export type TreemapBlockDataInput = BlockDataInput<typeof TreemapBlockSchema>;
export type NetworkGraphBlockDataInput = BlockDataInput<typeof NetworkGraphBlockSchema>;
export type RegressionBlockDataInput = BlockDataInput<typeof RegressionBlockSchema>;
export type AnomalyBlockDataInput = BlockDataInput<typeof AnomalyBlockSchema>;
export type SurveyResultsBlockDataInput = BlockDataInput<typeof SurveyResultsBlockSchema>;
export type ScrollyBlockDataInput = BlockDataInput<typeof ScrollyBlockSchema>;
export type MotionChartBlockDataInput = BlockDataInput<typeof MotionChartBlockSchema>;
export type SandboxBlockDataInput = BlockDataInput<typeof SandboxBlockSchema>;
export type Scene3DBlockDataInput = BlockDataInput<typeof Scene3DBlockSchema>;
