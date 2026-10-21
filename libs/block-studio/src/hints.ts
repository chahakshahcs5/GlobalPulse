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
    'data.sourceAttribution': { group: 'Sourcing', order: 1 },
    'data.methodology': { group: 'Sourcing', order: 2 },
    'data.lastUpdated': { group: 'Sourcing', order: 3 },
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
    'data.style': { group: 'Map', order: 2, control: 'segment' },
    'data.center': {
      group: 'Map',
      order: 3,
      help: 'The centre of the map, as longitude and latitude.',
    },
    'data.zoom': { group: 'Map', order: 4 },
    'data.markers': {
      group: 'Map',
      order: 5,
      visibleWhen: { field: 'data.mapType', in: ['points', undefined] },
    },
    'data.layers': {
      group: 'Map',
      order: 6,
      visibleWhen: { field: 'data.mapType', in: ['choropleth', 'heatmap'] },
    },
    'data.layers[].colorScale': { control: 'color' },
    'data.routes': {
      group: 'Map',
      order: 7,
      visibleWhen: { field: 'data.mapType', equals: 'route' },
    },
    'data.comparisonRegionIds': {
      group: 'Map',
      order: 8,
      visibleWhen: { field: 'data.mapType', equals: 'comparison' },
    },
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
