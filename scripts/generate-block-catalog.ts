import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import {
  applyBlockCatalog,
  findUncataloguedBlocks,
  renderCatalogSections,
} from './block-catalog-doc';
import { listBlockDefinitions } from '@ai-news/schemas';

/**
 * Regenerate the block catalog in `docs/content-model.md` from the block
 * registry.
 *
 *   pnpm docs:blocks
 *
 * The script only rewrites the regions marked as generated; the prose around
 * them is left alone.
 */
const DOC_PATH = join(process.cwd(), 'docs', 'content-model.md');

function main(): void {
  const definitions = listBlockDefinitions();

  const uncatalogued = findUncataloguedBlocks(definitions);
  if (uncatalogued.length > 0) {
    console.error(
      `These block types are not covered by any documented section: ${uncatalogued.join(', ')}`
    );
    console.error(
      'Add their registry category to CATALOG_SECTIONS in scripts/block-catalog-doc.ts.'
    );
    process.exitCode = 1;
    return;
  }

  const original = readFileSync(DOC_PATH, 'utf8');
  const updated = applyBlockCatalog(original, definitions);

  if (updated === original) {
    console.log(`Block catalog already up to date (${definitions.length} types).`);
  } else {
    writeFileSync(DOC_PATH, updated);
    console.log(`Updated block catalog in docs/content-model.md (${definitions.length} types).`);
  }

  for (const section of renderCatalogSections(definitions)) {
    const count = section.body.split('\n').length;
    console.log(`  ${section.heading.replace(/^### /, '')} — ${count} entries`);
  }
}

main();
