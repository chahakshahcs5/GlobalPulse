import type { z } from 'zod';
import {
  AnnotatedImageBlockSchema,
  AudioBlockSchema,
  CalloutBlockSchema,
  CalculatorBlockSchema,
  ChartBlockSchema,
  CitationBlockSchema,
  ComparisonBlockSchema,
  DataExplorerBlockSchema,
  DisasterBlockSchema,
  DiagramBlockSchema,
  DocumentViewerBlockSchema,
  ElectionBlockSchema,
  EmbedBlockSchema,
  EntityBlockSchema,
  EvidenceBlockSchema,
  FactCheckBlockSchema,
  FinancialBlockSchema,
  FlowBlockSchema,
  GalleryBlockSchema,
  HeadingBlockSchema,
  ImageBlockSchema,
  ImageDiffBlockSchema,
  InterviewBlockSchema,
  LiveDataBlockSchema,
  LiveTickerBlockSchema,
  MapBlockSchema,
  ParagraphBlockSchema,
  PerspectiveBlockSchema,
  PollBlockSchema,
  QuoteBlockSchema,
  RankingBlockSchema,
  RelatedStoriesBlockSchema,
  ScienceBlockSchema,
  SlideDeckBlockSchema,
  SourceBlockSchema,
  StatisticBlockSchema,
  SummaryBlockSchema,
  TableBlockSchema,
  TimelineBlockSchema,
  VideoBlockSchema,
  WhatChangedBlockSchema,
  VideoGalleryBlockSchema,
  PodcastBlockSchema,
  WaveformBlockSchema,
  TranscriptBlockSchema,
  DatasetBlockSchema,
} from './blocks';

export type BlockCategory =
  'text' | 'media' | 'data' | 'map' | 'interactive' | 'context' | 'evidence' | 'specialized';

export interface BlockCapabilities {
  web: boolean;
  mobile: boolean;
  api: boolean;
  mcp: boolean;
}

export interface BlockDefinition {
  type: string;
  category: BlockCategory;
  description: string;
  schemaVersion: number;
  schema: z.ZodTypeAny;
  capabilities: BlockCapabilities;
  recommendedFor?: string[];
  example?: Record<string, unknown>;
}

type DefinitionOptions = {
  category: BlockCategory;
  description: string;
  schemaVersion?: number;
  mobile?: boolean;
  recommendedFor?: string[];
  example?: Record<string, unknown>;
};

const definitions: BlockDefinition[] = [];

function define(
  type: string,
  schema: z.ZodTypeAny,
  {
    category,
    description,
    schemaVersion = 1,
    mobile = true,
    recommendedFor,
    example,
  }: DefinitionOptions
): void {
  definitions.push({
    type,
    category,
    description,
    schemaVersion,
    schema,
    capabilities: { web: true, mobile, api: true, mcp: true },
    recommendedFor,
    example,
  });
}

// --- Text & editorial -------------------------------------------------------
define('heading', HeadingBlockSchema, {
  category: 'text',
  description: 'Section heading (levels 1-4) with optional subtext.',
});
define('paragraph', ParagraphBlockSchema, {
  category: 'text',
  description: 'Body paragraph, plain text or Markdown. HTML is stripped at write time.',
});
define('summary', SummaryBlockSchema, {
  category: 'text',
  description: 'Key-takeaway / executive briefing block with bullet points.',
});
define('quote', QuoteBlockSchema, {
  category: 'text',
  description: 'Pull quote with required attribution and optional portrait/source URL.',
});
define('callout', CalloutBlockSchema, {
  category: 'text',
  description: 'Informational, warning, tip, or critical editorial callout.',
});
define('citation', CitationBlockSchema, {
  category: 'evidence',
  description: 'A claim coupled to one or more registered source IDs.',
});

