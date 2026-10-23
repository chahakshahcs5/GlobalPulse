import { describe, it, expect } from 'vitest';
import { NUMBER_LOCALE, formatNumber } from '@ai-news/media';

/**
 * A figure has to read the same way wherever it is drawn.
 *
 * `toLocaleString()` with no locale uses whichever locale the runtime
 * happens to be set to, so a server in one place and a reader in another
 * write the same figure differently. The page is then rendered twice and
 * React reports a mismatch between the two.
 */
describe('Figure formatting', () => {
  it('writes a figure the same way whatever the runtime locale is', () => {
    const original = process.env.LC_ALL ?? process.env.LANG;
    const values = [1840000000, 9400.5, 12, 0.25, 1_000_000];

    const written = values.map((value) => formatNumber(value));

    // The runtime's locale is not the platform's, and it must not matter.
    try {
      process.env.LC_ALL = 'en_IN';
      process.env.LANG = 'en_IN';
      const again = values.map((value) => formatNumber(value));
      expect(again).toEqual(written);
    } finally {
      if (original === undefined) {
        delete process.env.LC_ALL;
        delete process.env.LANG;
      } else {
        process.env.LC_ALL = original;
        process.env.LANG = original;
      }
    }
  });

  it('writes a large figure the way the platform writes it', () => {
    expect(formatNumber(1840000000)).toBe('1,840,000,000');
  });

  it('uses one locale for every figure in the platform', () => {
    expect(NUMBER_LOCALE).toBe('en-GB');
  });

  it('writes a figure that is not a number as a dash', () => {
    expect(formatNumber(Number.NaN)).toBe('—');
    expect(formatNumber(Number.POSITIVE_INFINITY)).toBe('—');
  });
});
