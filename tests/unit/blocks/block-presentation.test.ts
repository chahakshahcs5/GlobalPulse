import { describe, it, expect } from 'vitest';
import { presentationClass } from '@ai-news/blocks-ui';

/**
 * How a block's presentation affects its layout.
 *
 * The presentation options are applied around a block rather than inside
 * it, which is what lets one set of options work for every block type. The
 * important case is the default one: a block that asks for nothing must be
 * laid out exactly as it was before presentation existed.
 */
describe('Block presentation', () => {
  it('changes nothing for a block with no presentation', () => {
    expect(presentationClass(undefined)).toBe('');
    expect(presentationClass({})).toBe('');
  });

  it('changes nothing for a block that asks for the column width', () => {
    expect(presentationClass({ width: 'column' })).toBe('');
  });

  it('narrows a contained block', () => {
    const classes = presentationClass({ width: 'contained' });

    expect(classes).toContain('max-w-3xl');
    expect(classes).toContain('w-full');
  });

  it('centres a contained block by default', () => {
    expect(presentationClass({ width: 'contained' })).toContain('mx-auto');
  });

  it('aligns a contained block as it is asked to', () => {
    expect(presentationClass({ width: 'contained', align: 'left' })).toContain('mr-auto');
    expect(presentationClass({ width: 'contained', align: 'right' })).toContain('ml-auto');
    expect(presentationClass({ width: 'contained', align: 'center' })).toContain('mx-auto');
  });

  it('breaks a full-width block out of the column', () => {
    const classes = presentationClass({ width: 'full' });

    expect(classes).toContain('w-screen');
    expect(classes).toContain('-translate-x-1/2');
  });
});
