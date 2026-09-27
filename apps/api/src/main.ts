import dotenv from 'dotenv';
import { startServer } from './server';
import { db } from '@ai-news/database';
import { createLogger } from '@ai-news/observability';

dotenv.config();
const logger = createLogger('main');

const port = parseInt(process.env.PORT || '4000', 10);
const host = process.env.HOST || '0.0.0.0';

async function bootstrap() {
  logger.info('Initializing Database Engine...');
  await db.initialize();

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
      try {
        await app.close();
        logger.info('API Gateway closed successfully.');
        process.exit(0);
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        logger.error(`Error during shutdown: ${errorMsg}`, err instanceof Error ? err : new Error(errorMsg));
        process.exit(1);
      }
    });
  }
}

bootstrap().catch((err) => {
  logger.error(`Fatal bootstrap error: ${err.message}`, err);
  process.exit(1);
});
