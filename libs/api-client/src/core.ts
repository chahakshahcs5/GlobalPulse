/**
 * API Client — Core HTTP & SSE Infrastructure
 *
 * This is the product's single door to the newsroom API. The web portal, the
 * Block Studio and anything else that talks to the API all go through it,
 * so they all speak the same dialect and share the same session.
 */

const API_BASE_URL =
  typeof window !== 'undefined'
    ? ''
    : process.env.API_INTERNAL_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

/**
 * Where the session lives.
 *
 * The API owns the session and hands out an `HttpOnly` cookie, which the
 * browser sends with every request to this host — the web portal and the
 * Block Studio included, because a cookie is scoped to the host and not the
 * port. That is what makes one sign-in mean one session across the product.
 *
 * The token below is a convenience for the cases a cookie cannot cover: a
 * request made from a server, and the moment between signing in and the
 * cookie being stored. It lives in `sessionStorage`, which is per-tab and
 * per-origin, so it never outlives the tab and never travels to another
 * site. The cookie is `HttpOnly` and is left alone on purpose: writing it
 * from script would strip that protection for no gain, since the browser
 * sends it either way.
 */
const AUTH_TOKEN_KEY = 'globalpulse_auth_token';

// Auth token stored in memory with sessionStorage fallback (isolated per session, prevents persistent XSS token theft)
let _authToken: string | null = null;

export function setAuthToken(token: string | null): void {
  _authToken = token;
  if (typeof window !== 'undefined') {
    if (token) {
      sessionStorage.setItem(AUTH_TOKEN_KEY, token);
    } else {
      sessionStorage.removeItem(AUTH_TOKEN_KEY);
      localStorage.removeItem(AUTH_TOKEN_KEY);
    }
  }
}

export function getAuthToken(): string | null {
  if (_authToken) return _authToken;
  if (typeof window !== 'undefined') {
    _authToken = sessionStorage.getItem(AUTH_TOKEN_KEY) || localStorage.getItem(AUTH_TOKEN_KEY);
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

  /*
   * The content type follows the body.
   *
   * A request that carries no body — a sign-out, a delete — must not say
   * it is carrying JSON. The API's JSON parser reads the content type as a
   * promise that there is a JSON body to read, and answers a request that
   * breaks that promise with a 400 before the handler is ever reached.
   */
  const hasBody = options.body !== undefined && options.body !== null;
  const headers: Record<string, string> = {
    ...(hasBody ? { 'Content-Type': 'application/json' } : {}),
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
    'poll.vote',
    'live.feed',
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
