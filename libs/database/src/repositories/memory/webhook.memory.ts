import type { WebhookSubscription, WebhookDispatchLog } from '@ai-news/schemas';
import type { IWebhookRepository } from '../../interfaces/webhook.repository';

export class MemoryWebhookRepository implements IWebhookRepository {
  private subscriptions = new Map<string, WebhookSubscription>();
  private logs: WebhookDispatchLog[] = [];

  async createSubscription(subscription: WebhookSubscription): Promise<WebhookSubscription> {
    this.subscriptions.set(subscription.id, { ...subscription });
    return { ...subscription };
  }

  async listSubscriptions(orgId: string): Promise<WebhookSubscription[]> {
    const list: WebhookSubscription[] = [];
    for (const sub of this.subscriptions.values()) {
      if (sub.organizationId === orgId && sub.active) {
        list.push({ ...sub });
      }
    }
    return list;
  }

  async findSubscriptionById(id: string, orgId?: string): Promise<WebhookSubscription | null> {
    const sub = this.subscriptions.get(id);
    if (!sub) return null;
    if (orgId && sub.organizationId !== orgId) return null;
    return { ...sub };
  }

  async deleteSubscription(id: string, orgId?: string): Promise<boolean> {
    const sub = this.subscriptions.get(id);
    if (!sub) return false;
    if (orgId && sub.organizationId !== orgId) return false;
    return this.subscriptions.delete(id);
  }

  async logDispatch(log: WebhookDispatchLog): Promise<WebhookDispatchLog> {
    this.logs.push({ ...log });
    return { ...log };
  }

  async listDispatchLogs(subscriptionId: string): Promise<WebhookDispatchLog[]> {
    return this.logs.filter((l) => l.subscriptionId === subscriptionId);
  }

  snapshot(): { subscriptions: Map<string, WebhookSubscription>; logs: WebhookDispatchLog[] } {
    return {
      subscriptions: new Map(this.subscriptions),
      logs: [...this.logs],
    };
  }

  restore(snap: { subscriptions: Map<string, WebhookSubscription>; logs: WebhookDispatchLog[] }): void {
    this.subscriptions = new Map(snap.subscriptions);
    this.logs = [...snap.logs];
  }

  clear(): void {
    this.subscriptions.clear();
    this.logs = [];
  }
}
