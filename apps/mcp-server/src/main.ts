import './env';

import { createMcpApp } from './server';
import { db, prismaManager } from '@ai-news/database';
import { createLogger } from '@ai-news/observability';

const logger = createLogger('mcp-main');
const port = parseInt(process.env.MCP_PORT || '4001', 10);
const host = process.env.MCP_HOST || '0.0.0.0';

async function start() {
  // Initialize database — connect to PostgreSQL if available, else in-memory
  logger.info('Initializing Database Engine for MCP Server...');
  await db.initialize();

  const { httpServer } = createMcpApp(db);
  httpServer.listen(port, host, () => {
    console.log(`🔌 Remote MCP Server listening on http://${host}:${port}/mcp`);
    console.log(
      `   Database Engine: ${db.isUsingPrisma() ? 'PostgreSQL (Prisma)' : 'In-Memory (shared with API if co-located)'}`
    );
    console.log(
      `   OAuth Protected Resource: http://${host}:${port}/.well-known/oauth-protected-resource`
    );
    console.log(`   Health check: http://${host}:${port}/health`);
  });

  const signals: NodeJS.Signals[] = ['SIGINT', 'SIGTERM', 'SIGBREAK'];
  let shuttingDown = false;
  for (const signal of signals) {
    process.once(signal, async () => {
      if (shuttingDown) return;
      shuttingDown = true;
      logger.info(`Received ${signal}. Shutting down MCP server...`);
      try {
        const closed = new Promise<void>((resolve, reject) => {
          httpServer.close((err) => (err ? reject(err) : resolve()));
        });
        // Do not wait forever for long-lived SSE streams.
        httpServer.closeAllConnections?.();
        await closed;
        await prismaManager.disconnect();
        process.exit(0);
      } catch (err: unknown) {
        logger.error(
          `Error during MCP shutdown: ${err instanceof Error ? err.message : String(err)}`
        );
        process.exit(1);
      }
    });
  }
}

start().catch((err) => {
  logger.error(`Fatal MCP bootstrap error: ${err.message}`, err);
  process.exit(1);
});
