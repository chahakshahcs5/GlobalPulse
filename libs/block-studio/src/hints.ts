/**
 * How a block's fields are presented in the editor.
 *
 * The schema says what a block may contain. It cannot say how that content
 * should be *edited*: a colour is a colour, but writing `#3b82f6` into a text
 * box is not the same as picking it from a swatch, and a chart's `stacked`
 * option means nothing when the chart is a line.
 *
 * A hint is that missing half. It is a small, optional annotation on a
 * field — a group it belongs to, a line of guidance, a better control, a
 * condition under which it applies — and it never changes what the payload
 * may be. The schema still has the last word on that, and the validator
 * still checks against it.
 *
 * Hints are optional throughout: a block type with no hints still gets a
 * complete, editable form, exactly as before.
 */

/**
 * The control used for a field.
 *
 * The first few are the kinds the schema converter infers on its own. The
 * rest are chosen deliberately, for a field whose content deserves a control
 * the schema cannot describe.
 */
export type FieldControl =
  | 'text'
  | 'textarea'
  | 'number'
  | 'boolean'
  | 'select'
  | 'json'
  | 'object'
  | 'array'
  | 'color'
  | 'segment'
  | 'date';

/**
 * A rule that decides whether a field applies.
 *
 * It reads one other field in the payload. A chart's `facetField` only means
 * something for a small-multiples chart, and a map's `routes` only mean
 * something for a route map — so the field is hidden until the rule says it
 * applies, rather than sitting there implying it does.
 */
export interface VisibilityRule {
  /** The payload path the rule reads, e.g. `data.chartType`. */
  field: string;
  /** Applies when the value equals this. */
  equals?: unknown;
  /** Applies when the value does not equal this. */
  notEquals?: unknown;
  /** Applies when the value is one of these. */
  in?: unknown[];
  /** Applies when the value is none of these. */
  notIn?: unknown[];
}

export interface FieldHint {
  /** Replaces the label generated from the field's name. */
  label?: string;
  /** A line of guidance shown under the control. */
  help?: string;
  /** The group the field belongs to, within its section. */
  group?: string;
  /** The field's position within its group. Lower comes first. */
  order?: number;
  /** A suffix shown after the value, e.g. `%` or `km`. */
  unit?: string;
  /** The field is collapsed behind a disclosure until it is asked for. */
  advanced?: boolean;
  /** The rule under which the field applies. */
  visibleWhen?: VisibilityRule;
  /** The control to use instead of the inferred one. */
  control?: FieldControl;
}

/**
 * The hints for one block type, keyed by the field's path in the payload.
 *
 * A path's array indexes are written as `[]`, so a hint covers every element
 * of a list rather than only its first: `data.series[].color` applies to the
 * colour of every series, not just the one at index zero.
 */
export type BlockHints = Record<string, FieldHint>;

/** The hints for every block type, keyed by the block type. */
export type HintsRegistry = Record<string, BlockHints>;

/**
 * The colours a block may be drawn in.
 *
 * These are the palette the renderers already use (`DEFAULT_PALETTE` in the
 * chart renderer, and the semantic colours the analysis renderers reach for),
 * so a colour picked here is a colour that already looks right in a story.
 *
 * The list is a convenience, not a limit: a colour can still be typed in, and
 * the schema still checks it. The point is that an editor does not have to
 * know the hex codes.
 */
export const BLOCK_COLOR_SWATCHES = [
  '#3b82f6',
  '#10b981',
  '#f59e0b',
  '#ec4899',
  '#8b5cf6',
  '#06b6d4',
  '#ef4444',
  '#64748b',
  '#0f172a',
] as const;

/**
 * The hints that apply to every block type.
 *
 * The envelope's own fields are the same for all fifty-five block types,
 * so their hints live here rather than being repeated per block.
 */
