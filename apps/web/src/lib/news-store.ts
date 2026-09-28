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
      // API unreachable — fall back to demo data only if we haven't connected before
      if (!hasAttemptedFetch.current) {
        setStories(EXTENDED_NEWS_STORIES);
        setIsDemoMode(true);
      }
      setIsApiConnected(false);
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
 * Updates an existing story, changes metadata, and commits a new version snapshot.
 */
export async function updateUserStory(
  storyId: string,
  storyData: Partial<Story> & { changeSummary?: string }
): Promise<Story> {
  try {
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
  } catch (err) {
    console.warn('API unavailable for update, falling back to localStorage:', err);
    if (typeof window !== 'undefined') {
      const storageKey = 'globalpulse_user_stories_v1';
      const existing: Story[] = JSON.parse(localStorage.getItem(storageKey) || '[]');
      const updatedList = existing.map((s) => {
        if (s.id === storyId) {
          return {
            ...s,
            ...storyData,
            updatedAt: new Date().toISOString(),
          };
        }
        return s;
      });
      localStorage.setItem(storageKey, JSON.stringify(updatedList));
    }
    notifyStoryMutation();
    return storyData as Story;
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

export const DEFAULT_CATEGORIES: NewsCategory[] = [
  { id: 'cat_india', name: 'India', slug: 'india', description: 'National policy, economy, politics, and development across India', icon: '🇮🇳', storyCount: 8 },
  { id: 'cat_world', name: 'World', slug: 'world', description: 'Diplomatic summits, global affairs, treaties, and international geopolitics', icon: '🌐', storyCount: 14 },
  { id: 'cat_business', name: 'Business', slug: 'business', description: 'Financial markets, trade settlements, central banking, and corporate dispatches', icon: '📈', storyCount: 11 },
  { id: 'cat_technology', name: 'Technology', slug: 'technology', description: 'Artificial Intelligence, semiconductor consortiums, quantum computing, and software', icon: '💻', storyCount: 16 },
  { id: 'cat_science', name: 'Science', slug: 'science', description: 'Magnetic fusion reactors, aerospace missions, genomics, and breakthrough physics', icon: '🔬', storyCount: 9 },
  { id: 'cat_health', name: 'Health', slug: 'health', description: 'Biotechnology, global epidemiology, therapeutics, and medical innovation', icon: '🩺', storyCount: 7 },
  { id: 'cat_sports', name: 'Sports', slug: 'sports', description: 'International championships, athletic tournaments, and competitive sports', icon: '🏆', storyCount: 5 },
  { id: 'cat_climate', name: 'Climate & Energy', slug: 'climate', description: 'Grid transition, carbon neutrality initiatives, renewables, and climate science', icon: '🌱', storyCount: 6 },
  { id: 'cat_geopolitics', name: 'Geopolitics', slug: 'geopolitics', description: 'Strategic alliances, multilateral trade pacts, defense, and sovereign policy', icon: '⚖️', storyCount: 12 },
];

export const DEFAULT_TOPICS: NewsTopic[] = [
  { id: 'top_ai', name: 'AI Breakthroughs', slug: 'ai-breakthroughs', parentCategory: 'Technology', description: 'Autonomous agent architectures, LLM models, and enterprise reasoning systems', storyCount: 12 },
  { id: 'top_semi', name: 'Semiconductors', slug: 'semiconductors', parentCategory: 'Technology', description: '2nm fabrication standards, lithography equipment, and global foundries', storyCount: 8 },
  { id: 'top_fusion', name: 'Clean Energy & Fusion', slug: 'clean-energy', parentCategory: 'Science', description: 'Magnetic confinement fusion, next-gen solar cells, and grid storage', storyCount: 6 },
  { id: 'top_quantum', name: 'Quantum Computing', slug: 'quantum-computing', parentCategory: 'Technology', description: 'Qubit stability, quantum error correction, and cryptographic implications', storyCount: 5 },
  { id: 'top_space', name: 'Space Exploration', slug: 'space-exploration', parentCategory: 'Science', description: 'Lunar gateway modules, interplanetary probes, and commercial launch vehicles', storyCount: 7 },
  { id: 'top_brics', name: 'BRICS 2026 Summit', slug: 'brics-2026', parentCategory: 'World', description: 'Sovereign local-currency accords, bilateral trade treaties, and multilateral expansion', storyCount: 9 },
  { id: 'top_cbdc', name: 'Central Bank Digital Currency', slug: 'cbdc', parentCategory: 'Business', description: 'Cross-border digital currency settlement pilots, sovereign reserves, and liquidity', storyCount: 4 },
  { id: 'top_defense', name: 'Cyber Defense & Security', slug: 'cyber-defense', parentCategory: 'Technology', description: 'Critical infrastructure protection, zero-trust cryptographic protocols, and audits', storyCount: 5 },
  { id: 'top_ev', name: 'Electric Mobility & Batteries', slug: 'electric-mobility', parentCategory: 'Business', description: 'Solid-state battery chemistry, sodium-ion scaling, and EV manufacturing', storyCount: 6 },
  { id: 'top_biotech', name: 'Genomics & Precision Medicine', slug: 'biotech', parentCategory: 'Health', description: 'CRISPR base editing, mRNA cancer vaccines, and clinical trials', storyCount: 4 },
];

const CATEGORIES_KEY = 'globalpulse_categories_v1';
const TOPICS_KEY = 'globalpulse_topics_v1';

export function useTaxonomy() {
  const [categories, setCategories] = useState<NewsCategory[]>(DEFAULT_CATEGORIES);
  const [topics, setTopics] = useState<NewsTopic[]>(DEFAULT_TOPICS);

  const loadTaxonomy = useCallback(() => {
    if (typeof window === 'undefined') return;
    try {
      const storedCats = localStorage.getItem(CATEGORIES_KEY);
      if (storedCats) {
        setCategories(JSON.parse(storedCats));
      } else {
        setCategories(DEFAULT_CATEGORIES);
      }

      const storedTops = localStorage.getItem(TOPICS_KEY);
      if (storedTops) {
        setTopics(JSON.parse(storedTops));
      } else {
        setTopics(DEFAULT_TOPICS);
      }
    } catch {
      // Safe fallback
    }
  }, []);

  useEffect(() => {
    loadTaxonomy();
    window.addEventListener('globalpulse_taxonomy_updated', loadTaxonomy);
    return () => window.removeEventListener('globalpulse_taxonomy_updated', loadTaxonomy);
  }, [loadTaxonomy]);

  const addCategory = useCallback((cat: { name: string; slug?: string; description?: string; icon?: string }) => {
    const slug = cat.slug || cat.name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-');
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
  }, []);

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

  const addTopic = useCallback((topic: { name: string; slug?: string; description?: string; parentCategory?: string }) => {
    const slug = topic.slug || topic.name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-');
    const newTopic: NewsTopic = {
      id: `top_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      name: topic.name.trim(),
      slug,
      description: topic.description || `In-depth coverage and timeline milestones for ${topic.name}.`,
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
    api.createTopic({ name: newTopic.name, slug: newTopic.slug, description: newTopic.description }).catch(() => {});

    return newTopic;
  }, []);

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
    addCategory,
    deleteCategory,
    addTopic,
    deleteTopic,
    refetch: loadTaxonomy,
  };
}



