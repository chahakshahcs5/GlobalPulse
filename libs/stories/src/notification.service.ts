import type { DatabaseService } from '@ai-news/database';
import type {
  EditorialNotification,
  NotificationSeverity,
  SendEditorialAlertInput,
} from '@ai-news/schemas';
import { generateId, NotFoundError } from '@ai-news/shared';
import type { StoryContext } from './story.service';
import { setRealtimeBroadcaster } from './realtime-bus';
import { DeliveryService } from './delivery.service';

export type NotificationBroadcaster = (channel: string, eventName: string, data: unknown) => void;
let _broadcaster: NotificationBroadcaster | null = null;

export function setNotificationBroadcaster(fn: NotificationBroadcaster): void {
  _broadcaster = fn;
  // The delivery transports publish on the same broker.
  setRealtimeBroadcaster(fn);
}

function broadcast(channel: string, eventName: string, data: unknown): void {
  if (_broadcaster) {
    try {
      _broadcaster(channel, eventName, data);
    } catch {
      // Ignored
    }
  }
}

export class NotificationService {
  constructor(private readonly db: DatabaseService) {}

  /**
   * Broadcasts a breaking news alert across real-time feeds and records it in notification history.
   */
  async broadcastBreakingNews(
    storyId: string,
    headline: string,
    urgency: NotificationSeverity = 'urgent',
    ctx: StoryContext
  ): Promise<EditorialNotification> {
    const story = await this.db.stories.findById(storyId, ctx.organizationId);
    if (!story) {
      throw new NotFoundError('Story', storyId);
    }

    const notification: EditorialNotification = {
      id: generateId('notif'),
      organizationId: ctx.organizationId,
      type: 'breaking_news',
      severity: urgency,
      title: '🚨 BREAKING NEWS',
      message: headline,
      storyId,
      authorId: ctx.authorId,
      isRead: false,
      createdAt: new Date().toISOString(),
    };

    const saved = await this.db.notifications.create(notification);

    await this.db.audit.log({
      id: generateId('aud'),
      organizationId: ctx.organizationId,
      userId: ctx.authorId,
      clientType: ctx.clientType,
      action: `${ctx.createdVia || 'mcp'}.broadcast_breaking_news`,
      resourceType: 'notification',
      resourceId: saved.id,
      payloadSummary: { storyId, headline, urgency },
      requestId: ctx.requestId,
      status: 'SUCCESS',
      timestamp: saved.createdAt,
    });

    broadcast('all', 'breaking_news', {
      notificationId: saved.id,
      storyId: story.id,
      slug: story.slug,
      headline,
      severity: urgency,
      timestamp: saved.createdAt,
    });

    return saved;
  }

  /**
   * Dispatches an internal newsroom editorial alert or fact-check flag.
   */
  async sendEditorialAlert(
    input: SendEditorialAlertInput,
    ctx: StoryContext
  ): Promise<EditorialNotification> {
    const notification: EditorialNotification = {
      id: generateId('notif'),
      organizationId: ctx.organizationId,
      type: input.storyId ? 'fact_check_flag' : 'editorial_alert',
      severity: input.severity,
      title: input.title,
      message: input.message,
      storyId: input.storyId,
      authorId: ctx.authorId,
      targetRole: input.targetRole,
      isRead: false,
      createdAt: new Date().toISOString(),
    };

    const saved = await this.db.notifications.create(notification);

    await this.db.audit.log({
      id: generateId('aud'),
      organizationId: ctx.organizationId,
      userId: ctx.authorId,
      clientType: ctx.clientType,
      action: `${ctx.createdVia || 'mcp'}.send_editorial_alert`,
      resourceType: 'notification',
      resourceId: saved.id,
      payloadSummary: { title: input.title, severity: input.severity, storyId: input.storyId },
      requestId: ctx.requestId,
      status: 'SUCCESS',
      timestamp: saved.createdAt,
    });

    broadcast('newsroom', 'editorial_alert', saved);

    return saved;
  }

  /**
   * Lists recent notifications for display in the CMS or notification center.
   */
  async listNotifications(
    orgId: string = 'org_default',
    limit = 50
  ): Promise<EditorialNotification[]> {
    return this.db.notifications.list(orgId, limit);
  }

  /**
   * Lists the notifications addressed to one reader. Reader notifications are
   * stored with the reader as the recipient (`authorId`), so a reader only
   * ever sees their own updates.
   */
  async listForUser(
    userId: string,
    orgId: string = 'org_default',
    limit = 50
  ): Promise<EditorialNotification[]> {
    return this.db.notifications.listForUser(userId, orgId, limit);
  }

  /**
   * Notifies the readers following a story (or its cluster) that a new
   * development was recorded.
   *
   * This closes the following loop: follow → development → notification. The
   * notification is addressed to the follower and pushed on their personal
   * realtime channel (`user_<id>`).
   */
  async notifyFollowersOfStory(
    storyId: string,
    development: { title: string; description?: string },
    ctx: StoryContext
  ): Promise<EditorialNotification[]> {
    const created: EditorialNotification[] = [];

    try {
      const followerIds = new Set<string>();

      for (const follower of await this.db.users.listFollowers('story', storyId)) {
        followerIds.add(follower.userId);
      }

      const cluster = await this.db.clusters.findByStoryId(storyId, ctx.organizationId);
      if (cluster) {
        for (const follower of await this.db.users.listFollowers('cluster', cluster.id)) {
          followerIds.add(follower.userId);
        }
      }

      // The actor does not need to be notified about their own development.
      followerIds.delete(ctx.authorId);
      if (followerIds.size === 0) return created;

      const story = await this.db.stories.findById(storyId, ctx.organizationId);
      const now = new Date().toISOString();
      const delivery = new DeliveryService(this.db);

      for (const followerId of followerIds) {
        const notification: EditorialNotification = {
          id: generateId('notif'),
          organizationId: ctx.organizationId,
          type: 'story_update',
          severity: 'info',
          title: story?.title ?? 'Story update',
          message: development.title,
          storyId,
          authorId: followerId,
          isRead: false,
          createdAt: now,
        };

        const saved = await this.db.notifications.create(notification);
        created.push(saved);

        // Live push on the reader's personal channel so the web/mobile client
        // can surface it without a refresh.
        await delivery.deliver(
          'push',
          {
            title: saved.title,
            message: saved.message,
            storyId,
            severity: 'info',
            eventType: 'story_update',
          },
          { userId: followerId },
          {
            organizationId: ctx.organizationId,
            actorId: ctx.authorId,
            clientType: ctx.clientType,
          }
        );
      }
    } catch {
      // Notification failures must never break an editorial write.
    }

    return created;
  }

  /**
   * Marks a notification as read.
   */
  async markAsRead(id: string): Promise<boolean> {
    return this.db.notifications.markAsRead(id);
  }
}
