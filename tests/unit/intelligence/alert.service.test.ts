import { describe, it, expect, beforeEach } from 'vitest';
import { DatabaseService } from '@ai-news/database';
import { AlertService, StoryService } from '@ai-news/stories';

const ORG = 'org_alert_test';
const OTHER_ORG = 'org_alert_other';

describe('Alert Service (deterministic rule evaluation)', () => {
  let db: DatabaseService;
  let alerts: AlertService;
  let stories: StoryService;

  const ctx = {
    organizationId: ORG,
    actorId: 'usr_alerts',
    clientType: 'custom_mcp' as const,
  };

  beforeEach(() => {
    db = new DatabaseService();
    alerts = new AlertService(db);
    stories = new StoryService(db);
  });

  it('creates a rule with normalized conditions', async () => {
    const rule = await alerts.createRule(
      {
        name: 'Central bank coverage',
        conditions: { keywords: ['central bank'] },
        channels: ['in_app'],
        cooldownMinutes: 30,
      },
      ctx
    );

    expect(rule.id).toMatch(/^alr_/);
    expect(rule.enabled).toBe(true);
    expect(rule.cooldownMinutes).toBe(30);
    expect(rule.conditions.keywords).toEqual(['central bank']);
    expect(rule.conditions.entityIds).toEqual([]);
  });

  it('lists and updates rules per organization', async () => {
    const rule = await alerts.createRule(
      { name: 'Climate desk', conditions: { topicIds: ['top_climate'] } },
      ctx
    );

    const updated = await alerts.updateRule(
      rule.id,
      { name: 'Climate desk (priority)', enabled: false },
      ctx
    );
    expect(updated.name).toBe('Climate desk (priority)');
    expect(updated.enabled).toBe(false);

    const listed = await alerts.listRules(ORG);
    expect(listed).toHaveLength(1);
    expect(await alerts.listRules(OTHER_ORG)).toHaveLength(0);
    expect(await alerts.listRules(ORG, true)).toHaveLength(0);
  });

  it('triggers a matching rule and records why it fired', async () => {
    const story = await stories.createStory(
      {
        title: 'Central bank signals rate pause',
        summary: 'Officials indicated no further rate changes.',
      },
      {
        organizationId: ORG,
        authorId: 'usr_reporter',
        clientType: 'human_web',
        createdVia: 'api',
      }
    );

    await alerts.createRule(
      { name: 'Rate decisions', conditions: { keywords: ['central bank'] } },
      ctx
    );

    const result = await alerts.evaluate('STORY', story.id, ctx);

    expect(result.evaluatedRules).toBe(1);
    expect(result.triggers).toHaveLength(1);
    expect(result.triggers[0].matchedConditions).toContain('keywords');
    expect(result.triggers[0].deliveredChannels).toContain('in_app');
    expect(result.triggers[0].resourceId).toBe(story.id);

    const triggers = await alerts.listTriggers(ORG);
    expect(triggers).toHaveLength(1);
  });

  it('does not trigger when conditions are not met', async () => {
    const story = await stories.createStory(
      { title: 'Local council approves a park', summary: 'Council vote 12-4.' },
      {
        organizationId: ORG,
        authorId: 'usr_reporter',
        clientType: 'human_web',
        createdVia: 'api',
      }
    );

    await alerts.createRule(
      { name: 'Rate decisions', conditions: { keywords: ['central bank'] } },
      ctx
    );

    const result = await alerts.evaluate('STORY', story.id, ctx);
    expect(result.triggers).toHaveLength(0);
  });

  it('applies the cooldown between triggers', async () => {
    const story = await stories.createStory(
      { title: 'Central bank signals rate pause', summary: 'Officials spoke today.' },
      {
        organizationId: ORG,
        authorId: 'usr_reporter',
        clientType: 'human_web',
        createdVia: 'api',
      }
    );

    await alerts.createRule(
      {
        name: 'Rate decisions',
        conditions: { keywords: ['central bank'] },
        cooldownMinutes: 60,
      },
      ctx
    );

    const first = await alerts.evaluate('STORY', story.id, ctx);
    expect(first.triggers).toHaveLength(1);

    const second = await alerts.evaluate('STORY', story.id, ctx);
    expect(second.triggers).toHaveLength(0);
    expect(second.skipped).toHaveLength(1);
    expect(second.skipped[0].reason).toBe('cooldown');
  });

  it('requires every condition category to match', async () => {
    const story = await stories.createStory(
      {
        title: 'Central bank signals rate pause',
        summary: 'Officials spoke today.',
        topicIds: ['top_econ'],
      },
      {
        organizationId: ORG,
        authorId: 'usr_reporter',
        clientType: 'human_web',
        createdVia: 'api',
      }
    );

    await alerts.createRule(
      {
        name: 'Strict rule',
        conditions: { keywords: ['central bank'], topicIds: ['top_politics'] },
      },
      ctx
    );

    const result = await alerts.evaluate('STORY', story.id, ctx);
    expect(result.triggers).toHaveLength(0);
  });

  it('ignores disabled rules', async () => {
    const story = await stories.createStory(
      { title: 'Central bank signals rate pause', summary: 'Officials spoke today.' },
      {
        organizationId: ORG,
        authorId: 'usr_reporter',
        clientType: 'human_web',
        createdVia: 'api',
      }
    );

    const rule = await alerts.createRule(
      { name: 'Rate decisions', conditions: { keywords: ['central bank'] } },
      ctx
    );
    await alerts.updateRule(rule.id, { enabled: false }, ctx);

    const result = await alerts.evaluate('STORY', story.id, ctx);
    expect(result.evaluatedRules).toBe(0);
    expect(result.triggers).toHaveLength(0);
  });

  it('deletes rules and keeps other tenants untouched', async () => {
    const rule = await alerts.createRule(
      { name: 'Temp rule', conditions: { keywords: ['anything'] } },
      ctx
    );

    await alerts.deleteRule(rule.id, ctx);
    expect(await alerts.listRules(ORG)).toHaveLength(0);
  });
});