const GLOBAL_HINTS: BlockHints = {
  'presentation.width': {
    control: 'segment',
    help: 'How much of the story column the block may use.',
  },
  'presentation.align': {
    control: 'segment',
    help: 'How the block sits within the column. It only applies to a contained block.',
  },
  'presentation.theme': {
    control: 'segment',
    help: 'Which theme the block is drawn in. Inherit follows the page.',
  },
  'accessibility.title': {
    help: 'The name this block is announced with.',
  },
  'accessibility.description': {
    help: 'A short description of the block, for anyone who cannot see it.',
  },
  'accessibility.textSummary': {
    help: 'The block in words. Readers who cannot see the block, and anyone searching for it, are served this.',
  },
  'provenance.source': {
    help: 'Where the content came from.',
  },
  'provenance.methodology': {
    help: 'How the content was produced. Readers are told how the numbers were made.',
  },
  'provenance.license': {
    help: 'What the content may be used for.',
  },
  'provenance.sourceIds': {
    help: 'The registered sources the content is based on.',
  },
};

/**
 * The hints for every block type, keyed by the block type.
 *
 * Only the blocks whose fields genuinely benefit get hints. A block whose
 * payload is two fields needs none, and adding them anyway would be noise.
 */
export const BLOCK_HINTS: HintsRegistry = {
  chart: {
    'data.chartType': {
      group: 'Chart',
      order: 1,
      help: 'How the values are drawn. Every other option on this block follows from it.',
    },
    'data.title': { group: 'Headline', order: 1 },
    'data.subtitle': { group: 'Headline', order: 2 },
    'data.caption': { group: 'Headline', order: 3 },
    'data.xAxis': { group: 'Axes', order: 1 },
    'data.yAxis': {
      group: 'Axes',
      order: 2,
      visibleWhen: { field: 'data.chartType', notIn: ['kpi', 'sparkline', 'donut', 'pie'] },
    },
    'data.legend': { group: 'Axes', order: 3 },
    'data.legend.position': { control: 'segment' },
    'data.series': {
      group: 'Data',
      order: 1,
      help: 'One entry per line on the chart. Give each a name and the key it reads from the rows.',
    },
    'data.series[].color': {
      control: 'color',
      help: 'The colour of this series. Leave it unset to use the house palette.',
    },
    'data.values': {
      group: 'Data',
      order: 2,
      help: 'The rows the chart draws. Each row is keyed by the axis keys and the series keys.',
    },
    'data.facetField': {
      group: 'Data',
      order: 3,
      visibleWhen: { field: 'data.chartType', equals: 'small_multiples' },
      help: 'The key that splits the rows into one small chart each.',
    },
    'data.annotations': {
      group: 'Annotations',
      order: 1,
      help: 'Notes pinned to particular points, opened by the reader.',
    },
    'data.groupKey': {
      group: 'Data',
      order: 4,
      visibleWhen: {
        field: 'data.chartType',
        in: ['box_plot', 'ridge', 'parallel_coordinates', 'chord', 'voronoi'],
      },
      help: 'The key that names the group each row belongs to. A box plot draws one box per group.',
    },
    'data.secondaryKey': {
      group: 'Data',
      order: 5,
      visibleWhen: { field: 'data.chartType', in: ['chord', 'voronoi'] },
      help: 'The key holding the second measurement. A voronoi diagram places each row at the point these two describe.',
    },
    'data.sourceAttribution': { group: 'Sourcing', order: 1 },
    'data.methodology': { group: 'Sourcing', order: 2 },
    'data.lastUpdated': { group: 'Sourcing', order: 3 },
  },

  sankey: {
    'data.title': { group: 'Headline', order: 1 },
    'data.subtitle': { group: 'Headline', order: 2 },
    'data.caption': { group: 'Headline', order: 3 },
    'data.style': {
      group: 'Look',
      order: 1,
      help: 'How the flow is drawn. The same numbers read very differently as ribbons, as a vertical flow, as hairlines or as curves.',
    },
    'data.nodes': {
      group: 'Flow',
      order: 1,
      help: 'Every stage of the flow. Each one needs an id, which the links point at.',
    },
    'data.links': {
      group: 'Flow',
      order: 2,
      help: 'How much moves from one stage to another. The width of the ribbon is the value.',
    },
    'data.unit': {
      group: 'Flow',
      order: 3,
      help: 'The unit the flow is measured in, e.g. cases or £m.',
    },
    'data.showValues': { group: 'Flow', order: 4 },
    'data.sourceAttribution': { group: 'Sourcing', order: 1 },
    'data.methodology': { group: 'Sourcing', order: 2 },
    'data.lastUpdated': { group: 'Sourcing', order: 3 },
  },

  treemap: {
    'data.title': { group: 'Headline', order: 1 },
    'data.subtitle': { group: 'Headline', order: 2 },
    'data.caption': { group: 'Headline', order: 3 },
    'data.layout': {
      group: 'Look',
      order: 1,
      help: 'How the rectangles are tiled. Squarified keeps them square; slicing and dicing cut the space into strips and a grid.',
    },
    'data.nodes': {
      group: 'Hierarchy',
      order: 1,
      help: 'The parts, as a flat list. A node that names a parent sits inside it; a node with a value is drawn at that size.',
    },
    'data.unit': { group: 'Hierarchy', order: 2 },
    'data.showValues': { group: 'Hierarchy', order: 3 },
    'data.sourceAttribution': { group: 'Sourcing', order: 1 },
    'data.methodology': { group: 'Sourcing', order: 2 },
    'data.lastUpdated': { group: 'Sourcing', order: 3 },
  },

  network_graph: {
    'data.title': { group: 'Headline', order: 1 },
    'data.subtitle': { group: 'Headline', order: 2 },
    'data.caption': { group: 'Headline', order: 3 },
    'data.nodes': {
      group: 'Graph',
      order: 1,
      help: 'The people, organisations and things. A group is a category they are coloured by.',
    },
    'data.links': { group: 'Graph', order: 2, help: 'The connections between them.' },
    'data.style': {
      group: 'Look',
      order: 1,
      help: 'How the nodes are drawn. Outline reads better when the graph is dense; bubble makes the hubs obvious.',
    },
    'data.layout': { group: 'Look', order: 2 },
    'data.showLabels': { group: 'Behaviour', order: 2 },
    'data.interactive': {
      group: 'Behaviour',
      order: 3,
      help: 'Let the reader drag the nodes and filter the groups.',
    },
    'data.sourceAttribution': { group: 'Sourcing', order: 1 },
    'data.methodology': { group: 'Sourcing', order: 2 },
  },

  regression: {
    'data.title': { group: 'Headline', order: 1 },
    'data.subtitle': { group: 'Headline', order: 2 },
    'data.caption': { group: 'Headline', order: 3 },
    'data.xLabel': { group: 'Axes', order: 1 },
    'data.yLabel': { group: 'Axes', order: 2 },
    'data.points': {
      group: 'Data',
      order: 1,
      help: 'The measurements the curve is fitted through.',
    },
    'data.model': { group: 'Fit', order: 1, help: 'The shape of the curve.' },
    'data.confidenceLevel': {
      group: 'Fit',
      order: 2,
      help: 'How wide the band around the fit is, as a fraction. 0.95 is the usual choice.',
    },
    'data.showConfidenceBand': { group: 'Fit', order: 3 },
    'data.showResiduals': { group: 'Fit', order: 4 },
    'data.showEquation': { group: 'Fit', order: 5 },
    'data.sourceAttribution': { group: 'Sourcing', order: 1 },
    'data.methodology': { group: 'Sourcing', order: 2 },
    'data.lastUpdated': { group: 'Sourcing', order: 3 },
  },

  anomaly: {
    'data.title': { group: 'Headline', order: 1 },
    'data.subtitle': { group: 'Headline', order: 2 },
    'data.caption': { group: 'Headline', order: 3 },
    'data.points': { group: 'Series', order: 1, help: 'The readings, in order.' },
    'data.method': {
      group: 'Rule',
      order: 1,
      help: 'How an unusual reading is recognised. The rule is named to the reader.',
    },
    'data.threshold': {
      group: 'Rule',
      order: 2,
      help: 'How far from normal a reading has to be, in the units the method uses.',
    },
    'data.window': {
      group: 'Rule',
      order: 3,
      visibleWhen: { field: 'data.method', in: ['zscore', 'mad'] },
      help: 'How many neighbouring readings the rolling methods look at.',
    },
    'data.direction': { group: 'Rule', order: 4 },
    'data.unit': { group: 'Series', order: 2 },
    'data.sourceAttribution': { group: 'Sourcing', order: 1 },
    'data.methodology': { group: 'Sourcing', order: 2 },
    'data.lastUpdated': { group: 'Sourcing', order: 3 },
  },

  survey_results: {
    'data.title': { group: 'Headline', order: 1 },
    'data.subtitle': { group: 'Headline', order: 2 },
    'data.caption': { group: 'Headline', order: 3 },
    'data.question': {
      group: 'Results',
      order: 1,
      help: 'The question the respondents were asked.',
    },
    'data.style': {
      group: 'Look',
      order: 1,
      help: 'How the answers are drawn. Bars show the numbers, a stack shows the split, a waffle counts squares and a donut turns it into a ring.',
    },
    'data.responses': { group: 'Results', order: 2, help: 'The answers, and how many gave each.' },
    'data.segments': {
      group: 'Results',
      order: 3,
      help: 'The same question, split by a subgroup. The reader can switch between them.',
    },
    'data.totalRespondents': { group: 'Method', order: 1 },
    'data.marginOfError': { group: 'Method', order: 2 },
    'data.fieldDates': { group: 'Method', order: 3 },
    'data.sourceAttribution': { group: 'Sourcing', order: 1 },
    'data.methodology': { group: 'Sourcing', order: 2 },
    'data.lastUpdated': { group: 'Sourcing', order: 3 },
  },

  scrolly: {
    'data.title': { group: 'Headline', order: 1 },
    'data.caption': { group: 'Headline', order: 2 },
    'data.steps': {
      group: 'Steps',
      order: 1,
      help: 'The steps of the narrative, in the order the reader meets them. Each step shows one picture.',
    },
    'data.layout': {
      group: 'Look',
      order: 1,
      help: 'Sticky keeps the picture in place while the steps go past it. Stacked gives every step its own picture.',
    },
    'data.showProgress': {
      group: 'Behaviour',
      order: 1,
      help: 'Show a marker of how far through the reader is.',
    },
    'data.sourceAttribution': { group: 'Sourcing', order: 1 },
    'data.methodology': { group: 'Sourcing', order: 2 },
  },

  motion_chart: {
    'data.title': { group: 'Headline', order: 1 },
    'data.subtitle': { group: 'Headline', order: 2 },
    'data.caption': { group: 'Headline', order: 3 },
    'data.chart': { group: 'Chart', order: 1, help: 'The chart that is drawn, and then animated.' },
    'data.animation': { group: 'Motion', order: 1, help: 'How the chart animates itself in.' },
    'data.durationMs': {
      group: 'Motion',
      order: 2,
      help: 'How long the animation takes, in milliseconds.',
    },
    'data.staggerMs': {
      group: 'Motion',
      order: 3,
      help: 'How long after each other the marks start.',
    },
    'data.loop': { group: 'Motion', order: 4 },
    'data.respectReducedMotion': {
      group: 'Motion',
      order: 5,
      help: 'Show the finished chart to readers who have asked their system for less movement.',
    },
    'data.sourceAttribution': { group: 'Sourcing', order: 1 },
    'data.methodology': { group: 'Sourcing', order: 2 },
  },

  sandbox: {
    'data.title': { group: 'Headline', order: 1 },
    'data.caption': { group: 'Headline', order: 2 },
    'data.html': {
      group: 'The frame',
      order: 1,
      help: 'The markup and styles the frame is given.',
    },
    'data.script': {
      group: 'The frame',
      order: 2,
      help: 'The script the frame runs. The block’s own data is on window.__blockData.',
    },
    'data.data': { group: 'The frame', order: 3, help: 'The data handed to the frame.' },
    'data.height': { group: 'The frame', order: 4, help: 'How tall the frame is, in pixels.' },
    'data.allowScripts': { group: 'The frame', order: 5 },
    'data.accessibilityText': {
      group: 'Accessibility',
      order: 1,
      help: 'The block in words, for anyone who cannot see what it drew.',
    },
    'data.sourceAttribution': { group: 'Sourcing', order: 1 },
  },

  scene_3d: {
    'data.title': { group: 'Headline', order: 1 },
    'data.subtitle': { group: 'Headline', order: 2 },
    'data.caption': { group: 'Headline', order: 3 },
    'data.scene': { group: 'Scene', order: 1, help: 'What kind of scene is drawn.' },
    'data.points': {
      group: 'Scene',
      order: 2,
      visibleWhen: { field: 'data.scene', in: ['globe', 'points'] },
      help: 'The places marked on the globe, or the points of the cloud.',
    },
    'data.bars': {
      group: 'Scene',
      order: 3,
      visibleWhen: { field: 'data.scene', equals: 'bars' },
      help: 'The columns of the chart.',
    },
    'data.modelUrl': {
      group: 'Scene',
      order: 4,
      visibleWhen: { field: 'data.scene', equals: 'model' },
      help: 'The model to show, as a .glb file.',
    },
    'data.autoRotate': { group: 'Behaviour', order: 1 },
    'data.cameraDistance': { group: 'Behaviour', order: 2 },
    'data.height': { group: 'Behaviour', order: 3 },
    'data.background': { group: 'Behaviour', order: 4, control: 'color' },
    'data.posterUrl': {
      group: 'Accessibility',
      order: 1,
      help: 'The picture shown where the scene cannot be drawn, e.g. on a phone.',
    },
    'data.alt': { group: 'Accessibility', order: 2, help: 'The scene in words.' },
    'data.sourceAttribution': { group: 'Sourcing', order: 1 },
    'data.methodology': { group: 'Sourcing', order: 2 },
  },

  table: {
    'data.title': { group: 'Headline', order: 1 },
    'data.caption': { group: 'Headline', order: 2 },
    'data.headers': { group: 'Table', order: 1, help: 'One column heading per column.' },
    'data.rows': { group: 'Table', order: 2, help: 'One row per record, in reading order.' },
    'data.footer': { group: 'Table', order: 3 },
    'data.sortable': { group: 'Behaviour', order: 1 },
    'data.filterable': { group: 'Behaviour', order: 2 },
    'data.searchable': { group: 'Behaviour', order: 3 },
    'data.downloadable': { group: 'Behaviour', order: 4 },
    'data.pageSize': {
      group: 'Behaviour',
      order: 5,
      help: 'Rows per page. Leave it unset to show the whole table.',
    },
    'data.sourceAttribution': { group: 'Sourcing', order: 1 },
    'data.methodology': { group: 'Sourcing', order: 2 },
    'data.lastUpdated': { group: 'Sourcing', order: 3 },
  },

  image: {
    'data.url': { group: 'Image', order: 1 },
    'data.altText': {
      group: 'Image',
      order: 2,
      help: 'What the picture shows, for readers who cannot see it. Required.',
    },
    'data.caption': { group: 'Image', order: 3 },
    'data.credit': { group: 'Image', order: 4 },
    'data.sourceAttribution': { group: 'Image', order: 5 },
    'data.aspectRatio': {
      group: 'Layout',
      order: 1,
      control: 'segment',
      help: 'The shape the picture is cropped to.',
    },
  },

  gallery: {
    'data.title': { group: 'Headline', order: 1 },
    'data.layout': {
      group: 'Layout',
      order: 1,
      control: 'segment',
      help: 'How the pictures are arranged.',
    },
    'data.images': { group: 'Pictures', order: 1 },
  },

  callout: {
    'data.style': {
      group: 'Callout',
      order: 1,
      control: 'segment',
      help: 'The kind of callout. The colour follows from it.',
    },
    'data.title': { group: 'Callout', order: 2 },
    'data.text': { group: 'Callout', order: 3 },
  },

  quote: {
    'data.quote': { group: 'Quote', order: 1 },
    'data.attribution': { group: 'Quote', order: 2, help: 'Who said it. Required.' },
    'data.title': { group: 'Quote', order: 3, help: 'Their role or the occasion.' },
    'data.avatarUrl': { group: 'Quote', order: 4 },
    'data.sourceUrl': { group: 'Quote', order: 5 },
  },

  summary: {
    'data.headline': { group: 'Headline', order: 1 },
    'data.bulletPoints': { group: 'Points', order: 1, help: 'One point per line.' },
    'data.sentiment': { group: 'Headline', order: 2, control: 'segment' },
  },

  statistic: {
    'data.value': { group: 'Figure', order: 1 },
    'data.label': { group: 'Figure', order: 2 },
    'data.unit': { group: 'Figure', order: 3 },
    'data.trend': { group: 'Trend', order: 1, control: 'segment' },
    'data.trendValue': { group: 'Trend', order: 2 },
    'data.comparison': { group: 'Trend', order: 3 },
    'data.period': { group: 'Trend', order: 4 },
    'data.context': { group: 'Trend', order: 5 },
    'data.sourceAttribution': { group: 'Sourcing', order: 1 },
    'data.methodology': { group: 'Sourcing', order: 2 },
    'data.lastUpdated': { group: 'Sourcing', order: 3 },
  },

  map: {
    'data.title': { group: 'Headline', order: 1 },
    'data.mapType': {
      group: 'Map',
      order: 1,
      control: 'segment',
      help: 'What the map shows. The layers, markers and routes that follow depend on it.',
    },
    'data.style': {
      group: 'Look',
      order: 1,
      control: 'segment',
      help: 'The basemap underneath the story: the roads, rivers and buildings.',
    },
    'data.projection': {
      group: 'Look',
      order: 2,
      control: 'segment',
      help: 'A globe is the right shape for a story about distance.',
    },
    'data.pitch': {
      group: 'Look',
      order: 3,
      help: 'How far the camera is tilted. A tilted map is a map in three dimensions.',
    },
    'data.bearing': { group: 'Look', order: 4, help: 'Which way the map is turned.' },
    'data.center': {
      group: 'Map',
      order: 3,
      help: 'The centre of the map, as longitude and latitude.',
    },
    'data.zoom': { group: 'Map', order: 4 },
    'data.fitToMarkers': {
      group: 'Map',
      order: 5,
      help: 'Frame the map around what it shows rather than around a stated centre.',
    },
    'data.minZoom': { group: 'Map', order: 6, advanced: true },
    'data.maxZoom': { group: 'Map', order: 7, advanced: true },
    'data.interactive': {
      group: 'Behaviour',
      order: 1,
      help: 'Whether the reader can move, zoom and turn the map.',
    },
    'data.cluster': {
      group: 'Behaviour',
      order: 2,
      help: 'Gather the marks together when they are close, and let the reader open them.',
    },
    'data.showControls': { group: 'Behaviour', order: 3 },
    'data.markers': {
      group: 'Map',
      order: 8,
      visibleWhen: { field: 'data.mapType', in: ['points', undefined] },
    },
    'data.layers': {
      group: 'Map',
      order: 9,
      visibleWhen: { field: 'data.mapType', in: ['choropleth', 'heatmap'] },
    },
    'data.layers[].colorScale': { control: 'color' },
    'data.routes': {
      group: 'Map',
      order: 10,
      visibleWhen: { field: 'data.mapType', equals: 'route' },
    },
    'data.comparisonRegionIds': {
      group: 'Map',
      order: 11,
      visibleWhen: { field: 'data.mapType', equals: 'comparison' },
    },
    'data.sourceAttribution': { group: 'Sourcing', order: 1 },
    'data.methodology': { group: 'Sourcing', order: 2 },
    'data.lastUpdated': { group: 'Sourcing', order: 3 },
  },

  animated_map: {
    'data.title': { group: 'Headline', order: 1 },
    'data.description': { group: 'Headline', order: 2 },
    'data.frames': {
      group: 'Frames',
      order: 1,
      help: 'The frames, in the order the reader meets them. The scrubber moves between them.',
    },
    'data.style': {
      group: 'Look',
      order: 1,
      control: 'segment',
      help: 'The basemap underneath the story.',
    },
    'data.projection': { group: 'Look', order: 2, control: 'segment' },
    'data.pitch': { group: 'Look', order: 3 },
    'data.flyToFrame': {
      group: 'Look',
      order: 4,
      help: 'Move the camera to wherever the situation has spread to.',
    },
    'data.frameDurationMs': { group: 'Behaviour', order: 1, help: 'How long each frame is held.' },
    'data.showControls': { group: 'Behaviour', order: 2 },
    'data.valueLabel': { group: 'Frames', order: 2 },
    'data.unit': { group: 'Frames', order: 3 },
    'data.methodology': { group: 'Sourcing', order: 1 },
    'data.sourceAttribution': { group: 'Sourcing', order: 2 },
  },

  map_3d: {
    'data.title': { group: 'Headline', order: 1 },
    'data.subtitle': { group: 'Headline', order: 2 },
    'data.caption': { group: 'Headline', order: 3 },
    'data.scene': {
      group: 'Look',
      order: 1,
      control: 'segment',
      help: 'Terrain is the land raised, extruded lifts the story’s own shapes off it, and a globe is the round earth.',
    },
    'data.style': { group: 'Look', order: 2, control: 'segment', help: 'The basemap underneath.' },
    'data.center': { group: 'Scene', order: 1, help: 'The centre of the scene.' },
    'data.zoom': { group: 'Scene', order: 2 },
    'data.pitch': { group: 'Look', order: 3, help: 'How far the camera is tilted.' },
    'data.bearing': { group: 'Look', order: 4 },
    'data.terrainExaggeration': {
      group: 'Scene',
      order: 3,
      help: 'How much the land is raised. One is the real world.',
    },
    'data.extrusions': {
      group: 'Scene',
      order: 4,
      visibleWhen: { field: 'data.scene', equals: 'extruded' },
      help: 'The shapes lifted off the map. A shape’s height is read from one of its properties.',
    },
    'data.extrusions[].colorScale': { control: 'color' },
    'data.layers': { group: 'Scene', order: 5 },
    'data.layers[].colorScale': { control: 'color' },
    'data.markers': { group: 'Scene', order: 6 },
    'data.interactive': { group: 'Behaviour', order: 1 },
    'data.showControls': { group: 'Behaviour', order: 2 },
    'data.sourceAttribution': { group: 'Sourcing', order: 1 },
    'data.methodology': { group: 'Sourcing', order: 2 },
    'data.lastUpdated': { group: 'Sourcing', order: 3 },
  },

  diagram: {
    'data.title': { group: 'Headline', order: 1 },
    'data.format': { group: 'Diagram', order: 1, control: 'segment' },
    'data.definition': {
      group: 'Diagram',
      order: 2,
      help: 'The diagram itself — Mermaid source, or the declarative definition.',
    },
    'data.caption': { group: 'Headline', order: 2 },
  },

  timeline: {
    'data.title': { group: 'Headline', order: 1 },
    'data.description': { group: 'Headline', order: 2 },
    'data.items': { group: 'Events', order: 1 },
    'data.items[].date': { group: 'Events', control: 'text' },
    'data.sourceAttribution': { group: 'Sourcing', order: 1 },
    'data.methodology': { group: 'Sourcing', order: 2 },
  },

  embed: {
    'data.provider': { group: 'Embed', order: 1, control: 'segment' },
    'data.url': { group: 'Embed', order: 2 },
    'data.title': { group: 'Embed', order: 3 },
  },

  source: {
    'data.sourceId': { group: 'Source', order: 1 },
    'data.title': { group: 'Source', order: 2 },
    'data.publisher': { group: 'Source', order: 3 },
    'data.url': { group: 'Source', order: 4 },
    'data.publishedAt': { group: 'Source', order: 5, control: 'date' },
  },

  entity: {
    'data.entityId': { group: 'Entity', order: 1 },
    'data.name': { group: 'Entity', order: 2 },
    'data.type': { group: 'Entity', order: 3 },
    'data.description': { group: 'Entity', order: 4 },
    'data.avatarUrl': { group: 'Entity', order: 5 },
  },

  citation: {
    'data.claim': { group: 'Citation', order: 1 },
    'data.sourceIds': { group: 'Citation', order: 2 },
    'data.quoteExcerpt': { group: 'Citation', order: 3 },
  },

  flow: {
    'data.title': { group: 'Headline', order: 1 },
    'data.description': { group: 'Headline', order: 2 },
    'data.steps': { group: 'Steps', order: 1 },
    'data.steps[].status': { control: 'segment' },
  },

  slide_deck: {
    'data.title': { group: 'Headline', order: 1 },
    'data.slides': { group: 'Slides', order: 1 },
  },

  comparison: {
    'data.title': { group: 'Headline', order: 1 },
    'data.subjectA': { group: 'Comparison', order: 1 },
    'data.subjectB': { group: 'Comparison', order: 2 },
  },

  related_stories: {
    'data.title': { group: 'Headline', order: 1 },
    'data.storyIds': { group: 'Stories', order: 1 },
  },

  what_changed: {
    'data.previousVersionNumber': { group: 'Change', order: 1 },
    'data.updatedAt': { group: 'Change', order: 2, control: 'date' },
    'data.items': { group: 'Change', order: 3 },
    'data.items[].changeType': { control: 'segment' },
  },
};

