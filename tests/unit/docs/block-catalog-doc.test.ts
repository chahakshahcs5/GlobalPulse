import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import {
  applyBlockCatalog,
  findUncataloguedBlocks,
  renderCatalogSections,
  replaceBetween,
  BLOCK_COUNT_PLACEHOLDER,
} from '../../../scripts/block-catalog-doc';
import { listBlockDefinitions } from '@ai-news/schemas';

/**
 * The block catalog in `docs/content-model.md` is generated from the block
 * registry.
 *
 * It used to be written by hand, which meant renumbering the whole document
 * every time a block type was added — and a missed renumbering left the
 * documentation quietly wrong. These tests make the catalog a build artefact
 * instead: the document must always match the registry.
 */
describe('Block catalog documentation', () => {
  const docPath = join(process.cwd(), 'docs', 'content-model.md');
  const document = readFileSync(docPath, 'utf8');

  it('covers every registered block type', () => {
    // A new registry category that no documented section covers would be
    // dropped from the documentation without a word.
    expect(findUncataloguedBlocks()).toEqual([]);
  });

  it('is in sync with the registry', () => {
    // Compared on content, not on line endings: the working tree may hold
    // CRLF while the committed blob is LF.
    const normalise = (value: string) => value.replace(/\r\n/g, '\n');
    const expected = applyBlockCatalog(document);

    if (normalise(expected) !== normalise(document)) {
      throw new Error(
        'docs/content-model.md is out of date with the block registry. Run `pnpm docs:blocks` to regenerate it.'
      );
    }

    expect(normalise(expected)).toBe(normalise(document));
  });

  it('lists every block type in the rendered catalog', () => {
    const rendered = renderCatalogSections()
      .map((section) => section.body)
      .join('\n');

    for (const definition of listBlockDefinitions()) {
      expect(rendered).toContain(`**\`${definition.type}\`**`);
    }
  });

  it('numbers the entries continuously across the sections', () => {
    const sections = renderCatalogSections();
    let expected = 1;

    for (const section of sections) {
      for (const line of section.body.split('\n')) {
        expect(line.startsWith(`${expected}. `)).toBe(true);
        expected++;
      }
    }

    expect(expected - 1).toBe(listBlockDefinitions().length);
  });

  it('shows the block count in the document', () => {
    expect(document).not.toContain(BLOCK_COUNT_PLACEHOLDER);
    expect(document).toContain(
      `Complete Catalog of ${listBlockDefinitions().length} Supported Block Types`
    );
  });

  it('corrects a stale block count rather than leaving it wrong', () => {
    // The placeholder only survives the first generation, so the count has to
    // be re-derivable from the literal in the document.
    const stale = document
      .replace(
        `Complete Catalog of ${listBlockDefinitions().length} Supported Block Types`,
        'Complete Catalog of 99 Supported Block Types'
      )
      .replace(
        `full catalog of all ${listBlockDefinitions().length} supported block types`,
        'full catalog of all 99 supported block types'
      );

    const fixed = applyBlockCatalog(stale);
    expect(fixed).toContain(
      `Complete Catalog of ${listBlockDefinitions().length} Supported Block Types`
    );
    expect(fixed).not.toContain('99 supported block types');
  });

  it('keeps the hand-written prose between the generated sections', () => {
    // The prose lives between the markers and must not be regenerated away.
    expect(document).toContain('#### Estimates carry their uncertainty');
    expect(document).toContain('#### Sensitivity analysis');
    expect(document).toContain('#### Prediction leaderboards');
    expect(document).toContain('#### Chart annotations');
    expect(document).toContain('#### Live blocks are actually live');
    expect(document).toContain('#### Polls are counted on the server');
    expect(document).toContain('#### Scenario explorers and live comment threads');
  });

  describe('replaceBetween', () => {
    it('replaces only the content between the markers', () => {
      const source = 'before\nBEGIN\nold\nEND\nafter';
      const result = replaceBetween(source, 'BEGIN', 'END', 'new');

      expect(result).toContain('before');
      expect(result).toContain('after');
      expect(result).toContain('new');
      expect(result).not.toContain('old');
    });

    it('throws when a marker is missing rather than silently skipping', () => {
      expect(() => replaceBetween('no markers here', 'BEGIN', 'END', 'new')).toThrow(
        /Missing marker/
      );
    });
  });

  it('is idempotent — running the generator twice changes nothing', () => {
    const once = applyBlockCatalog(document);
    expect(applyBlockCatalog(once)).toBe(once);
  });

  it('produces the same result whatever the file line endings are', () => {
    // A fresh clone on Windows checks the LF blob out as CRLF. The generator
    // must not depend on the working tree's endings, or the sync test fails
    // there while passing on the machine that produced the file.
    const lf = document.replace(/\r\n/g, '\n');
    const crlf = lf.replace(/\n/g, '\r\n');

    expect(applyBlockCatalog(crlf)).toBe(applyBlockCatalog(lf));
    expect(applyBlockCatalog(crlf)).toBe(applyBlockCatalog(applyBlockCatalog(crlf)));
  });

  it('always writes LF, the canonical form for this repository', () => {
    const lf = document.replace(/\r\n/g, '\n');
    const generated = applyBlockCatalog(lf.replace(/\n/g, '\r\n'));
    expect(generated).not.toContain('\r');
  });
});
