'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { Comment } from '@ai-news/schemas';
import * as api from '../api-client';

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
  }>(() => {
    if (typeof window !== 'undefined' && storyId) {
      try {
        const cached = localStorage.getItem(`globalpulse_reactions_${storyId}`);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed?.counts && Array.isArray(parsed?.userReactions)) {
            return parsed;
          }
        }
      } catch {}
    }
    return {
      counts: { like: 0, insightful: 0, important: 0, heart: 0 },
      userReactions: [],
    };
  });

  const lastLocalToggleRef = useRef<number>(0);

  const saveToCache = useCallback(
    (data: { counts: Record<string, number>; userReactions: string[] }) => {
      if (typeof window !== 'undefined' && storyId) {
        try {
          localStorage.setItem(`globalpulse_reactions_${storyId}`, JSON.stringify(data));
        } catch {}
      }
    },
    [storyId]
  );

  const fetchReactions = useCallback(async () => {
    if (!storyId) return;
    try {
      const data = await api.getStoryReactions(storyId);
      if (data) {
        const newSummary = {
          counts: data.counts || { like: 0, insightful: 0, important: 0, heart: 0 },
          userReactions: data.userReactions || [],
        };
        setSummary(newSummary);
        saveToCache(newSummary);
      }
    } catch {
      // Fallback
    }
  }, [storyId, saveToCache]);

  useEffect(() => {
    fetchReactions();

    const unsub = api.subscribeToRealtimeEvents(['all'], (event) => {
      if (
        event.type === 'reaction.updated' &&
        (event.data as Record<string, unknown> | undefined)?.storyId === storyId
      ) {
        // Skip redundant refetch if current user just toggled locally to avoid flickering
        if (Date.now() - lastLocalToggleRef.current < 2000) {
          return;
        }
        fetchReactions();
      }
    });

    return () => unsub();
  }, [fetchReactions, storyId]);

  const toggleReaction = async (reactionType: string) => {
    lastLocalToggleRef.current = Date.now();

    // 1. OPTIMISTIC UPDATE: update local state instantly without waiting for API round-trip
    setSummary((prev) => {
      const hasReacted = prev.userReactions.includes(reactionType);
      const nextUserReactions = hasReacted
        ? prev.userReactions.filter((r) => r !== reactionType)
        : [...prev.userReactions, reactionType];

      const currentCount = prev.counts[reactionType] || 0;
      const nextCount = hasReacted ? Math.max(0, currentCount - 1) : currentCount + 1;

      const nextSummary = {
        counts: {
          ...prev.counts,
          [reactionType]: nextCount,
        },
        userReactions: nextUserReactions,
      };

      saveToCache(nextSummary);
      return nextSummary;
    });

    // 2. Network sync in background
    try {
      const res = await api.toggleStoryReaction(storyId, reactionType);
      if (res?.summary) {
        setSummary({
          counts: res.summary.counts,
          userReactions: res.summary.userReactions,
        });
        saveToCache({
          counts: res.summary.counts,
          userReactions: res.summary.userReactions,
        });
      }
    } catch (err) {
      console.error('Failed to toggle reaction:', err);
      // Revert to server state on error
      fetchReactions();
    }
  };

  return { ...summary, toggleReaction };
}

/**
 * React hook for live newsroom metrics & KPIs.
 */
