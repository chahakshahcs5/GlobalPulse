import { describe, it, expect, beforeEach } from 'vitest';
import { DatabaseService } from '@ai-news/database';
import {
  AlertService,
  DeliveryService,
  InAppDeliveryTransport,
  PushDeliveryTransport,
  setRealtimeBroadcaster,
  StoryService,
} from '@ai-news/stories';
import type { RealtimeBroadcaster } from '@ai-news/stories';

const ORG = 'org_delivery_test';

describe('Delivery transports (§12)', () => {
  let db: DatabaseService;

  beforeEach(() => {
    db = new DatabaseService();
    setRealtimeBroadcaster(null);
  });

  it('persists an in-app delivery and reports it as delivered', async () => {
    const delivery = new DeliveryService(db);
    const outcome = await delivery.deliver(
      'in_app',
      { title: 'Heads up', message: 'A development was recorded.' },
      { userId: 'usr_reader' },
      { organizationId: ORG, actorId: 'usr_editor', clientType: 'human_web' }
    );

    expect(outcome.delivered).toBe(true);
    const notifications = await db.notifications.list(ORG);
    expect(notifications).toHaveLength(1);
    expect(notifications[0].authorId).toBe('usr_reader');
    expect(notifications[0].message).toBe('A development was recorded.');
  });

  it('pushes to the reader’s personal realtime channel', async () => {
    const published: Array<{ channel: string; event: string }> = [];
    const broadcaster: RealtimeBroadcaster = (channel, event) => {
      published.push({ channel, event });
    };
    setRealtimeBroadcaster(broadcaster);

    const delivery = new DeliveryService(db);
    const outcome = await delivery.deliver(
      'push',
      { title: 'Story update', message: 'A new development.' },
      { userId: 'usr_reader' },
      { organizationId: ORG, actorId: 'usr_editor', clientType: 'human_web' }
    );

    expect(outcome.delivered).toBe(true);
    expect(published).toEqual([{ channel: 'user_usr_reader', event: 'story_update' }]);
  });

  it('reports push as undelivered without a realtime broadcaster', async () => {
    const delivery = new DeliveryService(db);
    const outcome = await delivery.deliver(
      'push',
      { title: 'Story update', message: 'A new development.' },
      { userId: 'usr_reader' },
      { organizationId: ORG, actorId: 'usr_editor', clientType: 'human_web' }
    );

    expect(outcome.delivered).toBe(false);
  });

  it('delivers over every requested channel and reports each outcome', async () => {
    const delivery = new DeliveryService(db, {
      transports: [new InAppDeliveryTransport(db), new PushDeliveryTransport()],
    });

    const outcomes = await delivery.deliverAll(
      ['in_app', 'push', 'webhook'],
      { title: 'Alert', message: 'Something happened.' },
      { userId: 'usr_reader' },
      { organizationId: ORG, actorId: 'usr_editor', clientType: 'human_web' }
    );

    expect(outcomes.map((outcome) => outcome.channel)).toEqual(['in_app', 'push', 'webhook']);
    expect(outcomes[0].delivered).toBe(true);
    // No realtime broadcaster is configured in this test.
    expect(outcomes[1].delivered).toBe(false);
  });

  it('never throws when a transport fails', async () => {
    const delivery = new DeliveryService(db, {
      transports: [
        {
          channel: 'in_app',
          deliver: async () => {
            throw new Error('transport exploded');
          },
        },
      ],
    });

    const outcome = await delivery.deliver(
      'in_app',
      { title: 'Alert', message: 'Something happened.' },
      { userId: 'usr_reader' },
      { organizationId: ORG, actorId: 'usr_editor', clientType: 'human_web' }
    );

    expect(outcome.delivered).toBe(false);
    expect(outcome.detail).toContain('transport exploded');
  });

  it('delivers an alert over the channels the rule asked for', async () => {
    const published: string[] = [];
    setRealtimeBroadcaster((channel) => {
      published.push(channel);
    });

    const stories = new StoryService(db);
    const alerts = new AlertService(db);
    const ctx = {
      organizationId: ORG,
      actorId: 'usr_editor',
      clientType: 'human_web' as const,
    };

    const story = await stories.createStory(
      { title: 'Central bank raises rates', summary: 'A rate decision was announced.' },
      {
        organizationId: ORG,
        authorId: 'usr_reporter',
        clientType: 'human_web',
        createdVia: 'api',
      }
    );

    // A personal rule is pushed to its owner.
    await alerts.createRule(
      {
        name: 'My rate watch',
        scope: 'user',
        conditions: { keywords: ['central bank'] },
        channels: ['in_app', 'push'],
        cooldownMinutes: 0,
      },
      ctx
    );

    const result = await alerts.evaluate('STORY', story.id, ctx);

    expect(result.triggers).toHaveLength(1);
    expect(result.triggers[0].deliveredChannels).toContain('in_app');
    expect(result.triggers[0].deliveredChannels).toContain('push');
    expect(published).toContain('user_usr_editor');
  });

  it('does not push an organization-wide rule to a reader channel', async () => {
    const published: string[] = [];
    setRealtimeBroadcaster((channel) => {
      published.push(channel);
    });

    const stories = new StoryService(db);
    const alerts = new AlertService(db);
    const ctx = {
      organizationId: ORG,
      actorId: 'usr_editor',
      clientType: 'human_web' as const,
    };

    const story = await stories.createStory(
      { title: 'Central bank raises rates again', summary: 'Another rate decision.' },
      {
        organizationId: ORG,
        authorId: 'usr_reporter',
        clientType: 'human_web',
        createdVia: 'api',
      }
    );

    await alerts.createRule(
      {
        name: 'Newsroom rate watch',
        conditions: { keywords: ['central bank'] },
        channels: ['in_app', 'push'],
        cooldownMinutes: 0,
      },
      ctx
    );

    const result = await alerts.evaluate('STORY', story.id, ctx);

    expect(result.triggers[0].deliveredChannels).toContain('in_app');
    expect(result.triggers[0].deliveredChannels).not.toContain('push');
    expect(published).toHaveLength(0);
  });
});
