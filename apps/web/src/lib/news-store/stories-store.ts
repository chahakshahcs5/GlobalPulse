'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { Story } from '@ai-news/schemas';
import * as api from '@ai-news/api-client';
import { eventBus, emitStoriesUpdated } from '../event-bus';

/** Event emitted after a story mutation so other hooks refetch */
export function notifyStoryMutation() {
  emitStoriesUpdated();
}

/** How many stories a page of the newsroom holds. */
const STORY_PAGE_SIZE = 10;

/**
 * What the newsroom is looking at.
 *
 * The narrowing, the searching and the ordering are the API's work, not the
 * browser's: a newsroom with two hundred stories cannot be searched in the
 * browser without fetching all two hundred, and the counts would be the
 * counts of a page rather than the counts of the newsroom.
 */
export interface StoryListQuery {
  /** One workflow state, or nothing for all of them. */
  status?: string;
  /** Words to look for in the title and the summary. */
  query?: string;
  /** The order the stories come back in. */
  sort?: string;
}

/**
 * The newsroom's stories.
 *
 * The stories are fetched a page at a time, and the rest are fetched when
 * the editor asks for them. The counts are the API's counts, so they say
 * how many stories the newsroom holds rather than how many happen to be
 * on screen.
 */
export function useAllStories(filters: StoryListQuery = {}) {
  const { status, query, sort } = filters;
  const [stories, setStories] = useState<Story[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isApiConnected, setIsApiConnected] = useState(false);
  /**
   * How many stories the newsroom holds.
   *
   * This is the API's answer, not the number that happened to be fetched. A
   * newsroom with 202 stories and a table showing the first 50 is a
   * newsroom with 202 stories, and the count has to say so.
   */
  const [total, setTotal] = useState(0);
  /** Whether there are more stories to fetch. */
  const [hasMore, setHasMore] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  /**
   * The fetch that is on its way, if there is one.
   *
   * A promise rather than a flag, so that a caller can wait for it. The
   * "load more" button used to give up when a refetch was in flight, which
   * is most of the time — the newsroom's event stream keeps the list fresh.
   */
  const fetchInProgress = useRef<Promise<void> | null>(null);
  const hasAttemptedFetch = useRef(false);
  const retryTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const attempt = useRef(0);

  /*
   * A failed fetch is retried.
   *
   * The API is not always reachable — a tunnel closes, a deploy restarts
   * it — and a newsroom that cannot reach the API for a moment should not
   * be shown an empty newsroom. An empty list is a statement about the
   * newsroom, and it has to be true.
   */
  const scheduleRetry = useCallback(() => {
    if (retryTimer.current) return;
    const delay = Math.min(2000 * 2 ** attempt.current, 15000);
    attempt.current += 1;
    retryTimer.current = setTimeout(() => {
      retryTimer.current = null;
      void fetchStoriesRef.current?.();
    }, delay);
  }, []);

  const fetchStoriesRef = useRef<(() => Promise<void>) | null>(null);

  /**
   * How deep the list has been read.
   *
   * A refetch has to keep the depth. The newsroom's stories are read a page
   * at a time, and a story that arrived over the event stream would
   * otherwise collapse the list back to its first page — so the editor's
   * "load more" would quietly undo itself.
   */
  const loadedCount = useRef(0);

  const fetchStories = useCallback(async () => {
    if (fetchInProgress.current) return fetchInProgress.current;

    const run = (async () => {
      try {
        const page = await api.listStoriesPage({
          limit: Math.max(STORY_PAGE_SIZE, loadedCount.current),
          ...(status ? { status } : {}),
          ...(query ? { query } : {}),
          ...(sort ? { sort } : {}),
        });
        // API is reachable — use its data (even if empty)
        setStories(page.items);
        loadedCount.current = page.items.length;
        setTotal(page.total);
        setHasMore(page.hasMore);
        setIsApiConnected(true);
        attempt.current = 0;
      } catch {
        // API unreachable — do not substitute mock stories
        setStories([]);
        setIsApiConnected(false);
        scheduleRetry();
      } finally {
        hasAttemptedFetch.current = true;
        setIsLoading(false);
      }
    })();

    fetchInProgress.current = run;
    try {
      await run;
    } finally {
      if (fetchInProgress.current === run) fetchInProgress.current = null;
    }
  }, [query, scheduleRetry, sort, status]);

  fetchStoriesRef.current = fetchStories;

  /*
   * A new search, filter or order is a new list, so the depth starts again
   * at one page.
   */
  useEffect(() => {
    loadedCount.current = 0;
  }, [query, sort, status]);

  useEffect(() => {
    fetchStories();

    // Refetch on local mutation events via eventBus
    const unsubscribeBus = eventBus.subscribe('stories_updated', () => {
      fetchStories();
    });

    // Subscribe to SSE realtime events for live updates
    let unsubscribeRealtime: (() => void) | null = null;
    try {
      unsubscribeRealtime = api.subscribeToRealtimeEvents(
        ['all'],
        (event) => {
          if (
            event.type === 'story.published' ||
            event.type === 'story.created' ||
            event.type === 'story.updated' ||
            event.type === 'story.unpublished'
          ) {
            fetchStories();
          }
        },
        () => {
          // SSE connection error — silently ignore, we'll still poll on mutations
        }
      );
    } catch {
      // SSE not available
    }

    return () => {
      unsubscribeBus();
      unsubscribeRealtime?.();
      if (retryTimer.current) {
        clearTimeout(retryTimer.current);
        retryTimer.current = null;
      }
    };
  }, [fetchStories]);

  /**
   * Fetch the next page.
   *
   * The newsroom's stories are fetched a page at a time, and the rest are
   * fetched when the editor asks for them. The count in the corner is the
   * API's count from the start, so it says how many there are rather than
   * how many happen to be on screen.
   */
  const loadMore = useCallback(async () => {
    if (isLoadingMore) return;
    setIsLoadingMore(true);
    try {
      /*
       * Wait for a refetch that is already on its way, so the offset is
       * the list's. Without this the button gave up whenever the newsroom's
       * event stream happened to be refreshing the list — which is most of
       * the time.
       */
      if (fetchInProgress.current) await fetchInProgress.current;

      const page = await api.listStoriesPage({
        limit: STORY_PAGE_SIZE,
        offset: stories.length,
        ...(status ? { status } : {}),
        ...(query ? { query } : {}),
        ...(sort ? { sort } : {}),
      });
      setStories((previous) => {
        const seen = new Set(previous.map((story) => story.id));
        const next = [...previous, ...page.items.filter((story) => !seen.has(story.id))];
        loadedCount.current = next.length;
        return next;
      });
      setTotal(page.total);
      setHasMore(page.hasMore);
      setIsApiConnected(true);
    } catch {
      setIsApiConnected(false);
    } finally {
      setIsLoadingMore(false);
    }
  }, [isLoadingMore, query, sort, status, stories.length]);

  return {
    stories,
    isLoading,
    isApiConnected,
    isDemoMode: false,
    total,
    hasMore,
    isLoadingMore,
    loadMore,
  };
}

