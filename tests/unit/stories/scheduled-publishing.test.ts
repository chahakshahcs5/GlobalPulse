import { describe, it, expect, beforeEach } from 'vitest';
import { DatabaseService } from '@ai-news/database';
import { StoryService, SchedulingService } from '@ai-news/stories';

describe('Scheduled Publishing & Embargoes (Unit Tests)', () => {
  let db: DatabaseService;
  let storyService: StoryService;
  let schedulingService: SchedulingService;

  beforeEach(() => {
    db = new DatabaseService({ memory: true });
    storyService = new StoryService(db);
    schedulingService = new SchedulingService(db);
  });

  it('schedules an approved story for future publication', async () => {
    const story = await storyService.createStory(
      {
        title: 'Embargoed Tech Launch: Next-Gen Neural Chip',
        summary: 'Global announcement under strict embargo until tomorrow.',
        articleType: 'technology',
        blocks: [
          {
            id: 'blk_1',
            blockType: 'paragraph',
            sortOrder: 0,
            data: { text: 'New architecture details revealed under NDA.' },
          },
        ],
      },
      {
        organizationId: 'org_test',
        authorId: 'usr_editor',
        clientType: 'human_web',
      }
    );

    const futureDate = new Date(Date.now() + 86400000).toISOString(); // 24h future
    const scheduled = await schedulingService.scheduleStory(story.id, futureDate, {
      organizationId: 'org_test',
      authorId: 'usr_editor',
      clientType: 'human_web',
    });

    expect(scheduled.status).toBe('SCHEDULED');
    expect(scheduled.scheduledPublishAt).toBe(futureDate);

    const list = await schedulingService.listScheduledStories('org_test');
    expect(list).toHaveLength(1);
    expect(list[0].id).toBe(story.id);
  });

  it('rejects scheduling if the timestamp is in the past', async () => {
    const story = await storyService.createStory(
      {
        title: 'Story with Invalid Time',
        summary: 'Cannot schedule in the past.',
        articleType: 'technology',
        blocks: [
          {
            id: 'b1',
            blockType: 'paragraph',
            sortOrder: 0,
            data: { text: 'Some content' },
          },
        ],
      },
      { organizationId: 'org_test', authorId: 'usr_editor', clientType: 'human_web' }
    );

    const pastDate = new Date(Date.now() - 3600000).toISOString();
    await expect(
      schedulingService.scheduleStory(story.id, pastDate, {
        organizationId: 'org_test',
        authorId: 'usr_editor',
        clientType: 'human_web',
      })
    ).rejects.toThrow(/Scheduled publication timestamp must be set in the future/i);
  });

  it('releases and publishes due stories when target time is reached', async () => {
    const story = await storyService.createStory(
      {
        title: 'Story Due to Publish',
        summary: 'Scheduled to publish immediately on trigger.',
        articleType: 'science',
        blocks: [
          {
            id: 'b1',
            blockType: 'paragraph',
            sortOrder: 0,
            data: { text: 'Content ready to go live.' },
          },
        ],
      },
      { organizationId: 'org_test', authorId: 'usr_editor', clientType: 'human_web' }
    );

    // Schedule story for future
    const futureDate = new Date(Date.now() + 2000).toISOString();
    await schedulingService.scheduleStory(story.id, futureDate, {
      organizationId: 'org_test',
      authorId: 'usr_editor',
      clientType: 'human_web',
    });

    // Manually backdate the scheduledPublishAt in DB to simulate clock ticking forward
    const storyInDb = (await db.stories.findById(story.id, 'org_test'))!;
    storyInDb.scheduledPublishAt = new Date(Date.now() - 1000).toISOString();
    await db.stories.update(storyInDb);

    // Run sweep
    const published = await schedulingService.publishDueStories('org_test');
    expect(published).toHaveLength(1);
    expect(published[0].id).toBe(story.id);
    expect(published[0].status).toBe('PUBLISHED');
    expect(published[0].publishedAt).toBeDefined();

    // Verify it is no longer in scheduled list
    const remainingScheduled = await schedulingService.listScheduledStories('org_test');
    expect(remainingScheduled).toHaveLength(0);
  });
});