/**
 * Normalise a payload path so a hint can match it.
 *
 * An array's indexes are not known until there is an array, so they are
 * written as `[]`: `data.series.0.color` becomes `data.series[].color`, and
 * the hint matches every element of the list.
 */
export function normaliseHintPath(path: string): string {
  return (
    path
      .split('.')
      .map((segment) => (/^\d+$/.test(segment) ? '[]' : segment))
      .join('.')
      // The `[]` stands in for an index, so it belongs to the name before it
      // rather than being a segment of its own.
      .replace(/\.\[\]/g, '[]')
  );
}

/**
 * The hint for a field, if the block type has one.
 *
 * The exact path wins over the normalised one, so a hint can single out one
 * element of a list if it needs to — `data.series.0.color` beats
 * `data.series[].color`. A block type's own hint wins over the shared one,
 * so a block can describe a field differently from every other block.
 */
export function hintFor(blockType: string, path: string): FieldHint | undefined {
  const hints = BLOCK_HINTS[blockType];
  const normalised = normaliseHintPath(path);

  return hints?.[path] ?? hints?.[normalised] ?? GLOBAL_HINTS[path] ?? GLOBAL_HINTS[normalised];
}

/**
 * Whether a field applies, given the payload it is part of.
 *
 * The rule reads the payload through the same path helpers the form uses, so
 * a rule can point at any value — including one nested inside a list.
 */
export function isFieldVisible(
  rule: VisibilityRule | undefined,
  read: (path: string) => unknown
): boolean {
  if (!rule) return true;

  const value = read(rule.field);

  if (rule.equals !== undefined && value !== rule.equals) return false;
  if (rule.notEquals !== undefined && value === rule.notEquals) return false;
  if (rule.in && !rule.in.includes(value)) return false;
  if (rule.notIn && rule.notIn.includes(value)) return false;

  return true;
}
