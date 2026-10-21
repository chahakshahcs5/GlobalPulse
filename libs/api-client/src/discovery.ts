/**
 * API Client — Discovery (Search, Autocomplete, Health, Fact-Checks, Full Coverage)
 */
import type {
  StorySearchResultItem,
  FactCheckClaim,
  FullCoverageResult,
  Story,
  Topic,
  Entity,
  Source,
} from '@ai-news/schemas';
import { request } from './core';

export async function searchStories(query: string, limit = 20) {
  return request<{ items: StorySearchResultItem[]; total: number; hasMore: boolean }>(
    `/api/search/stories?query=${encodeURIComponent(query)}&limit=${limit}`
  );
}

export async function getSearchSuggestions(query: string, limit = 8) {
  return request<
    Array<{
      text: string;
      type: 'category' | 'topic' | 'entity' | 'story';
      id: string;
      score: number;
    }>
  >(`/api/search/suggestions?q=${encodeURIComponent(query)}&limit=${limit}`);
}

export async function searchFederated(q: string) {
  return request<{
    stories: Story[];
    events: Event[];
    topics: Topic[];
    entities: Entity[];
    sources: Source[];
  }>(`/api/search/federated?q=${encodeURIComponent(q)}`);
}

// ---------------------------------------------------------------------------
// Health Check
// ---------------------------------------------------------------------------

export async function checkHealth(): Promise<{ status: string; engine?: string }> {
  try {
    return await request<{ status: string; engine?: string }>('/health');
  } catch {
    return { status: 'unreachable' };
  }
}

// ---------------------------------------------------------------------------
// Phase 4: Analytics, Notifications, and Staff Operations
// ---------------------------------------------------------------------------

export async function listFactChecks(): Promise<FactCheckClaim[]> {
  const res = await request<FactCheckClaim[] | { data: FactCheckClaim[] }>('/api/fact-checks');
  return Array.isArray(res) ? res : res?.data || [];
}

export async function getStoryFullCoverage(
  storyIdOrSlug: string
): Promise<FullCoverageResult | null> {
  try {
    return await request<FullCoverageResult>(
      `/api/clustering/coverage/${encodeURIComponent(storyIdOrSlug)}`
    );
  } catch {
    try {
      return await request<FullCoverageResult>(
        `/api/stories/${encodeURIComponent(storyIdOrSlug)}/full-coverage`
      );
    } catch {
      return null;
    }
  }
}