// --- Media -----------------------------------------------------------------
define('image', ImageBlockSchema, {
  category: 'media',
  description: 'Single image with required alt text, caption, and credit.',
});
define('gallery', GalleryBlockSchema, {
  category: 'media',
  description: 'Grid, carousel, or masonry image gallery.',
});
define('annotated_image', AnnotatedImageBlockSchema, {
  category: 'media',
  description: 'Image with percentage-positioned annotations and per-annotation sources.',
  recommendedFor: ['investigations', 'explainers', 'satellite analysis'],
  example: {
    url: 'https://example.com/satellite.jpg',
    altText: 'Satellite image of the flooded delta',
    annotations: [
      {
        id: 'a1',
        xPercent: 42,
        yPercent: 55,
        label: 'Dam breach',
        description: 'Observed breach point',
      },
    ],
  },
});
define('image_diff', ImageDiffBlockSchema, {
  category: 'media',
  description: 'Before/after image comparison with draggable split.',
});
define('video', VideoBlockSchema, {
  category: 'media',
  description: 'Video with transcript segments and chapter markers.',
});
define('audio', AudioBlockSchema, {
  category: 'media',
  description: 'Audio player with transcript, chapters, speakers, and cue points.',
});
define('slide_deck', SlideDeckBlockSchema, {
  category: 'media',
  description: 'Embedded slide presentation with source attribution per slide.',
});
define('embed', EmbedBlockSchema, {
  category: 'media',
  description: 'External social/media embed with an allow-listed provider.',
});

// --- Data & visualisation ---------------------------------------------------
define('chart', ChartBlockSchema, {
  category: 'data',
  description:
    'Accessible D3 chart: line, area, bar variants, scatter, pie/donut, waterfall, slope, bump, dot, lollipop, diverging, radar, small multiples, sparkline. Raw values are stored alongside the chart.',
  example: {
    chartType: 'line',
    title: 'Reported cases over time',
    xAxis: { key: 'year', label: 'Year', type: 'time' },
    yAxis: { label: 'Cases', unit: 'cases' },
    series: [{ name: 'Confirmed', key: 'cases' }],
    values: [
      { year: '2024', cases: 120 },
      { year: '2025', cases: 180 },
    ],
    methodology: 'Official ministry counts, retrieved weekly.',
  },
});
define('table', TableBlockSchema, {
  category: 'data',
  description: 'Data table with optional sorting, filtering, search, pagination, and CSV download.',
});
define('data_explorer', DataExplorerBlockSchema, {
  category: 'data',
  description:
    'Reusable interactive explorer over an embedded dataset. Supports dimension/metric switching, filters, and data download.',
  recommendedFor: ['investigations', 'data stories', 'explainers'],
  example: {
    title: 'Global GDP',
    dataset: { name: 'World Bank GDP', sourceAttribution: 'World Bank', lastUpdated: '2026-01-01' },
    dimensions: [{ key: 'country', label: 'Country', type: 'category' }],
    metrics: [{ key: 'gdp', label: 'GDP', unit: 'USD' }],
    defaultDimension: 'country',
    defaultMetric: 'gdp',
    rows: [
      { country: 'India', gdp: 3900000000000 },
      { country: 'Japan', gdp: 4200000000000 },
    ],
  },
});
define('statistic', StatisticBlockSchema, {
  category: 'data',
  description: 'KPI / fact card with unit, trend, comparison period, source, and methodology.',
});
define('ranking', RankingBlockSchema, {
  category: 'data',
  description: 'Ranked list with rank movement, values, and explicit methodology.',
  example: {
    title: 'Most liveable cities',
    items: [
      { rank: 1, previousRank: 3, name: 'Vienna', value: 98.4, unit: 'index' },
      { rank: 2, previousRank: 2, name: 'Copenhagen', value: 98.0, unit: 'index' },
    ],
    methodology: 'Composite index across 30 indicators.',
  },
});
define('financial', FinancialBlockSchema, {
  category: 'data',
  description: 'Timestamped financial metrics and optional time series.',
});
define('election', ElectionBlockSchema, {
  category: 'data',
  description: 'Election results: seats, vote share, turnout, historical comparison.',
});
define('disaster', DisasterBlockSchema, {
  category: 'data',
  description: 'Earthquake, storm, flood, or fire metrics with timestamps and affected areas.',
  example: {
    title: 'M7.1 earthquake',
    disasterType: 'earthquake',
    occurredAt: '2026-10-20T10:42:00Z',
    metrics: [
      { label: 'Magnitude', value: 7.1, unit: 'Mww' },
      { label: 'Depth', value: 18.2, unit: 'km' },
    ],
    affectedAreas: ['Sendai', 'Miyagi'],
  },
});
define('science', ScienceBlockSchema, {
  category: 'data',
  description: 'Findings, measurements, equations, paper metadata, and scientific diagrams.',
});

