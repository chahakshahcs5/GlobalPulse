/**
 * Where the Block Studio lives.
 *
 * The studio is a separate app so it can carry its own dependencies, but the
 * newsroom CMS has to be able to link a block straight into it. The address
 * is configuration, because the studio may be running on another machine or
 * behind a tunnel.
 */
export const STUDIO_URL =
  process.env.NEXT_PUBLIC_STUDIO_URL?.replace(/\/$/, '') ?? 'http://localhost:3003';

/**
 * A link that opens the studio with a story already in hand.
 *
 * `session` identifies the composer that opened the studio, so a block the
 * editor builds there can find its way back into the draft.
 */
export function studioUrl(storyId: string | undefined, blockId?: string, session?: string): string {
  const params = new URLSearchParams();
  if (storyId) params.set('story', storyId);
  if (blockId) params.set('block', blockId);
  if (session) params.set('draft', session);
  return `${STUDIO_URL}/?${params.toString()}`;
}
