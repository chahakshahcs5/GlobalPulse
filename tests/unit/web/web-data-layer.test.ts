import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ApiError, setAuthToken, getAuthToken } from '../../../apps/web/src/lib/api-client';
import { getBookmarks, toggleBookmark } from '../../../apps/web/src/lib/news-store';

describe('Web Data Layer & Client Utilities (Unit Tests)', () => {
  let localStorageStore: Record<string, string> = {};

  beforeEach(() => {
    localStorageStore = {};
    const mockStorage = {
      getItem: vi.fn((key: string) => localStorageStore[key] || null),
      setItem: vi.fn((key: string, value: string) => {
        localStorageStore[key] = value;
      }),
      removeItem: vi.fn((key: string) => {
        delete localStorageStore[key];
      }),
      clear: vi.fn(() => {
        localStorageStore = {};
      }),
    };

    vi.stubGlobal('localStorage', mockStorage);
    vi.stubGlobal('sessionStorage', mockStorage);
    vi.stubGlobal('window', {
      dispatchEvent: vi.fn(),
      localStorage: mockStorage,
      sessionStorage: mockStorage,
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    setAuthToken(null);
  });

  describe('ApiError', () => {
    it('initializes with message, HTTP status code, and optional response body', () => {
      const err = new ApiError('Not Found', 404, { detail: 'Story not found' });
      expect(err.name).toBe('ApiError');
      expect(err.message).toBe('Not Found');
      expect(err.status).toBe(404);
      expect(err.body).toEqual({ detail: 'Story not found' });
      expect(err).toBeInstanceOf(Error);
    });
  });

  describe('Authentication Token Management', () => {
    it('sets and retrieves auth token from memory and storage', () => {
      setAuthToken('test-bearer-token-12345');
      expect(getAuthToken()).toBe('test-bearer-token-12345');

      setAuthToken(null);
      expect(getAuthToken()).toBeNull();
    });
  });

  describe('Bookmarks Storage & Toggle Operations', () => {
    it('returns empty array when no bookmarks exist in storage', () => {
      expect(getBookmarks()).toEqual([]);
    });

    it('toggles bookmarks by adding and removing slug IDs', () => {
      const slug = 'ai-frontier-chips-2026';

      // First toggle: adds bookmark
      const added = toggleBookmark(slug);
      expect(added).toBe(true);
      expect(getBookmarks()).toContain(slug);

      // Second toggle: removes bookmark
      const removed = toggleBookmark(slug);
      expect(removed).toBe(false);
      expect(getBookmarks()).not.toContain(slug);
    });

    it('handles multiple bookmarks without duplicates', () => {
      toggleBookmark('story-1');
      toggleBookmark('story-2');
      toggleBookmark('story-3');

      const bookmarks = getBookmarks();
      expect(bookmarks).toHaveLength(3);
      expect(bookmarks).toEqual(expect.arrayContaining(['story-1', 'story-2', 'story-3']));

      toggleBookmark('story-2');
      expect(getBookmarks()).toEqual(['story-1', 'story-3']);
    });
  });
});