/**
 * Fetches only published stories for the reader-facing feed.
 */
export function usePublishedStories() {
  const {
    stories,
    isLoading,
    isApiConnected,
    isDemoMode,
    total,
    hasMore,
    loadMore,
    isLoadingMore,
  } = useAllStories({ status: 'PUBLISHED' });
  return {
    stories,
    isLoading,
    isApiConnected,
    isDemoMode,
    total,
    hasMore,
    loadMore,
    isLoadingMore,
  };
}

// ---------------------------------------------------------------------------
// Mutations — Go through the API, then notify hooks to refetch
// ---------------------------------------------------------------------------

/**
 * Creates a story via the API backend.
 */
export async function saveUserStory(
  storyData: Partial<Story> & { title: string; summary: string }
): Promise<Story> {
  const created = await api.createStory({
    title: storyData.title,
    summary: storyData.summary,
    articleType: storyData.articleType || 'developing_story',
    topicIds: storyData.topicIds || [],
    entityIds: storyData.entityIds || [],
    sourceIds: storyData.sourceIds || [],
    blocks: storyData.blocks || [],
    heroImageUrl: storyData.heroImageUrl,
    isSubscriberOnly: storyData.isSubscriberOnly,
  });

  // If the story should be published immediately, publish it
  if (storyData.status === 'PUBLISHED') {
    await api.publishStory(created.id);
  }

  notifyStoryMutation();
  return created;
}

