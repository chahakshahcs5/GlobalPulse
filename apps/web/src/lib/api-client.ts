/**
 * API Client — Bridges the web frontend to the production API backend.
 *
 * Previously the web app read from hardcoded JSON and wrote to localStorage.
 * This client makes real HTTP calls to the NestJS API gateway so that:
 *   - Stories created in the CMS are persisted to the database
 *   - Stories published by AI agents via MCP appear in the frontend
 *   - Both halves of the app share a single source of truth
 */

import type {
  Story,
  StoryBlock,
  StoryVersion,
  CreateStoryInput,
  UpdateStoryInput,
} from '@ai-news/schemas';

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const API_BASE_URL =
  typeof window !== 'undefined'
    ? process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
    : process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

// Auth token stored in memory with sessionStorage fallback (isolated per session, prevents persistent XSS token theft)
let _authToken: string | null = null;

export function setAuthToken(token: string | null): void {
  _authToken = token;
  if (typeof window !== 'undefined') {
    if (token) {
      sessionStorage.setItem('globalpulse_auth_token', token);
    } else {
      sessionStorage.removeItem('globalpulse_auth_token');
      localStorage.removeItem('globalpulse_auth_token');
    }
  }
}

export function getAuthToken(): string | null {
  if (_authToken) return _authToken;
  if (typeof window !== 'undefined') {
    _authToken =
      sessionStorage.getItem('globalpulse_auth_token') ||
      localStorage.getItem('globalpulse_auth_token');
  }
  return _authToken;
}

