/**
 * API Client — Editorial Review, Comments, Reactions & Bookmarks
 */
import type { Story, Comment, BookmarkItem, PollTally } from '@ai-news/schemas';
import { request } from './core';

export async function submitForReview(id: string): Promise<Story> {
  return request<Story>(`/api/stories/${encodeURIComponent(id)}/submit-review`, {
    method: 'POST',
  });
}

export async function reviewStory(
  id: string,
  review: { action: 'approve' | 'reject'; feedback?: string }
): Promise<Story> {
  return request<Story>(`/api/stories/${encodeURIComponent(id)}/review`, {
    method: 'POST',
    body: JSON.stringify(review),
  });
}

export async function getReviewQueue(): Promise<Story[]> {
  const res = await request<{ data: Story[] }>('/api/stories/review-queue');
  return res.data;
}

// ---------------------------------------------------------------------------
// Reader Engagement (Comments, Reactions, Bookmarks)
// ---------------------------------------------------------------------------

export async function getStoryComments(storyId: string): Promise<Comment[]> {
  return request<Comment[]>(`/api/stories/${encodeURIComponent(storyId)}/comments`);
}

export async function createComment(
  storyId: string,
  content: string,
  authorName?: string,
  parentId?: string
): Promise<Comment> {
  return request<Comment>(`/api/stories/${encodeURIComponent(storyId)}/comments`, {
    method: 'POST',
    body: JSON.stringify({ content, authorName, parentId }),
  });
}

export async function moderateComment(
  commentId: string,
  status: 'approved' | 'flagged' | 'hidden',
  reason?: string
): Promise<Comment> {
  return request<Comment>(`/api/comments/${encodeURIComponent(commentId)}/moderate`, {
    method: 'PUT',
    body: JSON.stringify({ status, reason }),
  });
}

export async function deleteComment(commentId: string) {
  return request<{ success: boolean }>(`/api/comments/${encodeURIComponent(commentId)}`, {
    method: 'DELETE',
  });
}

export async function getStoryReactions(storyId: string) {
  return request<{ storyId: string; counts: Record<string, number>; userReactions: string[] }>(
    `/api/stories/${encodeURIComponent(storyId)}/reactions`
  );
}

export async function toggleStoryReaction(storyId: string, reactionType: string) {
  return request<{
    active: boolean;
    summary: { storyId: string; counts: Record<string, number>; userReactions: string[] };
  }>(`/api/stories/${encodeURIComponent(storyId)}/reactions`, {
    method: 'POST',
    body: JSON.stringify({ reactionType }),
  });
}

export async function listServerBookmarks(): Promise<BookmarkItem[]> {
  return request<BookmarkItem[]>('/api/bookmarks');
}

export async function toggleServerBookmark(storyId: string) {
  return request<{ bookmarked: boolean }>(`/api/bookmarks/${encodeURIComponent(storyId)}`, {
    method: 'POST',
  });
}

// ---------------------------------------------------------------------------
// Poll Votes
// ---------------------------------------------------------------------------

/**
 * Live tally for a poll block.
 *
 * The tally merges the counts baked into the story payload with the votes
 * recorded on the server, so it reflects every reader's choice — not just the
 * ones cast in this browser.
 */
export async function getPollTally(storyId: string, blockId: string): Promise<PollTally> {
  return request<PollTally>(
    `/api/stories/${encodeURIComponent(storyId)}/blocks/${encodeURIComponent(blockId)}/poll`
  );
}

/**
 * Cast (or change) this reader's vote on a poll block.
 *
 * A reader has at most one vote per block; voting again replaces the choice.
 */
export async function castPollVote(
  storyId: string,
  blockId: string,
  optionId: string
): Promise<PollTally> {
  return request<PollTally>(
    `/api/stories/${encodeURIComponent(storyId)}/blocks/${encodeURIComponent(blockId)}/poll`,
    {
      method: 'POST',
      body: JSON.stringify({ optionId }),
    }
  );
}

// ---------------------------------------------------------------------------
// Dynamic Categories
// ---------------------------------------------------------------------------