/**
 * Updates an existing story, changes metadata, and commits a new version snapshot.
 */
export async function updateUserStory(
  storyId: string,
  storyData: Partial<Story> & { changeSummary?: string }
): Promise<Story> {
  // 1. Update story metadata
  const updated = await api.updateStory(storyId, {
    title: storyData.title,
    summary: storyData.summary,
    articleType: storyData.articleType,
    topicIds: storyData.topicIds,
    entityIds: storyData.entityIds,
    heroImageUrl: storyData.heroImageUrl,
    isSubscriberOnly: storyData.isSubscriberOnly,
  });

  // 2. If blocks are provided, commit a new version snapshot
  //
  // An empty list is a change too: a story whose blocks were all removed
  // has to be committed as well, or the removal never happens.
  if (storyData.blocks !== undefined) {
    await api.createStoryVersion(storyId, {
      changeSummary: storyData.changeSummary || 'Story updated via Editorial CMS',
      title: storyData.title,
      summary: storyData.summary,
      blocks: storyData.blocks,
    });
  }

  // 3. Handle publication status change if requested
  if (storyData.status === 'PUBLISHED' && updated.status !== 'PUBLISHED') {
    await api.publishStory(storyId);
  } else if (storyData.status === 'DRAFT' && updated.status === 'PUBLISHED') {
    await api.unpublishStory(storyId);
  }

  notifyStoryMutation();
  return updated;
}

/**
 * Toggles a story between PUBLISHED and DRAFT via the API.
 */
export async function toggleStoryStatus(storyId: string): Promise<void> {
  // Fetch current story to determine current status
  const story = await api.getStory(storyId);
  if (story.status === 'PUBLISHED') {
    await api.unpublishStory(storyId);
  } else {
    await api.publishStory(storyId);
  }
  notifyStoryMutation();
}

/**
 * Deletes a story permanently via the API.
 */
export async function deleteUserStory(storyId: string): Promise<void> {
  await api.deleteStory(storyId);
  notifyStoryMutation();
}

/**
 * Submits a draft story for editorial review.
 */
export async function submitStoryForReview(storyId: string): Promise<Story | null> {
  try {
    const updated = await api.submitForReview(storyId);
    notifyStoryMutation();
    return updated;
  } catch (err) {
    console.error('Failed to submit story for review:', err);
    return null;
  }
}

/**
 * Reviews a pending story: approves to publish or rejects back to draft.
 */
export async function reviewUserStory(
  storyId: string,
  action: 'approve' | 'reject',
  feedback?: string
): Promise<Story | null> {
  try {
    const updated = await api.reviewStory(storyId, { action, feedback });
    notifyStoryMutation();
    return updated;
  } catch (err) {
    console.error(`Failed to ${action} story:`, err);
    return null;
  }
}

/**
 * React hook to fetch the editorial review queue.
 */
export function useReviewQueue() {
  const [queue, setQueue] = useState<Story[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchQueue = useCallback(async () => {
    try {
      const items = await api.getReviewQueue();
      setQueue(items || []);
    } catch {
      setQueue([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchQueue();
    const unsubscribe = eventBus.subscribe('stories_updated', () => fetchQueue());
    return () => unsubscribe();
  }, [fetchQueue]);

  return { queue, isLoading, refetch: fetchQueue };
}

/**
 * React hook to fetch dynamic categories.
 */
