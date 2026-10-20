import type { DatabaseService } from '@ai-news/database';
import type { ClientType } from '@ai-news/schemas';
import { generateId } from '@ai-news/shared';
import { WebhookService } from './webhook.service';
import { broadcastRealtime } from './realtime-bus';

/**
 * Delivery transports (§12).
 *
 * Alert rules and reader notifications declare the channels they want
 * (`in_app`, `push`, `email`, `webhook`). Each channel is implemented as a
 * transport, so a rule that asks for `webhook` is actually delivered over
 * HTTP with an HMAC signature instead of only being recorded.
 *
 * Nothing here requires an LLM or an external provider: the transports use
 * the platform's own notification store, realtime broker, and webhook engine.
 * The email transport takes an injectable sender (the platform never assumes
 * a particular ESP).
 */

export type DeliveryChannel = 'in_app' | 'email' | 'push' | 'webhook';

export interface DeliveryMessage {
  title: string;
  message: string;
  storyId?: string;
  severity?: 'info' | 'warning' | 'urgent';
  eventType?: string;
  data?: Record<string, unknown>;
}

export interface DeliveryTarget {
  /** Reader the message is addressed to (in_app and push). */
  userId?: string;
  /** Optional email address for the email transport. */
  email?: string;
}

export interface DeliveryContext {
  organizationId: string;
  actorId: string;
  clientType: ClientType;
}

export interface DeliveryOutcome {
  channel: DeliveryChannel;
  delivered: boolean;
  detail?: string;
}

export type EmailSender = (params: {
  to: string;
  subject: string;
  htmlBody: string;
  textBody: string;
}) => Promise<{ success: boolean; messageId?: string; error?: string }>;

export interface DeliveryTransport {
  readonly channel: DeliveryChannel;
  deliver(
    message: DeliveryMessage,
    target: DeliveryTarget,
    ctx: DeliveryContext
  ): Promise<DeliveryOutcome>;
}

/** Persists the message in the notification store. */
export class InAppDeliveryTransport implements DeliveryTransport {
  readonly channel: DeliveryChannel = 'in_app';

  constructor(private readonly db: DatabaseService) {}

  async deliver(
    message: DeliveryMessage,
    target: DeliveryTarget,
    ctx: DeliveryContext
  ): Promise<DeliveryOutcome> {
    const recipient = target.userId ?? ctx.actorId;
    const saved = await this.db.notifications.create({
      id: generateId('notif'),
      organizationId: ctx.organizationId,
      type: message.eventType === 'story_update' ? 'story_update' : 'editorial_alert',
      severity: message.severity ?? 'info',
      title: message.title,
      message: message.message,
      storyId: message.storyId,
      authorId: recipient,
      isRead: false,
      createdAt: new Date().toISOString(),
    });
    return { channel: this.channel, delivered: true, detail: saved.id };
  }
}

/**
 * Live push on the reader's personal realtime channel (`user_<id>`).
 *
 * This is the platform's push transport: the web and mobile clients subscribe
 * to their own channel and receive the event immediately.
 */
export class PushDeliveryTransport implements DeliveryTransport {
  readonly channel: DeliveryChannel = 'push';

  async deliver(
    message: DeliveryMessage,
    target: DeliveryTarget,
    _ctx: DeliveryContext
  ): Promise<DeliveryOutcome> {
    if (!target.userId) {
      return { channel: this.channel, delivered: false, detail: 'no recipient' };
    }
    const delivered = broadcastRealtime(`user_${target.userId}`, 'story_update', {
      title: message.title,
      message: message.message,
      storyId: message.storyId,
      severity: message.severity,
      data: message.data,
      timestamp: new Date().toISOString(),
    });
    return {
      channel: this.channel,
      delivered,
      detail: delivered ? 'broadcast' : 'no realtime broadcaster configured',
    };
  }
}

/** Outbound HTTP POST with an HMAC signature, using the webhook engine. */
export class WebhookDeliveryTransport implements DeliveryTransport {
  readonly channel: DeliveryChannel = 'webhook';

  constructor(private readonly webhooks: WebhookService) {}

  async deliver(
    message: DeliveryMessage,
    _target: DeliveryTarget,
    ctx: DeliveryContext
  ): Promise<DeliveryOutcome> {
    const logs = await this.webhooks.dispatch(
      'alert.triggered',
      {
        title: message.title,
        message: message.message,
        storyId: message.storyId,
        severity: message.severity,
        ...(message.data ?? {}),
      },
      ctx.organizationId
    );

    const delivered = logs.some((log) => log.success);
    return {
      channel: this.channel,
      delivered,
      detail: delivered ? `${logs.length} endpoint(s)` : 'no endpoint accepted the delivery',
    };
  }
}

/** Email delivery through an injectable sender (no provider is assumed). */
export class EmailDeliveryTransport implements DeliveryTransport {
  readonly channel: DeliveryChannel = 'email';

  constructor(private readonly sender: EmailSender) {}

  async deliver(
    message: DeliveryMessage,
    target: DeliveryTarget,
    _ctx: DeliveryContext
  ): Promise<DeliveryOutcome> {
    if (!target.email) {
      return { channel: this.channel, delivered: false, detail: 'no email address' };
    }
    const result = await this.sender({
      to: target.email,
      subject: message.title,
      htmlBody: `<p><strong>${escapeHtml(message.title)}</strong></p><p>${escapeHtml(
        message.message
      )}</p>`,
      textBody: `${message.title}\n\n${message.message}`,
    });
    return {
      channel: this.channel,
      delivered: result.success,
      detail: result.success ? result.messageId : result.error,
    };
  }
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Routes a message to the transports a rule asked for.
 */
export class DeliveryService {
  private readonly transports: Map<DeliveryChannel, DeliveryTransport>;

  constructor(
    db: DatabaseService,
    options: { emailSender?: EmailSender; transports?: DeliveryTransport[] } = {}
  ) {
    const transports = options.transports ?? [
      new InAppDeliveryTransport(db),
      new PushDeliveryTransport(),
      new WebhookDeliveryTransport(new WebhookService(db)),
      new EmailDeliveryTransport(
        options.emailSender ??
          (async () => ({
            success: false,
            error: 'no email sender is configured for this deployment',
          }))
      ),
    ];
    this.transports = new Map(transports.map((transport) => [transport.channel, transport]));
  }

  async deliver(
    channel: DeliveryChannel,
    message: DeliveryMessage,
    target: DeliveryTarget,
    ctx: DeliveryContext
  ): Promise<DeliveryOutcome> {
    const transport = this.transports.get(channel);
    if (!transport) {
      return { channel, delivered: false, detail: 'no transport registered' };
    }
    try {
      return await transport.deliver(message, target, ctx);
    } catch (err) {
      const detail = err instanceof Error ? err.message : String(err);
      return { channel, delivered: false, detail };
    }
  }

  /**
   * Delivers over every requested channel and returns the outcomes.
   * Delivery failures are reported, never thrown: an alert must not break the
   * operation that triggered it.
   */
  async deliverAll(
    channels: DeliveryChannel[],
    message: DeliveryMessage,
    target: DeliveryTarget,
    ctx: DeliveryContext
  ): Promise<DeliveryOutcome[]> {
    const outcomes: DeliveryOutcome[] = [];
    for (const channel of channels) {
      outcomes.push(await this.deliver(channel, message, target, ctx));
    }
    return outcomes;
  }
}
