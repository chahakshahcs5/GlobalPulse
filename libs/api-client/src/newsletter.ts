import { request } from './core';

export async function getLatestDigest(
  frequency?: 'daily' | 'weekly',
  category?: string
): Promise<unknown> {
  const query = new URLSearchParams();
  if (frequency) query.set('frequency', frequency);
  if (category) query.set('category', category);
  const suffix = query.toString() ? `?${query.toString()}` : '';
  return request(`/api/newsletter/latest${suffix}`);
}

export async function dispatchNewsletter(digestId: string): Promise<{
  sentCount: number;
  errors: number;
  logs: Array<{ email: string; success: boolean }>;
}> {
  return request(`/api/newsletter/dispatch/${encodeURIComponent(digestId)}`, {
    method: 'POST',
  });
}
