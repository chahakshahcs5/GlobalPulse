import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { CacheService } from '../../../apps/api/src/common/cache/cache.service';
import { buildServer } from '../../../apps/api/src/server';
import { FastifyInstance } from 'fastify';

describe('Production Caching Layer & HTTP Cache Headers', () => {
  let cache: CacheService;

  beforeEach(() => {
    cache = new CacheService();
  });

  afterEach(async () => {
    await cache.disconnect();
  });

  describe('CacheService (In-Memory & Redis Abstraction)', () => {
    it('sets, gets, and deletes values correctly', async () => {
      await cache.set('test:key1', { message: 'hello world', count: 42 });
      const retrieved = await cache.get<{ message: string; count: number }>('test:key1');
      expect(retrieved).not.toBeNull();
      expect(retrieved?.message).toBe('hello world');
      expect(retrieved?.count).toBe(42);

      await cache.del('test:key1');
      const afterDel = await cache.get('test:key1');
      expect(afterDel).toBeNull();
    });

    it('deletes keys by prefix', async () => {
      await cache.set('stories:1', { title: 'Story 1' });
      await cache.set('stories:2', { title: 'Story 2' });
      await cache.set('topics:1', { title: 'Topic 1' });

      await cache.delByPrefix('stories:');

      expect(await cache.get('stories:1')).toBeNull();
      expect(await cache.get('stories:2')).toBeNull();
      expect(await cache.get('topics:1')).not.toBeNull();
    });

    it('reports health and latency accurately', async () => {
      const health = await cache.ping();
      expect(health.status).toBe('healthy');
      expect(typeof health.latencyMs).toBe('number');
      expect(['redis', 'memory']).toContain(health.mode);
    });

    it('expires keys past TTL', async () => {
      // 1 second TTL
      await cache.set('short:lived', { data: 'temp' }, 1);
      const immediate = await cache.get('short:lived');
      expect(immediate).not.toBeNull();

      // Wait 1.1s
      await new Promise((r) => setTimeout(r, 1100));
      const expired = await cache.get('short:lived');
      expect(expired).toBeNull();
    });
  });

  describe('HTTP Cache Headers & ETag Validation', () => {
    let app: FastifyInstance;

    beforeEach(async () => {
      app = buildServer({ logger: false });
      await app.ready();
    });

    afterEach(async () => {
      await app.close();
    });

    it('attaches public Cache-Control and ETag headers to public GET endpoints', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/stories',
      });

      expect(res.statusCode).toBe(200);
      const cacheControl = res.headers['cache-control'];
      expect(cacheControl).toContain('public');
      expect(cacheControl).toContain('max-age=60');

      const etag = res.headers['etag'];
      expect(etag).toBeDefined();
      expect(typeof etag).toBe('string');
      expect(etag?.startsWith('W/"')).toBe(true);
    });

    it('responds with 304 Not Modified when If-None-Match matches ETag', async () => {
      const firstRes = await app.inject({
        method: 'GET',
        url: '/api/stories',
      });

      expect(firstRes.statusCode).toBe(200);
      const etag = firstRes.headers['etag'] as string;
      expect(etag).toBeDefined();

      const secondRes = await app.inject({
        method: 'GET',
        url: '/api/stories',
        headers: {
          'if-none-match': etag,
        },
      });

      expect(secondRes.statusCode).toBe(304);
      expect(secondRes.body).toBe('');
    });

    it('sets no-cache headers on review queue and private routes', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/stories/review-queue',
      });

      const cacheControl = res.headers['cache-control'];
      expect(cacheControl).toContain('no-cache');
      expect(cacheControl).toContain('no-store');
    });
  });
});
