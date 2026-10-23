import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import type { StoryBlock } from '@ai-news/schemas';
import { listStudioBlocks } from '@ai-news/block-studio';
import { BlockItem } from '@ai-news/blocks-ui';

/**
 * Every variant of a block must be a different block.
 *
 * A variant is a named way of drawing a block. Two variants that carry
 * the same payload are the same block twice: the variant bar offers the
 * editor a choice that does not exist. And two variants that differ only
 * in their treatment but draw the same picture are the same block twice
 * for the same reason — the renderer ignored the treatment.
 */

/** The markup a block's payload draws. */
function markupFor(type: string, data: Record<string, unknown>): string | null {
  try {
    return renderToStaticMarkup(
      React.createElement(BlockItem, {
        // The block envelope is a union over every block type, and a probe
        // is built from a payload that has already been checked against
        // its own schema.
        block: {
          id: `probe_${type}`,
          blockType: type,
          sortOrder: 0,
          data,
        } as unknown as StoryBlock,
        theme: 'light' as const,
      })
    );
  } catch {
    // A renderer that needs a browser cannot be checked here.
    return null;
  }
}

/**
 * The fields two payloads differ in.
 *
 * A pair that differs in one field, and that field is the treatment, is
 * a pair the renderer is responsible for telling apart. A pair that
 * differs in something else — a zoom level, a marker, a flag read at run
 * time — is not: it may well look the same in a static render and be
 * different in the browser.
 */
function treatmentOnlyDifference(a: Record<string, unknown>, b: Record<string, unknown>): boolean {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  const differing = [...keys].filter((key) => JSON.stringify(a[key]) !== JSON.stringify(b[key]));
  return differing.length === 1 && (differing[0] === 'layout' || differing[0] === 'style');
}

describe('Block Studio variants', () => {
  it('never lets two variants of a block carry the same payload', () => {
    const duplicates: string[] = [];

    for (const block of listStudioBlocks()) {
      const seen = new Map<string, string[]>();
      for (const variant of block.variants) {
        const key = JSON.stringify(variant.data);
        const group = seen.get(key) ?? [];
        group.push(variant.id);
        seen.set(key, group);
      }
      for (const ids of seen.values()) {
        if (ids.length > 1) duplicates.push(`${block.type}: ${ids.join(' and ')}`);
      }
    }

    expect(duplicates.join(' | ')).toBe('');
  });

  for (const block of listStudioBlocks()) {
    const variants = block.variants.filter((variant) => Object.keys(variant.data).length > 0);
    if (variants.length < 2) continue;

    it(`tells the treatments of '${block.type}' apart`, () => {
      // The picture each variant draws.
      const pictures = new Map<string, { id: string; data: Record<string, unknown> }[]>();
      let drawn = 0;

      for (const variant of variants) {
        const markup = markupFor(block.type, variant.data);
        if (markup === null) continue;
        drawn++;
        const group = pictures.get(markup);
        if (group) group.push({ id: variant.id, data: variant.data });
        else pictures.set(markup, [{ id: variant.id, data: variant.data }]);
      }

      if (drawn < 2) return;

      const ignored: string[] = [];
      for (const group of pictures.values()) {
        for (let i = 0; i < group.length; i++) {
          for (let j = i + 1; j < group.length; j++) {
            if (treatmentOnlyDifference(group[i].data, group[j].data)) {
              ignored.push(`${group[i].id} and ${group[j].id}`);
            }
          }
        }
      }

      expect(ignored.join(' | ')).toBe('');
    });
  }
});
