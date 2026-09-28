import type { NewsletterSubscription, NewsletterDigest } from '@ai-news/schemas';
import type { INewsletterRepository } from '../../interfaces/newsletter.repository';
import { MemoryNewsletterRepository } from '../memory/newsletter.memory';

export class PrismaNewsletterRepository implements INewsletterRepository {
  private fallbackMemory = new MemoryNewsletterRepository();

  constructor(private readonly prismaGetter: () => Record<string, unknown>) {}

  private get prisma(): Record<string, unknown> {
    return this.prismaGetter();
  }

  private get subscriptionClient(): any {
    return (this.prisma as any).newsletterSubscription;
  }

  private get digestClient(): any {
    return (this.prisma as any).newsletterDigest;
  }

  async subscribe(
    email: string,
    frequency: 'daily' | 'weekly' = 'daily',
    categories: string[] = []
  ): Promise<NewsletterSubscription> {
    if (!this.subscriptionClient) {
      return this.fallbackMemory.subscribe(email, frequency, categories);
    }
    try {
      const normalizedEmail = email.toLowerCase().trim();
      const existing = await this.subscriptionClient.findUnique({
        where: { email: normalizedEmail },
      });

      const now = new Date();
      if (existing) {
        const mergedCategories = Array.from(new Set([...(existing.categories as string[]), ...categories]));
        const updated = await this.subscriptionClient.update({
          where: { id: existing.id },
          data: {
            active: true,
            frequency,
            categories: mergedCategories,
            updatedAt: now,
          },
        });
        return {
          id: updated.id,
          email: updated.email,
          frequency: updated.frequency as 'daily' | 'weekly',
          categories: updated.categories as string[],
          active: updated.active,
          createdAt: updated.createdAt instanceof Date ? updated.createdAt.toISOString() : String(updated.createdAt),
          updatedAt: updated.updatedAt instanceof Date ? updated.updatedAt.toISOString() : String(updated.updatedAt),
        };
      }

      const id = `sub_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      const created = await this.subscriptionClient.create({
        data: {
          id,
          email: normalizedEmail,
          frequency,
          categories,
          active: true,
          createdAt: now,
          updatedAt: now,
        },
      });

      return {
        id: created.id,
        email: created.email,
        frequency: created.frequency as 'daily' | 'weekly',
        categories: created.categories as string[],
        active: created.active,
        createdAt: created.createdAt instanceof Date ? created.createdAt.toISOString() : String(created.createdAt),
        updatedAt: created.updatedAt instanceof Date ? created.updatedAt.toISOString() : String(created.updatedAt),
      };
    } catch {
      return this.fallbackMemory.subscribe(email, frequency, categories);
    }
  }

  async unsubscribe(email: string): Promise<boolean> {
    if (!this.subscriptionClient) {
      return this.fallbackMemory.unsubscribe(email);
    }
    try {
      const normalizedEmail = email.toLowerCase().trim();
      const existing = await this.subscriptionClient.findUnique({
        where: { email: normalizedEmail },
      });
      if (!existing) return false;

      await this.subscriptionClient.update({
        where: { id: existing.id },
        data: { active: false, updatedAt: new Date() },
      });
      return true;
    } catch {
      return this.fallbackMemory.unsubscribe(email);
    }
  }

  async getSubscription(email: string): Promise<NewsletterSubscription | null> {
    if (!this.subscriptionClient) {
      return this.fallbackMemory.getSubscription(email);
    }
    try {
      const row = await this.subscriptionClient.findUnique({
        where: { email: email.toLowerCase().trim() },
      });
      if (!row) return null;
      return {
        id: row.id,
        email: row.email,
        frequency: row.frequency as 'daily' | 'weekly',
        categories: row.categories as string[],
        active: row.active,
        createdAt: row.createdAt instanceof Date ? row.createdAt.toISOString() : String(row.createdAt),
        updatedAt: row.updatedAt instanceof Date ? row.updatedAt.toISOString() : String(row.updatedAt),
      };
    } catch {
      return this.fallbackMemory.getSubscription(email);
    }
  }

  async listActiveSubscriptions(
    frequency?: 'daily' | 'weekly',
    category?: string
  ): Promise<NewsletterSubscription[]> {
    if (!this.subscriptionClient) {
      return this.fallbackMemory.listActiveSubscriptions(frequency, category);
    }
    try {
      const where: Record<string, unknown> = { active: true };
      if (frequency) where.frequency = frequency;
      const rows = await this.subscriptionClient.findMany({ where });

      const mapped: NewsletterSubscription[] = rows.map((r: any) => ({
        id: r.id,
        email: r.email,
        frequency: r.frequency as 'daily' | 'weekly',
        categories: r.categories as string[],
        active: r.active,
        createdAt: r.createdAt instanceof Date ? r.createdAt.toISOString() : String(r.createdAt),
        updatedAt: r.updatedAt instanceof Date ? r.updatedAt.toISOString() : String(r.updatedAt),
      }));

      if (category) {
        return mapped.filter((s) => s.categories.length === 0 || s.categories.includes(category));
      }
      return mapped;
    } catch {
      return this.fallbackMemory.listActiveSubscriptions(frequency, category);
    }
  }

  async saveDigest(digest: NewsletterDigest): Promise<NewsletterDigest> {
    if (!this.digestClient) {
      return this.fallbackMemory.saveDigest(digest);
    }
    try {
      await this.digestClient.create({
        data: {
          id: digest.id,
          frequency: digest.frequency,
          date: digest.date,
          category: digest.category,
          headline: digest.headline,
          curatedStoryIds: digest.curatedStoryIds,
          stories: digest.stories,
          generatedAt: new Date(digest.generatedAt),
        },
      });
      return digest;
    } catch {
      return this.fallbackMemory.saveDigest(digest);
    }
  }

  async getDigest(id: string): Promise<NewsletterDigest | null> {
    if (!this.digestClient) {
      return this.fallbackMemory.getDigest(id);
    }
    try {
      const row = await this.digestClient.findUnique({ where: { id } });
      if (!row) return null;
      return {
        id: row.id,
        frequency: row.frequency as 'daily' | 'weekly',
        date: row.date,
        category: row.category || undefined,
        headline: row.headline,
        curatedStoryIds: row.curatedStoryIds as string[],
        stories: row.stories as any[],
        generatedAt: row.generatedAt instanceof Date ? row.generatedAt.toISOString() : String(row.generatedAt),
      };
    } catch {
      return this.fallbackMemory.getDigest(id);
    }
  }

  async getLatestDigest(
    frequency?: 'daily' | 'weekly',
    category?: string
  ): Promise<NewsletterDigest | null> {
    if (!this.digestClient) {
      return this.fallbackMemory.getLatestDigest(frequency, category);
    }
    try {
      const where: Record<string, unknown> = {};
      if (frequency) where.frequency = frequency;
      if (category) where.category = category;

      const row = await this.digestClient.findFirst({
        where,
        orderBy: { generatedAt: 'desc' },
      });
      if (!row) return null;
      return {
        id: row.id,
        frequency: row.frequency as 'daily' | 'weekly',
        date: row.date,
        category: row.category || undefined,
        headline: row.headline,
        curatedStoryIds: row.curatedStoryIds as string[],
        stories: row.stories as any[],
        generatedAt: row.generatedAt instanceof Date ? row.generatedAt.toISOString() : String(row.generatedAt),
      };
    } catch {
      return this.fallbackMemory.getLatestDigest(frequency, category);
    }
  }
}
