import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  ApiError,
  getAuthToken,
  setAuthToken,
  getCurrentUser,
  loginUser,
  logoutUser,
  registerUser,
} from '@ai-news/api-client';

/**
 * The product's one session.
 *
 * The web portal, the Block Studio and the API are the same product, and
 * they share one session. These tests pin down how that session is carried
 * and, just as importantly, how it is not: the cookie belongs to the API and
 * is `HttpOnly`, so nothing in the browser may write it.
 */
describe('The shared session', () => {
  /*
   * The suite runs in a node environment, so the browser's storage is stood
   * in for. The session only ever touches `sessionStorage`.
   */
  const store = new Map<string, string>();
  const storageStub = {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, value);
    },
    removeItem: (key: string) => {
      store.delete(key);
    },
    clear: () => {
      store.clear();
    },
  };

  const originalWindow = (globalThis as { window?: unknown }).window;
  const originalDocument = (globalThis as { document?: unknown }).document;
  const originalFetch = globalThis.fetch;
  const originalSessionStorage = (globalThis as { sessionStorage?: unknown }).sessionStorage;
  const originalLocalStorage = (globalThis as { localStorage?: unknown }).localStorage;

  beforeEach(() => {
    store.clear();
    // The client reaches for the storage globals directly, so they are set
    // as globals as well as on the window.
    (globalThis as { sessionStorage?: unknown }).sessionStorage = storageStub;
    (globalThis as { localStorage?: unknown }).localStorage = storageStub;
    (globalThis as { window?: unknown }).window = {
      sessionStorage: storageStub,
      localStorage: storageStub,
    };
    (globalThis as { document?: unknown }).document = {
      // A document that records any attempt to write a cookie.
      cookie: '',
    };
    setAuthToken(null);
  });

  afterEach(() => {
    store.clear();
    setAuthToken(null);
    (globalThis as { window?: unknown }).window = originalWindow;
    (globalThis as { document?: unknown }).document = originalDocument;
    (globalThis as { sessionStorage?: unknown }).sessionStorage = originalSessionStorage;
    (globalThis as { localStorage?: unknown }).localStorage = originalLocalStorage;
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  describe('the token', () => {
    it('is kept in the tab, not in a cookie the browser could read', () => {
      setAuthToken('a-token');

      expect(getAuthToken()).toBe('a-token');
      expect(store.get('globalpulse_auth_token')).toBe('a-token');

      /*
       * The session cookie is the API's, and it is `HttpOnly`. A cookie
       * written from script would replace it and take that protection with
       * it — and it would gain nothing, because the browser sends the
       * cookie either way.
       */
      expect((globalThis as { document: { cookie: string } }).document.cookie).toBe('');
    });

    it('is forgotten when the session ends', () => {
      setAuthToken('a-token');
      setAuthToken(null);

      expect(getAuthToken()).toBeNull();
      expect(store.has('globalpulse_auth_token')).toBe(false);
    });
  });

  describe('signing in', () => {
    it('keeps the token the API hands back', async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          user: {
            id: 'usr_1',
            name: 'Marcus Vance',
            email: 'editor@news.platform',
            role: 'editor',
          },
          token: 'the-token',
        }),
      });
      globalThis.fetch = fetchMock as unknown as typeof fetch;

      const result = await loginUser('editor@news.platform', 'Editor123!');

      expect(result.token).toBe('the-token');
      expect(getAuthToken()).toBe('the-token');

      const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
      expect(url).toContain('/api/auth/login');
      expect(init.method).toBe('POST');
      /*
       * The browser has to send the cookie, or the session would not
       * follow the editor into the other apps.
       */
      expect(init.credentials).toBe('include');
    });

    it('registers the same way', async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        status: 201,
        json: async () => ({
          user: { id: 'usr_2', name: 'New Editor', email: 'new@news.platform', role: 'reader' },
          token: 'another-token',
        }),
      });
      globalThis.fetch = fetchMock as unknown as typeof fetch;

      await registerUser('New Editor', 'new@news.platform', 'Password123!');

      expect(getAuthToken()).toBe('another-token');
    });
  });

  describe('who is signed in', () => {
    it('is the user the API answers with', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          id: 'usr_1',
          name: 'Marcus Vance',
          email: 'editor@news.platform',
          role: 'editor',
        }),
      }) as unknown as typeof fetch;

      const user = await getCurrentUser();

      expect(user?.email).toBe('editor@news.platform');
    });

    it('is nobody when there is no session — which is not an error', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({ message: 'Unauthorized' }),
        text: async () => 'Unauthorized',
      }) as unknown as typeof fetch;

      await expect(getCurrentUser()).resolves.toBeNull();
    });

    it('is nobody when the network is down, rather than a crash', async () => {
      globalThis.fetch = vi.fn().mockRejectedValue(new Error('offline')) as unknown as typeof fetch;

      await expect(getCurrentUser()).resolves.toBeNull();
    });
  });

  describe('signing out', () => {
    it('ends the session everywhere, not just in this tab', async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ success: true }),
      });
      globalThis.fetch = fetchMock as unknown as typeof fetch;

      setAuthToken('a-token');
      await logoutUser();

      expect(getAuthToken()).toBeNull();
      const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
      expect(url).toContain('/api/auth/logout');
      expect(init.method).toBe('POST');
    });

    it('still forgets the token when the API cannot be reached', async () => {
      globalThis.fetch = vi.fn().mockRejectedValue(new Error('offline')) as unknown as typeof fetch;

      setAuthToken('a-token');
      await expect(logoutUser()).rejects.toThrow('offline');
      expect(getAuthToken()).toBeNull();
    });
  });

  describe('the API error', () => {
    it('carries the status, so a caller can tell a refusal from a failure', () => {
      const error = new ApiError('nope', 401, { message: 'Unauthorized' });

      expect(error.status).toBe(401);
      expect(error).toBeInstanceOf(Error);
    });
  });

  describe('the content type', () => {
    it('is not declared when the request carries no body', async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ success: true }),
      });
      globalThis.fetch = fetchMock as unknown as typeof fetch;

      await logoutUser();

      /*
       * A request with no body must not say it is carrying JSON. The API's
       * JSON parser reads the content type as a promise that there is a body
       * to read, and answers a request that breaks that promise with a 400
       * before the handler is reached — which is what a sign-out used to
       * get.
       */
      const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
      const headers = init.headers as Record<string, string>;
      expect(headers['Content-Type']).toBeUndefined();
    });

    it('is declared when the request carries a body', async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ success: true }),
      });
      globalThis.fetch = fetchMock as unknown as typeof fetch;

      await loginUser('editor@news.platform', 'Editor123!');

      const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
      const headers = init.headers as Record<string, string>;
      expect(headers['Content-Type']).toBe('application/json');
    });
  });
});
