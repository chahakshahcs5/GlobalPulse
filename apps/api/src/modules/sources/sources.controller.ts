import { FastifyRequest, FastifyReply } from 'fastify';
import { SourceService } from '@ai-news/sources';
import { db } from '@ai-news/database';
import { ApiResponse } from '../../common/response/api-response';

const sourceService = new SourceService(db);

export class SourcesController {
  static async listSources(request: FastifyRequest, reply: FastifyReply) {
    const orgId = request.principal.organizationId;
    const query = (request.query as any)?.query;
    if (query) {
      const sources = await sourceService.searchSources(query, orgId);
      return reply.send(ApiResponse.success(sources));
    }
    const sources = await sourceService.listSources(orgId);
    return reply.send(sources);
  }

  static async getSource(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const { id } = request.params;
    const source = await sourceService.getSource(id, request.principal.organizationId);
    return reply.send(source);
  }

  static async createSource(request: FastifyRequest, reply: FastifyReply) {
    const source = await sourceService.createSource(request.body as any, request.principal.organizationId);
    return reply.status(201).send(source);
  }

  static async attachSource(request: FastifyRequest, reply: FastifyReply) {
    const { storyId, sourceId } = request.body as { storyId: string; sourceId: string };
    await sourceService.attachSourceToStory(storyId, sourceId, request.principal.organizationId);
    return reply.send({ success: true, storyId, sourceId });
  }

  static async createCitation(request: FastifyRequest, reply: FastifyReply) {
    const body = request.body as any;
    const citation = await sourceService.createCitation({
      ...body,
      orgId: request.principal.organizationId,
    });
    return reply.status(201).send(citation);
  }

  static async getCitations(request: FastifyRequest<{ Params: { storyId: string } }>, reply: FastifyReply) {
    const { storyId } = request.params;
    const citations = await sourceService.getStoryCitations(storyId);
    return reply.send(citations);
  }
}
