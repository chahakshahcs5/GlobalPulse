import 'reflect-metadata';
import Fastify, { FastifyInstance, FastifyRequest } from 'fastify';
import cors, { FastifyCorsOptions } from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { AppModule } from './app.module';
import { Rfc7807ExceptionFilter } from './common/rfc7807.filter';
import { requestLoggerPlugin } from './common/middleware/request-logger';
import { httpCachePlugin } from './common/cache/http-cache.plugin';
import { appConfig } from './config/configuration';
import { createLogger } from '@ai-news/observability';

const logger = createLogger('api-server');

export interface ApiServerOptions {
  port?: number;
  host?: string;
  logger?: boolean;
}

import { isOriginAllowed, ALLOWED_CORS_HEADERS, ALLOWED_CORS_METHODS } from '@ai-news/shared';

export function getCorsOptions(): FastifyCorsOptions {
  return {
    origin: async (origin: string | undefined): Promise<boolean> => {
      if (!origin || isOriginAllowed(origin)) {
        return true;
      }
      return false;
    },
    methods: ALLOWED_CORS_METHODS as string[],
    allowedHeaders: ALLOWED_CORS_HEADERS as string[],
    credentials: true,
  };
}

export function getRateLimitOptions() {
  const isTest = process.env.NODE_ENV === 'test';
  const max = process.env.RATE_LIMIT_MAX
    ? parseInt(process.env.RATE_LIMIT_MAX, 10)
    : isTest
      ? 1000
      : 100;
  const timeWindow = process.env.RATE_LIMIT_WINDOW || '1 minute';
  const allowList = process.env.RATE_LIMIT_ALLOW_LIST
    ? process.env.RATE_LIMIT_ALLOW_LIST.split(',').map((s) => s.trim())
    : [];

  return {
    max,
    timeWindow,
    allowList,
    keyGenerator: (req: FastifyRequest) => {
      const auth = req.headers.authorization;
      if (auth && typeof auth === 'string') return auth;
      return req.ip || '127.0.0.1';
    },
    errorResponseBuilder: (req: FastifyRequest, context: { max: number; after: string }) => ({
      type: 'https://globalpulse.news/errors/rate-limit-exceeded',
      title: 'Too Many Requests',
      status: 429,
      detail: `Rate limit of ${context.max} requests exceeded. Retry after ${context.after}`,
      instance: req.url,
      timestamp: new Date().toISOString(),
    }),
  };
}

/**
 * Builds and configures the production Fastify instance powered by NestJS.
 * Preserves 100% compatibility with test harnesses and Fastify injection.
 */
export function buildServer(options: ApiServerOptions = {}): FastifyInstance {
  const trustProxy = process.env.TRUST_PROXY === 'true' || process.env.NODE_ENV === 'production';
  const fastify = Fastify({ logger: options.logger ?? false, trustProxy });

  fastify.addHook('onRequest', async (_req, reply) => {
    reply.header('X-Content-Type-Options', 'nosniff');
    reply.header('X-Frame-Options', 'DENY');
    reply.header('Referrer-Policy', 'strict-origin-when-cross-origin');
    reply.header('X-DNS-Prefetch-Control', 'off');
    if (process.env.NODE_ENV === 'production') {
      reply.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    }
  });

  fastify.register(cors, getCorsOptions());
  fastify.register(rateLimit, getRateLimitOptions());
  fastify.register(httpCachePlugin);
  fastify.register(requestLoggerPlugin);

  // Hook NestJS bootstrap into fastify.ready()
  const adapter = new FastifyAdapter(fastify);
  const nestPromise = NestFactory.create<NestFastifyApplication>(AppModule, adapter, {
    logger: ['error', 'warn'],
    abortOnError: false,
  }).then(async (nestApp) => {
    nestApp.useGlobalFilters(new Rfc7807ExceptionFilter());
    await nestApp.init();
    return nestApp;
  });

  const origReady = fastify.ready.bind(fastify);
  fastify.ready = ((cb?: (err: Error | null) => void) => {
    if (cb) {
      return origReady(cb);
    }
    return nestPromise.then(() => origReady());
  }) as unknown as typeof fastify.ready;

  return fastify;
}

/**
 * Creates and initializes the pure NestJS application instance on FastifyAdapter.
 */
export async function createNestApp(): Promise<NestFastifyApplication> {
  const adapter = new FastifyAdapter();
  const app = await NestFactory.create<NestFastifyApplication>(AppModule, adapter, {
    logger: false,
  });

  const fastifyInstance = app.getHttpAdapter().getInstance() as FastifyInstance;
  if (fastifyInstance && typeof fastifyInstance.addHook === 'function') {
    fastifyInstance.addHook('onRequest', async (_req, reply) => {
      reply.header('X-Content-Type-Options', 'nosniff');
      reply.header('X-Frame-Options', 'DENY');
      reply.header('Referrer-Policy', 'strict-origin-when-cross-origin');
      reply.header('X-DNS-Prefetch-Control', 'off');
      if (process.env.NODE_ENV === 'production') {
        reply.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
      }
    });
  }

  await app.register(cors, getCorsOptions() as unknown as Record<string, unknown>);
  await app.register(rateLimit, getRateLimitOptions());
  await app.register(httpCachePlugin);

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
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    logger.error(
      `Failed to start NestJS API Gateway: ${errorMsg}`,
      err instanceof Error ? err : new Error(errorMsg)
    );
    throw err;
  }
}
