import { FastifyRequest, FastifyReply } from 'fastify';
import { SearchService } from '@ai-news/search';
import { db } from '@ai-news/database';

const searchService = new SearchService(db);

export class SearchController {
  static async searchStories(request: FastifyRequest, reply: FastifyReply) {
    const orgId = request.principal.organizationId;
    const query = request.query as any;
    const result = await searchService.searchStories(query, orgId);
    return reply.send(result);
  }

  static async findSimilarStories(request: FastifyRequest, reply: FastifyReply) {
    const orgId = request.principal.organizationId;
    const body = request.body as any;
    const result = await searchService.findSimilarStories(body, orgId);
    return reply.send(result);
  }

  static async searchAll(request: FastifyRequest<{ Querystring: { q: string } }>, reply: FastifyReply) {
    const orgId = request.principal.organizationId;
    const q = request.query.q || '';

    const [storiesResult, events, topics, entities, sources] = await Promise.all([
      searchService.searchStories({ query: q, limit: 10 }, orgId),
      searchService.searchEvents(q, orgId),
      searchService.searchTopics(q, orgId),
      searchService.searchEntities(q, orgId),
      searchService.searchSources(q, orgId),
    ]);

    return reply.send({
      stories: storiesResult.items,
      events,
      topics,
      entities,
      sources,
    });
  }
}
