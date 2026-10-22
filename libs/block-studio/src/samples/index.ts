import type { StudioVariant } from '../types';
import { TEXT_SAMPLES } from './text';
import { EVIDENCE_SAMPLES } from './evidence';
import { MEDIA_SAMPLES } from './media';
import { DATA_SAMPLES } from './data';
import { INTERACTIVE_SAMPLES } from './interactive';
import { CONTEXT_SAMPLES } from './context';
import { MAP_SAMPLES } from './map';
import { SPECIALIZED_SAMPLES } from './specialized';
import { IMMERSIVE_SAMPLES } from './immersive';

/**
 * Sample payloads for every block type.
 *
 * The payloads are grouped by the registry's own categories, one file per
 * category, and assembled here. A block type that is registered but has no
 * samples still appears in the studio — with an empty payload — so the
 * catalog never hides a block the platform can render.
 *
 * Every variant is validated against its block's schema by
 * `tests/unit/blocks/block-studio-samples.test.ts`, so a sample can never
 * drift away from the block it demonstrates.
 */
export const BLOCK_SAMPLES: Record<string, StudioVariant[]> = {
  ...TEXT_SAMPLES,
  ...EVIDENCE_SAMPLES,
  ...MEDIA_SAMPLES,
  ...DATA_SAMPLES,
  ...INTERACTIVE_SAMPLES,
  ...CONTEXT_SAMPLES,
  ...MAP_SAMPLES,
  ...SPECIALIZED_SAMPLES,
  ...IMMERSIVE_SAMPLES,
};
