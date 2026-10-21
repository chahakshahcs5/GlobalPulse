import type { StoryBlock } from '@ai-news/schemas';

/**
 * The story the studio is working in.
 *
 * The studio can be opened from the newsroom CMS with a deep link, so an
 * editor lands here with the story — and often the block — already in hand.
 *
 * The context carries the whole story, not just its id, because the studio
 * shows where the editor is: which story, which of its blocks is open, and
 * what else the story contains. A block is not an isolated object; it is a
 * piece of a story, and the studio should treat it that way.
 */
export interface StoryContext {
  storyId: string;
  storyTitle: string;
  storySlug?: string;
  /** The story's status in the newsroom workflow, e.g. PUBLISHED. */
  status?: string;
  /** The block being edited, when the studio was opened for one. */
  blockId?: string;
  /** Every block in the story, in the order it reads. */
  blocks?: StoryBlock[];
}

/** Where the newsroom CMS lives. */
export function cmsUrl(): string {
  return process.env.NEXT_PUBLIC_CMS_URL ?? 'http://localhost:3002';
}

/** The link back to the story the studio is working in. */
export function storyUrl(context: StoryContext): string {
  return context.storySlug ? `${cmsUrl()}/stories/${context.storySlug}` : `${cmsUrl()}/admin`;
}