// --- Maps & process ---------------------------------------------------------
define('map', MapBlockSchema, {
  category: 'map',
  description:
    'Map with point, choropleth, heatmap, route, or comparison layers. Markers and GeoJSON layers are structured data, not screenshots.',
});
define('timeline', TimelineBlockSchema, {
  category: 'map',
  description: 'Chronological milestones; each item can carry entities, sources, and media.',
});
define('diagram', DiagramBlockSchema, {
  category: 'map',
  description: 'Mermaid, declarative SVG, flowchart, or sequence diagram.',
});
define('flow', FlowBlockSchema, {
  category: 'map',
  description: 'Process / explainer steps with optional branches and citations.',
});

// --- Interactive ------------------------------------------------------------
define('live_ticker', LiveTickerBlockSchema, {
  category: 'interactive',
  description: 'Volatile ticker values with refresh interval and timestamps.',
});
define('live_data', LiveDataBlockSchema, {
  category: 'interactive',
  description:
    'Named live datasets with provider, refresh interval, timestamp, license, and methodology.',
  example: {
    title: 'Markets',
    refreshIntervalSeconds: 60,
    items: [
      {
        id: 'nifty',
        label: 'NIFTY 50',
        provider: 'NSE',
        value: 25430.2,
        previousValue: 25130.1,
        change: 1.2,
        unit: 'index',
        asOf: '2026-10-20T10:42:00Z',
      },
    ],
  },
});
define('calculator', CalculatorBlockSchema, {
  category: 'interactive',
  description:
    'Generic calculator with structured inputs, safe formula expressions, outputs, units, assumptions, and sources.',
  example: {
    title: 'Fuel cost',
    inputs: [{ id: 'distance', label: 'Distance', type: 'number', unit: 'km', defaultValue: 100 }],
    outputs: [{ id: 'cost', label: 'Cost', expression: 'distance * 7.5', unit: 'INR' }],
  },
});
define('poll', PollBlockSchema, {
  category: 'interactive',
  description: 'Reader poll with options, expiry, and vote counts.',
});
define('document_viewer', DocumentViewerBlockSchema, {
  category: 'interactive',
  description: 'Paginated document viewer with sourced highlights.',
});

// --- Context & evidence -----------------------------------------------------
define('source', SourceBlockSchema, {
  category: 'context',
  description: 'Registered source citation card.',
});
define('entity', EntityBlockSchema, {
  category: 'context',
  description: 'Person, organization, company, country, location, or product card.',
});
define('related_stories', RelatedStoriesBlockSchema, {
  category: 'context',
  description: 'Related story references resolved by the frontend.',
});
define('what_changed', WhatChangedBlockSchema, {
  category: 'context',
  description: 'Structured change summary between two story versions.',
});
define('evidence', EvidenceBlockSchema, {
  category: 'evidence',
  description:
    'Claim/evidence summary: claims with status and methodology, plus supporting, contradicting, or contextual evidence.',
  recommendedFor: ['fact checks', 'investigations', 'breaking news'],
});
define('perspective', PerspectiveBlockSchema, {
  category: 'evidence',
  description: 'Documented perspectives anchored to their sources. Not a forced two-sides frame.',
});
define('fact_check', FactCheckBlockSchema, {
  category: 'evidence',
  description: 'Claim-level fact-check result with confidence methodology and review metadata.',
});
define('comparison', ComparisonBlockSchema, {
  category: 'context',
  description: 'Two-option comparison card.',
});
define('interview', InterviewBlockSchema, {
  category: 'specialized',
  description: 'Structured Q&A interview with optional audio/video media and per-segment sources.',
  recommendedFor: ['interviews', 'profiles', 'explainers'],
});

