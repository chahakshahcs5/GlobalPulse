import type { DatabaseService } from '@ai-news/database';
import type { Story } from '@ai-news/schemas';
import { NotFoundError, ValidationError, generateId } from '@ai-news/shared';
import type { StoryContext } from './story.service';

export type SchedulingBroadcaster = (channel: string, eventName: string, data: unknown) => void;
let _broadcaster: SchedulingBroadcaster | null = null;

export function setSchedulingBroadcaster(fn: SchedulingBroadcaster): void {
  _broadcaster = fn;
}

function broadcast(eventName: string, data: unknown): void {
  if (_broadcaster) {
    try {
      _broadcaster('all', eventName, data);
    } catch {
      // Ignored
    }
  }
}

export class SchedulingService {
  constructor(private readonly db: DatabaseService) {}

  /**
   * Schedules a story for automated publishing at a designated future timestamp.
   */
  async scheduleStory(storyId: string, publishAt: string, ctx: StoryContext): Promise<Story> {
    const targetTime = new Date(publishAt).getTime();
    if (isNaN(targetTime)) {
      throw new ValidationError('Invalid scheduled publication timestamp format. Must be valid ISO-8601.');
    }
    if (targetTime <= Date.now()) {
      throw new ValidationError('Scheduled publication timestamp must be set in the future.');
    }

    const story = await this.db.stories.findById(storyId, ctx.organizationId);
    if (!story) {
      throw new NotFoundError('Story', storyId);
    }

    const blocks = await this.db.stories.getBlocks(storyId);
    if (blocks.length === 0) {
      throw new ValidationError('Cannot schedule a story with zero content blocks.');
    }

    const now = new Date().toISOString();
    story.status = 'SCHEDULED';
    story.scheduledPublishAt = new Date(targetTime).toISOString();
    story.updatedAt = now;

    const saved = await this.db.runInTransaction(async () => {
      const res = await this.db.stories.update(story);

      await this.db.audit.log({
        id: generateId('aud'),
        organizationId: ctx.organizationId,
        userId: ctx.authorId,
        clientType: ctx.clientType,
        action: `${ctx.createdVia || 'mcp'}.schedule_story`,
        resourceType: 'story',
        resourceId: storyId,
        payloadSummary: { title: story.title, scheduledPublishAt: story.scheduledPublishAt },
        requestId: ctx.requestId,
        status: 'SUCCESS',
        timestamp: now,
      });

      return res;
    });

    broadcast('story.scheduled', {
      storyId: saved.id,
      title: saved.title,
      scheduledPublishAt: saved.scheduledPublishAt,
    });

    return saved;
  }

  /**
   * Lists all stories currently scheduled for future release.
   */
  async listScheduledStories(orgId: string = 'org_default'): Promise<Story[]> {
    const all = await this.db.stories.list({ status: 'SCHEDULED' }, orgId);
    return all.sort((a, b) => {
      const timeA = a.scheduledPublishAt ? new Date(a.scheduledPublishAt).getTime() : 0;
      const timeB = b.scheduledPublishAt ? new Date(b.scheduledPublishAt).getTime() : 0;
      return timeA - timeB;
    });
  }

  /**
   * Sweeps and publishes all scheduled stories whose target time has arrived.
   */
  async publishDueStories(orgId: string = 'org_default'): Promise<Story[]> {
    const scheduled = await this.db.stories.list({ status: 'SCHEDULED' }, orgId);
    const now = Date.now();
    const published: Story[] = [];

    for (const story of scheduled) {
      if (story.scheduledPublishAt && new Date(story.scheduledPublishAt).getTime() <= now) {
        const publishTimestamp = new Date().toISOString();
        story.status = 'PUBLISHED';
        story.publishedAt = publishTimestamp;
        story.updatedAt = publishTimestamp;

        const res = await this.db.runInTransaction(async () => {
          const updated = await this.db.stories.update(story);

          await this.db.audit.log({
            id: generateId('aud'),
            organizationId: orgId,
            userId: 'system_scheduler',
            clientType: 'internal_service',
            action: 'system.scheduled_publish',
            resourceType: 'story',
            resourceId: story.id,
            payloadSummary: { title: story.title, publishedAt: publishTimestamp },
            status: 'SUCCESS',
            timestamp: publishTimestamp,
          });

          return updated;
        });

        published.push(res);
        broadcast('story.published', {
          storyId: res.id,
          title: res.title,
          slug: res.slug,
          publishedAt: res.publishedAt,
        });
      }
    }

    return published;
  }
}
