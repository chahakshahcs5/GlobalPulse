import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DatabaseService } from '@ai-news/database';
import { WebhookService, type WebhookHttpClient } from '../../../libs/stories/src/webhook.service';
import { createHmac } from 'crypto';

describe('Webhook Delivery Engine Unit Tests', () => {
  let db: DatabaseService;
  const orgId = 'org_enterprise_1';

  beforeEach(async () => {
    db = new DatabaseService({ memory: true });
    await db.initialize();
  });

  it('delivers webhook events with HMAC-SHA256 signature and event headers', async () => {
    let capturedUrl = '';
    let capturedHeaders: Record<string, string> = {};
    let capturedBody = '';

    const mockHttpClient: WebhookHttpClient = async (url, options) => {
      capturedUrl = url;
      capturedHeaders = options.headers;
      capturedBody = options.body;
      return { status: 200, ok: true };
    };

    const webhookService = new WebhookService(db, mockHttpClient);
    const sub = await webhookService.registerWebhook(orgId, {
      url: 'https://newsroom.example.org/hook',
      events: ['story.published'],
      secret: 'secret-key-12345',
    });

    const logs = await webhookService.dispatch(
      'story.published',
      { storyId: 'sty_test_999', title: 'Global Climate Summit' },
      orgId
    );

    expect(logs.length).toBe(1);
    expect(logs[0].success).toBe(true);
    expect(logs[0].statusCode).toBe(200);
    expect(capturedUrl).toBe('https://newsroom.example.org/hook');
    expect(capturedHeaders['Content-Type']).toBe('application/json');
    expect(capturedHeaders['X-GlobalPulse-Event']).toBe('story.published');
    expect(capturedHeaders['X-GlobalPulse-Delivery']).toMatch(/^del_/);
    expect(capturedHeaders['User-Agent']).toBe('GlobalPulse-Webhook-Engine/1.0');

    // Verify HMAC-SHA256 signature computation
    const expectedSig = createHmac('sha256', sub.secret).update(capturedBody).digest('hex');
    expect(capturedHeaders['X-GlobalPulse-Signature-256']).toBe(expectedSig);
  });

  it('retries with exponential backoff on transient 5xx errors and records failure log', async () => {
    let callCount = 0;
    const mockHttpClient: WebhookHttpClient = async () => {
      callCount++;
      return { status: 503, ok: false };
    };

    const webhookService = new WebhookService(db, mockHttpClient);
    await webhookService.registerWebhook(orgId, {
      url: 'https://flaky-server.example.org/hook',
      events: ['breaking_news.alert'],
    });

    const logs = await webhookService.dispatch(
      'breaking_news.alert',
      { storyId: 'sty_breaking_1' },
      orgId,
      { maxRetries: 2 }
    );

    expect(logs.length).toBe(1);
    expect(logs[0].success).toBe(false);
    expect(logs[0].statusCode).toBe(503);
    // Initial attempt + 2 retries = 3 calls
    expect(callCount).toBe(3);
  });

  it('filters out inactive webhook subscriptions or mismatched events', async () => {
    const mockHttpClient: WebhookHttpClient = vi.fn().mockResolvedValue({ status: 200, ok: true });
    const webhookService = new WebhookService(db, mockHttpClient);

    await webhookService.registerWebhook(orgId, {
      url: 'https://politics-only.example.org/hook',
      events: ['story.published'],
    });

    const logs = await webhookService.dispatch(
      'story.updated',
      { storyId: 'sty_updated_1' },
      orgId
    );

    expect(logs.length).toBe(0);
    expect(mockHttpClient).not.toHaveBeenCalled();
  });
});
