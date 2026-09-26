import { FastifyRequest, FastifyReply } from 'fastify';
import { StoryService } from '@ai-news/stories';
import { db } from '@ai-news/database';
import { ApiResponse } from '../../common/response/api-response';
import {
  CreateStoryInputSchema,
  UpdateStoryInputSchema,
  CreateStoryVersionInputSchema,
  PublishStoryInputSchema,
  ReorderBlocksInputSchema,
} from './stories.dto';

const storyService = new StoryService(db);

export class StoriesController {
  static async listStories(request: FastifyRequest, reply: FastifyReply) {
    const orgId = request.principal.organizationId;
    const filter = request.query as any;
    const stories = await storyService.listStories(filter, orgId);
    return reply.send(ApiResponse.paginated(stories, stories.length, filter?.limit || 50));
  }

  static async createStory(request: FastifyRequest, reply: FastifyReply) {
    const validated = CreateStoryInputSchema.parse(request.body);
    const story = await storyService.createStory(validated, {
      organizationId: request.principal.organizationId,
      authorId: request.principal.id,
      clientType: request.principal.clientType,
      createdVia: 'api',
      requestId: request.headers['x-request-id'] as string,
    });
    return reply.status(201).send(story);
  }

  static async getStoryById(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const { id } = request.params;
    const story = await storyService.getStory(id, request.principal.organizationId);
    return reply.send(story);
  }

  static async getStoryBySlug(request: FastifyRequest<{ Params: { slug: string } }>, reply: FastifyReply) {
    const { slug } = request.params;
    const story = await storyService.getStoryBySlug(slug, request.principal.organizationId);
    return reply.send(story);
  }

  static async updateStory(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const { id } = request.params;
    const validated = UpdateStoryInputSchema.parse(request.body);
    const updated = await storyService.updateStory(id, validated, {
      organizationId: request.principal.organizationId,
      authorId: request.principal.id,
      clientType: request.principal.clientType,
      createdVia: 'api',
      requestId: request.headers['x-request-id'] as string,
    });
    return reply.send(updated);
  }

  static async addBlock(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const { id } = request.params;
    const block = await storyService.addBlock(id, request.body, {
      organizationId: request.principal.organizationId,
      authorId: request.principal.id,
      clientType: request.principal.clientType,
      createdVia: 'api',
      requestId: request.headers['x-request-id'] as string,
    });
    return reply.status(201).send(block);
  }

  static async getBlocks(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const { id } = request.params;
    await storyService.getStory(id, request.principal.organizationId);
    const blocks = await db.stories.getBlocks(id);
    return reply.send(blocks);
  }

  static async updateBlock(
    request: FastifyRequest<{ Params: { id: string; blockId: string } }>,
    reply: FastifyReply
  ) {
    const { id, blockId } = request.params;
    const updated = await storyService.updateBlock(id, blockId, request.body, {
      organizationId: request.principal.organizationId,
      authorId: request.principal.id,
      clientType: request.principal.clientType,
      createdVia: 'api',
      requestId: request.headers['x-request-id'] as string,
    });
    return reply.send(updated);
  }

  static async removeBlock(
    request: FastifyRequest<{ Params: { id: string; blockId: string } }>,
    reply: FastifyReply
  ) {
    const { id, blockId } = request.params;
    const removed = await storyService.removeBlock(id, blockId, {
      organizationId: request.principal.organizationId,
      authorId: request.principal.id,
      clientType: request.principal.clientType,
      createdVia: 'api',
      requestId: request.headers['x-request-id'] as string,
    });
    return reply.send({ success: removed });
  }

  static async reorderBlocks(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const { id } = request.params;
    const { blockIds } = ReorderBlocksInputSchema.parse(request.body);
    const reordered = await storyService.reorderBlocks(id, blockIds, {
      organizationId: request.principal.organizationId,
      authorId: request.principal.id,
      clientType: request.principal.clientType,
      createdVia: 'api',
      requestId: request.headers['x-request-id'] as string,
    });
    return reply.send(reordered);
  }

  static async createVersion(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const { id } = request.params;
    const validated = CreateStoryVersionInputSchema.parse(request.body);
    const version = await storyService.createStoryVersion(id, validated, {
      organizationId: request.principal.organizationId,
      authorId: request.principal.id,
      clientType: request.principal.clientType,
      createdVia: 'api',
      requestId: request.headers['x-request-id'] as string,
    });
    return reply.status(201).send(version);
  }

  static async getVersions(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const { id } = request.params;
    const versions = await storyService.getStoryVersions(id);
    return reply.send(versions);
  }

  static async getVersion(
    request: FastifyRequest<{ Params: { id: string; versionNumber: string } }>,
    reply: FastifyReply
  ) {
    const { id, versionNumber } = request.params;
    const version = await storyService.getStoryVersion(id, parseInt(versionNumber, 10));
    return reply.send(version);
  }

  static async publishStory(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const { id } = request.params;
    const body = PublishStoryInputSchema.parse(request.body || {});
    const published = await storyService.publishStory(
      id,
      {
        organizationId: request.principal.organizationId,
        authorId: request.principal.id,
        clientType: request.principal.clientType,
        createdVia: 'api',
        requestId: request.headers['x-request-id'] as string,
      },
      body.idempotencyKey
    );
    return reply.send(published);
  }
}
