import type { DatabaseService } from '@ai-news/database';
import type {
  EditorialNotification,
  NotificationSeverity,
  SendEditorialAlertInput,
} from '@ai-news/schemas';
import { generateId, NotFoundError } from '@ai-news/shared';
import type { StoryContext } from './story.service';

export type NotificationBroadcaster = (channel: string, eventName: string, data: unknown) => void;
let _broadcaster: NotificationBroadcaster | null = null;

export function setNotificationBroadcaster(fn: NotificationBroadcaster): void {
  _broadcaster = fn;
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
  async listNotifications(orgId: string = 'org_default', limit = 50): Promise<EditorialNotification[]> {
    return this.db.notifications.list(orgId, limit);
  }

  /**
   * Marks a notification as read.
   */
  async markAsRead(id: string): Promise<boolean> {
    return this.db.notifications.markAsRead(id);
  }
}
