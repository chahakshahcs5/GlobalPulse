import http from 'http';
import { AsyncLocalStorage } from 'async_hooks';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { db, DatabaseService } from '@ai-news/database';
import { AuthService, type AuthenticatedPrincipal } from '@ai-news/auth';
import { registerSearchTools } from './tools/search.tools';
import { registerStoryTools } from './tools/story.tools';
import { registerBlockTools } from './tools/block.tools';
import { registerMediaTools } from './tools/media.tools';
import { registerSourceTools } from './tools/source.tools';
import { registerTaxonomyTools } from './tools/taxonomy.tools';
import { registerJobTools } from './tools/job.tools';
import { registerEngagementTools } from './tools/engagement.tools';
import { registerAnalyticsTools } from './tools/analytics.tools';
import { registerSchedulingTools } from './tools/scheduling.tools';
import { registerNotificationTools } from './tools/notification.tools';
import { registerUserTools } from './tools/user.tools';
import { registerSyndicationTools } from './tools/syndication.tools';
import { registerClusteringTools } from './tools/clustering.tools';
import { registerTemplateTools } from './tools/template.tools';
import { registerLiveblogTools } from './tools/liveblog.tools';
import { registerFactCheckTools } from './tools/fact-check.tools';
import { registerEditorialTools } from './tools/editorial.tools';
import { registerEnterpriseTools } from './tools/enterprise.tools';
import { registerTipTools } from './tools/tip.tools';
import { registerWeatherTools } from './tools/weather.tools';
import { registerResources } from './resources/index';
import { registerPrompts } from './prompts/index';
import { resolveCorsOrigin, ALLOWED_CORS_HEADERS } from '@ai-news/shared';

/**
 * Sliding-window rate limiter for MCP HTTP requests.
 * Tracks request timestamps per key and enforces a max request count within a time window.
 */
class RateLimiter {
  private requests = new Map<string, number[]>();
  private readonly maxRequests: number;
  private readonly windowMs: number;

  constructor(maxRequests: number = 200, windowMs: number = 60_000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;

    // Periodic cleanup of stale entries every 60 seconds
    setInterval(() => {
      const now = Date.now();
      for (const [key, timestamps] of this.requests.entries()) {
        const valid = timestamps.filter((t) => now - t < this.windowMs);
        if (valid.length === 0) {
          this.requests.delete(key);
        } else {
          this.requests.set(key, valid);
        }
      }
    }, 60_000).unref();
  }

  /**
   * Returns true if the request should be allowed, false if rate-limited.
   */
  check(key: string): { allowed: boolean; remaining: number; retryAfterMs: number } {
    const now = Date.now();
    const timestamps = this.requests.get(key) || [];
    const validTimestamps = timestamps.filter((t) => now - t < this.windowMs);

    if (validTimestamps.length >= this.maxRequests) {
      const oldestInWindow = validTimestamps[0];
      const retryAfterMs = this.windowMs - (now - oldestInWindow);
      return { allowed: false, remaining: 0, retryAfterMs };
    }

    validTimestamps.push(now);
    this.requests.set(key, validTimestamps);
    return { allowed: true, remaining: this.maxRequests - validTimestamps.length, retryAfterMs: 0 };
  }
}

/**
 * Concurrency-safe request-scoped storage for AuthenticatedPrincipal
 * Prevents race conditions across concurrent AI client requests (§54, §56)
 */
export const mcpPrincipalStore = new AsyncLocalStorage<AuthenticatedPrincipal>();

export interface McpServerApp {
  server: McpServer;
  httpServer: http.Server;
  transport: StreamableHTTPServerTransport;
  currentPrincipal: AuthenticatedPrincipal;
}

