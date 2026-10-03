'use client';

import { useState, useEffect } from 'react';
import * as api from '../api-client';
import { eventBus, emitBookmarksUpdated } from '../event-bus';

// ---------------------------------------------------------------------------
// Bookmarks (server-synced with localStorage cache)
// ---------------------------------------------------------------------------

const BOOKMARKS_STORAGE_KEY = 'globalpulse_bookmarks_v1';

export function getBookmarks(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(BOOKMARKS_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function toggleBookmark(slugOrId: string): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const current = getBookmarks();
    const isBookmarked = current.includes(slugOrId);
    const updated = isBookmarked ? current.filter((s) => s !== slugOrId) : [...current, slugOrId];
    localStorage.setItem(BOOKMARKS_STORAGE_KEY, JSON.stringify(updated));
    emitBookmarksUpdated();

    // Optimistically sync to backend in background
    api.toggleServerBookmark(slugOrId).catch(() => {
      // Non-blocking sync error
    });

    return !isBookmarked;
  } catch (err) {
    console.error('Failed to toggle bookmark:', err);
    return false;
  }
}

export function useBookmarks() {
  const [bookmarks, setBookmarks] = useState<string[]>([]);

  useEffect(() => {
    setBookmarks(getBookmarks());

    const handleUpdate = () => {
      setBookmarks(getBookmarks());
    };

    const unsubscribe = eventBus.subscribe('bookmarks_updated', handleUpdate);
    return () => unsubscribe();
  }, []);

  return bookmarks;
}
