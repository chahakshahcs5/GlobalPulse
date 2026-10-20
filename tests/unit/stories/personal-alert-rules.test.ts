import { describe, it, expect, beforeEach } from 'vitest';
import { DatabaseService } from '@ai-news/database';
import { AlertService, StoryService, UserService } from '@ai-news/stories';

const ORG = 'org_personal_alerts';

describe('Per-user alert rules (§12)', () => {
  let db: DatabaseService;
  let alerts: AlertService;
  let stories: StoryService;

  const reader = {
    organizationId: ORG,
    actorId: 'usr_reader_alerts',
    clientType: 'human_web' as const,
  };

  const otherReader = {
    organizationId: ORG,
    actorId: 'usr_other_reader',
    clientType: 'human_web' as const,
  };

  beforeEach(() => {
    db = new DatabaseService();
    alerts = new AlertService(db);
    stories = new StoryService(db);
  });

  it('creates an organization-wide rule by default', async () => {
    const rule = await alerts.createRule(
      { name: 'Newsroom rule', conditions: { keywords: ['rates'] } },
      reader
    );

    expect(rule.scope).toBe('organization');
    expect(rule.userId).toBeUndefined();
  });

  it('creates a personal rule owned by the caller', async () => {
    const rule = await alerts.createRule(
      { name: 'My rule', scope: 'user', conditions: { keywords: ['rates'] } },
      reader
    );

    expect(rule.scope).toBe('user');
    expect(rule.userId).toBe('usr_reader_alerts');
  });

  it('shows a reader the newsroom rules plus their own', async () => {
    const orgRule = await alerts.createRule(
      { name: 'Newsroom rule', conditions: { keywords: ['rates'] } },
      reader
    );
    const personalRule = await alerts.createRule(
      { name: 'My rule', scope: 'user', conditions: { keywords: ['rates'] } },
      reader
    );
    const otherPersonal = await alerts.createRule(
      { name: 'Someone else’s rule', scope: 'user', conditions: { keywords: ['rates'] } },
      otherReader
    );

    const visible = await alerts.listRules(ORG, undefined, 'usr_reader_alerts');
    const ids = visible.map((rule) => rule.id);

    expect(ids).toContain(orgRule.id);
    expect(ids).toContain(personalRule.id);
    expect(ids).not.toContain(otherPersonal.id);
  });

  it('fires a personal rule only for its owner', async () => {
    const story = await stories.createStory(
      { title: 'Central bank raises rates', summary: 'A rate decision was announced.' },
      {
        organizationId: ORG,
        authorId: 'usr_reporter',
        clientType: 'human_web',
        createdVia: 'api',
      }
    );

    await alerts.createRule(
      {
        name: 'Personal rate watch',
        scope: 'user',
        conditions: { keywords: ['central bank'] },
        cooldownMinutes: 0,
      },
      reader
    );

    const ownerResult = await alerts.evaluate('STORY', story.id, reader);
    expect(ownerResult.triggers).toHaveLength(1);

    const otherResult = await alerts.evaluate('STORY', story.id, otherReader);
    expect(otherResult.triggers).toHaveLength(0);
  });

  it('moves a rule between the reader and the newsroom when the scope changes', async () => {
    const rule = await alerts.createRule(
      { name: 'Movable rule', scope: 'user', conditions: { keywords: ['rates'] } },
      reader
    );
    expect(rule.userId).toBe('usr_reader_alerts');

    const promoted = await alerts.updateRule(rule.id, { scope: 'organization' }, reader);
    expect(promoted.scope).toBe('organization');
    expect(promoted.userId).toBeUndefined();
  });

  it('resolves follows into displayable entries', async () => {
    const users = new UserService(db);
    const story = await stories.createStory(
      { title: 'Resolved story', summary: 'A story the reader follows.' },
      {
        organizationId: ORG,
        authorId: 'usr_reporter',
        clientType: 'human_web',
        createdVia: 'api',
      }
    );

    await users.followTarget('usr_reader_alerts', 'story', story.id);

    const resolved = await users.listFollowingResolved('usr_reader_alerts', ORG);

    expect(resolved).toHaveLength(1);
    expect(resolved[0].label).toBe('Resolved story');
    expect(resolved[0].href).toBe(`/stories/${story.slug}`);
    expect(resolved[0].detail).toBe('developing_story');
  });
});
