import type {
  BlockAccessibility,
  BlockCategory,
  BlockPresentation,
  DataProvenance,
} from '@ai-news/schemas';

/**
 * The shapes the Block Studio works with.
 *
 * A *block* is one registered block type. A *variant* is a named, ready-made
 * payload for that type — the way a chart has a "line" variant and a "stacked
 * bar" variant. The studio previews a variant, lets an editor change the
 * payload, and shows the result immediately.
 */

/**
 * Everything about a block except the platform's own bookkeeping.
 *
 * `id`, `blockType` and `sortOrder` belong to the platform: the studio never
 * invents them, and they are not part of what an editor edits. Everything
 * else is the block's own — its content, how it is presented, and the
 * metadata the newsroom attaches to it.
 *
 * The payload deliberately includes the envelope's `accessibility`,
 * `provenance` and citation fields. They are as editable as the content is:
 * a text summary, a methodology note and a licence are things an editor
 * sets, and a studio that cannot see them cannot show them.
 */
/**
 * Everything about a block except the platform's own bookkeeping.
 *
 * `id`, `blockType` and `sortOrder` belong to the platform: the studio never
 * invents them, and they are not part of what an editor edits. Everything
 * else is the block's own — its content, how it is presented, and the
 * metadata the newsroom attaches to it.
 *
 * The payload deliberately includes the envelope's `accessibility`,
 * `provenance` and citation fields. They are as editable as the content is:
 * a text summary, a methodology note and a licence are things an editor
 * sets, and a studio that cannot see them cannot show them.
 *
 * It is a type alias rather than an interface so that it carries an
 * implicit index signature, and can be handed to anything that takes a
 * plain JSON object — the raw JSON editor, for one.
 */
export type StudioPayload = {
  /** The block's content. Every block type has one. */
  data: Record<string, unknown>;
  /** How the block is presented. */
  presentation?: BlockPresentation;
  /** The block's accessible name, description and text summary. */
  accessibility?: BlockAccessibility;
  /** Where the block's content came from, and under what licence. */
  provenance?: DataProvenance;
  /** The registered sources this block cites. */
  citationIds?: string[];
  /** The registered sources this block is based on. */
  sourceIds?: string[];
  /** Free-form metadata the platform attaches to a block. */
  metadata?: Record<string, unknown>;
};

export interface StudioVariant {
  /** Stable id, unique within the block type. */
  id: string;
  /** Human label shown in the variant bar. */
  label: string;
  /** What this variant demonstrates, shown under the label. */
  description?: string;
  /** The full `data` payload for the block. */
  data: Record<string, unknown>;
}

export interface StudioBlock {
  type: string;
  category: BlockCategory;
  description: string;
  schemaVersion: number;
  recommendedFor?: string[];
  /** Every variant of this block, in display order. */
  variants: StudioVariant[];
  /** The variant selected when the block is first opened. */
  defaultVariantId: string;
}

/** The categories in the order the studio lists them. */
export const CATEGORY_ORDER: BlockCategory[] = [
  'media',
  'data',
  'interactive',
  'map',
  'text',
  'context',
  'evidence',
  'specialized',
];

export const CATEGORY_LABELS: Record<BlockCategory, string> = {
  media: 'Media',
  data: 'Data & Visualisation',
  interactive: 'Interactive',
  map: 'Maps & Process',
  text: 'Text & Editorial',
  context: 'Context',
  evidence: 'Evidence',
  specialized: 'Specialized',
};

/** A studio block grouped under its category, ready for the sidebar. */
export interface StudioCategoryGroup {
  category: BlockCategory;
  label: string;
  blocks: StudioBlock[];
}
