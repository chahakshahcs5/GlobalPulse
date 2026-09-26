import { FastifyRequest, FastifyReply } from 'fastify';
import { TopicService } from '@ai-news/topics';
import { db } from '@ai-news/database';
import { ApiResponse } from '../../common/response/api-response';

const topicService = new TopicService(db);

export class TopicsController {
  static async listTopics(request: FastifyRequest, reply: FastifyReply) {
    const orgId = request.principal.organizationId;
    const query = (request.query as any)?.query;
    if (query) {
      const topics = await topicService.searchTopics(query, orgId);
      return reply.send(ApiResponse.success(topics));
    }
    const topics = await topicService.listTopics(orgId);
    return reply.send(topics);
  }

  static async getTopic(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const { id } = request.params;
    const topic = await topicService.getTopic(id, request.principal.organizationId);
    return reply.send(topic);
  }

  static async createTopic(request: FastifyRequest, reply: FastifyReply) {
    const topic = await topicService.createTopic(request.body as any, request.principal.organizationId);
    return reply.status(201).send(topic);
  }
}
