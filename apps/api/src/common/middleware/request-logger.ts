import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { v4 as uuidv4 } from 'uuid';
import { createLogger } from '@ai-news/observability';

const logger = createLogger('http-gateway');

export const requestLoggerPlugin: FastifyPluginAsync = async (app: FastifyInstance) => {
  app.addHook('onRequest', async (request, reply) => {
    const requestId = (request.headers['x-request-id'] as string) || uuidv4();
    request.headers['x-request-id'] = requestId;
    reply.header('x-request-id', requestId);
    (request as any).startTime = Date.now();
  });

  app.addHook('onResponse', async (request, reply) => {
    const startTime = (request as any).startTime || Date.now();
    const durationMs = Date.now() - startTime;
    const statusCode = reply.statusCode;

    const logPayload = {
      requestId: request.headers['x-request-id'],
      method: request.method,
      url: request.url,
      statusCode,
      durationMs,
      userAgent: request.headers['user-agent'],
      caller: request.principal ? `${request.principal.clientType}:${request.principal.id}` : 'anonymous',
    };

    if (statusCode >= 500) {
      logger.error(`HTTP ${request.method} ${request.url} - ${statusCode} (${durationMs}ms)`, logPayload);
    } else if (statusCode >= 400) {
      logger.warn(`HTTP ${request.method} ${request.url} - ${statusCode} (${durationMs}ms)`, logPayload);
    } else {
      logger.info(`HTTP ${request.method} ${request.url} - ${statusCode} (${durationMs}ms)`, logPayload);
    }
  });
};
