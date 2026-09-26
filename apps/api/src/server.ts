import 'reflect-metadata';
import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { AppModule } from './app.module';
import { Rfc7807ExceptionFilter } from './common/rfc7807.filter';
import { requestLoggerPlugin } from './common/middleware/request-logger';
import { appConfig } from './config/configuration';
import { createLogger } from '@ai-news/observability';

const logger = createLogger('api-server');

export interface ApiServerOptions {
  port?: number;
  host?: string;
  logger?: boolean;
}

/**
 * Builds and configures the production Fastify instance powered by NestJS.
 * Preserves 100% compatibility with test harnesses and Fastify injection.
 */
export function buildServer(options: ApiServerOptions = {}): FastifyInstance {
  const fastify = Fastify({ logger: options.logger ?? false });

  fastify.register(cors, {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-request-id', 'x-client-id'],
  });

  fastify.register(requestLoggerPlugin);

  // Hook NestJS bootstrap into fastify.ready()
  const adapter = new FastifyAdapter(fastify);
  const nestPromise = NestFactory.create<NestFastifyApplication>(AppModule, adapter, {
    logger: ['error', 'warn'],
    abortOnError: false,
  })
    .then(async (nestApp) => {
      nestApp.useGlobalFilters(new Rfc7807ExceptionFilter());
      await nestApp.init();
      return nestApp;
    });

  const origReady = fastify.ready.bind(fastify);
  fastify.ready = (async (cb?: (err?: Error) => void) => {
    await nestPromise;
    return origReady(cb as any);
  }) as any;

  return fastify;
}

/**
 * Creates and initializes the pure NestJS application instance on FastifyAdapter.
 */
export async function createNestApp(): Promise<NestFastifyApplication> {
  const adapter = new FastifyAdapter();
  const app = await NestFactory.create<NestFastifyApplication>(AppModule, adapter, { logger: false });

  await app.register(cors, {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-request-id', 'x-client-id'],
  });

  app.useGlobalFilters(new Rfc7807ExceptionFilter());
  await app.init();
  return app;
}

/**
 * Starts the HTTP server listening on the configured port and host using NestJS.
 */
export async function startServer(options: ApiServerOptions = {}): Promise<NestFastifyApplication> {
  const port = options.port ?? appConfig.port;
  const host = options.host ?? appConfig.host;

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