// ---------------------------------------------------------------------------
// HTTP helpers
// ---------------------------------------------------------------------------

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly body?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${path}`;
  const token = getAuthToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...((options.headers as Record<string, string>) ?? {}),
  };

  const res = await fetch(url, {
    credentials: 'include',
    ...options,
    headers,
  });

  if (!res.ok) {
    let body: unknown;
    try {
      body = await res.json();
    } catch {
      body = await res.text().catch(() => null);
    }
    throw new ApiError(
      `API ${options.method || 'GET'} ${path} failed with status ${res.status}`,
      res.status,
      body
    );
  }

  // Handle 204 No Content
  if (res.status === 204) {
    return undefined as unknown as T;
  }

  return res.json() as Promise<T>;
}

// ---------------------------------------------------------------------------
// Stories API
// ---------------------------------------------------------------------------

export interface ListStoriesParams {
  status?: string;
  articleType?: string;
  topicId?: string;
  entityId?: string;
  query?: string;
  limit?: number;
}

export async function listStories(params?: ListStoriesParams): Promise<Story[]> {
  try {
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.set('status', params.status);
    if (params?.articleType) searchParams.set('articleType', params.articleType);
    if (params?.topicId) searchParams.set('topicId', params.topicId);
    if (params?.entityId) searchParams.set('entityId', params.entityId);
    if (params?.query) searchParams.set('query', params.query);
    if (params?.limit) searchParams.set('limit', String(params.limit));

    const qs = searchParams.toString();
    const response = await request<{ data: Story[]; total: number }>(
      `/api/stories${qs ? `?${qs}` : ''}`
    );

    // The API may return { data: [...] } or an array directly depending on wrapper
    return Array.isArray(response) ? response : (response.data ?? []);
  } catch {
    return [];
  }
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

export interface RealtimeEvent {
  type: string;
  data: unknown;
  id?: string;
}

export function subscribeToRealtimeEvents(
  channels: string[] = ['all'],
  onEvent: (event: RealtimeEvent) => void,
  onError?: (error: Event) => void
): () => void {
  const channelParam = channels.join(',');
  const url = `${API_BASE_URL}/api/realtime/stream?channels=${encodeURIComponent(channelParam)}`;
  const eventSource = new EventSource(url);

  eventSource.onmessage = (e) => {
    try {
      const parsed = JSON.parse(e.data);
      onEvent({
        type: parsed.type || 'message',
        data: parsed.data || parsed,
        id: e.lastEventId,
      });
    } catch {
      onEvent({ type: 'message', data: e.data });
    }
  };

  // Listen for specific named event types
  for (const eventType of [
    'story.published',
    'story.updated',
    'story.created',
    'story.unpublished',
    'story.archived',
    'story.deleted',
    'story.in_review',
    'story.rejected',
    'comment.created',
    'comment.moderated',
    'comment.deleted',
    'reaction.updated',
  ]) {
    eventSource.addEventListener(eventType, (e: MessageEvent) => {
      try {
        onEvent({ type: eventType, data: JSON.parse(e.data), id: e.lastEventId });
      } catch {
        onEvent({ type: eventType, data: e.data });
      }
    });
  }

  if (onError) {
    eventSource.onerror = onError;
  }

  // Return unsubscribe function
  return () => {
    eventSource.close();
  };
}

// ---------------------------------------------------------------------------
// Review Workflow
// ---------------------------------------------------------------------------

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

export async function getStoryComments(storyId: string) {
  return request<any[]>(`/api/stories/${encodeURIComponent(storyId)}/comments`);
}

export async function createComment(
  storyId: string,
  content: string,
  authorName?: string,
  parentId?: string
) {
  return request<any>(`/api/stories/${encodeURIComponent(storyId)}/comments`, {
    method: 'POST',
    body: JSON.stringify({ content, authorName, parentId }),
  });
}

export async function moderateComment(
  commentId: string,
  status: 'approved' | 'flagged' | 'hidden',
  reason?: string
) {
  return request<any>(`/api/comments/${encodeURIComponent(commentId)}/moderate`, {
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

export async function listServerBookmarks() {
  return request<any[]>('/api/bookmarks');
}

export async function toggleServerBookmark(storyId: string) {
  return request<{ bookmarked: boolean }>(`/api/bookmarks/${encodeURIComponent(storyId)}`, {
    method: 'POST',
  });
}

// ---------------------------------------------------------------------------
// Dynamic Categories
// ---------------------------------------------------------------------------

export async function listCategories() {
  return request<any[]>('/api/categories');
}

export async function getCategoryStories(slug: string, limit = 20) {
  const res = await request<{ data: Story[] }>(
    `/api/categories/${encodeURIComponent(slug)}/stories?limit=${limit}`
  );
  return res.data;
}

// ---------------------------------------------------------------------------
// Search API
// ---------------------------------------------------------------------------

export async function searchStories(query: string, limit = 20) {
  return request<{ items: any[]; total: number; hasMore: boolean }>(
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
    stories: any[];
    events: any[];
    topics: any[];
    entities: any[];
    sources: any[];
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

export async function getStoryAnalytics(storyId: string) {
  return request<any>(`/api/analytics/stories/${encodeURIComponent(storyId)}`);
}

export async function getTrendingStories(limit = 10) {
  return request<any[]>(`/api/analytics/trending?limit=${limit}`);
}

export async function getNewsroomMetrics() {
  return request<any>('/api/analytics/newsroom');
}

export async function listNotifications(limit = 20) {
  return request<any[]>(`/api/notifications?limit=${limit}`);
}

export async function broadcastBreakingNews(storyId: string, headline: string, urgency = 'urgent') {
  return request<any>('/api/notifications/breaking', {
    method: 'POST',
    body: JSON.stringify({ storyId, headline, urgency }),
  });
}

export async function listNewsroomStaff() {
  return request<any[]>('/api/users');
}

export async function assignUserRole(userId: string, role: string) {
  return request<any>(`/api/users/${encodeURIComponent(userId)}/role`, {
    method: 'PUT',
    body: JSON.stringify({ role }),
  });
}

export async function inviteNewsroomUser(input: {
  email: string;
  name: string;
  role: string;
  clientType?: string;
}) {
  return request<any>('/api/users/invite', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

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

export async function listTopics(): Promise<any[]> {
  try {
    const res = await request<any[]>('/api/topics');
    return Array.isArray(res) ? res : (res as any)?.data || [];
  } catch {
    return [];
  }
}

export async function createTopic(input: {
  name: string;
  slug?: string;
  description?: string;
  parentId?: string;
}): Promise<any> {
  return request<any>('/api/topics', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

// ---------------------------------------------------------------------------
// Authentication API
// ---------------------------------------------------------------------------

export interface AuthResponse {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    avatarUrl?: string;
  };
  token: string;
}

export async function loginUser(email: string, password: string): Promise<AuthResponse> {
  return request<AuthResponse>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export async function registerUser(
  name: string,
  email: string,
  password: string
): Promise<AuthResponse> {
  return request<AuthResponse>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ name, email, password }),
  });
}

export async function getCurrentUser(): Promise<AuthResponse['user'] | null> {
  try {
    return await request<AuthResponse['user']>('/api/auth/me');
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Sources, Events, Entities & Fact-Checks API
// ---------------------------------------------------------------------------

export async function listSources(query?: string): Promise<any[]> {
  try {
    const qs = query ? `?query=${encodeURIComponent(query)}` : '';
    const res = await request<any>(`/api/sources${qs}`);
    return Array.isArray(res) ? res : res?.data || [];
  } catch {
    return [];
  }
}

export async function getSource(id: string): Promise<any | null> {
  try {
    return await request<any>(`/api/sources/${encodeURIComponent(id)}`);
  } catch {
    return null;
  }
}

export async function listEvents(query?: string): Promise<any[]> {
  try {
    const qs = query ? `?query=${encodeURIComponent(query)}` : '';
    const res = await request<any>(`/api/events${qs}`);
    return Array.isArray(res) ? res : res?.data || [];
  } catch {
    return [];
  }
}

export async function getEvent(id: string): Promise<any | null> {
  try {
    return await request<any>(`/api/events/${encodeURIComponent(id)}`);
  } catch {
    return null;
  }
}

export async function listEntities(query?: string): Promise<any[]> {
  try {
    const qs = query ? `?query=${encodeURIComponent(query)}` : '';
    const res = await request<any>(`/api/entities${qs}`);
    return Array.isArray(res) ? res : res?.data || [];
  } catch {
    return [];
  }
}

export async function getEntity(id: string): Promise<any | null> {
  try {
    return await request<any>(`/api/entities/${encodeURIComponent(id)}`);
  } catch {
    return null;
  }
}

export async function getTopic(slugOrId: string): Promise<any | null> {
  try {
    return await request<any>(`/api/topics/${encodeURIComponent(slugOrId)}`);
  } catch {
    return null;
  }
}

export async function listFactChecks(): Promise<any[]> {
  try {
    const res = await request<any[]>('/api/fact-checks');
    return Array.isArray(res) ? res : (res as any)?.data || [];
  } catch {
    return [];
  }
}

export async function getStoryFullCoverage(storyIdOrSlug: string): Promise<any | null> {
  try {
    return await request<any>(`/api/clustering/coverage/${encodeURIComponent(storyIdOrSlug)}`);
  } catch {
    try {
      return await request<any>(`/api/stories/${encodeURIComponent(storyIdOrSlug)}/full-coverage`);
    } catch {
      return null;
    }
  }
}

export async function listAuditLogs(
  params?: Record<string, string | number | undefined>
): Promise<any[]> {
  try {
    const sp = new URLSearchParams();
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        if (v !== undefined) sp.set(k, String(v));
      }
    }
    const qs = sp.toString();
    const res = await request<any>(`/api/audit/logs${qs ? `?${qs}` : ''}`);
    return Array.isArray(res) ? res : res?.data || [];
  } catch {
    return [];
  }
}

export async function listMcpWebhooks(): Promise<any[]> {
  try {
    const res = await request<any[]>('/api/mcp/webhooks');
    return Array.isArray(res) ? res : [];
  } catch {
    return [];
  }
}
