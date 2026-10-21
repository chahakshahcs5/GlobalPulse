import { listBlockDefinitions } from '@ai-news/schemas';
import { BLOCK_SAMPLES } from './samples';
import {
  CATEGORY_LABELS,
  CATEGORY_ORDER,
  type StudioBlock,
  type StudioCategoryGroup,
  type StudioVariant,
} from './types';

/**
 * The studio catalog.
 *
 * It is built from the platform's own block registry, so a block type that
 * exists in the product exists in the studio — there is no second list to
 * keep in step. The samples supply the variants; a type with no sample
 * still appears, with a single empty variant, so the studio never hides a
 * block type.
 */

function variantsFor(type: string): StudioVariant[] {
  const samples = BLOCK_SAMPLES[type];
  if (samples && samples.length > 0) return samples;
  return [
    {
      id: 'default',
      label: 'Default',
      description: 'An empty payload. Fill it in to see the block render.',
      data: {},
    },
  ];
}

let cached: StudioBlock[] | null = null;

/** Every block type the platform knows about, with its variants. */
export function listStudioBlocks(): StudioBlock[] {
  if (cached) return cached;

  cached = listBlockDefinitions().map((definition) => {
    const variants = variantsFor(definition.type);
    return {
      type: definition.type,
      category: definition.category,
      description: definition.description,
      schemaVersion: definition.schemaVersion,
      recommendedFor: definition.recommendedFor,
      variants,
      defaultVariantId: variants[0].id,
    };
  });

  return cached;
}

export function getStudioBlock(type: string): StudioBlock | undefined {
  return listStudioBlocks().find((block) => block.type === type);
}

export function getStudioVariant(type: string, variantId: string): StudioVariant | undefined {
  const block = getStudioBlock(type);
  if (!block) return undefined;
  return block.variants.find((variant) => variant.id === variantId) ?? block.variants[0];
}

/** The blocks grouped by category, in the order the sidebar lists them. */
export function listStudioCategories(): StudioCategoryGroup[] {
  const blocks = listStudioBlocks();
  const groups: StudioCategoryGroup[] = [];

  for (const category of CATEGORY_ORDER) {
    const inCategory = blocks.filter((block) => block.category === category);
    if (inCategory.length === 0) continue;
    groups.push({
      category,
      label: CATEGORY_LABELS[category],
      blocks: inCategory,
    });
  }

  // Any category the registry adds later still shows up, at the end.
  const known = new Set(CATEGORY_ORDER);
  for (const block of blocks) {
    if (known.has(block.category)) continue;
    const existing = groups.find((group) => group.category === block.category);
    if (existing) existing.blocks.push(block);
    else {
      groups.push({
        category: block.category,
        label: CATEGORY_LABELS[block.category] ?? block.category,
        blocks: [block],
      });
    }
  }

  return groups;
}

/** Free-text search over the block catalog. */
export function searchStudioBlocks(query: string): StudioBlock[] {
  const trimmed = query.trim().toLowerCase();
  if (trimmed.length === 0) return listStudioBlocks();

  return listStudioBlocks().filter((block) => {
    if (block.type.toLowerCase().includes(trimmed)) return true;
    if (block.description.toLowerCase().includes(trimmed)) return true;
    if (block.variants.some((variant) => variant.label.toLowerCase().includes(trimmed))) {
      return true;
    }
    return (block.recommendedFor ?? []).some((use) => use.toLowerCase().includes(trimmed));
  });
}

/** How many variants the whole catalog carries — shown in the studio header. */
export function countStudioVariants(): number {
  return listStudioBlocks().reduce((total, block) => total + block.variants.length, 0);
}
