import type { StudioPayload } from './types';

/**
 * Handing a block from the studio back to the story composer.
 *
 * A story that is being written does not exist on the server yet, so there
 * is nothing for the studio to write a block into. The studio therefore hands
 * the block to the composer instead, through the browser: the composer
 * keeps the block in its draft and writes it when the story is saved.
 *
 * The studio can still write straight to a story that *does* exist — see
 * `newsroom-api.ts` — but for a story in progress this is the only way the
 * block can get back to the editor who is writing it.
 */

export interface HandedOffBlock {
  blockType: string;
  /**
   * The whole block, not just its content.
   *
   * The block's presentation, accessibility text, provenance and citations
   * travel with it, so a block that is edited in the studio and handed back
   * keeps everything it had.
   */
  payload: StudioPayload;
  /** The block being replaced, when the studio was editing an existing one. */
  blockId?: string;
  sentAt: string;
}

const HANDOFF_PREFIX = 'block_studio_handoff_';

export function handoffKey(sessionId: string): string {
  return `${HANDOFF_PREFIX}${sessionId}`;
}

/** Hand a block to the composer that opened this session. */
export function sendBlockToComposer(
  sessionId: string,
  block: Omit<HandedOffBlock, 'sentAt'>
): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(
      handoffKey(sessionId),
      JSON.stringify({ ...block, sentAt: new Date().toISOString() })
    );
  } catch {
    // Private mode, or the quota is full. The block is not handed over.
  }
}

/**
 * Take a block the studio handed over, and clear it.
 *
 * It is cleared on the way out so the same block is never added twice.
 */
export function takeBlockFromComposer(sessionId: string): HandedOffBlock | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(handoffKey(sessionId));
    if (!raw) return null;
    window.localStorage.removeItem(handoffKey(sessionId));
    const parsed = JSON.parse(raw) as HandedOffBlock;
    return parsed && typeof parsed.blockType === 'string' ? parsed : null;
  } catch {
    return null;
  }
}
