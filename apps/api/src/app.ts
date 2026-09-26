import fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import { globalErrorHandler } from './common/errors/error-handler';
import { requestLoggerPlugin } from './common/middleware/request-logger';
import { healthRoutes } from './modules/health/health.routes';
import { oauthRoutes } from './modules/oauth/oauth.routes';
import { storiesRoutes } from './modules/stories/stories.routes';
import { eventsRoutes } from './modules/events/events.routes';
import { topicsRoutes } from './modules/topics/topics.routes';
import { entitiesRoutes } from './modules/entities/entities.routes';
import { sourcesRoutes } from './modules/sources/sources.routes';
import { searchRoutes } from './modules/search/search.routes';
import { mediaRoutes } from './modules/media/media.routes';
import { auditRoutes } from './modules/audit/audit.routes';
import { sseRoutes } from './realtime/sse.routes';
import { openApiRoutes } from './docs/openapi';

export interface AppOptions {
  logger?: boolean;
}

export function createApp(options: AppOptions = {}): FastifyInstance {
  const app = fastify({
    logger: options.logger ?? false,
  });

  // CORS
  app.register(cors, {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-request-id', 'x-client-id'],
  });

  // Request correlation & logging middleware
  app.register(requestLoggerPlugin);

  // Global RFC 7807 Error Handler
  app.setErrorHandler(globalErrorHandler);

  // Mount Feature Modules
  app.register(healthRoutes);
  app.register(oauthRoutes);
  app.register(storiesRoutes);
  app.register(eventsRoutes);
  app.register(topicsRoutes);
  app.register(entitiesRoutes);
  app.register(sourcesRoutes);
  app.register(searchRoutes);
  app.register(mediaRoutes);
  app.register(auditRoutes);
  app.register(sseRoutes);
  app.register(openApiRoutes);

  return app;
}
