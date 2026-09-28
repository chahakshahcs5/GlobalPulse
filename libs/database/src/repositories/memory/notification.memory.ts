import type { EditorialNotification } from '@ai-news/schemas';
import type { INotificationRepository } from '../../interfaces/notification.repository';

export class MemoryNotificationRepository implements INotificationRepository {
  private notifications = new Map<string, EditorialNotification>();

  async create(notification: EditorialNotification): Promise<EditorialNotification> {
    this.notifications.set(notification.id, { ...notification });
    return { ...notification };
  }

  async list(orgId?: string, limit = 50): Promise<EditorialNotification[]> {
    let all = Array.from(this.notifications.values());
    if (orgId) {
      all = all.filter((n) => n.organizationId === orgId);
    }
    // Sort descending by creation time
    all.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return all.slice(0, limit).map((n) => ({ ...n }));
  }

  async findById(id: string): Promise<EditorialNotification | null> {
    const notif = this.notifications.get(id);
    return notif ? { ...notif } : null;
  }

  async markAsRead(id: string): Promise<boolean> {
    const notif = this.notifications.get(id);
    if (!notif) return false;
    notif.isRead = true;
    return true;
  }

  snapshot(): Map<string, EditorialNotification> {
    return new Map(Array.from(this.notifications.entries()).map(([k, v]) => [k, { ...v }]));
  }

  restore(snap: Map<string, EditorialNotification>): void {
    this.notifications = new Map(Array.from(snap.entries()).map(([k, v]) => [k, { ...v }]));
  }

  clear(): void {
    this.notifications.clear();
  }
}
