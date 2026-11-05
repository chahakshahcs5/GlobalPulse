import {
  BadRequestException,
  Body,
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { createHmac, timingSafeEqual } from 'crypto';
import { db } from '@ai-news/database';

interface BillingEvent {
  type: 'subscription.activated' | 'subscription.canceled';
  data?: {
    userId?: string;
    organizationId?: string;
  };
}

function verifySignature(payload: string, signature: string | undefined, secret: string): boolean {
  if (!signature) return false;
  const expected = createHmac('sha256', secret).update(payload).digest('hex');
  const provided = signature.startsWith('sha256=') ? signature.slice('sha256='.length) : signature;
  const a = Buffer.from(expected);
  const b = Buffer.from(provided);
  return a.length === b.length && timingSafeEqual(a, b);
}

/**
 * Payment-provider webhook.
 *
 * Entitlement is never granted by the browser. The provider signs the event
 * body, and only a valid signature can flip `User.isSubscriber`.
 */
@Controller('api/billing')
export class BillingController {
  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  async handleWebhook(
    @Body() body: BillingEvent,
    @Headers('x-billing-signature') signature?: string
  ) {
    const secret = process.env.BILLING_WEBHOOK_SECRET;
    if (!secret) {
      throw new ServiceUnavailableException('Billing webhook is not configured.');
    }

    const raw = JSON.stringify(body ?? {});
    if (!verifySignature(raw, signature, secret)) {
      throw new UnauthorizedException('Invalid billing webhook signature.');
    }

    if (body?.type !== 'subscription.activated' && body?.type !== 'subscription.canceled') {
      throw new BadRequestException('Unsupported billing event type.');
    }

    const userId = body.data?.userId;
    if (!userId) {
      throw new BadRequestException('Billing event is missing data.userId.');
    }

    const organizationId = body.data?.organizationId || process.env.DEFAULT_ORG_ID || 'org_default';
    const user = await db.users.findById(userId, organizationId);
    if (!user) {
      throw new BadRequestException('Billing event references an unknown user.');
    }

    await db.users.update({
      ...user,
      isSubscriber: body.type === 'subscription.activated',
    });

    return { received: true, type: body.type, userId };
  }
}
