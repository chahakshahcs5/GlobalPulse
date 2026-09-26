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
import { registerResources } from './resources/index';
import { registerPrompts } from './prompts/index';

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
    clientType: 'gemini',
    scopes: [
      'news:read',
      'news:search',
      'news:write',
      'news:publish',
      'news:media',
      'news:sources',
      'news:topics',
      'news:admin',
    ],
  };

  const getPrincipal = () => mcpPrincipalStore.getStore() || defaultPrincipal;

  const server = new McpServer({
    name: 'ai-news-platform-mcp',
    version: '1.0.0',
  });

  // Register all tool domains with concurrency-safe getPrincipal
  registerSearchTools(server, database, getPrincipal);
  registerStoryTools(server, database, getPrincipal);
  registerBlockTools(server, database, getPrincipal);
  registerMediaTools(server, database, getPrincipal);
  registerSourceTools(server, database, getPrincipal);
  registerTaxonomyTools(server, database, getPrincipal);
  registerJobTools(server, database, getPrincipal);

  // Register resources and prompts
  registerResources(server, database, getPrincipal);
  registerPrompts(server);

  const transport = new StreamableHTTPServerTransport();
  server.connect(transport);

  // Create HTTP server
  const httpServer = http.createServer(async (req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
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
    if (url.pathname === '/.well-known/oauth-protected-resource') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          resource: process.env.OAUTH_AUDIENCE || 'https://news.platform/mcp',
          authorization_servers: [process.env.OAUTH_ISSUER || 'http://localhost:4000/auth'],
          scopes_supported: [
            'news:read',
            'news:search',
            'news:write',
            'news:publish',
            'news:media',
            'news:sources',
            'news:topics',
            'news:admin',
          ],
          bearer_methods_supported: ['header'],
          resource_documentation: 'https://news.platform/docs/mcp',
        })
      );
      return;
    }

    // Concurrency-safe request-scoped principal resolution
    let resolvedPrincipal = defaultPrincipal;
    try {
      const authHeader = req.headers.authorization;
      if (authHeader) {
        resolvedPrincipal = AuthService.resolveBearerToken(authHeader);
      }
    } catch (err: any) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Unauthorized', message: err.message }));
      return;
    }

    // Streamable HTTP / MCP Handler wrapped in request-scoped AsyncLocalStorage
    if (url.pathname === '/mcp' || url.pathname === '/') {
      let bodyStr = '';
      req.on('data', (chunk) => {
        bodyStr += chunk;
      });
      req.on('end', async () => {
        await mcpPrincipalStore.run(resolvedPrincipal, async () => {
          try {
            const parsed = bodyStr ? JSON.parse(bodyStr) : undefined;
            await transport.handleRequest(req, res, parsed);
          } catch (e: any) {
            if (!res.headersSent) {
              res.writeHead(500, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ jsonrpc: '2.0', error: { code: -32603, message: e.message } }));
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
