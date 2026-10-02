/**
 * API Client — Auth, Sources, Publishers, Following, Events & Entities
 */
import type { Source, Publisher, PublisherProfile, Event, Entity, Topic } from '@ai-news/schemas';
import { request, setAuthToken } from './core';

// export for external use if needed
export { setAuthToken };

export interface AuthResponse {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    avatarUrl?: string;
  };
  token: string;
}

export async function loginUser(email: string, password: string): Promise<AuthResponse> {
  return request<AuthResponse>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export async function registerUser(
  name: string,
  email: string,
  password: string
): Promise<AuthResponse> {
  return request<AuthResponse>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ name, email, password }),
  });
}

export async function getCurrentUser(): Promise<AuthResponse['user'] | null> {
  try {
    return await request<AuthResponse['user']>('/api/auth/me');
  } catch {
    return null;
  }
}

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
  targetType: 'topic' | 'entity' | 'author' | 'source',
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
  targetType: 'topic' | 'entity' | 'author' | 'source',
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
  targetType: 'topic' | 'entity' | 'author' | 'source',
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
  targetType?: 'topic' | 'entity' | 'author' | 'source'
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
