import { beforeEach, describe, expect, it } from 'vitest';
import { DatabaseService } from '@ai-news/database';
import { PaywallService } from '@ai-news/stories';
import type { Story } from '@ai-news/schemas';

const ORG = 'org_paywall_test';
const NOW = new Date().toISOString();

function makeStory(overrides: Partial<Story> = {}): Story {
  return {
    id: 'sty_paywall',
    organizationId: ORG,
    slug: 'paywall-story',
    title: 'Paywall story',
    summary: 'Summary',
    status: 'PUBLISHED',
    articleType: 'investigation',
    currentVersionNumber: 1,
    topicIds: [],
    entityIds: [],
    sourceIds: [],
    categories: [],
    createdVia: 'api',
    createdByClient: 'human_web',
    authorId: 'usr_author',
    blocks: [
      {
        id: 'blk_1',
        blockType: 'paragraph',
        sortOrder: 0,
        data: { text: 'Premium body', format: 'plain' },
      } as Story['blocks'][number],
    ],
    isSubscriberOnly: true,
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  };
}

describe('PaywallService', () => {
  let db: DatabaseService;
  let service: PaywallService;

  beforeEach(async () => {
    db = new DatabaseService({ memory: true });
    service = new PaywallService(db);
    await db.users.create({
      id: 'usr_paywall_reader',
      organizationId: ORG,
      name: 'Reader',
      email: 'reader@paywall.test',
      role: 'reader',
      clientType: 'human_web',
      status: 'active',
      isSubscriber: false,
      createdAt: NOW,
      updatedAt: NOW,
    });
  });

  const principal = {
    id: 'usr_paywall_reader',
    organizationId: ORG,
    role: 'reader',
    scopes: ['news:read'],
  };

  it('locks subscriber-only stories and redacts their blocks', async () => {
    const story = makeStory();
    const access = await service.getAccess(principal, story);

    expect(access.isLocked).toBe(true);
    expect(access.reason).toBe('subscription_required');
    expect(service.redactIfLocked(story, access).blocks).toHaveLength(0);
  });

  it('unlocks the story for a subscriber', async () => {
    const story = makeStory();
    await db.users.update({
      ...(await db.users.findById('usr_paywall_reader'))!,
      isSubscriber: true,
    });

    const access = await service.getAccess(principal, story);
    expect(access.isLocked).toBe(false);
    expect(service.redactIfLocked(story, access).blocks).toHaveLength(1);
  });

  it('meters free reads server-side', async () => {
    const freeStory = makeStory({ id: 'sty_free', isSubscriberOnly: false });
    for (let i = 0; i < 5; i++) {
      await service.recordRead(principal, { ...freeStory, id: `sty_free_${i}` });
    }

    const access = await service.getAccess(principal, freeStory);
    expect(access.monthlyReads).toBe(5);
    expect(access.isLocked).toBe(true);
    expect(access.reason).toBe('metered_limit_reached');
  });
});
