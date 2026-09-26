import fastify, { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import cors from '@fastify/cors';
import { db } from '@ai-news/database';
import { StoryService } from '@ai-news/stories';
import { EventService } from '@ai-news/events';
import { TopicService } from '@ai-news/topics';
import { EntityService } from '@ai-news/entities';
import { SourceService } from '@ai-news/sources';
import { SearchService } from '@ai-news/search';
import { AuthService, type AuthenticatedPrincipal } from '@ai-news/auth';
import { DomainError } from '@ai-news/shared';

export interface ApiServerOptions {
  port?: number;
  host?: string;
}

export function buildServer(): FastifyInstance {
  const server = fastify({ logger: false });

  server.register(cors, {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  });

  const storyService = new StoryService(db);
  const eventService = new EventService(db);
  const topicService = new TopicService(db);
  const entityService = new EntityService(db);
  const sourceService = new SourceService(db);
  const searchService = new SearchService(db);

  // Error handler
  server.setErrorHandler((error: Error, request: FastifyRequest, reply: FastifyReply) => {
    if (error instanceof DomainError) {
      return reply.status(error.statusCode).send({
        error: error.name,
        code: error.code,
        message: error.message,
        details: error.details,
      });
    }
    return reply.status(500).send({
      error: 'InternalServerError',
      message: error.message || 'An unexpected error occurred.',
    });
  });

  // Health endpoint
  server.get('/health', async () => {
    return {
      status: 'healthy',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
    };
  });

  // RFC 8414 & OpenAI Protected Resource Metadata
  server.get('/.well-known/oauth-protected-resource', async () => {
    return {
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
      resource_documentation: 'https://news.platform/docs',
    };
  });

  // Story Endpoints
  server.post('/api/stories', async (request, reply) => {
    const principal = AuthService.resolveBearerToken(request.headers.authorization);
    AuthService.requireScope(principal, 'news:write');

    const result = await storyService.createStory(request.body as any, {
      organizationId: principal.organizationId,
      authorId: principal.id,
      clientType: principal.clientType,
      createdVia: 'api',
    });
    return reply.status(201).send(result);
  });

  server.get('/api/stories/:id', async (request, reply) => {
    const principal = AuthService.resolveBearerToken(request.headers.authorization);
    AuthService.requireScope(principal, 'news:read');
    const { id } = request.params as { id: string };
    const story = await storyService.getStory(id, principal.organizationId);
    return story;
  });

  server.get('/api/stories/slug/:slug', async (request, reply) => {
    const principal = AuthService.resolveBearerToken(request.headers.authorization);
    AuthService.requireScope(principal, 'news:read');
    const { slug } = request.params as { slug: string };
    const story = await storyService.getStoryBySlug(slug, principal.organizationId);
    return story;
  });

  server.put('/api/stories/:id', async (request, reply) => {
    const principal = AuthService.resolveBearerToken(request.headers.authorization);
    AuthService.requireScope(principal, 'news:write');
    const { id } = request.params as { id: string };
    const updated = await storyService.updateStory(id, request.body as any, {
      organizationId: principal.organizationId,
      authorId: principal.id,
      clientType: principal.clientType,
      createdVia: 'api',
    });
    return updated;
  });

  server.post('/api/stories/:id/blocks', async (request, reply) => {
    const principal = AuthService.resolveBearerToken(request.headers.authorization);
    AuthService.requireScope(principal, 'news:write');
    const { id } = request.params as { id: string };
    const block = await storyService.addBlock(id, request.body, {
      organizationId: principal.organizationId,
      authorId: principal.id,
      clientType: principal.clientType,
      createdVia: 'api',
    });
    return reply.status(201).send(block);
  });

  server.post('/api/stories/:id/versions', async (request, reply) => {
    const principal = AuthService.resolveBearerToken(request.headers.authorization);
    AuthService.requireScope(principal, 'news:write');
    const { id } = request.params as { id: string };
    const version = await storyService.createStoryVersion(id, request.body as any, {
      organizationId: principal.organizationId,
      authorId: principal.id,
      clientType: principal.clientType,
      createdVia: 'api',
    });
    return reply.status(201).send(version);
  });

  server.post('/api/stories/:id/publish', async (request, reply) => {
    const principal = AuthService.resolveBearerToken(request.headers.authorization);
    AuthService.requireScope(principal, 'news:publish');
    const { id } = request.params as { id: string };
    const body = (request.body as any) || {};
    const published = await storyService.publishStory(
      id,
      {
        organizationId: principal.organizationId,
        authorId: principal.id,
        clientType: principal.clientType,
        createdVia: 'api',
      },
      body.idempotencyKey
    );
    return published;
  });

  // Search & Similar Stories
  server.get('/api/search/stories', async (request) => {
    const principal = AuthService.resolveBearerToken(request.headers.authorization);
    AuthService.requireScope(principal, 'news:search');
    return searchService.searchStories(request.query as any, principal.organizationId);
  });

  server.post('/api/search/stories/similar', async (request) => {
    const principal = AuthService.resolveBearerToken(request.headers.authorization);
    AuthService.requireScope(principal, 'news:search');
    return searchService.findSimilarStories(request.body as any, principal.organizationId);
  });

  // Events, Topics, Entities, Sources
  server.post('/api/events', async (request, reply) => {
    const principal = AuthService.resolveBearerToken(request.headers.authorization);
    AuthService.requireScope(principal, 'news:write');
    const event = await eventService.createEvent(request.body as any, principal.organizationId);
    return reply.status(201).send(event);
  });

  server.get('/api/events', async (request) => {
    const principal = AuthService.resolveBearerToken(request.headers.authorization);
    AuthService.requireScope(principal, 'news:read');
    return eventService.listEvents(principal.organizationId);
  });

  server.post('/api/topics', async (request, reply) => {
    const principal = AuthService.resolveBearerToken(request.headers.authorization);
    AuthService.requireScope(principal, 'news:topics');
    const topic = await topicService.createTopic(request.body as any, principal.organizationId);
    return reply.status(201).send(topic);
  });

  server.get('/api/topics', async (request) => {
    const principal = AuthService.resolveBearerToken(request.headers.authorization);
    AuthService.requireScope(principal, 'news:read');
    return topicService.listTopics(principal.organizationId);
  });

  server.post('/api/entities', async (request, reply) => {
    const principal = AuthService.resolveBearerToken(request.headers.authorization);
    AuthService.requireScope(principal, 'news:write');
    const entity = await entityService.createEntity(request.body as any, principal.organizationId);
    return reply.status(201).send(entity);
  });

  server.get('/api/entities', async (request) => {
    const principal = AuthService.resolveBearerToken(request.headers.authorization);
    AuthService.requireScope(principal, 'news:read');
    return entityService.listEntities(principal.organizationId);
  });

  server.post('/api/sources', async (request, reply) => {
    const principal = AuthService.resolveBearerToken(request.headers.authorization);
    AuthService.requireScope(principal, 'news:sources');
    const source = await sourceService.createSource(request.body as any, principal.organizationId);
    return reply.status(201).send(source);
  });

  server.post('/api/sources/attach', async (request) => {
    const principal = AuthService.resolveBearerToken(request.headers.authorization);
    AuthService.requireScope(principal, 'news:sources');
    const { storyId, sourceId } = request.body as { storyId: string; sourceId: string };
    await sourceService.attachSourceToStory(storyId, sourceId, principal.organizationId);
    return { success: true };
  });

  server.get('/api/audit', async (request) => {
    const principal = AuthService.resolveBearerToken(request.headers.authorization);
    AuthService.requireScope(principal, 'news:admin');
    return db.audit.query(principal.organizationId);
  });

  return server;
}
