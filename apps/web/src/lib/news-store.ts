/**
 * News Store — Hybrid API-first data layer with local fallback.
 *
 * BEFORE: Read from hardcoded EXTENDED_NEWS_STORIES and localStorage.
 * AFTER:  Fetches from the API backend. Falls back to demo data if API
 *         is unreachable (e.g. dev mode without the API running).
 *
 * React hooks automatically refetch when SSE events arrive or when
 * mutations are dispatched through the API client.
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { Story } from '@ai-news/schemas';
import { EXTENDED_NEWS_STORIES } from './news-data';
import * as api from './api-client';

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
    window.dispatchEvent(new Event('globalpulse_bookmarks_updated'));

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

    window.addEventListener('globalpulse_bookmarks_updated', handleUpdate);
    return () => window.removeEventListener('globalpulse_bookmarks_updated', handleUpdate);
  }, []);

  return bookmarks;
}

// ---------------------------------------------------------------------------
// Stories — API-backed with demo data fallback
// ---------------------------------------------------------------------------

/** Event emitted after a story mutation so other hooks refetch */
function notifyStoryMutation() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('globalpulse_stories_updated'));
  }
}

/**
 * React hook that fetches all published stories from the API.
 * Falls back to demo data when the API is unreachable.
 * Automatically refreshes on SSE events and local mutations.
 */
export function useAllStories() {
  const [stories, setStories] = useState<Story[]>(EXTENDED_NEWS_STORIES);
  const [isApiConnected, setIsApiConnected] = useState(false);
  const fetchInProgress = useRef(false);

  const fetchStories = useCallback(async () => {
    if (fetchInProgress.current) return;
    fetchInProgress.current = true;
    try {
      const apiStories = await api.listStories({ limit: 100 });
      if (apiStories && apiStories.length > 0) {
        // Merge API stories with demo data, API stories take priority
        const apiIds = new Set(apiStories.map((s) => s.id));
        const merged = [
          ...apiStories,
          ...EXTENDED_NEWS_STORIES.filter((s) => !apiIds.has(s.id)),
        ];
        setStories(merged);
        setIsApiConnected(true);
      } else {
        // API returned empty — use demo data as baseline
        setStories(EXTENDED_NEWS_STORIES);
        setIsApiConnected(true);
      }
    } catch {
      // API unreachable — use demo data gracefully
      setStories(EXTENDED_NEWS_STORIES);
      setIsApiConnected(false);
    } finally {
      fetchInProgress.current = false;
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
        },
      );
    } catch {
      // SSE not available
    }

    return () => {
      window.removeEventListener('globalpulse_stories_updated', handleUpdate);
      unsubscribe?.();
    };
  }, [fetchStories]);

  return { stories, isApiConnected };
}

/**
 * Fetches only published stories for the reader-facing feed.
 */
export function usePublishedStories() {
  const { stories, isApiConnected } = useAllStories();
  const published = stories.filter((s) => s.status === 'PUBLISHED');
  return { stories: published, isApiConnected };
}

// ---------------------------------------------------------------------------
// Mutations — Go through the API, then notify hooks to refetch
// ---------------------------------------------------------------------------

/**
 * Creates a story via the API backend.
 * Falls back to localStorage if the API is unreachable.
 */
