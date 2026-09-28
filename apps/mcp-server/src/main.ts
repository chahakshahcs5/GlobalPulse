import dotenv from 'dotenv';
import { createMcpApp } from './server';
import { db } from '@ai-news/database';
import { createLogger } from '@ai-news/observability';

dotenv.config();

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
}

start().catch((err) => {
  logger.error(`Fatal MCP bootstrap error: ${err.message}`, err);
  process.exit(1);
});
