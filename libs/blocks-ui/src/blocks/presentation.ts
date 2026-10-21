import type { BlockPresentation } from '@ai-news/schemas';

/**
 * How a block's presentation affects its layout.
 *
 * The presentation options are applied *around* a block, in one place, so
 * that the same three options work for all fifty-five block types without
 * each of them having to know about them.
 *
 * A block with no presentation asks for nothing and gets nothing: the
 * classes are empty, so it is laid out exactly as it was before
 * presentation existed.
 */
export function presentationClass(presentation: BlockPresentation | undefined): string {
  const width = presentation?.width ?? 'column';

  if (width === 'full') {
    /*
     * The story's column is a centred `max-w-4xl`, so a block that wants the
     * whole page has to leave it: half the column's width to the left of
     * its centre, and the same again back.
     */
    return 'w-screen relative left-1/2 -translate-x-1/2';
  }

  if (width === 'contained') {
    /*
     * The alignment only has something to say when the block is narrower
     * than the column — that is, when its width is `contained`.
     */
    const align = presentation?.align;
    const placement = align === 'left' ? 'mr-auto' : align === 'right' ? 'ml-auto' : 'mx-auto';
    return `w-full max-w-3xl ${placement}`;
  }

  return '';
}
