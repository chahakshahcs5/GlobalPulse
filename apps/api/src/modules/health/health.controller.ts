import { Controller, Get, Res, HttpStatus } from '@nestjs/common';
import { db } from '@ai-news/database';
import { s3Storage } from '@ai-news/media';
import { defaultQueue } from '@ai-news/jobs';
import { cacheService } from '../../common/cache';
import { FastifyReply } from 'fastify';

@Controller(['health', 'api/health'])
export class HealthController {
  @Get()
  async getHealth(@Res({ passthrough: true }) reply: FastifyReply) {
    const [dbHealth, redisHealth, storageHealth] = await Promise.all([
      db.getHealth(),
      cacheService.ping(),
      s3Storage.checkHealth(),
    ]);

    const queueMetrics = defaultQueue.getMetrics();
    const memoryUsage = process.memoryUsage();
    const isHealthy = dbHealth.status !== 'error';

    const payload = {
      status: isHealthy ? 'healthy' : 'degraded',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      uptime: Math.floor(process.uptime()),
      system: {
        nodeVersion: process.version,
        platform: process.platform,
        memory: {
          rssMb: Math.round(memoryUsage.rss / 1024 / 1024),
          heapUsedMb: Math.round(memoryUsage.heapUsed / 1024 / 1024),
          heapTotalMb: Math.round(memoryUsage.heapTotal / 1024 / 1024),
        },
      },
      services: {
        database: {
          status: dbHealth.status,
          mode: db.isUsingPrisma() ? 'postgresql-prisma' : 'in-memory-engine',
          latencyMs: dbHealth.latencyMs,
          connected: dbHealth.status === 'connected' || dbHealth.status === 'memory_fallback',
        },
        redis: {
          status: redisHealth.status,
          mode: redisHealth.mode,
          latencyMs: redisHealth.latencyMs,
          connected: redisHealth.connected,
          configured: Boolean(process.env.REDIS_URL),
        },
        storage: {
          status: storageHealth.status,
          bucket: storageHealth.bucket,
          provider: storageHealth.provider,
          latencyMs: storageHealth.latencyMs,
        },
        queue: {
          status: 'online',
          queued: queueMetrics.queued,
          running: queueMetrics.running,
          completed: queueMetrics.completed,
          failed: queueMetrics.failed,
          total: queueMetrics.total,
        },
      },
    };

    reply.status(isHealthy ? HttpStatus.OK : HttpStatus.SERVICE_UNAVAILABLE);
    return payload;
  }

  @Get('live')
  getLiveness() {
    return {
      status: 'alive',
      timestamp: new Date().toISOString(),
      uptime: Math.floor(process.uptime()),
    };
  }

  @Get('ready')
  async getReadiness(@Res({ passthrough: true }) reply: FastifyReply) {
    const [dbHealth, redisHealth, storageHealth] = await Promise.all([
      db.getHealth(),
      cacheService.ping(),
      s3Storage.checkHealth(),
    ]);

    const isReady = dbHealth.status !== 'error' && storageHealth.status === 'healthy';

    reply.status(isReady ? HttpStatus.OK : HttpStatus.SERVICE_UNAVAILABLE);
    return {
      status: isReady ? 'ready' : 'unready',
      timestamp: new Date().toISOString(),
      dependencies: {
        database: {
          status: dbHealth.status,
          latencyMs: dbHealth.latencyMs,
          ready: dbHealth.status !== 'error',
        },
        cache: {
          status: redisHealth.status,
          mode: redisHealth.mode,
          latencyMs: redisHealth.latencyMs,
          ready: true,
        },
        storage: {
          status: storageHealth.status,
          latencyMs: storageHealth.latencyMs,
          ready: storageHealth.status === 'healthy',
        },
      },
    };

  }
}