export async function saveUserStory(storyData: Partial<Story> & { title: string; summary: string }): Promise<Story> {
  try {
    const created = await api.createStory({
      title: storyData.title,
      summary: storyData.summary,
      articleType: storyData.articleType || 'developing_story',
      topicIds: storyData.topicIds || [],
      entityIds: storyData.entityIds || [],
      sourceIds: storyData.sourceIds || [],
      blocks: storyData.blocks || [],
      heroImageUrl: storyData.heroImageUrl,
    });

    // If the story should be published immediately, publish it
    if (storyData.status === 'PUBLISHED') {
      await api.publishStory(created.id);
    }

    notifyStoryMutation();
    return created;
  } catch (err) {
    console.warn('API unavailable, saving to localStorage as fallback:', err);
    // Fallback: save to localStorage (legacy behavior)
    const fallbackStory: Story = {
      id: storyData.id || `sty_local_${Date.now()}`,
      organizationId: storyData.organizationId || 'org_default',
      slug: storyData.slug || storyData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      title: storyData.title,
      summary: storyData.summary,
      status: (storyData.status as any) || 'DRAFT',
      articleType: storyData.articleType || 'developing_story',
      currentVersionNumber: 1,
      currentVersionId: `ver_${Date.now()}`,
      topicIds: storyData.topicIds || [],
      entityIds: storyData.entityIds || [],
      sourceIds: storyData.sourceIds || [],
      blocks: storyData.blocks || [],
      heroImageUrl: storyData.heroImageUrl,
      createdVia: 'admin',
      createdByClient: 'human_web',
      authorId: storyData.authorId || 'usr_journalist',
      publishedAt: storyData.status === 'PUBLISHED' ? new Date().toISOString() : undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (typeof window !== 'undefined') {
      const storageKey = 'globalpulse_user_stories_v1';
      const existing: Story[] = JSON.parse(localStorage.getItem(storageKey) || '[]');
      localStorage.setItem(storageKey, JSON.stringify([fallbackStory, ...existing]));
    }

    notifyStoryMutation();
    return fallbackStory;
  }
}

/**
 * Toggles a story between PUBLISHED and DRAFT via the API.
 */
export async function toggleStoryStatus(storyId: string): Promise<void> {
  try {
    // Fetch current story to determine current status
    const story = await api.getStory(storyId);
    if (story.status === 'PUBLISHED') {
      await api.unpublishStory(storyId);
    } else {
      await api.publishStory(storyId);
    }
    notifyStoryMutation();
  } catch (err) {
    console.warn('API unavailable for toggle, falling back to localStorage:', err);
    // Legacy localStorage fallback
    if (typeof window !== 'undefined') {
      const storageKey = 'globalpulse_user_stories_v1';
      const stories: Story[] = JSON.parse(localStorage.getItem(storageKey) || '[]');
      const updated = stories.map((s) => {
        if (s.id === storyId) {
          const nextStatus = s.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED';
          return {
            ...s,
            status: nextStatus as any,
            publishedAt: nextStatus === 'PUBLISHED' ? new Date().toISOString() : s.publishedAt,
          };
        }
        return s;
      });
      localStorage.setItem(storageKey, JSON.stringify(updated));
      notifyStoryMutation();
    }
  }
}

/**
 * Deletes a story permanently via the API.
 */
export async function deleteUserStory(storyId: string): Promise<void> {
  try {
    await api.deleteStory(storyId);
    notifyStoryMutation();
  } catch (err) {
    console.warn('API unavailable for delete, falling back to localStorage:', err);
    if (typeof window !== 'undefined') {
      const storageKey = 'globalpulse_user_stories_v1';
      const stories: Story[] = JSON.parse(localStorage.getItem(storageKey) || '[]');
      localStorage.setItem(storageKey, JSON.stringify(stories.filter((s) => s.id !== storyId)));
      notifyStoryMutation();
    }
  }
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
export function useCategories() {
  const [categories, setCategories] = useState<any[]>([]);

  useEffect(() => {
    api.listCategories().then((cats) => {
      if (cats && cats.length > 0) setCategories(cats);
    }).catch(() => {});
  }, []);

  return categories;
}

/**
 * React hook to fetch stories for a specific category.
 */
export function useCategoryStories(slug: string) {
  const { stories: allStories } = useAllStories();
  const [categoryStories, setCategoryStories] = useState<Story[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    api.getCategoryStories(slug, 30)
      .then((stories) => {
        if (isMounted && stories && stories.length > 0) {
          setCategoryStories(stories);
          setIsLoading(false);
        } else if (isMounted) {
          // Fallback to filtering allStories locally
          const normalized = slug.toLowerCase();
          const filtered = allStories.filter(
            (s) =>
              (s.articleType || '').toLowerCase() === normalized ||
              (s.topicIds || []).some((t) => t.toLowerCase().includes(normalized))
          );
          setCategoryStories(filtered);
          setIsLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          const normalized = slug.toLowerCase();
          const filtered = allStories.filter(
            (s) =>
              (s.articleType || '').toLowerCase() === normalized ||
              (s.topicIds || []).some((t) => t.toLowerCase().includes(normalized))
          );
          setCategoryStories(filtered);
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [slug, allStories]);

  return { stories: categoryStories, isLoading };
}

/**
 * React hook for story comments.
 */
export function useStoryComments(storyId: string) {
  const [comments, setComments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchComments = useCallback(async () => {
    if (!storyId) return;
    try {
      const data = await api.getStoryComments(storyId);
      setComments(data || []);
    } catch {
      setComments([]);
    } finally {
      setIsLoading(false);
    }
  }, [storyId]);

  useEffect(() => {
    fetchComments();

    // Listen for SSE comment events
    const unsub = api.subscribeToRealtimeEvents(['all'], (event) => {
      if (
        event.type === 'comment.created' ||
        event.type === 'comment.moderated' ||
        event.type === 'comment.deleted'
      ) {
        fetchComments();
      }
    });

    return () => unsub();
  }, [fetchComments]);

  const addComment = async (content: string, authorName?: string, parentId?: string) => {
    try {
      const created = await api.createComment(storyId, content, authorName, parentId);
      setComments((prev) => [...prev, created]);
      return created;
    } catch (err) {
      console.error('Failed to post comment:', err);
      throw err;
    }
  };

  return { comments, isLoading, addComment, refetch: fetchComments };
}

/**
 * React hook for story reactions.
 */
export function useStoryReactions(storyId: string) {
  const [summary, setSummary] = useState<{
    counts: Record<string, number>;
    userReactions: string[];
  }>({
    counts: { like: 0, insightful: 0, important: 0, heart: 0 },
    userReactions: [],
  });

  const fetchReactions = useCallback(async () => {
    if (!storyId) return;
    try {
      const data = await api.getStoryReactions(storyId);
      if (data) {
        setSummary({
          counts: data.counts || { like: 0, insightful: 0, important: 0, heart: 0 },
          userReactions: data.userReactions || [],
        });
      }
    } catch {
      // Fallback
    }
  }, [storyId]);

  useEffect(() => {
    fetchReactions();

    const unsub = api.subscribeToRealtimeEvents(['all'], (event) => {
      if (event.type === 'reaction.updated' && (event.data as any)?.storyId === storyId) {
        fetchReactions();
      }
    });

    return () => unsub();
  }, [fetchReactions, storyId]);

  const toggleReaction = async (reactionType: string) => {
    try {
      const res = await api.toggleStoryReaction(storyId, reactionType);
      if (res?.summary) {
        setSummary({
          counts: res.summary.counts,
          userReactions: res.summary.userReactions,
        });
      }
    } catch (err) {
      console.error('Failed to toggle reaction:', err);
    }
  };

  return { ...summary, toggleReaction };
}

/**
 * React hook for live newsroom metrics & KPIs.
 */
export function useNewsroomMetrics() {
  const [metrics, setMetrics] = useState<{
    totalStories: number;
    publishedStories: number;
    draftStories: number;
    inReviewStories: number;
    scheduledStories: number;
    totalReads: number;
    totalReactions: number;
    totalComments: number;
    avgReadingTimeMinutes: number;
    activeJournalists: number;
    activeAiAgents: number;
  }>({
    totalStories: 0,
    publishedStories: 0,
    draftStories: 0,
    inReviewStories: 0,
    scheduledStories: 0,
    totalReads: 0,
    totalReactions: 0,
    totalComments: 0,
    avgReadingTimeMinutes: 3.5,
    activeJournalists: 1,
    activeAiAgents: 2,
  });
  const [isLoading, setIsLoading] = useState(true);

  const fetchMetrics = useCallback(async () => {
    try {
      const data = await api.getNewsroomMetrics();
      if (data) {
        setMetrics(data);
      }
    } catch {
      // Fallback
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMetrics();
    const unsub = api.subscribeToRealtimeEvents(['all'], (event) => {
      if (
        event.type === 'story.published' ||
        event.type === 'story.scheduled' ||
        event.type === 'reaction.updated' ||
        event.type === 'comment.created'
      ) {
        fetchMetrics();
      }
    });
    return () => unsub();
  }, [fetchMetrics]);

  return { metrics, isLoading, refetch: fetchMetrics };
}

/**
 * React hook for trending stories leaderboard.
 */
export function useTrendingStories(limit = 10) {
  const [trending, setTrending] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchTrending = useCallback(async () => {
    try {
      const list = await api.getTrendingStories(limit);
      if (Array.isArray(list)) {
        setTrending(list);
      }
    } catch {
      // Fallback
    } finally {
      setIsLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    fetchTrending();
    const unsub = api.subscribeToRealtimeEvents(['all'], (event) => {
      if (event.type === 'story.published' || event.type === 'reaction.updated') {
        fetchTrending();
      }
    });
    return () => unsub();
  }, [fetchTrending]);

  return { trending, isLoading, refetch: fetchTrending };
}

/**
 * React hook for newsroom staff & autonomous AI roster.
 */
export function useNewsroomStaff() {
  const [staff, setStaff] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchStaff = useCallback(async () => {
    try {
      const list = await api.listNewsroomStaff();
      if (Array.isArray(list)) {
        setStaff(list);
      }
    } catch {
      // Fallback
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStaff();
  }, [fetchStaff]);

  const updateRole = async (userId: string, role: string) => {
    await api.assignUserRole(userId, role);
    fetchStaff();
  };

  const inviteStaff = async (input: { email: string; name: string; role: string; clientType?: string }) => {
    await api.inviteNewsroomUser(input);
    fetchStaff();
  };

  return { staff, isLoading, updateRole, inviteStaff, refetch: fetchStaff };
}

/**
 * React hook for scheduled stories.
 */
export function useScheduledStories() {
  const [scheduled, setScheduled] = useState<Story[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchScheduled = useCallback(async () => {
    try {
      const list = await api.listScheduledStories();
      if (Array.isArray(list)) {
        setScheduled(list);
      }
    } catch {
      // Fallback
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchScheduled();
    const unsub = api.subscribeToRealtimeEvents(['all'], (event) => {
      if (event.type === 'story.scheduled' || event.type === 'story.published') {
        fetchScheduled();
      }
    });
    return () => unsub();
  }, [fetchScheduled]);

  const scheduleStory = async (id: string, publishAt: string) => {
    const res = await api.scheduleStory(id, publishAt);
    fetchScheduled();
    notifyStoryMutation();
    return res;
  };

  const sweep = async () => {
    const res = await api.sweepScheduledStories();
    fetchScheduled();
    notifyStoryMutation();
    return res;
  };

  return { scheduled, isLoading, scheduleStory, sweep, refetch: fetchScheduled };
}

/**
 * React hook for editorial notifications.
 */
export function useEditorialNotifications(limit = 20) {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    try {
      const list = await api.listNotifications(limit);
      if (Array.isArray(list)) {
        setNotifications(list);
      }
    } catch {
      // Fallback
    } finally {
      setIsLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    fetchNotifications();
    const unsub = api.subscribeToRealtimeEvents(['all'], (event) => {
      if (event.type === 'notification.breaking' || event.type === 'editorial.alert') {
        fetchNotifications();
      }
    });
    return () => unsub();
  }, [fetchNotifications]);

  const broadcastBreaking = async (storyId: string, headline: string, urgency = 'urgent') => {
    const res = await api.broadcastBreakingNews(storyId, headline, urgency);
    fetchNotifications();
    return res;
  };

  return { notifications, isLoading, broadcastBreaking, refetch: fetchNotifications };
}


