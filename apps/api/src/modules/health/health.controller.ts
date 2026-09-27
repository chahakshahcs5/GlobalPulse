import { Controller, Get, Res, HttpStatus } from '@nestjs/common';
import { db } from '@ai-news/database';
import { s3Storage } from '@ai-news/media';
import { FastifyReply } from 'fastify';

@Controller('health')
export class HealthController {
  @Get()
  async getHealth(@Res({ passthrough: true }) reply: FastifyReply) {
    const dbHealth = await db.getHealth();
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
          status: process.env.REDIS_URL ? 'configured' : 'standalone-fallback',
          url: process.env.REDIS_URL ? '[REDACTED]' : undefined,
        },
        storage: {
          status: 'online',
          bucket: s3Storage.getBucket(),
          provider: process.env.S3_ENDPOINT || process.env.MINIO_ENDPOINT ? 'minio-s3' : 'embedded-s3',
        },
      },
    };

    reply.status(isHealthy ? HttpStatus.OK : HttpStatus.SERVICE_UNAVAILABLE);
    return payload;
  }

  @Get('live')
  getLiveness() {
    return { status: 'alive', timestamp: new Date().toISOString() };
  }

  @Get('ready')
  async getReadiness(@Res({ passthrough: true }) reply: FastifyReply) {
    const dbHealth = await db.getHealth();
    const isReady = dbHealth.status !== 'error';

    reply.status(isReady ? HttpStatus.OK : HttpStatus.SERVICE_UNAVAILABLE);
    return { status: isReady ? 'ready' : 'unready', timestamp: new Date().toISOString() };
  }
}
