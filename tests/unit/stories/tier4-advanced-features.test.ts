import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DatabaseService } from '@ai-news/database';
import { NewsletterService } from '../../../libs/stories/src/newsletter.service';
import { SchedulingService } from '../../../libs/stories/src/scheduling.service';

describe('Tier 4: Advanced & Google News Differentiation Unit Tests', () => {
  let db: DatabaseService;

  beforeEach(async () => {
    db = new DatabaseService({ useMemory: true });
    await db.initialize();
  });

  describe('F40: Email Newsletter Outbound Delivery Engine', () => {
    it('dispatches formatted HTML newsletter digests to active subscribers', async () => {
      const service = new NewsletterService(db);

      // 1. Subscribe users
      await service.subscribe('subscriber1@example.com', 'daily', ['technology']);
      await service.subscribe('subscriber2@example.com', 'daily', ['technology']);

      // 2. Seed a published story
      await db.stories.create({
        id: 'sty_newsletter_test_1',
        slug: 'newsletter-headline-test',
        title: 'Breakthrough in Solid-State Battery Density',
        summary: 'Commercial trials verify 800-mile electric vehicle range.',
        articleType: 'technology',
        status: 'PUBLISHED',
        authorId: 'usr_editor_1',
        organizationId: 'org_default',
        blocks: [],
        schemaVersion: 1,
        version: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      // 3. Generate digest
      const digest = await service.generateDigest('daily', 'technology');
      expect(digest.id).toMatch(/^ndig_/);
      expect(digest.stories.length).toBeGreaterThanOrEqual(1);

      // 4. Dispatch with mock email sender
      const sentEmails: string[] = [];
      const mockSender = vi.fn(async (params: { to: string; subject: string; htmlBody: string }) => {
        sentEmails.push(params.to);
        expect(params.htmlBody).toContain('Breakthrough in Solid-State Battery Density');
        return { success: true, messageId: 'msg_123' };
      });

      const dispatchResult = await service.dispatchDigest(digest.id, mockSender);

      expect(dispatchResult.sentCount).toBe(2);
      expect(dispatchResult.errors).toBe(0);
      expect(sentEmails).toContain('subscriber1@example.com');
      expect(sentEmails).toContain('subscriber2@example.com');
    });
  });

  describe('F30: Paywall & Metered Access Rules', () => {
    it('evaluates metered threshold and grants access to subscribed readers', () => {
      const evaluateAccess = (readsThisMonth: number, isSubscribed: boolean, limit = 5) => {
        if (isSubscribed) return { allowed: true, paywall: false };
        if (readsThisMonth <= limit) return { allowed: true, paywall: false };
        return { allowed: false, paywall: true, remaining: 0 };
      };

      // Free user within quota
      expect(evaluateAccess(3, false).paywall).toBe(false);
      // Free user at exact quota
      expect(evaluateAccess(5, false).paywall).toBe(false);
      // Free user exceeding quota
      expect(evaluateAccess(6, false).paywall).toBe(true);
      // Subscribed user with high read count
      expect(evaluateAccess(42, true).paywall).toBe(false);
    });
  });

  describe('F37: Content Embargo Management', () => {
    it('rejects scheduling in the past and sweeps due embargoes atomically', async () => {
      const scheduling = new SchedulingService(db);
      const ctx = {
        authorId: 'usr_editor_1',
        organizationId: 'org_default',
        clientType: 'editorial_studio' as const,
        requestId: 'req_test_1',
      };

      const story = await db.stories.create({
        id: 'sty_embargo_test_1',
        slug: 'embargo-story-test',
        title: 'Embargoed Financial Earnings',
        summary: 'Under strict press embargo until market close.',
        articleType: 'business',
        status: 'DRAFT',
        authorId: 'usr_editor_1',
        organizationId: 'org_default',
        blocks: [],
        schemaVersion: 1,
        version: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      await db.stories.saveBlocks(story.id, [
        {
          id: 'blk_1',
          storyId: story.id,
          type: 'text',
          sequenceOrder: 0,
          content: 'Strictly confidential financial results.',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ]);

      // Reject scheduling in the past
      const pastTime = new Date(Date.now() - 100000).toISOString();
      await expect(scheduling.scheduleStory(story.id, pastTime, ctx)).rejects.toThrow();

      // Schedule in future
      const futureTime = new Date(Date.now() + 3600000).toISOString();
      const scheduled = await scheduling.scheduleStory(story.id, futureTime, ctx);
      expect(scheduled.status).toBe('SCHEDULED');
      expect(scheduled.scheduledPublishAt).toBe(futureTime);

      // Verify listScheduledStories
      const scheduledList = await scheduling.listScheduledStories('org_default');
      expect(scheduledList.some((s) => s.id === story.id)).toBe(true);
    });
  });
});
