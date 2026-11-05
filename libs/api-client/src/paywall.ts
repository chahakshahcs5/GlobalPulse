import { request } from './core';

export interface PaywallAccess {
  storyId?: string;
  isSubscriber: boolean;
  isNewsroom: boolean;
  monthlyReads: number;
  readLimit: number;
  isSubscriberOnly: boolean;
  isLocked: boolean;
  reason?: 'subscription_required' | 'metered_limit_reached';
}

export async function getPaywallAccess(storyId?: string): Promise<PaywallAccess> {
  return request<PaywallAccess>(
    storyId ? `/api/paywall/access/${encodeURIComponent(storyId)}` : '/api/paywall/me'
  );
}

export async function recordStoryRead(storyId: string): Promise<PaywallAccess> {
  return request<PaywallAccess>(`/api/paywall/read/${encodeURIComponent(storyId)}`, {
    method: 'POST',
  });
}

export async function setUserSubscription(userId: string, isSubscriber: boolean): Promise<unknown> {
  return request(`/api/users/${encodeURIComponent(userId)}/subscription`, {
    method: 'POST',
    body: JSON.stringify({ isSubscriber }),
  });
}
