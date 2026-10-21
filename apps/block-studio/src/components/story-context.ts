/**
 * The story the studio is working in.
 *
 * The studio can be opened from the newsroom CMS with a deep link, so an
 * editor lands here with the story — and often the block — already in hand.
 */
export interface StoryContext {
  storyId: string;
  storyTitle: string;
  storySlug?: string;
  /** The block being edited, when the studio was opened for one. */
  blockId?: string;
}

/** Where the newsroom CMS lives. */
export function cmsUrl(): string {
  return process.env.NEXT_PUBLIC_CMS_URL ?? 'http://localhost:3002';
}

/** The link back to the story the studio is working in. */
export function storyUrl(context: StoryContext): string {
  return context.storySlug ? `${cmsUrl()}/stories/${context.storySlug}` : `${cmsUrl()}/admin`;
}
