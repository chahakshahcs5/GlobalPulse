import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { buildServer } from '../../../apps/api/src/server';
import { FastifyInstance } from 'fastify';
import { db } from '@ai-news/database';

describe('Deep Health Check Probes (/health, /health/live, /health/ready)', () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    app = buildServer({ logger: false });
    await app.ready();
  });

  afterEach(async () => {
    await app.close();
    vi.restoreAllMocks();
  });

  it('GET /health returns full deep diagnostic payload with latency and queue stats', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/health',
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);

    expect(body.status).toBe('healthy');
    expect(body.services).toBeDefined();

    // Database check
    expect(body.services.database).toBeDefined();
    expect(['connected', 'memory_fallback']).toContain(body.services.database.status);
    expect(typeof body.services.database.latencyMs).toBe('number');

    // Redis check
    expect(body.services.redis).toBeDefined();
    expect(body.services.redis.status).toBe('healthy');
    expect(typeof body.services.redis.latencyMs).toBe('number');
    expect(['redis', 'memory']).toContain(body.services.redis.mode);

    // Storage check
    expect(body.services.storage).toBeDefined();
    expect(body.services.storage.status).toBe('healthy');
    expect(typeof body.services.storage.latencyMs).toBe('number');

    // Queue metrics check
    expect(body.services.queue).toBeDefined();
    expect(body.services.queue.status).toBe('online');
    expect(typeof body.services.queue.queued).toBe('number');
    expect(typeof body.services.queue.total).toBe('number');

    // System metrics check
    expect(body.system).toBeDefined();
    expect(typeof body.system.memory.heapUsedMb).toBe('number');
    expect(typeof body.uptime).toBe('number');
  });

  it('GET /health/live returns lightweight liveness status for Kubernetes', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/health/live',
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.status).toBe('alive');
    expect(body.timestamp).toBeDefined();
  });

  it('GET /health/ready returns 200 and ready dependencies when all components operational', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/health/ready',
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.status).toBe('ready');
    expect(body.dependencies.database.ready).toBe(true);
    expect(body.dependencies.cache.ready).toBe(true);
    expect(body.dependencies.storage.ready).toBe(true);
  });

  it('GET /health/ready returns 503 Service Unavailable when DB is down', async () => {
    vi.spyOn(db, 'getHealth').mockResolvedValueOnce({
      status: 'error',
      engine: 'in_memory',
      databaseUrlConfigured: false,
      timestamp: new Date().toISOString(),
      latencyMs: 999,
    });

    const res = await app.inject({
      method: 'GET',
      url: '/health/ready',
    });

    expect(res.statusCode).toBe(503);
    const body = JSON.parse(res.body);
    expect(body.status).toBe('unready');
    expect(body.dependencies.database.ready).toBe(false);
  });
});