// --- Media expansion -------------------------------------------------------
define('video_gallery', VideoGalleryBlockSchema, {
  category: 'media',
  description:
    'Multiple videos in one block, each with poster art, chapters, and optional transcript segments.',
  recommendedFor: ['documentaries', 'event recaps', 'explainers'],
});
define('podcast', PodcastBlockSchema, {
  category: 'media',
  description:
    'Podcast show with episodes: episode numbers, artwork, transcripts, chapters, and speakers.',
  recommendedFor: ['podcasts', 'newsroom audio', 'series'],
});
define('waveform', WaveformBlockSchema, {
  category: 'media',
  description:
    'Audio/video waveform with amplitude samples and segments that reference other blocks (cue points).',
  recommendedFor: ['audio briefings', 'podcasts', 'radio'],
});
define('transcript', TranscriptBlockSchema, {
  category: 'media',
  description:
    'Timestamped transcript with speaker attribution, linked to the audio or video it belongs to.',
  recommendedFor: ['interviews', 'podcasts', 'accessibility'],
});
define('dataset', DatasetBlockSchema, {
  category: 'data',
  description:
    'Published dataset with column definitions, a preview table, download formats, license, and methodology.',
  recommendedFor: ['data journalism', 'investigations', 'transparency'],
});

// Remove internal placeholder before exposing the registry.
const cleaned = definitions.filter((d) => !d.type.endsWith('_placeholder'));

export const BLOCK_REGISTRY: Readonly<Record<string, BlockDefinition>> = Object.freeze(
  Object.fromEntries(cleaned.map((d) => [d.type, d]))
);

export function getBlockDefinition(type: string): BlockDefinition | undefined {
  return BLOCK_REGISTRY[type];
}

export function listBlockDefinitions(): BlockDefinition[] {
  return Object.values(BLOCK_REGISTRY);
}

export function listBlockTypes(): string[] {
  return Object.keys(BLOCK_REGISTRY);
}

export function supportsBlockType(type: string): boolean {
  return Boolean(BLOCK_REGISTRY[type]);
}

/**
 * Minimal Zod -> JSON Schema converter covering the subset used by story
 * blocks. This intentionally avoids an extra dependency; generated schemas are
 * consumed by MCP discovery, documentation, and external AI agents.
 */
