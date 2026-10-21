import type { Story, StoryBlock } from '@ai-news/schemas';
import {
  ApiError,
  addBlock as addStoryBlock,
  getAuthToken,
  reorderBlocks,
  request,
  setAuthToken,
  updateBlock as updateStoryBlock,
} from '@ai-news/api-client';
import { getCurrentUser, loginUser, logoutUser, registerUser } from '@ai-news/api-client';

/**
 * The newsroom API, as the studio uses it.
 *
 * The studio talks to the same API, through the same client and with the
 * same session as the rest of the product — so a sign-in in the web portal
 * is a sign-in here too.
 *
 * The studio proxies the API through its own origin, so the browser never
 * talks to the API directly and no CORS setup is needed.
 */

export interface Paginated<T> {
  items: T[];
  total: number;
  limit: number;
  offset?: number;
  hasMore: boolean;
}

export { ApiError, getAuthToken, setAuthToken };
export { getCurrentUser, loginUser, logoutUser, registerUser };
/** The shared client's block operations, under the names the studio uses. */
export { addStoryBlock, updateStoryBlock, reorderBlocks };

/** Search the newsroom's stories. */
export async function searchStories(
  query: string,
  offset: number,
  limit = 20
): Promise<Paginated<Story>> {
  const params = new URLSearchParams();
  if (query.trim().length > 0) params.set('query', query.trim());
  params.set('limit', String(limit));
  params.set('offset', String(offset));

  const body = await request<{
    data: Story[];
    meta?: { total: number; limit: number; offset?: number; hasMore: boolean };
  }>(`/api/stories?${params.toString()}`);
  const items = Array.isArray(body.data) ? body.data : [];

  return {
    items,
    total: body.meta?.total ?? items.length,
    limit: body.meta?.limit ?? limit,
    offset: body.meta?.offset ?? offset,
    hasMore: body.meta?.hasMore ?? false,
  };
}

/** Read one story, with its blocks. */
export async function getStory(id: string): Promise<Story> {
  return request<Story>(`/api/stories/${encodeURIComponent(id)}`);
}

/**
 * Commit a new version of a story.
 *
 * This is the workflow-aware path: it snapshots an immutable version, writes
 * an audit entry with the change summary, and prepends a `what_changed` block
 * so readers can see what moved. The story's status is not touched — the
 * platform has no staged-revision concept, so a new version of a published
 * story goes live immediately.
 */
export async function commitStoryVersion(
  storyId: string,
  blocks: StoryBlock[],
  changeSummary: string
): Promise<{ versionNumber?: number }> {
  return request<{ versionNumber?: number }>(
    `/api/stories/${encodeURIComponent(storyId)}/versions`,
    {
      method: 'POST',
      body: JSON.stringify({ blocks, changeSummary }),
    }
  );
}

/**
 * Append a new block to a story.
 *
 * This is the "craft a block in the studio and import it" path. The block is
 * appended at the end of the story, and the API records an audit entry for
 * it — unlike the in-place update, which records nothing.
 */

/**
 * Replace one block in a story, in place.
 *
 * The surgical path: the change is live at once, but it creates no version,
 * no audit entry and no diff block. The story's version history will not
 * mention it.
 */

/** A unique id for a block the studio has just built. */
export function newBlockId(blockType: string): string {
  return `blk_${blockType}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}
