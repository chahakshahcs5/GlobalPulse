import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { FastifyInstance } from 'fastify';
import { buildServer } from '../../../apps/api/src/server';

describe('API Rate Limiting & Throttling Integration Tests', () => {
  let app: FastifyInstance;
  const originalMax = process.env.RATE_LIMIT_MAX;

  beforeAll(async () => {
    // Set a strict rate limit for testing threshold breaches
    process.env.RATE_LIMIT_MAX = '5';
    app = buildServer();
    await app.ready();
  });

  afterAll(async () => {
    if (originalMax !== undefined) {
      process.env.RATE_LIMIT_MAX = originalMax;
    } else {
      delete process.env.RATE_LIMIT_MAX;
    }
    await app.close();
  });

  it('allows requests within the configured rate limit threshold', async () => {
    const clientIp = '198.51.100.10';

    for (let i = 1; i <= 5; i++) {
      const res = await app.inject({
        method: 'GET',
        url: '/health',
        headers: { 'x-forwarded-for': clientIp },
      });
      expect(res.statusCode).toBe(200);
    }
  });

  it('returns HTTP 429 Too Many Requests when rate limit threshold is exceeded', async () => {
    const clientIp = '198.51.100.20';

    // Send 5 permitted requests
    for (let i = 1; i <= 5; i++) {
      const res = await app.inject({
        method: 'GET',
        url: '/health',
        headers: { 'x-forwarded-for': clientIp },
      });
      expect(res.statusCode).toBe(200);
    }

    // 6th request should be rejected by @fastify/rate-limit
    const rateLimitedRes = await app.inject({
      method: 'GET',
      url: '/health',
      headers: { 'x-forwarded-for': clientIp },
    });

    expect(rateLimitedRes.statusCode).toBe(429);
    const body = JSON.parse(rateLimitedRes.body);
    expect(body.status).toBe(429);
    expect(body.type).toBe('https://news.platform/errors/rate-limit-exceeded');
    expect(body.title).toBe('Too Many Requests');
    expect(body.detail).toContain('Rate limit of 5 requests exceeded');
  });

  it('isolates rate limits per client identity / token', async () => {
    const clientA = '198.51.100.30';
    const clientB = '198.51.100.31';

    // Exhaust client A's limit
    for (let i = 1; i <= 5; i++) {
      await app.inject({
        method: 'GET',
        url: '/health',
        headers: { 'x-forwarded-for': clientA },
      });
    }

    const resA = await app.inject({
      method: 'GET',
      url: '/health',
      headers: { 'x-forwarded-for': clientA },
    });
    expect(resA.statusCode).toBe(429);

    // Client B should still be accepted
    const resB = await app.inject({
      method: 'GET',
      url: '/health',
      headers: { 'x-forwarded-for': clientB },
    });
    expect(resB.statusCode).toBe(200);
  });
});
