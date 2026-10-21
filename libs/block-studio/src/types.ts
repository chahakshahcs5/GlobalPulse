import type { BlockCategory } from '@ai-news/schemas';

/**
 * The shapes the Block Studio works with.
 *
 * A *block* is one registered block type. A *variant* is a named, ready-made
 * payload for that type — the way a chart has a "line" variant and a "stacked
 * bar" variant. The studio previews a variant, lets an editor change the
 * payload, and shows the result immediately.
 */

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