export function createMcpApp(database: DatabaseService = db): McpServerApp {
  let defaultPrincipal: AuthenticatedPrincipal = {
    id: 'usr_mcp_gemini',
    organizationId: 'org_default',
    role: 'ai_agent',
    clientType: 'gemini',
    scopes: [
      'news:read',
      'news:search',
      'news:write',
      'news:publish',
      'news:media',
      'news:sources',
      'news:topics',
    ],
    aiMetadata: {
      model: 'gemini-1.5-pro',
      provider: 'google',
      version: '1.5',
      capabilities: ['news:read', 'news:write', 'news:publish'],
    },
  };

  const getPrincipal = () => mcpPrincipalStore.getStore() || defaultPrincipal;

  function initServerInstance(targetServer: McpServer) {
    registerSearchTools(targetServer, database, getPrincipal);
    registerStoryTools(targetServer, database, getPrincipal);
    registerBlockTools(targetServer, database, getPrincipal);
    registerMediaTools(targetServer, database, getPrincipal);
    registerSourceTools(targetServer, database, getPrincipal);
    registerTaxonomyTools(targetServer, database, getPrincipal);
    registerJobTools(targetServer, database, getPrincipal);
    registerEngagementTools(targetServer, database, getPrincipal);
    registerAnalyticsTools(targetServer, database, getPrincipal);
    registerSchedulingTools(targetServer, database, getPrincipal);
    registerNotificationTools(targetServer, database, getPrincipal);
    registerUserTools(targetServer, database, getPrincipal);
    registerSyndicationTools(targetServer, database, getPrincipal);
    registerClusteringTools(targetServer, database, getPrincipal);
    registerTemplateTools(targetServer, database, getPrincipal);
    registerLiveblogTools(targetServer, database, getPrincipal);
    registerFactCheckTools(targetServer, database, getPrincipal);
    registerEditorialTools(targetServer, database, getPrincipal);
    registerEnterpriseTools(targetServer, database, getPrincipal);
    registerTipTools(targetServer, database, getPrincipal);
    registerWeatherTools(targetServer, getPrincipal);
    registerResources(targetServer, database, getPrincipal);
    registerPrompts(targetServer);
  }

  const sessions = new Map<string, StreamableHTTPServerTransport>();

  function createSessionTransport(sessionId: string): StreamableHTTPServerTransport {
    const sessionTransport = new StreamableHTTPServerTransport({
      sessionIdGenerator: () => sessionId,
    });
    const sessionServer = new McpServer({
      name: 'ai-news-platform-mcp',
      version: '1.0.0',
    });
    initServerInstance(sessionServer);
    sessionServer.connect(sessionTransport);
    sessions.set(sessionId, sessionTransport);
    sessionTransport.onclose = () => {
      sessions.delete(sessionId);
    };
    return sessionTransport;
  }

  const defaultSessionId = crypto.randomUUID();
  const transport = createSessionTransport(defaultSessionId);
  const server = new McpServer({
    name: 'ai-news-platform-mcp',
    version: '1.0.0',
  });
  initServerInstance(server);

  // Rate limiter: configurable via env vars (defaults: 200 req/min)
  const mcpRateMax = parseInt(process.env.MCP_RATE_LIMIT_MAX || '200', 10);
  const mcpRateWindowMs = parseInt(process.env.MCP_RATE_LIMIT_WINDOW_MS || '60000', 10);
  const rateLimiter = new RateLimiter(mcpRateMax, mcpRateWindowMs);

  // Create HTTP server
  const httpServer = http.createServer(async (req, res) => {
    // Secure CORS handling
    const reqOrigin = req.headers.origin;
    const allowOrigin = resolveCorsOrigin(reqOrigin);

    if (allowOrigin) {
      res.setHeader('Access-Control-Allow-Origin', allowOrigin);
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', ALLOWED_CORS_HEADERS.join(', '));
      res.setHeader('Access-Control-Allow-Credentials', 'true');
    }

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    // Rate limiting — keyed by auth token or IP
    const rateLimitKey =
      req.headers.authorization ||
      req.headers['x-forwarded-for']?.toString().split(',')[0]?.trim() ||
      req.socket.remoteAddress ||
      '127.0.0.1';
    const rateResult = rateLimiter.check(rateLimitKey);
    res.setHeader('X-RateLimit-Limit', String(mcpRateMax));
    res.setHeader('X-RateLimit-Remaining', String(rateResult.remaining));
    if (!rateResult.allowed) {
      res.setHeader('Retry-After', String(Math.ceil(rateResult.retryAfterMs / 1000)));
      res.writeHead(429, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          jsonrpc: '2.0',
          error: {
            code: -32000,
            message: `Rate limit exceeded. Max ${mcpRateMax} requests per ${mcpRateWindowMs / 1000}s. Retry after ${Math.ceil(rateResult.retryAfterMs / 1000)}s.`,
          },
        })
      );
      return;
    }

    const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);

    // Health endpoint
    if (url.pathname === '/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          status: 'healthy',
          mcp: 'streamable-http',
          version: '1.0.0',
          timestamp: new Date().toISOString(),
        })
      );
      return;
    }

    // RFC 8414 OAuth Protected Resource Metadata for OpenAI & Gemini (§42, §47)
    if (
      url.pathname === '/.well-known/oauth-protected-resource' ||
      url.pathname === '/.well-known/oauth-protected-resource/mcp'
    ) {
      const serverOrigin = `${url.protocol}//${req.headers.host || 'localhost'}`;
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          resource: process.env.OAUTH_AUDIENCE || `${serverOrigin}/mcp`,
          authorization_servers: [process.env.OAUTH_ISSUER || `${serverOrigin}/auth`],
          scopes_supported: [
            'news:read',
            'news:search',
            'news:write',
            'news:publish',
            'news:media',
            'news:sources',
            'news:topics',
          ],
          bearer_methods_supported: ['header'],
          resource_documentation: `${serverOrigin}/docs/mcp`,
        })
      );
      return;
    }

    // Concurrency-safe request-scoped principal resolution
    const isProduction = process.env.NODE_ENV === 'production';
    let resolvedPrincipal: AuthenticatedPrincipal;
    try {
      const authHeader = req.headers.authorization;
      if (authHeader) {
        resolvedPrincipal = AuthService.resolveBearerToken(authHeader);
      } else if (isProduction) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(
          JSON.stringify({
            error: 'Unauthorized',
            message:
              'Authentication required. Authorization Bearer token must be provided to access MCP endpoints in production.',
          })
        );
        return;
      } else {
        resolvedPrincipal = defaultPrincipal;
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Unauthorized', message: errorMsg }));
      return;
    }

    // Streamable HTTP / MCP Handler wrapped in request-scoped AsyncLocalStorage
    if (url.pathname === '/mcp' || url.pathname === '/') {
      // Normalize Accept header so non-SSE client probes (Gemini Spark, browsers, curl)
      // that send Accept: */* or Accept: application/json are not rejected with HTTP 406
      const currentAccept = (req.headers.accept || '').trim();

      if (req.method === 'GET') {
        // If it's a GET probe that is not explicitly requesting an SSE stream, return 200 OK server info
        if (!currentAccept.includes('text/event-stream') && !req.headers['mcp-session-id']) {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(
            JSON.stringify({
              status: 'healthy',
              service: 'ai-news-platform-mcp',
              mcp: 'streamable-http',
              version: '1.0.0',
              endpoint: '/mcp',
            })
          );
          return;
        }
        req.headers.accept = 'text/event-stream';
      } else if (req.method === 'POST') {
        // Streamable HTTP POST requires both application/json and text/event-stream in Accept header
        const parts = currentAccept ? currentAccept.split(',').map((p) => p.trim()) : [];
        if (!parts.some((p) => p.includes('application/json'))) {
          parts.push('application/json');
        }
        if (!parts.some((p) => p.includes('text/event-stream'))) {
          parts.push('text/event-stream');
        }
        req.headers.accept = parts.join(', ');

        // Default Content-Type to application/json if omitted
        if (!req.headers['content-type']) {
          req.headers['content-type'] = 'application/json';
        }
      }

      let bodyStr = '';
      req.on('data', (chunk) => {
        bodyStr += chunk;
      });
      req.on('end', async () => {
        await mcpPrincipalStore.run(resolvedPrincipal, async () => {
          try {
            const parsed = bodyStr ? JSON.parse(bodyStr) : undefined;
            const headerSessionId = req.headers['mcp-session-id'] as string | undefined;

            let activeTransport: StreamableHTTPServerTransport;
            if (headerSessionId && sessions.has(headerSessionId)) {
              activeTransport = sessions.get(headerSessionId)!;
            } else {
              const newSessionId = crypto.randomUUID();
              activeTransport = createSessionTransport(newSessionId);
            }

            await activeTransport.handleRequest(req, res, parsed);
          } catch (e: unknown) {
            const errorMsg = e instanceof Error ? e.message : String(e);
            if (!res.headersSent) {
              res.writeHead(500, { 'Content-Type': 'application/json' });
              res.end(
                JSON.stringify({ jsonrpc: '2.0', error: { code: -32603, message: errorMsg } })
              );
            }
          }
        });
      });
      return;
    }

    // Default 404
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not Found' }));
  });

  return {
    server,
    httpServer,
    transport,
    get currentPrincipal() {
      return defaultPrincipal;
    },
    set currentPrincipal(p: AuthenticatedPrincipal) {
      defaultPrincipal = p;
    },
  };
}
