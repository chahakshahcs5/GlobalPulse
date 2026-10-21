import type {
  BlockAccessibility,
  BlockPresentation,
  DataProvenance,
  StoryBlock,
} from '@ai-news/schemas';
import type { StudioPayload } from './types';

/**
 * The parts of a block that an editor edits.
 *
 * This is deliberately structural rather than `StoryBlock`: a block is a
 * discriminated union of fifty-five shapes, and every one of them carries
 * the same envelope. Reading the envelope off a block should not require
 * knowing which of the fifty-five it is.
 */
export interface BlockEnvelope {
  data?: Record<string, unknown>;
  presentation?: BlockPresentation;
  accessibility?: BlockAccessibility;
  provenance?: DataProvenance;
  citationIds?: string[];
  sourceIds?: string[];
  metadata?: Record<string, unknown>;
}

/**
 * The editable payload of a block.
 *
 * The envelope's own fields are read only when they are there: a block with
 * no accessibility text does not gain an empty accessibility object on the
 * way through the studio.
 */
export function payloadOf(block: BlockEnvelope): StudioPayload {
  const payload: StudioPayload = { data: block.data ?? {} };

  if (block.presentation) payload.presentation = block.presentation;
  if (block.accessibility) payload.accessibility = block.accessibility;
  if (block.provenance) payload.provenance = block.provenance;
  if (block.citationIds) payload.citationIds = block.citationIds;
  if (block.sourceIds) payload.sourceIds = block.sourceIds;
  if (block.metadata) payload.metadata = block.metadata;

  return payload;
}

/**
 * The block a payload describes.
 *
 * The platform's own fields — the id, the type and the position in the
 * story — are supplied by the caller; the payload supplies everything else.
 * Nothing is dropped: a block that came back from the studio keeps the
 * accessibility text, the provenance and the citations it had.
 */
export function blockOf(
  blockType: string,
  id: string,
  sortOrder: number,
  payload: StudioPayload
): StoryBlock {
  return {
    id,
    blockType,
    sortOrder,
    ...payload,
  } as unknown as StoryBlock;
}
