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

  /**
   * F40: Dispatches an email newsletter digest to all active subscribers.
   */
  async dispatchDigest(
    digestId: string,
    emailSender?: (params: {
      to: string;
      subject: string;
      htmlBody: string;
      textBody: string;
    }) => Promise<{ success: boolean; messageId?: string; error?: string }>
  ): Promise<{ sentCount: number; errors: number; logs: Array<{ email: string; success: boolean }> }> {
    const digest = await this.db.newsletters.getDigest(digestId);
    if (!digest) {
      throw new Error(`Newsletter digest with id "${digestId}" was not found`);
    }

    const subscriptions = await this.db.newsletters.listActiveSubscriptions(digest.frequency, digest.category);
    const activeSubs = subscriptions.filter((s) => s.active);

    const defaultSender = async () => ({
      success: true,
      messageId: `msg_${randomUUID().replace(/-/g, '').slice(0, 12)}`,
    });

    const sender = emailSender || defaultSender;
    let sentCount = 0;
    let errors = 0;
    const logs: Array<{ email: string; success: boolean }> = [];

    const htmlBody = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"/><title>${digest.headline}</title></head>
<body style="font-family: Arial, sans-serif; background-color: #f8fafc; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto; background: #ffffff; padding: 24px; border-radius: 12px; border: 1px solid #e2e8f0;">
    <h1 style="color: #0f172a; font-size: 22px;">${digest.headline}</h1>
    <p style="color: #64748b; font-size: 13px;">Curated GlobalPulse Intelligence Briefing • ${digest.date}</p>
    <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;"/>
    ${digest.stories
      .map(
        (s) => `
      <div style="margin-bottom: 20px;">
        <span style="font-size: 11px; font-weight: bold; color: #2563eb; text-transform: uppercase;">${s.category}</span>
        <h3 style="margin: 4px 0;"><a href="https://globalpulse.news${s.url}" style="color: #0f172a; text-decoration: none;">${s.title}</a></h3>
        <p style="color: #475569; font-size: 13px; line-height: 1.5;">${s.summary}</p>
      </div>`
      )
      .join('')}
  </div>
</body>
</html>`;

    for (const sub of activeSubs) {
      try {
        const res = await sender({
          to: sub.email,
          subject: digest.headline,
          htmlBody,
          textBody: `${digest.headline}\n\n${digest.stories.map((s) => `${s.title}: https://globalpulse.news${s.url}`).join('\n\n')}`,
        });

        if (res.success) {
          sentCount++;
          logs.push({ email: sub.email, success: true });
        } else {
          errors++;
          logs.push({ email: sub.email, success: false });
        }
      } catch {
        errors++;
        logs.push({ email: sub.email, success: false });
      }
    }

    return { sentCount, errors, logs };
  }
}
