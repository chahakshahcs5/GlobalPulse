/**
 * API Client — Stories & Publishing Endpoints
 */
import type {
  Story,
  StoryBlock,
  StoryVersion,
  CreateStoryInput,
  UpdateStoryInput,
} from '@ai-news/schemas';
import { request } from './core';

export interface ListStoriesParams {
  status?: string;
  articleType?: string;
  topicId?: string;
  entityId?: string;
  query?: string;
  limit?: number;
  /** How many stories to skip — the page to ask for. */
  offset?: number;
  /** The order the stories come back in. */
  sort?: string;
}

/**
 * One page of stories, and what the newsroom knows about the rest.
 *
 * The API answers with the page and a description of the whole: how many
 * stories there are, how many were asked for, and whether there is more.
 * A caller that only wants the stories can use `listStories`; a caller that
 * has to tell the reader how many there are needs this.
 */
export interface StoryPage {
  items: Story[];
  /** How many stories match, in the whole newsroom — not just this page. */
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

export async function listStoriesPage(params?: ListStoriesParams): Promise<StoryPage> {
  const searchParams = new URLSearchParams();
  if (params?.status) searchParams.set('status', params.status);
  if (params?.articleType) searchParams.set('articleType', params.articleType);
  if (params?.topicId) searchParams.set('topicId', params.topicId);
  if (params?.entityId) searchParams.set('entityId', params.entityId);
  if (params?.query) searchParams.set('query', params.query);
  if (params?.limit) searchParams.set('limit', String(Math.min(params.limit, 500)));
  if (params?.offset) searchParams.set('offset', String(params.offset));
  if (params?.sort) searchParams.set('sort', params.sort);

  const qs = searchParams.toString();
  const response = await request<{
    data: Story[];
    meta?: { total?: number; limit?: number; offset?: number; hasMore?: boolean };
  }>(`/api/stories${qs ? `?${qs}` : ''}`);

  const items = Array.isArray(response.data) ? response.data : [];
  const limit = response.meta?.limit ?? params?.limit ?? items.length;

  return {
    items,
    total: response.meta?.total ?? items.length,
    limit,
    offset: response.meta?.offset ?? params?.offset ?? 0,
    hasMore:
      response.meta?.hasMore ??
      (response.meta?.total !== undefined
        ? (response.meta.offset ?? params?.offset ?? 0) + items.length < response.meta.total
        : false),
  };
}

export async function listStories(params?: ListStoriesParams): Promise<Story[]> {
  const page = await listStoriesPage(params);
  return page.items;
}

export async function getStory(id: string): Promise<Story> {
  return request<Story>(`/api/stories/${id}`);
}

export async function getStoryBySlug(slug: string): Promise<Story> {
  return request<Story>(`/api/stories/slug/${slug}`);
}

export async function createStory(input: CreateStoryInput): Promise<Story> {
  return request<Story>('/api/stories', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function updateStory(id: string, input: UpdateStoryInput): Promise<Story> {
  return request<Story>(`/api/stories/${id}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  });
}

export async function publishStory(id: string, idempotencyKey?: string): Promise<Story> {
  return request<Story>(`/api/stories/${id}/publish`, {
    method: 'POST',
    body: JSON.stringify({ idempotencyKey }),
  });
}

export async function unpublishStory(id: string): Promise<Story> {
  return request<Story>(`/api/stories/${id}/unpublish`, {
    method: 'POST',
    body: JSON.stringify({}),
  });
}

export async function archiveStory(id: string): Promise<Story> {
  return request<Story>(`/api/stories/${id}/archive`, {
    method: 'POST',
    body: JSON.stringify({}),
  });
}

export async function deleteStory(id: string): Promise<{ success: boolean }> {
  return request<{ success: boolean }>(`/api/stories/${id}`, {
    method: 'DELETE',
  });
}

// ---------------------------------------------------------------------------
// Blocks API
// ---------------------------------------------------------------------------

export async function addBlock(storyId: string, block: Partial<StoryBlock>): Promise<StoryBlock> {
  return request<StoryBlock>(`/api/stories/${storyId}/blocks`, {
    method: 'POST',
    body: JSON.stringify(block),
  });
}

export async function updateBlock(
  storyId: string,
  blockId: string,
  block: Partial<StoryBlock>
): Promise<StoryBlock> {
  return request<StoryBlock>(`/api/stories/${storyId}/blocks/${blockId}`, {
    method: 'PUT',
    body: JSON.stringify(block),
  });
}

export async function removeBlock(storyId: string, blockId: string): Promise<void> {
  return request<void>(`/api/stories/${storyId}/blocks/${blockId}`, {
    method: 'DELETE',
  });
}

/**
 * Put a story's blocks in a new order.
 *
 * The order is given as the ids of every block in the story, so the platform
 * can renumber them and keep the story consistent. A block that is left out
 * would be an accident, and the editor is told about it rather than having
 * it silently dropped.
 */
export async function reorderBlocks(storyId: string, blockIds: string[]): Promise<StoryBlock[]> {
  return request<StoryBlock[]>(`/api/stories/${storyId}/blocks/reorder`, {
    method: 'PUT',
    body: JSON.stringify({ blockIds }),
  });
}

// ---------------------------------------------------------------------------
// Versions API
// ---------------------------------------------------------------------------

export async function createStoryVersion(
  storyId: string,
  input: { changeSummary: string; title?: string; summary?: string; blocks?: StoryBlock[] }
): Promise<StoryVersion> {
  return request<StoryVersion>(`/api/stories/${storyId}/versions`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function listStoryVersions(storyId: string): Promise<StoryVersion[]> {
  return request<StoryVersion[]>(`/api/stories/${storyId}/versions`);
}

// ---------------------------------------------------------------------------
// SSE Realtime Stream
// ---------------------------------------------------------------------------

export async function scheduleStory(id: string, publishAt: string): Promise<Story> {
  return request<Story>(`/api/stories/${id}/schedule`, {
    method: 'POST',
    body: JSON.stringify({ publishAt }),
  });
}

export async function listScheduledStories(): Promise<Story[]> {
  const res = await request<{ data: Story[] }>('/api/stories/scheduled/list');
  return res?.data || [];
}

export async function sweepScheduledStories(): Promise<{
  success: boolean;
  count: number;
  published: Story[];
}> {
  return request<{ success: boolean; count: number; published: Story[] }>(
    '/api/stories/scheduled/sweep',
    {
      method: 'POST',
    }
  );
}

// ---------------------------------------------------------------------------
// Taxonomy & Topics API
// ---------------------------------------------------------------------------
