import type { Story, StoryBlock } from '@ai-news/schemas';

/**
 * The newsroom API, as the studio uses it.
 *
 * The studio proxies the API through its own origin, so requests are
 * relative and the browser never talks to the API directly.
 */

export interface Paginated<T> {
  items: T[];
  total: number;
  limit: number;
  offset?: number;
  hasMore: boolean;
}

interface Envelope<T> {
  success: boolean;
  data: T;
  meta?: {
    total: number;
    limit: number;
    offset?: number;
    nextCursor?: string;
    hasMore: boolean;
  };
}

/**
 * Unwrap the API's envelope when there is one.
 *
 * The list endpoint answers with an envelope, but the single-story endpoint
 * answers with the story itself. Both shapes are handled here rather than at
 * each call site, so a change in one does not silently break the other.
 */
function unwrap<T>(body: T | Envelope<T>): T {
  if (
    body !== null &&
    typeof body === 'object' &&
    'data' in body &&
    'success' in (body as unknown as Record<string, unknown>)
  ) {
    return (body as Envelope<T>).data;
  }
  return body as T;
}

/** The token the studio authenticates with, if it has one. */
export function apiToken(): string {
  if (typeof window === 'undefined') return '';
  // The token is set by the developer in the browser, not baked into the app.
  return window.localStorage.getItem('block_studio_api_token') ?? '';
}

export function setApiToken(token: string): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem('block_studio_api_token', token.trim());
  } catch {
    // Private mode; the token simply is not kept.
  }
}

export class NewsroomApiError extends Error {
  constructor(
    message: string,
    readonly status: number
  ) {
    super(message);
    this.name = 'NewsroomApiError';
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = apiToken();
  const response = await fetch(path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers ?? {}),
    },
  });

  if (!response.ok) {
    let detail = `The API answered ${response.status}.`;
    try {
      const body = (await response.json()) as { message?: string; error?: string };
      detail = body.message ?? body.error ?? detail;
    } catch {
      // Keep the generic message.
    }
    throw new NewsroomApiError(detail, response.status);
  }

  return (await response.json()) as T;
}

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

  const body = await request<Envelope<Story[]>>(`/api/stories?${params.toString()}`);
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
  const body = await request<Story | Envelope<Story>>(`/api/stories/${encodeURIComponent(id)}`);
  return unwrap(body);
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
  const body = await request<{ versionNumber?: number } | Envelope<{ versionNumber?: number }>>(
    `/api/stories/${encodeURIComponent(storyId)}/versions`,
    {
      method: 'POST',
      body: JSON.stringify({ blocks, changeSummary }),
    }
  );
  return unwrap(body) ?? {};
}

/**
 * Replace one block in a story, in place.
 *
 * The surgical path: the change is live at once, but it creates no version,
 * no audit entry and no diff block. The story's version history will not
 * mention it.
 */
export async function updateStoryBlock(storyId: string, block: StoryBlock): Promise<StoryBlock> {
  const body = await request<StoryBlock | Envelope<StoryBlock>>(
    `/api/stories/${encodeURIComponent(storyId)}/blocks/${encodeURIComponent(block.id)}`,
    {
      method: 'PUT',
      body: JSON.stringify(block),
    }
  );
  return unwrap(body);
}
