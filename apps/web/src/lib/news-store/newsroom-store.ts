'use client';

import { useState, useEffect, useCallback } from 'react';
import type {
  TrendingStory,
  NewsroomUser,
  EditorialNotification,
  NewsroomMetrics,
  Story,
} from '@ai-news/schemas';
import * as api from '../api-client';
import { notifyStoryMutation } from './stories-store';

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
