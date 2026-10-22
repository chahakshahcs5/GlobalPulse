/**
 * Shared assets for the sample payloads.
 *
 * The samples use a placeholder image service rather than files in the
 * repository, so a sample never points at an asset that has to be
 * downloaded, licensed or kept in step with the story it belongs to.
 */

/**
 * A placeholder image URL with a stable seed.
 *
 * The same seed always returns the same photograph, so a sample looks the
 * same every time it is previewed.
 */
export const image = (seed: string, width = 1200, height = 675): string =>
  `https://picsum.photos/seed/${seed}/${width}/${height}`;
