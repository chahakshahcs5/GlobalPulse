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
import {
  BASELINE_NAV_TABS,
  type Story,
  type Category,
  type Comment,
  type TrendingStory,
  type NewsroomUser,
  type EditorialNotification,
  type NewsroomMetrics,
  type NavTab,
} from '@ai-news/schemas';
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
 * Only falls back to demo data when the API is completely unreachable.
 * Automatically refreshes on SSE events and local mutations.
 */
export function useAllStories() {
  const [stories, setStories] = useState<Story[]>([]);
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

  return { stories, isApiConnected, isDemoMode };
}

/**
 * Fetches only published stories for the reader-facing feed.
 */
export function usePublishedStories() {
  const { stories, isApiConnected, isDemoMode } = useAllStories();
  const published = stories.filter((s) => s.status === 'PUBLISHED');
  return { stories: published, isApiConnected, isDemoMode };
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
export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    api
      .listCategories()
      .then((cats) => {
        if (cats && cats.length > 0) setCategories(cats);
      })
      .catch(() => {});
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

    api
      .getCategoryStories(slug, 30)
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
  const [comments, setComments] = useState<Comment[]>([]);
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
      if (
        event.type === 'reaction.updated' &&
        (event.data as Record<string, unknown> | undefined)?.storyId === storyId
      ) {
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
  const [metrics, setMetrics] = useState<NewsroomMetrics>({
    totalStories: 0,
    publishedStories: 0,
    draftStories: 0,
    reviewQueueCount: 0,
    scheduledStoriesCount: 0,
    totalComments: 0,
    totalReactions: 0,
    totalBookmarks: 0,
    activeCategoriesCount: 0,
    totalReads: 0,
    avgReadingTimeMinutes: 3.5,
    activeJournalists: 1,
    activeAiAgents: 2,
    generatedAt: new Date().toISOString(),
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
  const [trending, setTrending] = useState<TrendingStory[]>([]);
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
  const [staff, setStaff] = useState<NewsroomUser[]>([]);
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

  const inviteStaff = async (input: {
    email: string;
    name: string;
    role: string;
    clientType?: string;
  }) => {
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
  const [notifications, setNotifications] = useState<EditorialNotification[]>([]);
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

  const broadcastBreaking = async (
    storyId: string,
    headline: string,
    urgency: 'info' | 'warning' | 'urgent' = 'urgent'
  ) => {
    const res = await api.broadcastBreakingNews(storyId, headline, urgency);
    fetchNotifications();
    return res;
  };

  return { notifications, isLoading, broadcastBreaking, refetch: fetchNotifications };
}

// ---------------------------------------------------------------------------
// Taxonomy Management (Categories & Topics Store)
// ---------------------------------------------------------------------------

export interface NewsCategory {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon?: string;
  storyCount?: number;
  isCustom?: boolean;
}

export interface NewsTopic {
  id: string;
  name: string;
  slug: string;
  description: string;
  parentCategory?: string;
  storyCount?: number;
  isCustom?: boolean;
}

export const DEFAULT_CATEGORIES: NewsCategory[] = [];
export const DEFAULT_TOPICS: NewsTopic[] = [];

export const CATEGORY_ICON_MAP: Record<string, string> = {
  'top-stories': '⭐',
  technology: '💻',
  business: '📈',
  world: '🌐',
  science: '🔬',
  health: '🩺',
  sports: '🏆',
  entertainment: '🎬',
  india: '🇮🇳',
};

const CATEGORIES_KEY = 'globalpulse_api_categories_v3';
const TOPICS_KEY = 'globalpulse_api_topics_v3';
const NAV_TABS_KEY = 'globalpulse_api_nav_tabs_v3';

export function useTaxonomy() {
  const [categories, setCategories] = useState<NewsCategory[]>([]);
  const [topics, setTopics] = useState<NewsTopic[]>([]);
  const [navTabs, setNavTabs] = useState<NavTab[]>(BASELINE_NAV_TABS);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const loadTaxonomy = useCallback(async () => {
    // Clear legacy static keys from storage if present
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('globalpulse_categories_v1');
        localStorage.removeItem('globalpulse_topics_v1');
      } catch {}

      try {
        const storedCats = localStorage.getItem(CATEGORIES_KEY);
        if (storedCats) {
          const parsed = JSON.parse(storedCats);
          if (Array.isArray(parsed) && parsed.length > 0) setCategories(parsed);
        }
        const storedTops = localStorage.getItem(TOPICS_KEY);
        if (storedTops) {
          const parsed = JSON.parse(storedTops);
          if (Array.isArray(parsed) && parsed.length > 0) setTopics(parsed);
        }
        const storedTabs = localStorage.getItem(NAV_TABS_KEY);
        if (storedTabs) {
          const parsed = JSON.parse(storedTabs);
          if (Array.isArray(parsed) && parsed.length > 0) setNavTabs(parsed);
        }
      } catch {
        // Safe fallback
      }
    }

    try {
      const [apiCats, apiTops, apiTabs, publishedStories] = await Promise.all([
        api.listCategories().catch(() => []),
        api.listTopics().catch(() => []),
        api.listNavTabs().catch(() => []),
        api.listStories({ limit: 500 }).catch(() => []),
      ]);

      const stories = Array.isArray(publishedStories) ? publishedStories : [];

      // Calculate dynamic story count per category and topic
      const categoryCounts: Record<string, number> = {};
      const topicCounts: Record<string, number> = {};

      for (const story of stories) {
        if (story.status !== 'PUBLISHED') continue;
        const artType = (story.articleType || '').toLowerCase();
        categoryCounts[artType] = (categoryCounts[artType] || 0) + 1;

        const storyTopicIds = (story.topicIds || []).map((t) => t.toLowerCase());
        const storyText = `${story.title} ${story.summary || ''}`.toLowerCase();

        for (const tid of storyTopicIds) {
          topicCounts[tid] = (topicCounts[tid] || 0) + 1;
        }

        if (Array.isArray(apiTops)) {
          for (const t of apiTops) {
            const tId = (t.id || '').toLowerCase();
            const tSlug = (t.slug || '').toLowerCase();
            const tName = (t.name || '').toLowerCase();
            if (
              storyTopicIds.includes(tId) ||
              storyTopicIds.includes(tSlug) ||
              storyText.includes(tName)
            ) {
              topicCounts[tId] = (topicCounts[tId] || 0) + 1;
              topicCounts[tSlug] = (topicCounts[tSlug] || 0) + 1;
            }
          }
        }
      }

      // Map categories purely from live API
      const finalCats: NewsCategory[] = Array.isArray(apiCats)
        ? apiCats.map((ac) => {
            const slug = (ac.slug || ac.code || ac.name || '').toLowerCase();
            const dynamicCount =
              categoryCounts[slug] ?? categoryCounts[ac.code] ?? ac.storyCount ?? 0;
            return {
              id: (ac as { id?: string }).id || `cat_${slug}`,
              name: ac.name,
              slug,
              description: ac.description || '',
              icon: CATEGORY_ICON_MAP[slug] || ac.icon || '🏷️',
              storyCount: dynamicCount,
              isPinned: ac.isPinned,
            };
          })
        : [];

      // Map topics purely from live API
      const finalTops: NewsTopic[] = Array.isArray(apiTops)
        ? apiTops.map((at) => {
            const slug = at.slug || at.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
            const atId = (at.id || '').toLowerCase();
            const count =
              topicCounts[atId] ||
              topicCounts[slug.toLowerCase()] ||
              (at as { storyCount?: number }).storyCount ||
              0;
            return {
              id: at.id || `top_${slug}`,
              name: at.name,
              slug,
              description: at.description || '',
              parentCategory:
                (at as { parentCategory?: string }).parentCategory || at.parentTopicId || 'General',
              storyCount: count,
              isCustom: (at as { isCustom?: boolean }).isCustom ?? false,
            };
          })
        : [];

      setCategories(finalCats);
      setTopics(finalTops);
      if (Array.isArray(apiTabs) && apiTabs.length > 0) {
        setNavTabs(apiTabs);
      }
      setIsLoading(false);

      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(CATEGORIES_KEY, JSON.stringify(finalCats));
          localStorage.setItem(TOPICS_KEY, JSON.stringify(finalTops));
          if (Array.isArray(apiTabs) && apiTabs.length > 0) {
            localStorage.setItem(NAV_TABS_KEY, JSON.stringify(apiTabs));
          }
        } catch {}
      }
    } catch {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTaxonomy();
    window.addEventListener('globalpulse_taxonomy_updated', loadTaxonomy);
    window.addEventListener('globalpulse_stories_updated', loadTaxonomy);
    return () => {
      window.removeEventListener('globalpulse_taxonomy_updated', loadTaxonomy);
      window.removeEventListener('globalpulse_stories_updated', loadTaxonomy);
    };
  }, [loadTaxonomy]);

  const addCategory = useCallback(
    (cat: { name: string; slug?: string; description?: string; icon?: string }) => {
      const slug =
        cat.slug ||
        cat.name
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9]+/g, '-');
      const newCat: NewsCategory = {
        id: `cat_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        name: cat.name.trim(),
        slug,
        description: cat.description || `Comprehensive dispatches and analysis on ${cat.name}.`,
        icon: cat.icon || '🏷️',
        storyCount: 0,
        isCustom: true,
      };

      setCategories((prev) => {
        const updated = [newCat, ...prev.filter((c) => c.slug !== slug)];
        try {
          localStorage.setItem(CATEGORIES_KEY, JSON.stringify(updated));
          window.dispatchEvent(new Event('globalpulse_taxonomy_updated'));
        } catch {}
        return updated;
      });

      return newCat;
    },
    []
  );

  const deleteCategory = useCallback((id: string) => {
    setCategories((prev) => {
      const updated = prev.filter((c) => c.id !== id);
      try {
        localStorage.setItem(CATEGORIES_KEY, JSON.stringify(updated));
        window.dispatchEvent(new Event('globalpulse_taxonomy_updated'));
      } catch {}
      return updated;
    });
  }, []);

  const addTopic = useCallback(
    (topic: { name: string; slug?: string; description?: string; parentCategory?: string }) => {
      const slug =
        topic.slug ||
        topic.name
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9]+/g, '-');
      const newTopic: NewsTopic = {
        id: `top_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        name: topic.name.trim(),
        slug,
        description:
          topic.description || `In-depth coverage and timeline milestones for ${topic.name}.`,
        parentCategory: topic.parentCategory || 'General',
        storyCount: 0,
        isCustom: true,
      };

      setTopics((prev) => {
        const updated = [newTopic, ...prev.filter((t) => t.slug !== slug)];
        try {
          localStorage.setItem(TOPICS_KEY, JSON.stringify(updated));
          window.dispatchEvent(new Event('globalpulse_taxonomy_updated'));
        } catch {}
        return updated;
      });

      // Optionally sync with backend if running
      api
        .createTopic({
          name: newTopic.name,
          slug: newTopic.slug,
          description: newTopic.description,
        })
        .catch(() => {});

      return newTopic;
    },
    []
  );

  const deleteTopic = useCallback((id: string) => {
    setTopics((prev) => {
      const updated = prev.filter((t) => t.id !== id);
      try {
        localStorage.setItem(TOPICS_KEY, JSON.stringify(updated));
        window.dispatchEvent(new Event('globalpulse_taxonomy_updated'));
      } catch {}
      return updated;
    });
  }, []);

  return {
    categories,
    topics,
    navTabs,
    isLoading,
    addCategory,
    deleteCategory,
    addTopic,
    deleteTopic,
    refetch: loadTaxonomy,
  };
}
