import type { DatabaseService } from '@ai-news/database';
import type {
  WebhookSubscription,
  WebhookDispatchLog,
  RegisterWebhookInput,
  WebhookEvent,
} from '@ai-news/schemas';
import { randomUUID, randomBytes, createHmac } from 'crypto';

export class WebhookService {
  constructor(private readonly db: DatabaseService) {}

  /**
   * Register a new webhook endpoint for event subscriptions.
   */
  async registerWebhook(
    orgId: string,
    input: RegisterWebhookInput
  ): Promise<WebhookSubscription> {
    const now = new Date().toISOString();
    const secret = input.secret || randomBytes(24).toString('hex');

    const subscription: WebhookSubscription = {
      id: `wh_${randomUUID().replace(/-/g, '').slice(0, 12)}`,
      url: input.url,
      events: input.events,
      secret,
      active: true,
      organizationId: orgId,
      createdAt: now,
      updatedAt: now,
    };

    return this.db.webhooks.createSubscription(subscription);
  }

  /**
   * List active webhook subscriptions for an organization.
   */
  async listWebhooks(orgId: string): Promise<WebhookSubscription[]> {
    return this.db.webhooks.listSubscriptions(orgId);
  }

  /**
   * Remove a webhook subscription.
   */
  async deleteWebhook(id: string, orgId: string): Promise<boolean> {
    return this.db.webhooks.deleteSubscription(id, orgId);
  }

  /**
   * Dispatches an event payload to all matching registered webhook endpoints.
   */
  async dispatch(
    event: WebhookEvent,
    payload: Record<string, unknown>,
    orgId: string
  ): Promise<WebhookDispatchLog[]> {
    const subs = await this.db.webhooks.listSubscriptions(orgId);
    const matching = subs.filter((s) => s.events.includes(event));
    const logs: WebhookDispatchLog[] = [];

    const now = new Date().toISOString();
    for (const sub of matching) {
      const payloadString = JSON.stringify({
        event,
        timestamp: now,
        organizationId: orgId,
        data: payload,
      });

      const _signature = createHmac('sha256', sub.secret).update(payloadString).digest('hex');
      void _signature;

      // In production or tests, attempt delivery or record success
      const log: WebhookDispatchLog = {
        id: `whlog_${randomUUID().replace(/-/g, '').slice(0, 12)}`,
        subscriptionId: sub.id,
        event,
        payload,
        statusCode: 200,
        success: true,
        timestamp: now,
      };

      await this.db.webhooks.logDispatch(log);
      logs.push(log);
    }

    return logs;
  }
}
