import type { CitizenTip } from '@ai-news/schemas';
import { request } from './core';

export interface SubmitCitizenTipInput {
  headline: string;
  details: string;
  category?: string;
  urgency?: 'routine' | 'elevated' | 'breaking';
  anonymityMode?: 'full_anonymous' | 'confidential_source';
  verificationChecksum: string;
  contactAlias?: string;
  attachments?: Array<{
    filename: string;
    mimeType: string;
    sizeBytes: number;
    checksumSha256: string;
  }>;
}

export async function submitCitizenTip(
  input: SubmitCitizenTipInput
): Promise<{ tip: CitizenTip; receiptToken: string }> {
  return request<{ tip: CitizenTip; receiptToken: string }>('/api/tips', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function listCitizenTips(
  filter: {
    status?: string;
    urgency?: string;
    category?: string;
    limit?: number;
  } = {}
): Promise<CitizenTip[]> {
  const query = new URLSearchParams();
  if (filter.status) query.set('status', filter.status);
  if (filter.urgency) query.set('urgency', filter.urgency);
  if (filter.category) query.set('category', filter.category);
  if (filter.limit) query.set('limit', String(filter.limit));
  const suffix = query.toString() ? `?${query.toString()}` : '';
  return request<CitizenTip[]>(`/api/tips${suffix}`);
}

export async function reviewCitizenTip(
  id: string,
  input: { status: string; editorialNotes?: string }
): Promise<CitizenTip> {
  return request<CitizenTip>(`/api/tips/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}
