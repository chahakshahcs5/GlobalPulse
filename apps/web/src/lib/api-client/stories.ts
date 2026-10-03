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
}

export async function listStories(params?: ListStoriesParams): Promise<Story[]> {
  const searchParams = new URLSearchParams();
  if (params?.status) searchParams.set('status', params.status);
  if (params?.articleType) searchParams.set('articleType', params.articleType);
  if (params?.topicId) searchParams.set('topicId', params.topicId);
  if (params?.entityId) searchParams.set('entityId', params.entityId);
  if (params?.query) searchParams.set('query', params.query);
  if (params?.limit) searchParams.set('limit', String(Math.min(params.limit, 500)));

  const qs = searchParams.toString();
  const response = await request<{ data: Story[]; total: number } | Story[]>(
    `/api/stories${qs ? `?${qs}` : ''}`
  );

  // The API may return { data: [...] } or an array directly depending on wrapper
  return Array.isArray(response) ? response : (response.data ?? []);
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
