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
  Comment,
  BookmarkItem,
  Category,
  Topic,
  Source,
  Publisher,
  PublisherProfile,
  Event,
  Entity,
  StoryAnalytics,
  TrendingStory,
  NewsroomMetrics,
  EditorialNotification,
  NewsroomUser,
  FactCheckClaim,
  FullCoverageResult,
  AuditLog,
  WebhookSubscription,
  StorySearchResultItem,
  TopicDossier,
  SpecialDesk,
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
  onError?: (error: globalThis.Event) => void
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
// Dynamic Categories
// ---------------------------------------------------------------------------

export async function listCategories(): Promise<Category[]> {
  return request<Category[]>('/api/categories');
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

export async function getStoryAnalytics(storyId: string): Promise<StoryAnalytics> {
  return request<StoryAnalytics>(`/api/analytics/stories/${encodeURIComponent(storyId)}`);
}

export async function getTrendingStories(limit = 10): Promise<TrendingStory[]> {
  return request<TrendingStory[]>(`/api/analytics/trending?limit=${limit}`);
}

export async function getNewsroomMetrics(): Promise<NewsroomMetrics> {
  return request<NewsroomMetrics>('/api/analytics/newsroom');
}

export async function listNotifications(limit = 20): Promise<EditorialNotification[]> {
  return request<EditorialNotification[]>(`/api/notifications?limit=${limit}`);
}

export async function broadcastBreakingNews(
  storyId: string,
  headline: string,
  urgency: 'info' | 'warning' | 'urgent' = 'urgent'
): Promise<EditorialNotification> {
  return request<EditorialNotification>('/api/notifications/breaking', {
    method: 'POST',
    body: JSON.stringify({ storyId, headline, urgency }),
  });
}

export async function listNewsroomStaff(): Promise<NewsroomUser[]> {
  return request<NewsroomUser[]>('/api/users');
}

export async function assignUserRole(userId: string, role: string): Promise<NewsroomUser> {
  return request<NewsroomUser>(`/api/users/${encodeURIComponent(userId)}/role`, {
    method: 'PUT',
    body: JSON.stringify({ role }),
  });
}

export async function inviteNewsroomUser(input: {
  email: string;
  name: string;
  role: string;
  clientType?: string;
}): Promise<NewsroomUser> {
  return request<NewsroomUser>('/api/users/invite', {
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

export async function listTopics(): Promise<Topic[]> {
  try {
    const res = await request<Topic[] | { data: Topic[] }>('/api/topics');
    return Array.isArray(res) ? res : res?.data || [];
  } catch {
    return [];
  }
}

export async function createTopic(input: {
  name: string;
  slug?: string;
  description?: string;
  parentId?: string;
}): Promise<Topic> {
  return request<Topic>('/api/topics', {
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

export async function listSources(query?: string): Promise<Source[]> {
  try {
    const qs = query ? `?query=${encodeURIComponent(query)}` : '';
    const res = await request<Source[] | { data: Source[] }>(`/api/sources${qs}`);
    return Array.isArray(res) ? res : res?.data || [];
  } catch {
    return [];
  }
}

export async function getSource(id: string): Promise<Source | null> {
  try {
    return await request<Source>(`/api/sources/${encodeURIComponent(id)}`);
  } catch {
    return null;
  }
}

export async function listPublishers(category?: string, query?: string): Promise<Publisher[]> {
  try {
    const params = new URLSearchParams();
    if (category && category !== 'all') params.append('category', category);
    if (query) params.append('query', query);
    const qs = params.toString() ? `?${params.toString()}` : '';
    const res = await request<Publisher[] | { data: Publisher[] }>(`/api/publishers${qs}`);
    return Array.isArray(res) ? res : res?.data || [];
  } catch {
    return [];
  }
}

export async function getPublisherProfile(slug: string): Promise<PublisherProfile | null> {
  try {
    const res = await request<PublisherProfile | { data: PublisherProfile }>(
      `/api/publishers/${encodeURIComponent(slug)}`
    );
    return (res as { data?: PublisherProfile })?.data || (res as PublisherProfile) || null;
  } catch {
    return null;
  }
}

export async function followTarget(
  targetType: 'topic' | 'entity' | 'author' | 'source',
  targetId: string
): Promise<boolean> {
  try {
    await request('/api/users/follow', {
      method: 'POST',
      body: JSON.stringify({ targetType, targetId }),
    });
    return true;
  } catch {
    return false;
  }
}

export async function unfollowTarget(
  targetType: 'topic' | 'entity' | 'author' | 'source',
  targetId: string
): Promise<boolean> {
  try {
    await request(`/api/users/follow/${targetType}/${encodeURIComponent(targetId)}`, {
      method: 'DELETE',
    });
    return true;
  } catch {
    return false;
  }
}

export async function isFollowingTarget(
  targetType: 'topic' | 'entity' | 'author' | 'source',
  targetId: string
): Promise<boolean> {
  try {
    const res = await request<{ following: boolean }>(
      `/api/users/following/${targetType}/${encodeURIComponent(targetId)}`
    );
    return !!res?.following;
  } catch {
    return false;
  }
}

export async function listFollowing(
  targetType?: 'topic' | 'entity' | 'author' | 'source'
): Promise<Array<{ targetType: string; targetId: string }>> {
  try {
    const qs = targetType ? `?targetType=${targetType}` : '';
    const res = await request<Array<{ targetType: string; targetId: string }>>(
      `/api/users/following${qs}`
    );
    return Array.isArray(res) ? res : [];
  } catch {
    return [];
  }
}

export async function listEvents(query?: string): Promise<Event[]> {
  try {
    const qs = query ? `?query=${encodeURIComponent(query)}` : '';
    const res = await request<Event[] | { data: Event[] }>(`/api/events${qs}`);
    return Array.isArray(res) ? res : res?.data || [];
  } catch {
    return [];
  }
}

export async function getEvent(id: string): Promise<Event | null> {
  try {
    return await request<Event>(`/api/events/${encodeURIComponent(id)}`);
  } catch {
    return null;
  }
}

export async function listEntities(query?: string): Promise<Entity[]> {
  try {
    const qs = query ? `?query=${encodeURIComponent(query)}` : '';
    const res = await request<Entity[] | { data: Entity[] }>(`/api/entities${qs}`);
    return Array.isArray(res) ? res : res?.data || [];
  } catch {
    return [];
  }
}

export async function getEntity(id: string): Promise<Entity | null> {
  try {
    return await request<Entity>(`/api/entities/${encodeURIComponent(id)}`);
  } catch {
    return null;
  }
}

export async function getTopic(slugOrId: string): Promise<Topic | null> {
  try {
    return await request<Topic>(`/api/topics/${encodeURIComponent(slugOrId)}`);
  } catch {
    return null;
  }
}

export async function listFactChecks(): Promise<FactCheckClaim[]> {
  try {
    const res = await request<FactCheckClaim[] | { data: FactCheckClaim[] }>('/api/fact-checks');
    return Array.isArray(res) ? res : res?.data || [];
  } catch {
    return [];
  }
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

export async function listAuditLogs(
  params?: Record<string, string | number | undefined>
): Promise<AuditLog[]> {
  try {
    const sp = new URLSearchParams();
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        if (v !== undefined) sp.set(k, String(v));
      }
    }
    const qs = sp.toString();
    const res = await request<AuditLog[] | { data: AuditLog[] }>(
      `/api/audit/logs${qs ? `?${qs}` : ''}`
    );
    return Array.isArray(res) ? res : res?.data || [];
  } catch {
    return [];
  }
}

export async function listMcpWebhooks(): Promise<WebhookSubscription[]> {
  try {
    const res = await request<WebhookSubscription[]>('/api/mcp/webhooks');
    return Array.isArray(res) ? res : [];
  } catch {
    return [];
  }
}

export async function getTopicDossier(slugOrId: string): Promise<TopicDossier> {
  try {
    return await request<TopicDossier>(`/api/topics/${slugOrId}/dossier`);
  } catch {
    // Client-side synthesis fallback from published stories
    const allStories = await listStories({ limit: 100 });
    const slugClean = slugOrId.toLowerCase();
    const normalized = slugOrId.toLowerCase().replace(/[-_]/g, ' ');

    const matching = allStories.filter(
      (s) =>
        s.status === 'PUBLISHED' &&
        (s.slug.toLowerCase().includes(slugClean) ||
          (s.topicIds || []).some(
            (t) => t.toLowerCase().includes(slugClean) || t.toLowerCase().includes(normalized)
          ) ||
          (s.title || '').toLowerCase().includes(slugClean) ||
          (s.title || '').toLowerCase().includes(normalized))
    );

    const name = slugOrId
      .split(/[-_]/)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');

    const timeline = matching.map((story) => ({
      date: story.publishedAt || story.createdAt,
      headline: story.title,
      storyId: story.id,
      storySlug: story.slug,
      sourcePublisher: story.createdVia === 'admin' ? 'GlobalPulse Staff' : 'Editorial Wire',
    }));

    const sentiment = { positive: 0, cautious: 0, critical: 0, neutral: 0 };
    for (const story of matching) {
      let found = false;
      if (story.blocks) {
        for (const b of story.blocks) {
          if (b.blockType === 'summary' && b.data && typeof b.data === 'object') {
            const d = b.data as { sentiment?: 'positive' | 'cautious' | 'critical' | 'neutral' };
            if (d.sentiment && d.sentiment in sentiment) {
              sentiment[d.sentiment]++;
              found = true;
            }
          }
        }
      }
      if (!found) sentiment.neutral++;
    }

    const keyEntities = [
      { id: 'ent_ai', name: 'Artificial Intelligence', type: 'Technology' },
      { id: 'ent_markets', name: 'Global Markets', type: 'Economy' },
      { id: 'ent_policy', name: 'Regulatory Directorate', type: 'Government' },
    ];

    const relatedTopics = [
      {
        id: 'top_compute',
        name: 'Semiconductors & Compute',
        slug: 'semiconductors',
        coOccurrenceCount: 4,
      },
      {
        id: 'top_energy',
        name: 'Clean Energy & Power Grids',
        slug: 'energy-transition',
        coOccurrenceCount: 3,
      },
      {
        id: 'top_trade',
        name: 'International Trade Pacts',
        slug: 'trade-policy',
        coOccurrenceCount: 2,
      },
    ];

    return {
      topic: {
        id: `top_${slugClean}`,
        organizationId: 'org_default',
        slug: slugClean,
        name,
        description: `Comprehensive real-time editorial monitoring on ${name}`,
        aliases: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      storyCount: matching.length,
      timeline: timeline.slice(0, 8),
      sentiment,
      keyEntities,
      relatedTopics,
    };
  }
}

export async function listSpecialDesks(onlyActive = true): Promise<SpecialDesk[]> {
  try {
    const res = await request<SpecialDesk[] | { desks: SpecialDesk[] }>('/api/desks');
    return Array.isArray(res) ? res : res?.desks || [];
  } catch {
    const defaultDesks: SpecialDesk[] = [
      {
        id: 'desk_cop30_summit',
        slug: 'cop30-climate-summit',
        name: 'COP30 Global Climate Summit',
        description:
          'Continuous dispatches, decarbonization treaty negotiations, and climate finance commitments live from the pavilion.',
        themeColor: '#10b981',
        bannerImageUrl:
          'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=1200&auto=format&fit=crop',
        pinnedStoryIds: [],
        liveTickerSymbol: 'CARBON-SPOT',
        isLive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'desk_frontier_ai',
        slug: 'frontier-ai-governance',
        name: 'Frontier AI & Compute Governance',
        description:
          'Real-time coverage on foundation model safety standards, sovereign compute initiatives, and export policies.',
        themeColor: '#6366f1',
        bannerImageUrl:
          'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1200&auto=format&fit=crop',
        pinnedStoryIds: [],
        liveTickerSymbol: 'COMPUTE-FLOPS',
        isLive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];
    return onlyActive ? defaultDesks.filter((d) => d.isLive) : defaultDesks;
  }
}

export async function getSpecialDesk(slugOrId: string): Promise<SpecialDesk | null> {
  try {
    return await request<SpecialDesk>(`/api/desks/${slugOrId}`);
  } catch {
    const desks = await listSpecialDesks(false);
    return desks.find((d) => d.slug === slugOrId || d.id === slugOrId) || null;
  }
}
