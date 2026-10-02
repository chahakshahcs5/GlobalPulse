/**
 * API Client — Newsroom Management (Staff, Analytics, Metrics, Notifications, Audit Logs, Webhooks)
 */
import type {
  StoryAnalytics,
  TrendingStory,
  NewsroomMetrics,
  EditorialNotification,
  NewsroomUser,
  AuditLog,
  WebhookSubscription,
} from '@ai-news/schemas';
import { request } from './core';

export async function getStoryAnalytics(storyId: string): Promise<StoryAnalytics> {
  return request<StoryAnalytics>(`/api/analytics/stories/${encodeURIComponent(storyId)}`);
}

export async function getTrendingStories(limit = 10): Promise<TrendingStory[]> {
  return request<TrendingStory[]>(`/api/analytics/trending?limit=${limit}`);
}

export async function getNewsroomMetrics(): Promise<NewsroomMetrics> {
  return request<NewsroomMetrics>('/api/analytics/newsroom');
}

export async function listNotifications(limit = 20): Promise<EditorialNotification[]> {
  return request<EditorialNotification[]>(`/api/notifications?limit=${limit}`);
}

export async function broadcastBreakingNews(
  storyId: string,
  headline: string,
  urgency: 'info' | 'warning' | 'urgent' = 'urgent'
): Promise<EditorialNotification> {
  return request<EditorialNotification>('/api/notifications/breaking', {
    method: 'POST',
    body: JSON.stringify({ storyId, headline, urgency }),
  });
}

export async function listNewsroomStaff(): Promise<NewsroomUser[]> {
  return request<NewsroomUser[]>('/api/users');
}

export async function assignUserRole(userId: string, role: string): Promise<NewsroomUser> {
  return request<NewsroomUser>(`/api/users/${encodeURIComponent(userId)}/role`, {
    method: 'PUT',
    body: JSON.stringify({ role }),
  });
}

export async function inviteNewsroomUser(input: {
  email: string;
  name: string;
  role: string;
  clientType?: string;
}): Promise<NewsroomUser> {
  return request<NewsroomUser>('/api/users/invite', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function listAuditLogs(
  params?: Record<string, string | number | undefined>
): Promise<AuditLog[]> {
  try {
    const sp = new URLSearchParams();
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        if (v !== undefined) sp.set(k, String(v));
      }
    }
    const qs = sp.toString();
    const res = await request<AuditLog[] | { data: AuditLog[] }>(
      `/api/audit/logs${qs ? `?${qs}` : ''}`
    );
    return Array.isArray(res) ? res : res?.data || [];
  } catch {
    return [];
  }
}

export async function listMcpWebhooks(): Promise<WebhookSubscription[]> {
  try {
    const res = await request<WebhookSubscription[]>('/api/mcp/webhooks');
    return Array.isArray(res) ? res : [];
  } catch {
    return [];
  }
}
