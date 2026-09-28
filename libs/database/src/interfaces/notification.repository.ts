import type { EditorialNotification } from '@ai-news/schemas';

export interface INotificationRepository {
  create(notification: EditorialNotification): Promise<EditorialNotification>;
  list(orgId?: string, limit?: number): Promise<EditorialNotification[]>;
  findById(id: string): Promise<EditorialNotification | null>;
  markAsRead(id: string): Promise<boolean>;
}
