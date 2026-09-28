import { FastifyInstance, FastifyPluginAsync } from 'fastify';

export const openApiSpec = {
  openapi: '3.1.0',
  info: {
    title: 'AI News Platform API Gateway',
    version: '1.0.0',
    description:
      'Enterprise Multimedia News Platform API designed for AI Agents (Gemini Spark, ChatGPT, Claude) and Multi-Device Clients.',
    contact: {
      name: 'News Platform Engineering',
      url: 'https://news.platform',
    },
  },
  servers: [
    {
      url: 'http://localhost:4000',
      description: 'Local Development Server',
    },
    {
      url: 'https://api.globalpulse.news',
      description: 'Production Multi-Region Gateway',
    },
  ],
  components: {
    securitySchemes: {
      OAuth2: {
        type: 'oauth2',
        description: 'RFC 6749 / 8414 OAuth 2.0 with Bearer Token Authorization',
        flows: {
          clientCredentials: {
            tokenUrl: '/oauth/token',
            scopes: {
              'news:read': 'Read published stories, topics, events, and sources',
              'news:write': 'Draft, update, and manage story blocks and versions',
              'news:publish': 'Publish and broadcast stories to Web, Mobile, and Display Wall',
              'news:search': 'Vector semantic search and similarity matching',
              'news:sources': 'Register primary sources and verify citations',
              'news:topics': 'Manage taxonomy and topics',
              'news:media': 'Upload media and trigger visual variant processing',
              'news:admin': 'View audit logs and perform system operations',
            },
          },
        },
      },
    },
  },
  paths: {
    '/health': {
      get: {
        summary: 'System & Database Health Probe',
        responses: {
          '200': { description: 'All systems operational' },
          '503': { description: 'One or more systems degraded' },
        },
      },
    },
    '/.well-known/oauth-protected-resource': {
      get: {
        summary: 'RFC 8414 & OpenAI Protected Resource Metadata',
        responses: {
          '200': { description: 'OAuth 2.0 Protected Resource Metadata' },
        },
      },
    },
    '/api/stories': {
      get: {
        summary: 'List or filter published and draft stories',
        security: [{ OAuth2: ['news:read'] }],
        responses: { '200': { description: 'List of stories' } },
      },
      post: {
        summary: 'Create a new draft story with blocks',
        security: [{ OAuth2: ['news:write'] }],
        responses: { '201': { description: 'Story created' } },
      },
    },
    '/api/stories/{id}': {
      get: {
        summary: 'Retrieve story with its ordered blocks and entity links',
        security: [{ OAuth2: ['news:read'] }],
        responses: { '200': { description: 'Story details' } },
      },
      put: {
        summary: 'Update story metadata',
        security: [{ OAuth2: ['news:write'] }],
        responses: { '200': { description: 'Story updated' } },
      },
    },
    '/api/stories/{id}/publish': {
      post: {
        summary: 'Publish a story version and broadcast to all channels',
        security: [{ OAuth2: ['news:publish'] }],
        responses: { '200': { description: 'Story published' } },
      },
    },
    '/api/search/stories': {
      get: {
        summary: 'Hybrid vector & keyword story search',
        security: [{ OAuth2: ['news:search'] }],
        responses: { '200': { description: 'Search results' } },
      },
    },
    '/api/realtime/stream': {
      get: {
        summary: 'Server-Sent Events (SSE) live feed',
        responses: { '200': { description: 'Streamable text/event-stream' } },
      },
    },
  },
};

export const openApiRoutes: FastifyPluginAsync = async (app: FastifyInstance) => {
  app.get('/docs/openapi.json', async () => openApiSpec);
};
