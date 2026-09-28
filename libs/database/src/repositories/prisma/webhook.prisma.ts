import type { WebhookSubscription, WebhookDispatchLog } from '@ai-news/schemas';
import type { IWebhookRepository } from '../../interfaces/webhook.repository';
import { MemoryWebhookRepository } from '../memory/webhook.memory';

export class PrismaWebhookRepository implements IWebhookRepository {
  private fallbackMemory = new MemoryWebhookRepository();

  constructor(private readonly prismaGetter: () => Record<string, unknown>) {}

  private get prisma(): Record<string, unknown> {
    return this.prismaGetter();
  }

  private get webhookClient(): any {
    return (this.prisma as any).webhookSubscription;
  }

  async createSubscription(subscription: WebhookSubscription): Promise<WebhookSubscription> {
    if (!this.webhookClient) {
      return this.fallbackMemory.createSubscription(subscription);
    }
    try {
      const created = await this.webhookClient.create({
        data: {
          id: subscription.id,
          url: subscription.url,
          events: subscription.events,
          secret: subscription.secret,
          active: subscription.active,
          organizationId: subscription.organizationId,
          createdAt: new Date(subscription.createdAt),
          updatedAt: new Date(subscription.updatedAt),
        },
      });
      return {
        id: created.id,
        url: created.url,
        events: created.events,
        secret: created.secret,
        active: created.active,
        organizationId: created.organizationId,
        createdAt: created.createdAt instanceof Date ? created.createdAt.toISOString() : String(created.createdAt),
        updatedAt: created.updatedAt instanceof Date ? created.updatedAt.toISOString() : String(created.updatedAt),
      };
    } catch {
      return this.fallbackMemory.createSubscription(subscription);
    }
  }

  async listSubscriptions(orgId: string): Promise<WebhookSubscription[]> {
    if (!this.webhookClient) {
      return this.fallbackMemory.listSubscriptions(orgId);
    }
    try {
      const rows = await this.webhookClient.findMany({
        where: { organizationId: orgId, active: true },
      });
      return rows.map((r: any) => ({
        id: r.id,
        url: r.url,
        events: r.events,
        secret: r.secret,
        active: r.active,
        organizationId: r.organizationId,
        createdAt: r.createdAt instanceof Date ? r.createdAt.toISOString() : String(r.createdAt),
        updatedAt: r.updatedAt instanceof Date ? r.updatedAt.toISOString() : String(r.updatedAt),
      }));
    } catch {
      return this.fallbackMemory.listSubscriptions(orgId);
    }
  }

  async findSubscriptionById(id: string, orgId?: string): Promise<WebhookSubscription | null> {
    if (!this.webhookClient) {
      return this.fallbackMemory.findSubscriptionById(id, orgId);
    }
    try {
      const where: Record<string, unknown> = { id };
      if (orgId) where.organizationId = orgId;
      const row = await this.webhookClient.findFirst({ where });
      if (!row) return null;
      return {
        id: row.id,
        url: row.url,
        events: row.events,
        secret: row.secret,
        active: row.active,
        organizationId: row.organizationId,
        createdAt: row.createdAt instanceof Date ? row.createdAt.toISOString() : String(row.createdAt),
        updatedAt: row.updatedAt instanceof Date ? row.updatedAt.toISOString() : String(row.updatedAt),
      };
    } catch {
      return this.fallbackMemory.findSubscriptionById(id, orgId);
    }
  }

  async deleteSubscription(id: string, orgId?: string): Promise<boolean> {
    if (!this.webhookClient) {
      return this.fallbackMemory.deleteSubscription(id, orgId);
    }
    try {
      const where: Record<string, unknown> = { id };
      if (orgId) where.organizationId = orgId;
      await this.webhookClient.deleteMany({ where });
      return true;
    } catch {
      return this.fallbackMemory.deleteSubscription(id, orgId);
    }
  }

  async logDispatch(log: WebhookDispatchLog): Promise<WebhookDispatchLog> {
    return this.fallbackMemory.logDispatch(log);
  }

  async listDispatchLogs(subscriptionId: string): Promise<WebhookDispatchLog[]> {
    return this.fallbackMemory.listDispatchLogs(subscriptionId);
  }
}
