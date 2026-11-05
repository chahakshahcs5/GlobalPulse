import type { DatabaseService } from '@ai-news/database';
import type { Story } from '@ai-news/schemas';

export const FREE_READ_LIMIT = 5;

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

export type PaywallPrincipal = {
  id: string;
  organizationId: string;
  role: string;
  scopes: string[];
};

function currentMonthKey(date = new Date()): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
}

/**
 * Server-side entitlement and metering.
 *
 * The reader's subscription flag and monthly read count live in the database,
 * not in localStorage: clearing site data, switching devices, or calling the
 * API directly must not reset the paywall.
 */
export class PaywallService {
  constructor(private readonly db: DatabaseService) {}

  private isNewsroom(principal: PaywallPrincipal): boolean {
    return (
      principal.role === 'admin' ||
      principal.role === 'editor' ||
      principal.role === 'journalist' ||
      principal.role === 'ai_agent' ||
      principal.scopes.includes('news:admin') ||
      principal.scopes.includes('news:write')
    );
  }

  async getAccess(principal: PaywallPrincipal, story?: Story): Promise<PaywallAccess> {
    const user = await this.db.users.findById(principal.id, principal.organizationId);
    const isSubscriber = Boolean(user?.isSubscriber);
    const isNewsroom = this.isNewsroom(principal);
    const monthlyReads = await this.db.storyReads.countDistinctStories(
      principal.id,
      currentMonthKey(),
      principal.organizationId
    );
    const isSubscriberOnly = Boolean(story?.isSubscriberOnly);

    if (isSubscriber || isNewsroom) {
      return {
        storyId: story?.id,
        isSubscriber,
        isNewsroom,
        monthlyReads,
        readLimit: FREE_READ_LIMIT,
        isSubscriberOnly,
        isLocked: false,
      };
    }

    if (isSubscriberOnly) {
      return {
        storyId: story?.id,
        isSubscriber,
        isNewsroom,
        monthlyReads,
        readLimit: FREE_READ_LIMIT,
        isSubscriberOnly,
        isLocked: true,
        reason: 'subscription_required',
      };
    }

    const isLocked = monthlyReads >= FREE_READ_LIMIT;
    return {
      storyId: story?.id,
      isSubscriber,
      isNewsroom,
      monthlyReads,
      readLimit: FREE_READ_LIMIT,
      isSubscriberOnly,
      isLocked,
      reason: isLocked ? 'metered_limit_reached' : undefined,
    };
  }

  /**
   * Record a free read. Subscriber-only stories never consume the free quota,
   * and subscribers/newsroom users are not metered.
   */
  async recordRead(principal: PaywallPrincipal, story: Story): Promise<PaywallAccess> {
    const access = await this.getAccess(principal, story);
    if (access.isSubscriber || access.isNewsroom || story.isSubscriberOnly) {
      return access;
    }
    if (access.isLocked) {
      return access;
    }

    await this.db.storyReads.recordRead({
      organizationId: principal.organizationId,
      userId: principal.id,
      storyId: story.id,
      monthKey: currentMonthKey(),
    });

    return this.getAccess(principal, story);
  }

  /**
   * Remove the body of a locked story. The client still gets the headline and
   * summary so it can render the paywall, but the premium blocks never leave
   * the server.
   */
  redactIfLocked(story: Story, access: PaywallAccess): Story {
    if (!access.isLocked) return story;
    return {
      ...story,
      blocks: [],
    };
  }

  async setSubscriber(
    userId: string,
    organizationId: string,
    isSubscriber: boolean
  ): Promise<void> {
    const user = await this.db.users.findById(userId, organizationId);
    if (!user) return;
    await this.db.users.update({ ...user, isSubscriber });
  }
}
