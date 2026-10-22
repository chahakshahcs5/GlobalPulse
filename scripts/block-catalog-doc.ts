import { listBlockDefinitions, type BlockDefinition } from '@ai-news/schemas';

/**
 * Generator for the block catalog in `docs/content-model.md`.
 *
 * The catalog is derived from the block registry, which is the single source of
 * truth for what block types exist. Hand-maintaining it meant renumbering the
 * whole document every time a type was added — and a missed renumbering left
 * the documentation quietly wrong.
 *
 * The document carries explicit markers around each generated region, so the
 * hand-written prose between the categories is preserved untouched.
 */

export interface CatalogSectionConfig {
  /**
   * The registry categories this section covers, in the order they appear.
   * A section may merge several categories.
   */
  categories: string[];
  /** The section heading, without its number. */
  title: string;
}

/**
 * How the registry categories map onto the documented sections.
 *
 * The registry splits context into three categories (`context`, `evidence`,
 * `specialized`); the documentation presents them as one section.
 */
export const CATALOG_SECTIONS: CatalogSectionConfig[] = [
  { categories: ['text'], title: 'Text & editorial' },
  { categories: ['media'], title: 'Media blocks' },
  { categories: ['data'], title: 'Data & quantitative blocks' },
  { categories: ['map'], title: 'Map, timeline & diagram blocks' },
  { categories: ['interactive'], title: 'Interactive blocks' },
  { categories: ['immersive'], title: 'Immersive & motion blocks' },
  {
    categories: ['context', 'evidence', 'specialized'],
    title: 'Evidence, source & context blocks',
  },
];

export const CATALOG_BEGIN = (id: string) => `<!-- BEGIN GENERATED BLOCK CATALOG: ${id} -->`;
export const CATALOG_END = (id: string) => `<!-- END GENERATED BLOCK CATALOG: ${id} -->`;

/** Inline placeholder for the total number of block types. */
export const BLOCK_COUNT_PLACEHOLDER = '<!-- BLOCK_COUNT -->';

/**
 * The phrases in the document that state the total number of block types.
 *
 * The placeholder is only present until the first generation, after which the
 * count is a literal. These patterns let the generator update it again, so
 * adding a block type never leaves the total stale.
 */
const BLOCK_COUNT_PATTERNS: Array<[RegExp, string]> = [
  [/(Complete Catalog of )\d+( Supported Block Types)/, '$1'],
  [/(full catalog of all )\d+( supported block types)/, '$1'],
];

export interface RenderedSection {
  /** The marker id used in the document. */
  id: string;
  /** The section heading, including its number and the block count. */
  heading: string;
  /** The numbered entries. */
  body: string;
}

/**
 * Render every catalog section, numbering the entries continuously across
 * sections so the document reads as one list.
 */
export function renderCatalogSections(
  definitions: BlockDefinition[] = listBlockDefinitions()
): RenderedSection[] {
  let number = 1;

  return CATALOG_SECTIONS.map((section, sectionIdx) => {
    const entries = section.categories.flatMap((category) =>
      definitions.filter((definition) => definition.category === category)
    );

    const heading = `### 2.${sectionIdx + 1} ${section.title} (${entries.length})`;
    const body = entries
      .map((definition) => `${number++}. **\`${definition.type}\`**: ${definition.description}`)
      .join('\n');

    return { id: section.categories[0], heading, body };
  });
}

/**
 * Replace the content between two markers.
 *
 * Throws when a marker is missing, so a renamed or deleted marker fails
 * loudly instead of silently leaving the document stale.
 */
export function replaceBetween(
  document: string,
  beginMarker: string,
  endMarker: string,
  content: string
): string {
  const begin = document.indexOf(beginMarker);
  if (begin === -1) {
    throw new Error(`Missing marker: ${beginMarker}`);
  }
  const end = document.indexOf(endMarker, begin);
  if (end === -1) {
    throw new Error(`Missing marker: ${endMarker}`);
  }

  const before = document.slice(0, begin + beginMarker.length);
  const after = document.slice(end);
  return `${before}\n\n${content}\n\n${after}`;
}

/**
 * Replace the stated number of block types.
 *
 * The placeholder handles the first generation; the patterns handle every
 * later one, so the total never goes stale when a type is added.
 */
export function replaceBlockCount(document: string, count: number): string {
  let output = document.replaceAll(BLOCK_COUNT_PLACEHOLDER, String(count));

  for (const [pattern, prefix] of BLOCK_COUNT_PATTERNS) {
    output = output.replace(pattern, `${prefix}${count}$2`);
  }

  return output;
}

/**
 * Produce the updated document.
 *
 * Only the marked regions and the block count change; everything else in the
 * file is left exactly as the author wrote it.
 *
 * The result is always LF. That is the canonical form for this repository
 * (`.prettierrc.json` sets `endOfLine: lf`, and git stores the blob that
 * way), and it makes the generator idempotent whatever line endings the
 * working tree happens to have - `core.autocrlf` checks an LF blob out as
 * CRLF on Windows, and a generator that preserved the file's own endings
 * would produce a different result there than on the machine that made it.
 */
export function applyBlockCatalog(
  document: string,
  definitions: BlockDefinition[] = listBlockDefinitions()
): string {
  let output = document.replace(/\r\n/g, '\n');

  for (const section of renderCatalogSections(definitions)) {
    output = replaceBetween(
      output,
      CATALOG_BEGIN(section.id),
      CATALOG_END(section.id),
      `${section.heading}\n\n${section.body}`
    );
  }

  return replaceBlockCount(output, definitions.length);
}

/**
 * Block types that are in the registry but in no documented section.
 *
 * A new registry category would otherwise be dropped from the documentation
 * without a word, so this is reported rather than ignored.
 */
export function findUncataloguedBlocks(
  definitions: BlockDefinition[] = listBlockDefinitions()
): string[] {
  const catalogued = new Set(
    CATALOG_SECTIONS.flatMap((section) =>
      definitions
        .filter((definition) => section.categories.includes(definition.category))
        .map((definition) => definition.type)
    )
  );

  return definitions
    .filter((definition) => !catalogued.has(definition.type))
    .map((definition) => definition.type);
}
