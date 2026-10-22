import { describe, it, expect } from 'vitest';
import {
  listStudioBlocks,
  listStudioCategories,
  withExtraVariants,
  type StudioVariant,
} from '@ai-news/block-studio';

/**
 * The newsroom's variants, merged into the catalog.
 *
 * A variant the studio saved is offered to everybody, so the catalog has
 * to carry it — and has to be able to tell a saved variant from a shipped
 * one, because a shipped variant belongs to the repository and cannot be
 * removed, while a saved one belongs to the newsroom and can.
 */
describe('Block Studio variants', () => {
  const saved: StudioVariant = {
    id: 'var_1',
    label: 'Bars, with the axis labelled',
    description: 'The treatment the data desk agreed on.',
    data: { chartType: 'bar' },
  };

  it('adds a saved variant to its block type', () => {
    const blocks = withExtraVariants(listStudioBlocks(), { chart: [saved] });
    const chart = blocks.find((block) => block.type === 'chart');

    expect(chart?.variants.some((variant) => variant.id === 'var_1')).toBe(true);
  });

  it('marks a merged variant as saved, and leaves the shipped ones alone', () => {
    const blocks = withExtraVariants(listStudioBlocks(), { chart: [saved] });
    const chart = blocks.find((block) => block.type === 'chart');

    expect(chart?.variants.find((variant) => variant.id === 'var_1')?.saved).toBe(true);
    expect(chart?.variants.find((variant) => variant.id !== 'var_1')?.saved).toBeUndefined();
  });

  it('does not add the same variant twice', () => {
    const once = withExtraVariants(listStudioBlocks(), { chart: [saved] });
    const twice = withExtraVariants(once, { chart: [saved] });
    const chart = twice.find((block) => block.type === 'chart');

    expect(chart?.variants.filter((variant) => variant.id === 'var_1')).toHaveLength(1);
  });

  it('leaves the catalog alone when there are no saved variants', () => {
    const blocks = withExtraVariants(listStudioBlocks(), {});
    const chart = blocks.find((block) => block.type === 'chart');

    expect(chart?.variants.some((variant) => variant.saved)).toBe(false);
  });

  it('carries the newsroom variants into the categories', () => {
    const groups = listStudioCategories({ chart: [saved] });
    const chart = groups.flatMap((group) => group.blocks).find((block) => block.type === 'chart');

    expect(chart?.variants.some((variant) => variant.id === 'var_1')).toBe(true);
  });
});