export function zodToJsonSchema(schema: z.ZodTypeAny): Record<string, unknown> {
  const def = schema._def as unknown as {
    typeName?: string;
    shape?: () => Record<string, z.ZodTypeAny>;
    type?: z.ZodTypeAny;
    element?: z.ZodTypeAny;
    options?: z.ZodTypeAny[];
    values?: string[];
    value?: unknown;
    checks?: Array<{ kind: string; value?: number; regex?: RegExp }>;
    keyType?: z.ZodTypeAny;
    valueType?: z.ZodTypeAny;
    rest?: z.ZodTypeAny;
    items?: z.ZodTypeAny[];
    schema?: z.ZodTypeAny;
    defaultValue?: () => unknown;
    innerType?: z.ZodTypeAny;
    left?: z.ZodTypeAny;
    right?: z.ZodTypeAny;
  };

  switch (def.typeName) {
    case 'ZodObject': {
      const shape = def.shape?.() || {};
      const properties: Record<string, unknown> = {};
      const required: string[] = [];
      for (const [key, value] of Object.entries(shape)) {
        properties[key] = zodToJsonSchema(value);
        if (!isOptionalLike(value)) required.push(key);
      }
      return { type: 'object', properties, required, additionalProperties: false };
    }
    case 'ZodArray':
      return { type: 'array', items: def.type ? zodToJsonSchema(def.type) : {} };
    case 'ZodTuple':
      return {
        type: 'array',
        prefixItems: (def.items || []).map(zodToJsonSchema),
        minItems: def.items?.length,
        maxItems: def.items?.length,
      };
    case 'ZodUnion':
    case 'ZodDiscriminatedUnion':
      return { anyOf: (def.options || []).map(zodToJsonSchema) };
    case 'ZodEnum':
      return { type: 'string', enum: def.values || [] };
    case 'ZodNativeEnum':
      return { type: 'string', enum: Object.values((def.values || {}) as Record<string, string>) };
    case 'ZodLiteral':
      return { const: def.value };
    case 'ZodNumber': {
      const out: Record<string, unknown> = { type: 'number' };
      for (const check of def.checks || []) {
        if (check.kind === 'min' && check.value !== undefined) out.minimum = check.value;
        if (check.kind === 'max' && check.value !== undefined) out.maximum = check.value;
        if (check.kind === 'int') out.type = 'integer';
      }
      return out;
    }
    case 'ZodString': {
      const out: Record<string, unknown> = { type: 'string' };
      for (const check of def.checks || []) {
        if (check.kind === 'min' && check.value !== undefined) out.minLength = check.value;
        if (check.kind === 'max' && check.value !== undefined) out.maxLength = check.value;
        if (check.kind === 'url') out.format = 'uri';
        if (check.kind === 'regex' && check.regex) out.pattern = check.regex.source;
      }
      return out;
    }
    case 'ZodBoolean':
      return { type: 'boolean' };
    case 'ZodRecord':
      return {
        type: 'object',
        additionalProperties: def.valueType ? zodToJsonSchema(def.valueType) : {},
      };
    case 'ZodOptional':
    case 'ZodNullable':
    case 'ZodDefault':
    case 'ZodBranded':
    case 'ZodEffects':
      if (def.typeName === 'ZodDefault' && def.innerType) {
        return { ...zodToJsonSchema(def.innerType), default: def.defaultValue?.() };
      }
      if (def.innerType) return zodToJsonSchema(def.innerType);
      if (def.type) return zodToJsonSchema(def.type);
      if (def.schema) return zodToJsonSchema(def.schema);
      return {};
    case 'ZodAny':
    case 'ZodUnknown':
      return {};
    default:
      return {};
  }
}

function isOptionalLike(schema: z.ZodTypeAny): boolean {
  const typeName = (schema._def as unknown as { typeName?: string }).typeName;
  return (
    typeName === 'ZodOptional' ||
    typeName === 'ZodDefault' ||
    typeName === 'ZodNullable' ||
    typeName === 'ZodEffects'
  );
}

export interface BlockCatalogEntry {
  type: string;
  category: BlockCategory;
  description: string;
  schemaVersion: number;
  capabilities: BlockCapabilities;
  recommendedFor?: string[];
  example?: Record<string, unknown>;
  jsonSchema: Record<string, unknown>;
}

export interface BlockCatalog {
  generatedAt: string;
  version: string;
  count: number;
  blocks: BlockCatalogEntry[];
}

export function buildBlockCatalog(): BlockCatalog {
  return {
    generatedAt: new Date().toISOString(),
    version: '1.0.0',
    count: cleaned.length,
    blocks: cleaned.map((definition) => ({
      type: definition.type,
      category: definition.category,
      description: definition.description,
      schemaVersion: definition.schemaVersion,
      capabilities: definition.capabilities,
      recommendedFor: definition.recommendedFor,
      example: definition.example,
      jsonSchema: zodToJsonSchema(definition.schema),
    })),
  };
}
