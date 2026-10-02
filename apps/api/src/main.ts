import dotenv from 'dotenv';
import { startServer } from './server';
import { db } from '@ai-news/database';
import { createLogger } from '@ai-news/observability';
import {
  setStoryBroadcaster,
  setEngagementBroadcaster,
  setNotificationBroadcaster,
  setSchedulingBroadcaster,
  SchedulingService,
} from '@ai-news/stories';
import { RealtimeService } from './modules/realtime/realtime.service';

dotenv.config();
const logger = createLogger('main');

const port = parseInt(process.env.PORT || '4000', 10);
const host = process.env.HOST || '0.0.0.0';

async function bootstrap() {
  logger.info('Initializing Database Engine...');
  await db.initialize();

  // Auto-seed in-memory or unseeded database so all stories, clusters, and fact-checks are live via API
  try {
    const existingStories = await db.stories.listPaginated({ limit: 1 }, 'org_default');
    if (existingStories.total === 0) {
      logger.info('Database empty; auto-seeding canonical enterprise records from seed.ts...');
      const { seedDatabase } = await import('@ai-news/database');
      await seedDatabase(db);
    }
  } catch (seedErr) {
    logger.warn(`Auto-seeding check notice: ${String(seedErr)}`);
  }

  // Wire SSE broadcasting: story, engagement, notification & scheduling events flow to connected clients
  const realtime = RealtimeService.getInstance();
  setStoryBroadcaster((channel, eventName, data) => {
    realtime.broadcast(channel, eventName, data);
  });
  setEngagementBroadcaster((channel, eventName, data) => {
    realtime.broadcast(channel, eventName, data);
  });
  setNotificationBroadcaster((channel, eventName, data) => {
    realtime.broadcast(channel, eventName, data);
  });
  setSchedulingBroadcaster((channel, eventName, data) => {
    realtime.broadcast(channel, eventName, data);
  });

  // Automated scheduled publishing — uses setInterval but with error isolation
  // and configurable interval. In production, this should be replaced with a
  // BullMQ repeatable job for distributed locking and crash resilience.
  const schedulingService = new SchedulingService(db);
  const schedulerIntervalMs = parseInt(process.env.SCHEDULER_INTERVAL_MS || '15000', 10);
  let schedulerRunning = false;

  const runScheduledPublishing = async () => {
    if (schedulerRunning) return; // Prevent overlapping runs
    schedulerRunning = true;
    try {
      const published = await schedulingService.publishDueStories('org_default');
      if (published.length > 0) {
        logger.info(`Automated scheduler released ${published.length} scheduled stories live.`);
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      logger.error(`Error in automated story scheduler: ${errorMsg}`);
    } finally {
      schedulerRunning = false;
    }
  };

  const schedulerTimer = setInterval(runScheduledPublishing, schedulerIntervalMs);

  const app = await startServer({ port, host });

  const banner = `
========================================================================
🚀 AI-OPERABLE ENTERPRISE NEWS PLATFORM - NESTJS API GATEWAY (PRODUCTION)
========================================================================
• Gateway URL:          http://${host}:${port}
• GraphQL API:          http://${host}:${port}/graphql
• GraphiQL IDE:         http://${host}:${port}/graphiql
• Health Check:         http://${host}:${port}/health
• OAuth 2.0 Discovery:  http://${host}:${port}/.well-known/oauth-protected-resource
• OpenAPI 3.1 Spec:     http://${host}:${port}/docs/openapi.json
• Real-time SSE Feed:   http://${host}:${port}/api/realtime/stream
• Database Engine:      ${db.isUsingPrisma() ? 'PostgreSQL (Prisma)' : 'High-Performance In-Memory Engine'}
========================================================================
`;
  console.log(banner);

  // Graceful shutdown handling
  const signals: NodeJS.Signals[] = ['SIGINT', 'SIGTERM'];
  for (const signal of signals) {
    process.on(signal, async () => {
      logger.info(`Received ${signal}. Initiating graceful shutdown...`);
      clearInterval(schedulerTimer);
      try {
        await app.close();
        logger.info('API Gateway closed successfully.');
        process.exit(0);
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        logger.error(
          `Error during shutdown: ${errorMsg}`,
          err instanceof Error ? err : new Error(errorMsg)
        );
        process.exit(1);
      }
    });
  }
}

bootstrap().catch((err) => {
  logger.error(`Fatal bootstrap error: ${err.message}`, err);
  process.exit(1);
});
