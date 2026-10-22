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
  AnimatedMapBlockSchema,
  KnowledgeGraphBlockSchema,
  QuizBlockSchema,
  CorrelationBlockSchema,
  SensitivityBlockSchema,
  WhatIfBlockSchema,
  LiveCommentsBlockSchema,
  PredictionLeaderboardBlockSchema,
  RelatedStoriesBlockSchema,
  UncertaintyBlockSchema,
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
} from './blocks';

export type BlockCategory =
  | 'text'
  | 'media'
  | 'data'
  | 'map'
  | 'interactive'
  | 'context'
  | 'evidence'
  | 'specialized'
  | 'immersive';

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
    'Programmatic D3 visualization. 21 chart types: line, area, bar, stacked_bar, grouped_bar, scatter, heatmap, histogram, waterfall, donut, pie, kpi, comparison, slope, dot_plot, lollipop, diverging_bar, sparkline, bump, radar and small_multiples. Supports click-to-reveal annotations anchored to specific data points.',
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
define('uncertainty', UncertaintyBlockSchema, {
  category: 'data',
  description:
    'Estimates with confidence intervals. Each point carries a point estimate, its lower and upper bounds, an optional sample size, and an optional source. Also supports a reference line for a consensus or target value.',
  recommendedFor: ['forecasts', 'surveys', 'polling', 'model outputs', 'scientific estimates'],
  example: {
    title: 'Projected electricity demand, 2030',
    unit: 'TWh',
    intervalLabel: '95% credible interval',
    confidenceLevel: 0.95,
    points: [
      { label: 'IEA', value: 9400, low: 8800, high: 10100, sourceId: 'src_iea' },
      { label: 'Analyst consensus', value: 9100, low: 8400, high: 9900 },
    ],
    referenceValue: 9000,
    referenceLabel: 'Current level',
    methodology: 'Ranges reflect the 5th-95th percentile across 12,000 scenario draws.',
  },
});
define('correlation', CorrelationBlockSchema, {
  category: 'data',
  description:
    'Correlation matrix. The block carries the raw observations; the platform derives the Pearson coefficients, the sample sizes and the significance, so a reader can tell a well-evidenced relationship from one computed from three data points. Significant pairings are marked, and the summary states plainly that a correlation is not causation.',
  recommendedFor: ['data journalism', 'research', 'feature analysis', 'exploratory reporting'],
  example: {
    title: 'What moves with what?',
    subtitle: 'Pairwise correlations across the indicators',
    variables: [
      { key: 'gpu_price', label: 'GPU price', unit: '$' },
      { key: 'power_draw', label: 'Power draw', unit: 'kW' },
      { key: 'tokens_per_sec', label: 'Tokens/sec' },
    ],
    observations: [
      { gpu_price: 1200, power_draw: 3.2, tokens_per_sec: 42 },
      { gpu_price: 2400, power_draw: 6.1, tokens_per_sec: 58 },
      { gpu_price: 3600, power_draw: 8.9, tokens_per_sec: 71 },
      { gpu_price: 4800, power_draw: 11.4, tokens_per_sec: 88 },
    ],
    significanceThreshold: 0.05,
    methodology:
      "Pearson's r over the observations supplied, with a two-tailed t-test for significance.",
  },
});
define('quiz', QuizBlockSchema, {
  category: 'interactive',
  description:
    "Knowledge check. Each question has options, one correct answer, and an explanation revealed once the reader has answered — so the block teaches rather than only scoring. The reader's answers stay in their own browser.",
  recommendedFor: ['explainers', 'education', 'reader engagement', 'comprehension checks'],
  example: {
    title: 'Test your understanding',
    description: 'Four questions on what the report actually found.',
    questions: [
      {
        id: 'q1',
        question: 'What did the study measure?',
        options: [
          { id: 'a', text: 'Training cost only', correct: false },
          { id: 'b', text: 'Inference cost across three model sizes', correct: true },
        ],
        explanation:
          'The report covers inference cost at 7B, 13B and 70B parameters, not training.',
        sourceId: 'src_study',
      },
    ],
    showScore: true,
    allowRetry: true,
  },
});
define('knowledge_graph', KnowledgeGraphBlockSchema, {
  category: 'context',
  description:
    'Knowledge graph over the entities, sources and events in a story. Nodes are typed, edges carry a named relationship, and the layout is a deterministic radial one — the focus node in the centre, its relationships in the first ring — so the picture does not shuffle between renders and two stories can be compared.',
  recommendedFor: ['investigations', 'entity stories', 'source mapping', 'explainers'],
  example: {
    title: 'Who is connected to whom',
    description: 'The entities behind the investigation and how they relate.',
    nodes: [
      { id: 'n1', label: 'Northwind Energy', type: 'company' },
      { id: 'n2', label: 'Ada Okafor', type: 'person' },
      { id: 'n3', label: 'Ministry of Energy', type: 'organization' },
      { id: 'n4', label: 'The Ledger', type: 'source' },
    ],
    edges: [
      { id: 'e1', from: 'n2', to: 'n1', relation: 'directs' },
      { id: 'e2', from: 'n3', to: 'n1', relation: 'regulates' },
      { id: 'e3', from: 'n4', to: 'n1', relation: 'reported on' },
    ],
    focusNodeId: 'n1',
    methodology: 'Relationships are drawn from the platform knowledge graph.',
  },
});
define('animated_map', AnimatedMapBlockSchema, {
  category: 'map',
  description:
    'Map that moves through time. The reader scrubs through the frames, so the story shows how a situation spread rather than only its end state. Marker size and colour follow the value, on a scale fixed across every frame so the markers do not jump as the reader scrubs.',
  recommendedFor: ['live coverage', 'outbreaks', 'disasters', 'conflicts', 'elections'],
  example: {
    title: 'How the outbreak spread',
    description: 'Confirmed cases by reporting date.',
    valueLabel: 'Confirmed cases',
    unit: 'cases',
    frames: [
      {
        at: '2026-03-01',
        label: '1 March',
        points: [{ id: 'p1', label: 'Northern coast', lng: 34.5, lat: 41.2, value: 12 }],
      },
      {
        at: '2026-03-08',
        label: '8 March',
        points: [
          { id: 'p1', label: 'Northern coast', lng: 34.5, lat: 41.2, value: 180 },
          { id: 'p2', label: 'Inland', lng: 33.2, lat: 39.9, value: 64 },
        ],
      },
    ],
    autoplay: false,
    methodology: 'Case counts by the date each report was published.',
  },
});
define('sensitivity', SensitivityBlockSchema, {
  category: 'data',
  description:
    'Sensitivity analysis. A base case plus a range for each input and an expression producing the output; the renderer moves one input at a time to the ends of its range and shows how far the outcome travels, so the reader can see which assumption actually drives the result.',
  recommendedFor: ['models', 'forecasts', 'cost analysis', 'scenario planning', 'policy analysis'],
  example: {
    title: 'What drives the cost of a 50 MW solar farm?',
    subtitle: 'Swing in total capital cost when one assumption moves at a time',
    outputLabel: 'Total capital cost',
    outputUnit: '$m',
    baseOutput: 40,
    expression: 'capacity * panel_cost + labour + grid_connection',
    inputs: [
      {
        id: 'capacity',
        label: 'Installed capacity',
        base: 50,
        low: 45,
        high: 55,
        unit: 'MW',
      },
      {
        id: 'panel_cost',
        label: 'Panel cost',
        base: 0.6,
        low: 0.5,
        high: 0.72,
        unit: '$m/MW',
      },
      {
        id: 'labour',
        label: 'Installation labour',
        base: 6,
        low: 4,
        high: 9,
        unit: '$m',
      },
      {
        id: 'grid_connection',
        label: 'Grid connection',
        base: 4,
        low: 2,
        high: 7,
        unit: '$m',
      },
    ],
    methodology: 'Each input is varied across its range with the others held at base.',
  },
});
define('prediction_leaderboard', PredictionLeaderboardBlockSchema, {
  category: 'data',
  description:
    'Tracked predictions with a forecaster leaderboard. Each prediction carries a probability, and resolved ones carry an outcome; the platform scores forecasters by Brier score and reports whether they are well-calibrated rather than merely lucky.',
  recommendedFor: ['accountability reporting', 'forecast tracking', 'model evaluation'],
  example: {
    title: 'Who called it? Forecasters on AGI capability',
    subtitle: 'Resolved predictions ranked by Brier score',
    scoringMethod:
      'Brier score: mean squared error between the stated probability and the outcome.',
    predictions: [
      {
        id: 'p1',
        claim: 'A frontier lab announces an AGI-capable system before 2027',
        forecaster: 'Desk A',
        probability: 0.3,
        predictedAt: '2026-01-15',
        resolvesAt: '2027-01-01',
        resolved: true,
        outcome: 0,
        sourceId: 'src_forecast_a',
      },
      {
        id: 'p2',
        claim: 'A frontier lab announces an AGI-capable system before 2027',
        forecaster: 'Desk B',
        probability: 0.6,
        predictedAt: '2026-01-15',
        resolvesAt: '2027-01-01',
        resolved: true,
        outcome: 0,
      },
    ],
    methodology:
      'Only resolved predictions count towards a score. An open prediction says nothing about a forecaster yet.',
  },
});
define('what_if', WhatIfBlockSchema, {
  category: 'interactive',
  description:
    "Interactive scenario explorer. The reader moves sliders over a range for each input and the outcome recomputes live from the block's own expressions, with an optional breakdown of the outcome into components and a baseline for comparison.",
  recommendedFor: ['scenario planning', 'policy explainers', 'cost models', 'interactives'],
  example: {
    title: 'What would it take to cut household energy bills by a fifth?',
    description: 'Move the sliders to see how a retrofit programme changes the average bill.',
    outcomeLabel: 'Average household bill',
    outcomeUnit: '$/year',
    expression: 'base_bill * (1 - insulation_saving) * (1 - solar_saving)',
    inputs: [
      {
        id: 'base_bill',
        label: 'Current average bill',
        min: 800,
        max: 4000,
        step: 50,
        defaultValue: 1800,
        unit: '$',
      },
      {
        id: 'insulation_saving',
        label: 'Insulation saving',
        min: 0,
        max: 0.35,
        step: 0.01,
        defaultValue: 0.15,
        unit: '',
      },
      {
        id: 'solar_saving',
        label: 'Solar saving',
        min: 0,
        max: 0.4,
        step: 0.01,
        defaultValue: 0.1,
        unit: '',
      },
    ],
    breakdown: [
      { label: 'Bill after insulation', expression: 'base_bill * (1 - insulation_saving)' },
      { label: 'Solar contribution', expression: 'base_bill * solar_saving' },
    ],
    methodology: 'Savings are applied to the current average bill and compounded.',
  },
});
define('live_comments', LiveCommentsBlockSchema, {
  category: 'interactive',
  description:
    "Reader comments inside the article body. The thread is loaded on mount and kept live over the story's realtime channel, so a comment posted while the reader is mid-article appears without a refresh.",
  recommendedFor: ['live coverage', 'community reporting', 'debates'],
  example: {
    title: 'What readers are saying',
    description: 'The latest approved comments on this story.',
    maxComments: 10,
    showCta: true,
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
  description:
    'Market and numerical ticker with per-item sparklines. Binds to a live feed key to refresh in place over the realtime channel.',
});
define('live_data', LiveDataBlockSchema, {
  category: 'interactive',
  description:
    'Named live datasets with provider, refresh interval, timestamp, license, and methodology. Binds to a live feed key to refresh in place over the realtime channel.',
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
  description:
    'Reader poll. Votes are counted on the server — one vote per reader, shared live across everyone reading the story.',
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

// --- Flow, hierarchy & structure --------------------------------------------
define('sankey', SankeyBlockSchema, {
  category: 'data',
  description:
    'Flow diagram showing how a quantity moves between stages or sources, with the size of each flow drawn to scale.',
  recommendedFor: ['investigations', 'budgets', 'supply chains'],
});
define('treemap', TreemapBlockSchema, {
  category: 'data',
  description:
    'Nested rectangles whose area shows the size of each part of a hierarchy, from the whole down to the leaves.',
  recommendedFor: ['budgets', 'market shares', 'spending'],
});
define('network_graph', NetworkGraphBlockSchema, {
  category: 'data',
  description:
    'Force-directed graph of people, organisations and things, showing who is connected to whom and how strongly.',
  recommendedFor: ['investigations', 'explainers', 'entity stories'],
});

// --- Analysis ---------------------------------------------------------------
define('regression', RegressionBlockSchema, {
  category: 'data',
  description:
    'A fitted curve through scattered measurements, with the fit, its confidence band, the residuals and the equation.',
  recommendedFor: ['economics', 'science', 'methodology'],
});
define('anomaly', AnomalyBlockSchema, {
  category: 'data',
  description:
    'A series over time with the unusual readings marked out, and the method used to decide what counts as unusual.',
  recommendedFor: ['monitoring', 'climate', 'markets'],
});
define('survey_results', SurveyResultsBlockSchema, {
  category: 'data',
  description:
    'The results of a poll or survey, with the breakdown by subgroup, the sample size and the margin of error.',
  recommendedFor: ['politics', 'research', 'explainers'],
});

// --- Immersive & motion -----------------------------------------------------
define('scrolly', ScrollyBlockSchema, {
  category: 'immersive',
  description:
    'A scroll-driven narrative: a sticky scene that changes as the reader moves through each step of the story.',
  recommendedFor: ['long reads', 'features', 'explainers'],
});
define('motion_chart', MotionChartBlockSchema, {
  category: 'immersive',
  description:
    'A chart that draws itself in — bars growing, lines drawing on, figures counting up — honouring reduced-motion.',
  recommendedFor: ['explainers', 'social', 'data journalism'],
});
define('sandbox', SandboxBlockSchema, {
  category: 'immersive',
  description:
    'Custom HTML, CSS and JavaScript drawn in a sandboxed frame, with the block’s own data handed to it.',
  recommendedFor: ['bespoke visuals', 'embeds', 'experiments'],
});
define('scene_3d', Scene3DBlockSchema, {
  category: 'immersive',
  description:
    'A three-dimensional scene — a globe, a point cloud, a bar chart or a model — drawn in WebGL and explorable.',
  recommendedFor: ['geography', 'climate', 'infrastructure'],
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
