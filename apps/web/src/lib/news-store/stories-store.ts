'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { Story } from '@ai-news/schemas';
import * as api from '../api-client';
/** Event emitted after a story mutation so other hooks refetch */
export function notifyStoryMutation() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('globalpulse_stories_updated'));
  }
}

export function useAllStories() {
  const [stories, setStories] = useState<Story[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isApiConnected, setIsApiConnected] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const fetchInProgress = useRef(false);
  const hasAttemptedFetch = useRef(false);

  const fetchStories = useCallback(async () => {
    if (fetchInProgress.current) return;
    fetchInProgress.current = true;
    try {
      const apiStories = await api.listStories({ limit: 100 });
      // API is reachable — use its data (even if empty)
      setStories(apiStories || []);
      setIsApiConnected(true);
      setIsDemoMode(false);
    } catch {
      // API unreachable — do not substitute mock stories
      setStories([]);
      setIsApiConnected(false);
      setIsDemoMode(false);
    } finally {
      hasAttemptedFetch.current = true;
      fetchInProgress.current = false;
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStories();

    // Refetch on local mutation events
    const handleUpdate = () => fetchStories();
    window.addEventListener('globalpulse_stories_updated', handleUpdate);

    // Subscribe to SSE realtime events for live updates
    let unsubscribe: (() => void) | null = null;
    try {
      unsubscribe = api.subscribeToRealtimeEvents(
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
      window.removeEventListener('globalpulse_stories_updated', handleUpdate);
      unsubscribe?.();
    };
  }, [fetchStories]);

  return { stories, isLoading, isApiConnected, isDemoMode };
}

/**
 * Fetches only published stories for the reader-facing feed.
 */
export function usePublishedStories() {
  const { stories, isLoading, isApiConnected, isDemoMode } = useAllStories();
  const published = stories.filter((s) => s.status === 'PUBLISHED');
  return { stories: published, isLoading, isApiConnected, isDemoMode };
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
  if (storyData.blocks && storyData.blocks.length > 0) {
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
    const handleUpdate = () => fetchQueue();
    window.addEventListener('globalpulse_stories_updated', handleUpdate);
    return () => window.removeEventListener('globalpulse_stories_updated', handleUpdate);
  }, [fetchQueue]);

  return { queue, isLoading, refetch: fetchQueue };
}

/**
 * React hook to fetch dynamic categories.
 */
