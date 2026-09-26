import { FastifyRequest, FastifyReply } from 'fastify';
import { EntityService } from '@ai-news/entities';
import { db } from '@ai-news/database';
import { ApiResponse } from '../../common/response/api-response';

const entityService = new EntityService(db);

export class EntitiesController {
  static async listEntities(request: FastifyRequest, reply: FastifyReply) {
    const orgId = request.principal.organizationId;
    const query = (request.query as any)?.query;
    if (query) {
      const entities = await entityService.searchEntities(query, orgId);
      return reply.send(ApiResponse.success(entities));
    }
    const entities = await entityService.listEntities(orgId);
    return reply.send(entities);
  }

  static async getEntity(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const { id } = request.params;
    const entity = await entityService.getEntity(id, request.principal.organizationId);
    return reply.send(entity);
  }

  static async createEntity(request: FastifyRequest, reply: FastifyReply) {
    const entity = await entityService.createEntity(request.body as any, request.principal.organizationId);
    return reply.status(201).send(entity);
  }
}
