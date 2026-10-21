import { describe, it, expect } from 'vitest';
import { StoryBlockSchema } from '@ai-news/schemas';
import {
  assembleStoryBlocks,
  createDefaultMediaBlock,
  validateStoryBlocks,
} from '../../../apps/web/src/app/admin/components/story-editor/block-factories';
import { COMPOSER_BLOCK_TYPES } from '../../../apps/web/src/app/admin/components/story-editor/types';
import type { MediaBlockDraft } from '../../../apps/web/src/app/admin/components/story-editor/types';

/**
 * The newsroom composer and the platform share one schema.
 *
 * The composer used to keep a flattened, invented shape — a chart's axis as
 * a bare string, its rows as a text blob — and rebuild it on save. The
 * platform rejected the result, so a chart written in the CMS was not a
 * chart the site could render. These tests make that impossible to repeat.
 */
describe('Newsroom composer blocks', () => {
  it('offers block types the platform knows', () => {
    for (const type of COMPOSER_BLOCK_TYPES) {
      const definition = createDefaultMediaBlock(type);
      expect(definition.type).toBe(type);
    }
  });

  it('creates a default payload the platform accepts', () => {
    for (const type of COMPOSER_BLOCK_TYPES) {
      const blocks = assembleStoryBlocks({
        leadParagraph: 'A lead paragraph.',
        bullet1: 'One',
        bullet2: 'Two',
        bullet3: 'Three',
        mediaBlocks: [createDefaultMediaBlock(type)],
      });

      const issues = validateStoryBlocks(blocks);
      expect(issues, `${type}: ${issues.map((issue) => issue.message).join(', ')}`).toEqual([]);
    }
  });

  it('produces blocks the platform schema accepts', () => {
    for (const type of COMPOSER_BLOCK_TYPES) {
      const blocks = assembleStoryBlocks({
        leadParagraph: 'A lead paragraph.',
        bullet1: 'One',
        bullet2: 'Two',
        bullet3: 'Three',
        mediaBlocks: [createDefaultMediaBlock(type)],
      });

      for (const block of blocks) {
        const result = StoryBlockSchema.safeParse(block);
        expect(result.success, `${type} failed: ${JSON.stringify(result.error?.issues)}`).toBe(
          true
        );
      }
    }
  });

  it('keeps the lead paragraph and the takeaways', () => {
    const blocks = assembleStoryBlocks({
      leadParagraph: 'The lead.',
      bullet1: 'First',
      bullet2: '',
      bullet3: '',
      mediaBlocks: [],
    });

    expect(blocks.map((block) => block.blockType)).toEqual(['paragraph', 'summary']);
    expect(blocks[1].data).toEqual({ headline: 'Key Takeaways', bulletPoints: ['First'] });
  });

  it('reports a block that would be rejected, rather than saving it', () => {
    const broken: MediaBlockDraft = {
      id: 'blk_broken',
      type: 'image',
      data: { url: 'https://example.com/a.png', altText: '' },
    };

    const blocks = assembleStoryBlocks({
      leadParagraph: '',
      bullet1: '',
      bullet2: '',
      bullet3: '',
      mediaBlocks: [broken],
    });

    const issues = validateStoryBlocks(blocks);
    expect(issues.length).toBeGreaterThan(0);
    expect(issues[0].blockType).toBe('image');
  });
});
