import type { WebhookSubscription, WebhookDispatchLog } from '@ai-news/schemas';

export interface IWebhookRepository {
  createSubscription(subscription: WebhookSubscription): Promise<WebhookSubscription>;
  listSubscriptions(orgId: string): Promise<WebhookSubscription[]>;
  findSubscriptionById(id: string, orgId?: string): Promise<WebhookSubscription | null>;
  deleteSubscription(id: string, orgId?: string): Promise<boolean>;
  logDispatch(log: WebhookDispatchLog): Promise<WebhookDispatchLog>;
  listDispatchLogs(subscriptionId: string): Promise<WebhookDispatchLog[]>;
}
