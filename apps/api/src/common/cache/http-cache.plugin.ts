import { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify';
import crypto from 'crypto';

import { cacheService } from './cache.service';

const PUBLIC_CACHE_ROUTES = [
  /^\/api\/stories(\?.*)?$/,
  /^\/api\/stories\/[a-zA-Z0-9_-]+$/,
  /^\/api\/topics(\/.*)?$/,
  /^\/api\/categories(\/.*)?$/,
  /^\/api\/entities(\/.*)?$/,
];

const PRIVATE_ROUTES = [
  /^\/api\/stories\/review-queue(\?.*)?$/,
  /^\/api\/stories\/scheduled(\/.*)?$/,
  /^\/api\/audit(\?.*)?$/,
  /^\/api\/users(\/.*)?$/,
  /^\/api\/auth(\/.*)?$/,
];

function isPublicCacheable(url: string, method: string): boolean {
  if (method !== 'GET' && method !== 'HEAD') return false;
  if (PRIVATE_ROUTES.some((pattern) => pattern.test(url))) return false;
  return PUBLIC_CACHE_ROUTES.some((pattern) => pattern.test(url));
}

export const httpCachePlugin: FastifyPluginAsync = async (fastify) => {
  fastify.addHook(
    'onSend',
    async (request: FastifyRequest, reply: FastifyReply, payload: unknown) => {
      const method = request.method.toUpperCase();
      const url = request.raw.url || request.url;

      // Invalidate caches on mutation
      if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
        reply.header('Cache-Control', 'no-cache, no-store, must-revalidate');
        if (url.startsWith('/api/stories')) {
          await cacheService.delByPrefix('stories:');
        }
        return payload;
      }

      // Public GET endpoints
      if (isPublicCacheable(url, method)) {
        reply.header(
          'Cache-Control',
          'public, max-age=60, s-maxage=300, stale-while-revalidate=60'
        );

        if (typeof payload === 'string' || Buffer.isBuffer(payload)) {
          let contentToHash: string = payload.toString();
          try {
            const parsed = JSON.parse(contentToHash);
            if (parsed && typeof parsed === 'object' && 'data' in parsed) {
              contentToHash = JSON.stringify({ data: parsed.data, meta: parsed.meta });
            }
          } catch {
            // not JSON, use raw payload
          }

          const hash = crypto
            .createHash('sha256')
            .update(contentToHash)
            .digest('hex')
            .substring(0, 16);
          const etag = `W/"${hash}"`;
          reply.header('ETag', etag);

          const clientEtag = request.headers['if-none-match'];
          if (clientEtag && (clientEtag === etag || clientEtag === `"${hash}"`)) {
            reply.status(304);
            reply.raw.statusCode = 304;
            return '';
          }
        }
        return payload;
      }

      // Default to private/no-cache for sensitive or dynamic endpoints
      reply.header('Cache-Control', 'no-cache, no-store, must-revalidate');
      return payload;
    }
  );
};

// Break Fastify plugin encapsulation so hooks apply globally across all routes
(httpCachePlugin as unknown as Record<symbol, unknown>)[Symbol.for('skip-override')] = true;
