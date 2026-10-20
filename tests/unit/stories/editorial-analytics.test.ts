import { describe, it, expect, beforeEach } from 'vitest';
import { DatabaseService } from '@ai-news/database';
import { AnalyticsService, StoryIntelligenceService, StoryService } from '@ai-news/stories';

const ORG = 'org_analytics_test';

describe('Newsroom analytics — content, editorial and intelligence metrics (§43)', () => {
  let db: DatabaseService;
  let stories: StoryService;
  let analytics: AnalyticsService;
  let intelligence: StoryIntelligenceService;

  const ctx = {
    organizationId: ORG,
    actorId: 'usr_reporter',
    clientType: 'human_web' as const,
  };

  beforeEach(() => {
    db = new DatabaseService();
    stories = new StoryService(db);
    analytics = new AnalyticsService(db);
    intelligence = new StoryIntelligenceService(db);
  });

  it('reports zeroed editorial metrics when nothing is published', async () => {
    const metrics = await analytics.getNewsroomMetrics(ORG);

    expect(metrics.publishedStories).toBe(0);
    expect(metrics.storyVelocityPerDay).toBe(0);
    expect(metrics.avgDraftToPublishHours).toBe(0);
    expect(metrics.evidenceCoverage).toBe(0);
  });

  it('computes draft-to-publish time and source diversity', async () => {
    const story = await stories.createStory(
      {
        title: 'Published story',
        summary: 'A story that went live.',
        sourceIds: ['src_a', 'src_b'],
        entityIds: ['ent_a'],
      },
      {
        organizationId: ORG,
        authorId: 'usr_reporter',
        clientType: 'human_web',
        createdVia: 'api',
      }
    );

    // Publish the story two hours after creation.
    const published = { ...story, status: 'PUBLISHED' as const };
    published.createdAt = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
    published.publishedAt = new Date().toISOString();
    await db.stories.update(published);

    const metrics = await analytics.getNewsroomMetrics(ORG);

    expect(metrics.publishedStories).toBe(1);
    expect(metrics.avgDraftToPublishHours).toBeCloseTo(2, 0);
    expect(metrics.sourceDiversity).toBe(2);
    expect(metrics.entityActivity).toBe(1);
  });

  it('counts claims, evidence, coverage, and timeline activity', async () => {
    const story = await stories.createStory(
      { title: 'Story with intelligence', summary: 'Claims and evidence.' },
      {
        organizationId: ORG,
        authorId: 'usr_reporter',
        clientType: 'human_web',
        createdVia: 'api',
      }
    );
    await db.stories.update({
      ...story,
      status: 'PUBLISHED',
      publishedAt: new Date().toISOString(),
    });

    const claim = await intelligence.createClaim(
      story.id,
      { text: 'A verifiable claim.' },
      { ...ctx, clientType: 'custom_mcp' }
    );
    await intelligence.addEvidence(
      story.id,
      { claimId: claim.id, type: 'DOCUMENT', title: 'Document' },
      { ...ctx, clientType: 'custom_mcp' }
    );
    await intelligence.addTimelineEvent(
      story.id,
      { title: 'Development', description: 'Something happened.' },
      { ...ctx, clientType: 'custom_mcp' }
    );

    const metrics = await analytics.getNewsroomMetrics(ORG);

    expect(metrics.claimCount).toBe(1);
    expect(metrics.evidenceCount).toBe(1);
    expect(metrics.evidenceCoverage).toBe(1);
    expect(metrics.timelineEventCount).toBe(1);
  });

  it('reports the correction rate against published stories', async () => {
    const story = await stories.createStory(
      { title: 'Story with a correction', summary: 'Corrected later.' },
      {
        organizationId: ORG,
        authorId: 'usr_reporter',
        clientType: 'human_web',
        createdVia: 'api',
      }
    );
    await db.stories.update({
      ...story,
      status: 'PUBLISHED',
      publishedAt: new Date().toISOString(),
    });

    await db.sourceCorrections.create({
      id: 'cor_1',
      organizationId: ORG,
      type: 'CORRECTION',
      description: 'Corrected the figure.',
      issuedAt: new Date().toISOString(),
      recordedBy: 'usr_editor',
      createdAt: new Date().toISOString(),
    });

    const metrics = await analytics.getNewsroomMetrics(ORG);

    expect(metrics.correctionCount).toBe(1);
    expect(metrics.retractionCount).toBe(0);
    expect(metrics.correctionRate).toBe(1);
  });

  it('measures review time from the audit trail', async () => {
    const story = await stories.createStory(
      { title: 'Reviewed story', summary: 'Went through review.' },
      {
        organizationId: ORG,
        authorId: 'usr_reporter',
        clientType: 'human_web',
        createdVia: 'api',
      }
    );

    const submittedAt = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString();
    const approvedAt = new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString();

    await db.audit.log({
      id: 'aud_submit',
      organizationId: ORG,
      userId: 'usr_reporter',
      clientType: 'human_web',
      action: 'api.submit_for_review',
      resourceType: 'story',
      resourceId: story.id,
      timestamp: submittedAt,
      status: 'SUCCESS',
    });
    await db.audit.log({
      id: 'aud_approve',
      organizationId: ORG,
      userId: 'usr_editor',
      clientType: 'human_web',
      action: 'api.approve_story',
      resourceType: 'story',
      resourceId: story.id,
      timestamp: approvedAt,
      status: 'SUCCESS',
    });

    const metrics = await analytics.getNewsroomMetrics(ORG);

    expect(metrics.avgReviewTimeHours).toBeCloseTo(2, 0);
  });

  it('measures story velocity over the last seven days', async () => {
    for (let index = 0; index < 7; index += 1) {
      const story = await stories.createStory(
        { title: `Daily story ${index}`, summary: 'Published today.' },
        {
          organizationId: ORG,
          authorId: 'usr_reporter',
          clientType: 'human_web',
          createdVia: 'api',
        }
      );
      await db.stories.update({
        ...story,
        status: 'PUBLISHED',
        publishedAt: new Date().toISOString(),
      });
    }

    const metrics = await analytics.getNewsroomMetrics(ORG);

    expect(metrics.storyVelocityPerDay).toBe(1);
  });
});
