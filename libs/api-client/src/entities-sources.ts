/**
 * API Client — Sources, Publishers, Following, Events & Entities
 */
import type {
  Source,
  Publisher,
  PublisherProfile,
  Event,
  Entity,
  Topic,
  FollowTargetType,
} from '@ai-news/schemas';
import { request } from './core';

// The session lives in its own module now; these are kept so that older
// imports of this module keep working.
export { loginUser, registerUser, getCurrentUser, logoutUser } from './session';
export type { AuthResponse } from './session';
export { setAuthToken } from './core';

// ---------------------------------------------------------------------------
// Sources, Events, Entities & Fact-Checks API
// ---------------------------------------------------------------------------

export async function listSources(query?: string): Promise<Source[]> {
  try {
    const qs = query ? `?query=${encodeURIComponent(query)}` : '';
    const res = await request<Source[] | { data: Source[] }>(`/api/sources${qs}`);
    return Array.isArray(res) ? res : res?.data || [];
  } catch {
    return [];
  }
}

export async function getSource(id: string): Promise<Source | null> {
  try {
    return await request<Source>(`/api/sources/${encodeURIComponent(id)}`);
  } catch {
    return null;
  }
}

export async function listPublishers(category?: string, query?: string): Promise<Publisher[]> {
  try {
    const params = new URLSearchParams();
    if (category && category !== 'all') params.append('category', category);
    if (query) params.append('query', query);
    const qs = params.toString() ? `?${params.toString()}` : '';
    const res = await request<Publisher[] | { data: Publisher[] }>(`/api/publishers${qs}`);
    return Array.isArray(res) ? res : res?.data || [];
  } catch {
    return [];
  }
}

export async function getPublisherProfile(slug: string): Promise<PublisherProfile | null> {
  try {
    const res = await request<PublisherProfile | { data: PublisherProfile }>(
      `/api/publishers/${encodeURIComponent(slug)}`
    );
    return (res as { data?: PublisherProfile })?.data || (res as PublisherProfile) || null;
  } catch {
    return null;
  }
}

export async function followTarget(
  targetType: FollowTargetType,
  targetId: string
): Promise<boolean> {
  try {
    await request('/api/users/follow', {
      method: 'POST',
      body: JSON.stringify({ targetType, targetId }),
    });
    return true;
  } catch {
    return false;
  }
}

export async function unfollowTarget(
  targetType: FollowTargetType,
  targetId: string
): Promise<boolean> {
  try {
    await request(`/api/users/follow/${targetType}/${encodeURIComponent(targetId)}`, {
      method: 'DELETE',
    });
    return true;
  } catch {
    return false;
  }
}

export async function isFollowingTarget(
  targetType: FollowTargetType,
  targetId: string
): Promise<boolean> {
  try {
    const res = await request<{ following: boolean }>(
      `/api/users/following/${targetType}/${encodeURIComponent(targetId)}`
    );
    return !!res?.following;
  } catch {
    return false;
  }
}

export async function listFollowing(
  targetType?: FollowTargetType
): Promise<Array<{ targetType: string; targetId: string }>> {
  try {
    const qs = targetType ? `?targetType=${targetType}` : '';
    const res = await request<Array<{ targetType: string; targetId: string }>>(
      `/api/users/following${qs}`
    );
    return Array.isArray(res) ? res : [];
  } catch {
    return [];
  }
}

/**
 * The reader's follows resolved into displayable entries: label, detail, and a
 * link path.
 */
export async function listFollowingResolved(): Promise<
  Array<{ targetType: string; targetId: string; label: string; detail?: string; href?: string }>
> {
  try {
    const res = await request<
      Array<{
        targetType: string;
        targetId: string;
        label: string;
        detail?: string;
        href?: string;
      }>
    >('/api/users/following/resolved');
    return Array.isArray(res) ? res : [];
  } catch {
    return [];
  }
}

export async function listEvents(query?: string): Promise<Event[]> {
  try {
    const qs = query ? `?query=${encodeURIComponent(query)}` : '';
    const res = await request<Event[] | { data: Event[] }>(`/api/events${qs}`);
    return Array.isArray(res) ? res : res?.data || [];
  } catch {
    return [];
  }
}

export async function getEvent(id: string): Promise<Event | null> {
  try {
    return await request<Event>(`/api/events/${encodeURIComponent(id)}`);
  } catch {
    return null;
  }
}

export async function listEntities(query?: string): Promise<Entity[]> {
  try {
    const qs = query ? `?query=${encodeURIComponent(query)}` : '';
    const res = await request<Entity[] | { data: Entity[] }>(`/api/entities${qs}`);
    return Array.isArray(res) ? res : res?.data || [];
  } catch {
    return [];
  }
}

export async function getEntity(id: string): Promise<Entity | null> {
  try {
    return await request<Entity>(`/api/entities/${encodeURIComponent(id)}`);
  } catch {
    return null;
  }
}

export async function getTopic(slugOrId: string): Promise<Topic | null> {
  try {
    return await request<Topic>(`/api/topics/${encodeURIComponent(slugOrId)}`);
  } catch {
    return null;
  }
}
