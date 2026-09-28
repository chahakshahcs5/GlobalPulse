import type { NewsletterSubscription, NewsletterDigest } from '@ai-news/schemas';

export interface INewsletterRepository {
  subscribe(email: string, frequency: 'daily' | 'weekly', categories: string[]): Promise<NewsletterSubscription>;
  unsubscribe(email: string): Promise<boolean>;
  getSubscription(email: string): Promise<NewsletterSubscription | null>;
  listActiveSubscriptions(frequency?: 'daily' | 'weekly', category?: string): Promise<NewsletterSubscription[]>;
  saveDigest(digest: NewsletterDigest): Promise<NewsletterDigest>;
  getDigest(id: string): Promise<NewsletterDigest | null>;
  getLatestDigest(frequency?: 'daily' | 'weekly', category?: string): Promise<NewsletterDigest | null>;
}
