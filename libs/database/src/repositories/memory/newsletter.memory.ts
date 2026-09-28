import type { NewsletterSubscription, NewsletterDigest } from '@ai-news/schemas';
import type { INewsletterRepository } from '../../interfaces/newsletter.repository';
import { randomUUID } from 'crypto';

export class MemoryNewsletterRepository implements INewsletterRepository {
  private subscriptions = new Map<string, NewsletterSubscription>(); // email -> subscription
  private digests = new Map<string, NewsletterDigest>(); // id -> digest

  async subscribe(
    email: string,
    frequency: 'daily' | 'weekly' = 'daily',
    categories: string[] = []
  ): Promise<NewsletterSubscription> {
    const normalizedEmail = email.toLowerCase().trim();
    const existing = this.subscriptions.get(normalizedEmail);
    const now = new Date().toISOString();

    if (existing) {
      existing.active = true;
      existing.frequency = frequency;
      existing.categories = Array.from(new Set([...existing.categories, ...categories]));
      existing.updatedAt = now;
      this.subscriptions.set(normalizedEmail, existing);
      return { ...existing };
    }

    const sub: NewsletterSubscription = {
      id: `sub_${randomUUID().replace(/-/g, '').slice(0, 12)}`,
      email: normalizedEmail,
      frequency,
      categories,
      active: true,
      createdAt: now,
      updatedAt: now,
    };
    this.subscriptions.set(normalizedEmail, sub);
    return { ...sub };
  }

  async unsubscribe(email: string): Promise<boolean> {
    const normalizedEmail = email.toLowerCase().trim();
    const sub = this.subscriptions.get(normalizedEmail);
    if (!sub) return false;
    sub.active = false;
    sub.updatedAt = new Date().toISOString();
    this.subscriptions.set(normalizedEmail, sub);
    return true;
  }

  async getSubscription(email: string): Promise<NewsletterSubscription | null> {
    const sub = this.subscriptions.get(email.toLowerCase().trim());
    return sub ? { ...sub } : null;
  }

  async listActiveSubscriptions(
    frequency?: 'daily' | 'weekly',
    category?: string
  ): Promise<NewsletterSubscription[]> {
    const list: NewsletterSubscription[] = [];
    for (const sub of this.subscriptions.values()) {
      if (!sub.active) continue;
      if (frequency && sub.frequency !== frequency) continue;
      if (category && sub.categories.length > 0 && !sub.categories.includes(category)) continue;
      list.push({ ...sub });
    }
    return list;
  }

  async saveDigest(digest: NewsletterDigest): Promise<NewsletterDigest> {
    this.digests.set(digest.id, { ...digest });
    return { ...digest };
  }

  async getDigest(id: string): Promise<NewsletterDigest | null> {
    const d = this.digests.get(id);
    return d ? { ...d } : null;
  }

  async getLatestDigest(
    frequency?: 'daily' | 'weekly',
    category?: string
  ): Promise<NewsletterDigest | null> {
    const all = Array.from(this.digests.values()).filter((d) => {
      if (frequency && d.frequency !== frequency) return false;
      if (category && d.category !== category) return false;
      return true;
    });

    if (all.length === 0) return null;
    all.sort((a, b) => new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime());
    return { ...all[0] };
  }

  snapshot(): { subscriptions: Map<string, NewsletterSubscription>; digests: Map<string, NewsletterDigest> } {
    return {
      subscriptions: new Map(this.subscriptions),
      digests: new Map(this.digests),
    };
  }

  restore(snap: { subscriptions: Map<string, NewsletterSubscription>; digests: Map<string, NewsletterDigest> }): void {
    this.subscriptions = new Map(snap.subscriptions);
    this.digests = new Map(snap.digests);
  }

  clear(): void {
    this.subscriptions.clear();
    this.digests.clear();
  }
}
