import type {
  EditorialNotification,
  NotificationType,
  NotificationSeverity,
} from '@ai-news/schemas';
import type { INotificationRepository } from '../../interfaces/notification.repository';

interface PrismaNotificationRow {
  id: string;
  organizationId: string;
  authorId: string;
  type: string;
  severity?: string;
  title: string;
  message: string;
  storyId?: string | null;
  targetRole?: string | null;
  isRead: boolean;
  createdAt: Date;
}

export class PrismaNotificationRepository implements INotificationRepository {
  constructor(private readonly prismaGetter: () => Record<string, unknown>) {}

  private get prisma(): Record<string, unknown> {
    return this.prismaGetter();
  }

  private get notificationClient(): {
    create: (args: { data: Record<string, unknown> }) => Promise<PrismaNotificationRow>;
    update: (args: {
      where: Record<string, unknown>;
      data: Record<string, unknown>;
    }) => Promise<PrismaNotificationRow>;
    findUnique: (args: { where: Record<string, unknown> }) => Promise<PrismaNotificationRow | null>;
    findFirst: (args: { where: Record<string, unknown> }) => Promise<PrismaNotificationRow | null>;
    findMany: (args: {
      where?: Record<string, unknown>;
      take?: number;
      orderBy?: Record<string, unknown>;
    }) => Promise<PrismaNotificationRow[]>;
  } {
    return this.prisma.editorialNotification as any;
  }

  private mapToNotification(row: PrismaNotificationRow): EditorialNotification {
    return {
      id: row.id,
      organizationId: row.organizationId,
      authorId: row.authorId,
      type: row.type as NotificationType,
      severity: (row.severity as NotificationSeverity) || 'info',
      title: row.title,
      message: row.message,
      storyId: row.storyId || undefined,
      targetRole: row.targetRole || undefined,
      isRead: row.isRead,
      createdAt:
        row.createdAt instanceof Date ? row.createdAt.toISOString() : String(row.createdAt),
    };
  }

  async create(notification: EditorialNotification): Promise<EditorialNotification> {
    const row = await this.notificationClient.create({
      data: {
        id: notification.id,
        organizationId: notification.organizationId,
        authorId: notification.authorId,
        type: notification.type,
        severity: notification.severity,
        title: notification.title,
        message: notification.message,
        storyId: notification.storyId,
        targetRole: notification.targetRole,
        isRead: notification.isRead ?? false,
        createdAt: new Date(notification.createdAt),
      },
    });
    return this.mapToNotification(row);
  }

  async list(orgId?: string, limit = 50): Promise<EditorialNotification[]> {
    const where = orgId ? { organizationId: orgId } : undefined;
    const rows = await this.notificationClient.findMany({
      where,
      take: limit,
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((r) => this.mapToNotification(r));
  }

  async findById(id: string): Promise<EditorialNotification | null> {
    const row = await this.notificationClient.findUnique({
      where: { id },
    });
    return row ? this.mapToNotification(row) : null;
  }

  async markAsRead(id: string): Promise<boolean> {
    try {
      await this.notificationClient.update({
        where: { id },
        data: { isRead: true },
      });
      return true;
    } catch {
      return false;
    }
  }
}
