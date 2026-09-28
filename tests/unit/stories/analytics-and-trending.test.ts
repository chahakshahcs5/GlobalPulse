import { describe, it, expect, beforeEach } from 'vitest';
import { DatabaseService } from '@ai-news/database';
import { StoryService, AnalyticsService } from '@ai-news/stories';

describe('Story Analytics & Trending Rankings (Unit Tests)', () => {
  let db: DatabaseService;
  let storyService: StoryService;
  let analyticsService: AnalyticsService;

  beforeEach(async () => {
    db = new DatabaseService({ memory: true });
    storyService = new StoryService(db);
    analyticsService = new AnalyticsService(db);
  });

  it('computes accurate reader metrics, estimated read time, and virality score', async () => {
    const story = await storyService.createStory(
      {
        title: 'Breakthrough in Room Temperature Superconductors',
        summary:
          'Researchers demonstrate stable levitation at ambient pressure and room temperature.',
        articleType: 'science',
        blocks: [
          {
            id: 'blk_1',
            blockType: 'paragraph',
            sortOrder: 0,
            data: {
              text: 'A collaborative group of condensed matter physicists announced reproducible measurements of zero electrical resistance under standard laboratory atmospheric conditions. Independent labs across North America and Europe are preparing validation protocols.',
              format: 'markdown',
            },
          },
        ],
      },
      {
        organizationId: 'org_test',
        authorId: 'usr_researcher',
        clientType: 'human_web',
      }
    );

    // Add readers engagement
    await db.engagement.toggleReaction(story.id, 'usr_reader_1', 'org_test', 'like');
    await db.engagement.toggleReaction(story.id, 'usr_reader_2', 'org_test', 'insightful');
    await db.engagement.toggleReaction(story.id, 'usr_reader_3', 'org_test', 'heart');

    await db.engagement.createComment({
      id: 'cmt_1',
      storyId: story.id,
      organizationId: 'org_test',
      authorId: 'usr_reader_1',
      authorName: 'Physics Enthusiast',
      authorRole: 'reader',
      content: 'Is this peer reviewed and verified by third party labs yet?',
      status: 'approved',
      likesCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const analytics = await analyticsService.getStoryAnalytics(story.id, 'org_test');

    expect(analytics.storyId).toBe(story.id);
    expect(analytics.title).toBe(story.title);
    expect(analytics.commentsCount).toBe(1);
    expect(analytics.reactionsCount).toBe(3);
    expect(analytics.viewsCount).toBeGreaterThan(0);
    expect(analytics.uniqueReaders).toBeGreaterThan(0);
    expect(analytics.avgReadTimeSeconds).toBeGreaterThan(0);
    expect(analytics.viralityScore).toBeGreaterThanOrEqual(5);
    expect(analytics.viralityScore).toBeLessThanOrEqual(100);
  });

  it('ranks published stories by virality velocity in trending list', async () => {
    // Story 1: high engagement
    const story1 = await storyService.createStory(
      {
        title: 'High Velocity Quantum Breakthrough',
        summary: 'Quantum computing milestone achieved.',
        articleType: 'technology',
      },
      { organizationId: 'org_test', authorId: 'usr_author', clientType: 'human_web' }
    );
    await storyService.addBlock(
      story1.id,
      { id: 'b1', blockType: 'paragraph', data: { text: 'Content details here.' }, sortOrder: 0 },
      { organizationId: 'org_test', authorId: 'usr_author', clientType: 'human_web' }
    );
    await storyService.reviewStory(
      story1.id,
      { action: 'approve' },
      { organizationId: 'org_test', authorId: 'usr_editor', clientType: 'human_web' }
    );

    // Story 2: standard story
    const story2 = await storyService.createStory(
      {
        title: 'Standard Weekly Business Roundup',
        summary: 'Stock indices hold steady.',
        articleType: 'business',
      },
      { organizationId: 'org_test', authorId: 'usr_author', clientType: 'human_web' }
    );
    await storyService.addBlock(
      story2.id,
      { id: 'b2', blockType: 'paragraph', data: { text: 'Market summary notes.' }, sortOrder: 0 },
      { organizationId: 'org_test', authorId: 'usr_author', clientType: 'human_web' }
    );
    await storyService.reviewStory(
      story2.id,
      { action: 'approve' },
      { organizationId: 'org_test', authorId: 'usr_editor', clientType: 'human_web' }
    );

    // Add massive reactions to Story 1
    for (let i = 1; i <= 5; i++) {
      await db.engagement.toggleReaction(story1.id, `usr_${i}`, 'org_test', 'like');
    }

    const trending = await analyticsService.getTrendingStories(10, 'org_test');
    expect(trending.length).toBeGreaterThanOrEqual(2);
    // Story 1 should rank higher than Story 2
    expect(trending[0].storyId).toBe(story1.id);
    expect(trending[0].reactionsCount).toBe(5);
  });

  it('aggregates newsroom metrics across active stories and categories', async () => {
    const metrics = await analyticsService.getNewsroomMetrics('org_test');
    expect(metrics).toBeDefined();
    expect(metrics.totalStories).toBeGreaterThanOrEqual(0);
    expect(metrics.generatedAt).toBeDefined();
  });
});
