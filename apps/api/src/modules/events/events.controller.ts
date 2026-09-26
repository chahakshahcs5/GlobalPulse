import { FastifyRequest, FastifyReply } from 'fastify';
import { EventService } from '@ai-news/events';
import { db } from '@ai-news/database';
import { ApiResponse } from '../../common/response/api-response';

const eventService = new EventService(db);

export class EventsController {
  static async listEvents(request: FastifyRequest, reply: FastifyReply) {
    const orgId = request.principal.organizationId;
    const query = (request.query as any)?.query;
    if (query) {
      const events = await eventService.searchEvents(query, orgId);
      return reply.send(ApiResponse.success(events));
    }
    const events = await eventService.listEvents(orgId);
    return reply.send(events);
  }

  static async getEvent(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const { id } = request.params;
    const event = await eventService.getEvent(id, request.principal.organizationId);
    return reply.send(event);
  }

  static async createEvent(request: FastifyRequest, reply: FastifyReply) {
    const event = await eventService.createEvent(request.body as any, request.principal.organizationId);
    return reply.status(201).send(event);
  }
}
