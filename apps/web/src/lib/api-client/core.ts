/**
 * API Client — Core HTTP & SSE Infrastructure
 */

const API_BASE_URL =
  typeof window !== 'undefined'
    ? ''
    : process.env.API_INTERNAL_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

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

export async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
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
