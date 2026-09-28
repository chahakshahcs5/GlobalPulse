import type { DatabaseService } from '@ai-news/database';
import type {
  NewsletterSubscription,
  NewsletterDigest,
  NewsletterDigestStory,
  Story,
} from '@ai-news/schemas';
import { randomUUID } from 'crypto';

export class NewsletterService {
  constructor(private readonly db: DatabaseService) {}

  /**
   * Subscribe an email address to a daily or weekly newsletter digest.
   */
  async subscribe(
    email: string,
    frequency: 'daily' | 'weekly' = 'daily',
    categories: string[] = []
  ): Promise<NewsletterSubscription> {
    if (!email || !email.includes('@')) {
      throw new Error('Valid email address is required');
    }
    return this.db.newsletters.subscribe(email, frequency, categories);
  }

  /**
   * Unsubscribe an email from newsletter digests.
   */
  async unsubscribe(email: string): Promise<boolean> {
    if (!email) {
      throw new Error('Email address is required');
    }
    return this.db.newsletters.unsubscribe(email);
  }

  /**
   * Get subscription status for an email.
   */
  async getSubscription(email: string): Promise<NewsletterSubscription | null> {
    return this.db.newsletters.getSubscription(email);
  }

  /**
   * Generate an automated newsletter digest by aggregating top published stories.
   */
  async generateDigest(
    frequency: 'daily' | 'weekly' = 'daily',
    category?: string,
    targetDate?: string,
    orgId: string = 'org_default'
  ): Promise<NewsletterDigest> {
    const dateStr = targetDate || new Date().toISOString().split('T')[0];

    // Fetch published stories from the repository
    const storiesResult = await this.db.stories.list(
      {
        status: 'PUBLISHED',
        limit: 50,
      },
      orgId
    );

    let eligibleStories: Story[] = storiesResult || [];

    // Filter by category if requested
    if (category) {
      const catLower = category.toLowerCase();
      eligibleStories = eligibleStories.filter((s: Story) => {
        const typeMatch = s.articleType ? s.articleType.toLowerCase() === catLower : false;
        const topics = s.topicIds ? s.topicIds.map((t: string) => t.toLowerCase()) : [];
        return typeMatch || topics.includes(catLower);
      });
    }

    // Select top 5-10 stories
    const curatedList = eligibleStories.slice(0, 10);
    const curatedStories: NewsletterDigestStory[] = curatedList.map((s: Story) => ({
      id: s.id,
      title: s.title,
      summary: s.summary,
      url: `/stories/${s.slug}`,
      category: s.articleType || (s.topicIds && s.topicIds[0]) || 'General',
      publishedAt: s.publishedAt || s.createdAt,
    }));

    const categoryTitle = category
      ? category.charAt(0).toUpperCase() + category.slice(1)
      : 'World News';
    const frequencyTitle = frequency === 'weekly' ? 'Weekly Briefing' : 'Daily Digest';
    const headline = `GlobalPulse ${frequencyTitle}: ${categoryTitle} - ${dateStr}`;

    const digest: NewsletterDigest = {
      id: `ndig_${randomUUID().replace(/-/g, '').slice(0, 12)}`,
      frequency,
      date: dateStr,
      category,
      headline,
      curatedStoryIds: curatedStories.map((s) => s.id),
      stories: curatedStories,
      generatedAt: new Date().toISOString(),
    };

    return this.db.newsletters.saveDigest(digest);
  }

  /**
   * Retrieve the latest generated digest.
   */
  async getLatestDigest(
    frequency?: 'daily' | 'weekly',
    category?: string
  ): Promise<NewsletterDigest | null> {
    return this.db.newsletters.getLatestDigest(frequency, category);
  }

  /**
   * Retrieve a specific digest by ID.
   */
  async getDigestById(id: string): Promise<NewsletterDigest | null> {
    return this.db.newsletters.getDigest(id);
  }
}
