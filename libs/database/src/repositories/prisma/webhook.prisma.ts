import type { WebhookSubscription, WebhookDispatchLog } from '@ai-news/schemas';
import type { IWebhookRepository } from '../../interfaces/webhook.repository';
import { MemoryWebhookRepository } from '../memory/webhook.memory';

interface PrismaWebhookRow {
  id: string;
  url: string;
  events: WebhookSubscription['events'];
  secret: string;
  active: boolean;
  organizationId: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export class PrismaWebhookRepository implements IWebhookRepository {
  private fallbackMemory = new MemoryWebhookRepository();

  constructor(private readonly prismaGetter: () => Record<string, unknown>) {}

  private get prisma(): Record<string, unknown> {
    return this.prismaGetter();
  }

  private get webhookClient():
    | {
        create: (args: { data: Record<string, unknown> }) => Promise<PrismaWebhookRow>;
        findMany: (args: { where: Record<string, unknown> }) => Promise<PrismaWebhookRow[]>;
        findFirst: (args: { where: Record<string, unknown> }) => Promise<PrismaWebhookRow | null>;
        delete: (args: { where: Record<string, unknown> }) => Promise<unknown>;
        deleteMany: (args: { where: Record<string, unknown> }) => Promise<unknown>;
      }
    | undefined {
    return (this.prisma as Record<string, unknown>)
      .webhookSubscription as typeof this.webhookClient;
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
        createdAt:
          created.createdAt instanceof Date
            ? created.createdAt.toISOString()
            : String(created.createdAt),
        updatedAt:
          created.updatedAt instanceof Date
            ? created.updatedAt.toISOString()
            : String(created.updatedAt),
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
      return rows.map((r) => ({
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
        createdAt:
          row.createdAt instanceof Date ? row.createdAt.toISOString() : String(row.createdAt),
        updatedAt:
          row.updatedAt instanceof Date ? row.updatedAt.toISOString() : String(row.updatedAt),
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

  private get dispatchLogClient():
    | {
        create: (args: { data: Record<string, unknown> }) => Promise<Record<string, unknown>>;
        findMany: (args: {
          where: Record<string, unknown>;
        }) => Promise<Array<Record<string, unknown>>>;
      }
    | undefined {
    return (this.prisma as Record<string, unknown>).webhookDispatchLog as
      | {
          create: (args: { data: Record<string, unknown> }) => Promise<Record<string, unknown>>;
          findMany: (args: {
            where: Record<string, unknown>;
          }) => Promise<Array<Record<string, unknown>>>;
        }
      | undefined;
  }

  async logDispatch(log: WebhookDispatchLog): Promise<WebhookDispatchLog> {
    const client = this.dispatchLogClient;
    if (!client) {
      return this.fallbackMemory.logDispatch(log);
    }
    try {
      const created = (await client.create({
        data: {
          id: log.id,
          subscriptionId: log.subscriptionId,
          event: log.event,
          targetUrl: '',
          payload: log.payload ?? {},
          statusCode: log.statusCode ?? 0,
          success: log.success,
          durationMs: 0,
          attempt: 1,
          errorMessage: log.error ?? null,
          dispatchedAt: new Date(log.timestamp),
        },
      })) as {
        id: string;
        subscriptionId: string;
        event: string;
        payload: unknown;
        statusCode: number;
        success: boolean;
        errorMessage: string | null;
        dispatchedAt: Date | string;
      };
      return {
        id: created.id,
        subscriptionId: created.subscriptionId,
        event: created.event as WebhookDispatchLog['event'],
        payload: (created.payload ?? {}) as WebhookDispatchLog['payload'],
        statusCode: created.statusCode,
        success: created.success,
        error: created.errorMessage || undefined,
        timestamp:
          created.dispatchedAt instanceof Date
            ? created.dispatchedAt.toISOString()
            : String(created.dispatchedAt),
      };
    } catch {
      return this.fallbackMemory.logDispatch(log);
    }
  }

  async listDispatchLogs(subscriptionId: string): Promise<WebhookDispatchLog[]> {
    const client = this.dispatchLogClient;
    if (!client) {
      return this.fallbackMemory.listDispatchLogs(subscriptionId);
    }
    try {
      const rows = await client.findMany({
        where: { subscriptionId },
      });
      return rows.map((row) => {
        const r = row as {
          id: string;
          subscriptionId: string;
          event: string;
          payload: unknown;
          statusCode: number;
          success: boolean;
          errorMessage: string | null;
          dispatchedAt: Date | string;
        };
        return {
          id: r.id,
          subscriptionId: r.subscriptionId,
          event: r.event as WebhookDispatchLog['event'],
          payload: (r.payload ?? {}) as WebhookDispatchLog['payload'],
          statusCode: r.statusCode,
          success: r.success,
          error: r.errorMessage || undefined,
          timestamp:
            r.dispatchedAt instanceof Date ? r.dispatchedAt.toISOString() : String(r.dispatchedAt),
        };
      });
    } catch {
      return this.fallbackMemory.listDispatchLogs(subscriptionId);
    }
  }
}
