import { describe, it, expect } from 'vitest';
import { StoryBlockSchema, type StoryBlock } from '@ai-news/schemas';
import { listStudioBlocks } from '@ai-news/block-studio';
import {
  renumberBlocks,
  validateStoryBlocks,
} from '../../../apps/web/src/app/admin/components/story-editor/block-factories';

/**
 * The newsroom composer and the platform share one schema.
 *
 * The composer used to keep a flattened, invented shape — a chart's axis as
 * a bare string, its rows as a text blob — and rebuild it on save. The
 * platform rejected the result, so a chart written in the CMS was not a
 * chart the site could render. These tests make that impossible to repeat.
 *
 * They also make sure the composer does not lose a story's blocks, which is
 * what it used to do: it kept a handful of fields and rebuilt the story
 * from them, so every block it did not understand was dropped on save.
 */
describe('Newsroom composer blocks', () => {
  it('offers every block type the platform knows', () => {
    const types = listStudioBlocks().map((block) => block.type);

    expect(types.length).toBeGreaterThan(0);
    expect(new Set(types).size).toBe(types.length);
  });

  it('starts a block with a payload the platform accepts', () => {
    for (const block of listStudioBlocks()) {
      const sample = block.variants.find((variant) => variant.id === block.defaultVariantId);
      if (!sample) continue;

      const candidate = {
        id: `blk_${block.type}_1`,
        blockType: block.type,
        sortOrder: 0,
        data: sample.data,
      } as unknown as StoryBlock;

      const issues = validateStoryBlocks([candidate]);
      expect(issues, `${block.type}: ${issues.map((issue) => issue.message).join(', ')}`).toEqual(
        []
      );
    }
  });

  it('keeps every block the story has, in the order they read', () => {
    /*
     * The regression: the composer used to rebuild the story from a lead
     * paragraph, three bullets and a list of media blocks, so a story with
     * a heading, a citation and a source lost all three the moment it was
     * opened and saved.
     */
    const storyBlocks: StoryBlock[] = [
      {
        id: 'b1',
        blockType: 'heading',
        sortOrder: 0,
        data: { text: 'A heading', level: 2 },
      },
      {
        id: 'b2',
        blockType: 'paragraph',
        sortOrder: 1,
        data: { text: 'A lead.', format: 'markdown' },
      },
      {
        id: 'b3',
        blockType: 'citation',
        sortOrder: 2,
        data: { claim: 'A claim.', sourceIds: ['src_1'] },
      },
      {
        id: 'b4',
        blockType: 'source',
        sortOrder: 3,
        data: {
          sourceId: 'src_1',
          title: 'A source',
          publisher: 'A publisher',
          url: 'https://example.com',
        },
      },
    ];

    const numbered = renumberBlocks(storyBlocks);

    expect(numbered.map((block) => block.id)).toEqual(['b1', 'b2', 'b3', 'b4']);
    expect(numbered.map((block) => block.sortOrder)).toEqual([0, 1, 2, 3]);
    expect(validateStoryBlocks(numbered)).toEqual([]);
  });

  it('numbers the blocks after a move', () => {
    const moved = renumberBlocks([
      {
        id: 'b2',
        blockType: 'paragraph',
        sortOrder: 0,
        data: { text: 'Second.', format: 'markdown' },
      },
      {
        id: 'b1',
        blockType: 'paragraph',
        sortOrder: 0,
        data: { text: 'First.', format: 'markdown' },
      },
    ]);

    expect(moved.map((block) => [block.id, block.sortOrder])).toEqual([
      ['b2', 0],
      ['b1', 1],
    ]);
  });

  it('reports a block that would be rejected, rather than saving it', () => {
    const broken = {
      id: 'blk_broken',
      blockType: 'image',
      sortOrder: 0,
      data: { url: 'https://example.com/a.png', altText: '' },
    } as unknown as StoryBlock;

    const issues = validateStoryBlocks([broken]);

    expect(issues.length).toBeGreaterThan(0);
    expect(issues[0].blockType).toBe('image');
  });

  it('accepts a block the platform can render', () => {
    const good = {
      id: 'blk_good',
      blockType: 'image',
      sortOrder: 0,
      data: { url: 'https://example.com/a.png', altText: 'A picture of something.' },
    } as unknown as StoryBlock;

    expect(validateStoryBlocks([good])).toEqual([]);
    expect(StoryBlockSchema.safeParse(good).success).toBe(true);
  });
});
