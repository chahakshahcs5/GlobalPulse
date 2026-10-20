import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { FastifyInstance } from 'fastify';
import { buildServer } from '../../../apps/api/src/server';

describe('Localization — Regional Editions API (GET /api/editions)', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = buildServer({ logger: false });
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('lists all supported regional editions', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/editions' });
    expect(res.statusCode).toBe(200);
    const editions = JSON.parse(res.payload);
    expect(Array.isArray(editions)).toBe(true);
    expect(editions.length).toBeGreaterThanOrEqual(6);

    const codes = editions.map((e: { code: string }) => e.code);
    for (const expected of ['global', 'us', 'uk', 'eu', 'in', 'apac']) {
      expect(codes).toContain(expected);
    }
  });

  it('every edition exposes name, country, language, currency, and timezone', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/editions' });
    const editions = JSON.parse(res.payload);
    editions.forEach(
      (edition: {
        code: string;
        name: string;
        country: string;
        defaultLanguage: string;
        currency: string;
        timezone: string;
      }) => {
        expect(edition.name).toBeDefined();
        expect(edition.country).toBeDefined();
        expect(edition.defaultLanguage).toBeDefined();
        expect(edition.currency).toBeDefined();
        expect(edition.timezone).toBeDefined();
      }
    );
  });

  it('retrieves a single edition by code', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/editions/in' });
    expect(res.statusCode).toBe(200);
    const edition = JSON.parse(res.payload);
    expect(edition.code).toBe('in');
    expect(edition.currency).toBe('INR');
    expect(edition.timezone).toBe('Asia/Kolkata');
  });

  it('resolves edition codes case-insensitively', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/editions/UK' });
    expect(res.statusCode).toBe(200);
    const edition = JSON.parse(res.payload);
    expect(edition.code).toBe('uk');
    expect(edition.currency).toBe('GBP');
  });

  it('returns 404 for unsupported edition codes', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/editions/antarctica' });
    expect(res.statusCode).toBe(404);
    const body = JSON.parse(res.payload);
    expect(JSON.stringify(body)).toContain('not supported');
  });
});
