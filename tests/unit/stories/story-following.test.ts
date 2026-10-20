import { describe, it, expect, beforeEach } from 'vitest';
import { DatabaseService } from '@ai-news/database';
import {
  PersonalizationService,
  StoryIntelligenceService,
  StoryService,
  UserService,
} from '@ai-news/stories';
import { FollowTargetTypeSchema } from '@ai-news/schemas';

/**
 * Following an evolving story (§11): a reader follows a story, and when a new
 * article lands in the same cluster they keep following it — without having to
 * follow every new article.
 */
describe('Story and cluster following', () => {
  let db: DatabaseService;
  let users: UserService;
  let stories: StoryService;
  let personalization: PersonalizationService;

  const ORG = 'org_follow_test';
  const USER = 'usr_reader';

  async function createStory(title: string, summary: string) {
    return stories.createStory(
      { title, summary },
      {
        organizationId: ORG,
        authorId: 'usr_reporter',
        clientType: 'human_web',
        createdVia: 'api',
      }
    );
  }

  async function createCluster(id: string, leadStoryId: string, storyIds: string[]) {
    const now = new Date().toISOString();
    await db.clusters.create({
      id,
      organizationId: ORG,
      title: 'Northern Coast earthquake',
      summary: 'Ongoing coverage',
      leadStoryId,
      storyIds,
      perspectives: [],
      timeline: [],
      createdAt: now,
      updatedAt: now,
    });
  }

  beforeEach(() => {
    db = new DatabaseService();
    users = new UserService(db);
    stories = new StoryService(db);
    personalization = new PersonalizationService(db);
  });

  it('accepts story, cluster and event follow targets', () => {
    expect(FollowTargetTypeSchema.parse('story')).toBe('story');
    expect(FollowTargetTypeSchema.parse('cluster')).toBe('cluster');
    expect(FollowTargetTypeSchema.parse('event')).toBe('event');
    // Historic target types keep working.
    expect(FollowTargetTypeSchema.parse('topic')).toBe('topic');
    expect(FollowTargetTypeSchema.parse('entity')).toBe('entity');
    expect(FollowTargetTypeSchema.parse('author')).toBe('author');
    expect(FollowTargetTypeSchema.parse('source')).toBe('source');
  });

  it('stores and removes a story follow', async () => {
    const record = await users.followTarget(USER, 'story', 'sty_1');
    expect(record.targetType).toBe('story');
    expect(record.targetId).toBe('sty_1');

    expect(await users.isFollowing(USER, 'story', 'sty_1')).toBe(true);

    const removed = await users.unfollowTarget(USER, 'story', 'sty_1');
    expect(removed).toBe(true);
    expect(await users.isFollowing(USER, 'story', 'sty_1')).toBe(false);
  });

  it('keeps following the cluster when a new article joins it', async () => {
    const first = await createStory('Earthquake hits the coast', 'First report.');
    const second = await createStory('Earthquake aftershocks continue', 'Second report.');

    await createCluster('clu_quake', first.id, [first.id]);
    await users.followTarget(USER, 'story', first.id);

    let scope = await users.getFollowedStoryScope(USER, ORG);
    expect(scope.direct.has(first.id)).toBe(true);
    expect(scope.expanded.has(first.id)).toBe(true);
    expect(scope.expanded.has(second.id)).toBe(false);

    // A new article joins the cluster: the reader keeps following it.
    const cluster = await db.clusters.getById('clu_quake', ORG);
    await db.clusters.update({ ...cluster!, storyIds: [first.id, second.id] });

    scope = await users.getFollowedStoryScope(USER, ORG);
    expect(scope.direct.has(second.id)).toBe(false);
    expect(scope.expanded.has(second.id)).toBe(true);
  });

  it('follows every story of a directly followed cluster', async () => {
    const first = await createStory('Cluster story A', 'A.');
    const second = await createStory('Cluster story B', 'B.');

    await createCluster('clu_direct', first.id, [first.id, second.id]);
    await users.followTarget(USER, 'cluster', 'clu_direct');

    const scope = await users.getFollowedStoryScope(USER, ORG);
    expect(scope.expanded.has(first.id)).toBe(true);
    expect(scope.expanded.has(second.id)).toBe(true);
    expect(scope.direct.size).toBe(0);
  });

  it('boosts a followed story and a new cluster member in the personalized feed', async () => {
    const followed = await createStory('Story the reader follows', 'Followed.');
    const clusterMember = await createStory('New article in the followed cluster', 'Cluster.');
    const unrelated = await createStory('Unrelated story', 'Not followed.');

    for (const story of [followed, clusterMember, unrelated]) {
      await db.stories.update({
        ...story,
        status: 'PUBLISHED',
        publishedAt: new Date().toISOString(),
      });
    }

    await createCluster('clu_feed', followed.id, [followed.id, clusterMember.id]);
    await users.followTarget(USER, 'story', followed.id);

    const feed = await personalization.getPersonalizedFeedWithAttribution({
      userId: USER,
      organizationId: ORG,
      limit: 10,
    });

    const reasonsFor = (id: string) =>
      feed.items.find((item) => item.story.id === id)?.reasons ?? [];

    expect(reasonsFor(followed.id)).toContain('Following this story');
    expect(reasonsFor(clusterMember.id)).toContain('New update in a story you follow');
    expect(reasonsFor(unrelated.id)).not.toContain('Following this story');

    // The followed story outranks the unrelated one.
    const order = feed.items.map((item) => item.story.id);
    expect(order.indexOf(followed.id)).toBeLessThan(order.indexOf(unrelated.id));
  });

  it('lists follows by target type', async () => {
    await users.followTarget(USER, 'story', 'sty_a');
    await users.followTarget(USER, 'cluster', 'clu_a');
    await users.followTarget(USER, 'topic', 'top_a');

    expect(await users.listFollowing(USER)).toHaveLength(3);
    expect(await users.listFollowing(USER, 'story')).toHaveLength(1);
    expect(await users.listFollowing(USER, 'cluster')).toHaveLength(1);
  });

  it('notifies followers when a new development is recorded', async () => {
    const intelligence = new StoryIntelligenceService(db);
    const story = await createStory('Story with a follower', 'Followed by a reader.');

    await createCluster('clu_notify', story.id, [story.id]);
    await users.followTarget(USER, 'story', story.id);

    await intelligence.addTimelineEvent(
      story.id,
      {
        title: 'Rescue teams on site',
        description: 'Emergency services reached the affected district.',
        eventType: 'DEVELOPMENT',
      },
      { organizationId: ORG, actorId: 'usr_reporter', clientType: 'human_web' }
    );

    const notifications = await db.notifications.list(ORG);
    const update = notifications.find(
      (notification) => notification.type === 'story_update' && notification.storyId === story.id
    );

    expect(update).toBeDefined();
    expect(update?.authorId).toBe(USER);
    expect(update?.message).toBe('Rescue teams on site');
  });

  it('notifies cluster followers about developments in a cluster member', async () => {
    const intelligence = new StoryIntelligenceService(db);
    const followed = await createStory('The story a reader follows', 'Followed.');
    const clusterMember = await createStory('New article in the cluster', 'Cluster.');

    await createCluster('clu_notify_cluster', followed.id, [followed.id, clusterMember.id]);
    await users.followTarget(USER, 'cluster', 'clu_notify_cluster');

    await intelligence.addTimelineEvent(
      clusterMember.id,
      {
        title: 'Cluster development',
        description: 'A development inside the followed cluster.',
        eventType: 'DEVELOPMENT',
      },
      { organizationId: ORG, actorId: 'usr_reporter', clientType: 'human_web' }
    );

    const notifications = await db.notifications.list(ORG);
    expect(
      notifications.some(
        (notification) =>
          notification.type === 'story_update' &&
          notification.storyId === clusterMember.id &&
          notification.authorId === USER
      )
    ).toBe(true);
  });
});
