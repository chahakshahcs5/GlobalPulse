import 'reflect-metadata';
import { FastifyInstance } from 'fastify';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { AppModule } from './nest/app.module';
import { createApp, AppOptions } from './app';
import { createLogger } from '@ai-news/observability';

const logger = createLogger('api-server');

export interface ApiServerOptions extends AppOptions {
  port?: number;
  host?: string;
}

/**
 * Builds and configures the production Fastify instance.
 * Preserves 100% backwards compatibility with test harnesses and consumers.
 */
export function buildServer(options: ApiServerOptions = {}): FastifyInstance {
  return createApp(options);
}

/**
 * Creates and initializes the full NestJS application instance on top of Fastify.
 */
export async function createNestApp(): Promise<NestFastifyApplication> {
  const fastifyInstance = buildServer();
  const adapter = new FastifyAdapter(fastifyInstance);

  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    adapter,
    { logger: false }
  );

  await app.init();
  return app;
}

/**
 * Starts the HTTP server listening on the specified port and host using NestJS.
 */
export async function startServer(options: ApiServerOptions = {}): Promise<NestFastifyApplication> {
  const port = options.port ?? parseInt(process.env.PORT || '4000', 10);
  const host = options.host ?? (process.env.HOST || '0.0.0.0');

  const app = await createNestApp();

  try {
    await app.listen(port, host);
    logger.info(`Enterprise News API Gateway (NestJS) listening at http://${host}:${port}`);
    return app;
  } catch (err: any) {
    logger.error(`Failed to start NestJS API Gateway: ${err.message}`, err);
    throw err;
  }
}
