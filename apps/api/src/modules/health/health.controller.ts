import { FastifyReply, FastifyRequest } from 'fastify';
import { db } from '@ai-news/database';

export class HealthController {
  static async getHealth(request: FastifyRequest, reply: FastifyReply) {
    const dbHealth = await db.getHealth();
    const memoryUsage = process.memoryUsage();

    const isHealthy = dbHealth.connected || !db.isUsingPrisma(); // healthy in memory or connected prisma

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
          connected: dbHealth.connected,
        },
      },
    };

    return reply.status(isHealthy ? 200 : 503).send(payload);
  }

  static async getLiveness(request: FastifyRequest, reply: FastifyReply) {
    return reply.status(200).send({ status: 'alive', timestamp: new Date().toISOString() });
  }

  static async getReadiness(request: FastifyRequest, reply: FastifyReply) {
    const dbHealth = await db.getHealth();
    const ready = dbHealth.connected || !db.isUsingPrisma();
    return reply.status(ready ? 200 : 503).send({
      status: ready ? 'ready' : 'not_ready',
      database: dbHealth.status,
      timestamp: new Date().toISOString(),
    });
  }
}
