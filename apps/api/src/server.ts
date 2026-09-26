import { FastifyInstance } from 'fastify';
import { createApp, AppOptions } from './app';
import { createLogger } from '@ai-news/observability';

const logger = createLogger('api-server');

export interface ApiServerOptions extends AppOptions {
  port?: number;
  host?: string;
}

/**
 * Builds and configures the production Fastify server instance.
 * Preserves backwards compatibility with test harnesses and consumers.
 */
export function buildServer(options: ApiServerOptions = {}): FastifyInstance {
  return createApp(options);
}

/**
 * Starts the HTTP server listening on the specified port and host.
 */
export async function startServer(options: ApiServerOptions = {}): Promise<FastifyInstance> {
  const port = options.port ?? parseInt(process.env.PORT || '4000', 10);
  const host = options.host ?? (process.env.HOST || '0.0.0.0');

  const app = buildServer(options);

  try {
    const address = await app.listen({ port, host });
    logger.info(`Enterprise News API Gateway listening at ${address}`);
    return app;
  } catch (err: any) {
    logger.error(`Failed to start API Gateway: ${err.message}`, err);
    throw err;
  }
}
