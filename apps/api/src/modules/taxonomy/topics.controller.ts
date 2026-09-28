import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Body,
  UseGuards,
  HttpStatus,
  Res,
} from '@nestjs/common';
import { FastifyReply } from 'fastify';
import { TopicService, type CreateTopicInput } from '@ai-news/topics';
import { db } from '@ai-news/database';
import { ApiResponse } from '../../common/response/api-response';
import { NestAuthGuard, RequireScope, Principal } from '../../common/auth.guard';
import type { AuthenticatedPrincipal } from '@ai-news/auth';

@Controller('api/topics')
@UseGuards(NestAuthGuard)
export class TopicsController {
  private topicService: TopicService;

  constructor() {
    this.topicService = new TopicService(db);
  }

  @Get()
  @RequireScope('news:read')
  async listTopics(@Query('query') query: string, @Principal() principal: AuthenticatedPrincipal) {
    const orgId = principal.organizationId;
    if (query) {
      const topics = await this.topicService.searchTopics(query, orgId);
      return ApiResponse.success(topics);
    }
    return await this.topicService.listTopics(orgId);
  }

  @Get(':id')
  @RequireScope('news:read')
  async getTopic(@Param('id') id: string, @Principal() principal: AuthenticatedPrincipal) {
    return await this.topicService.getTopic(id, principal.organizationId);
  }

  @Post()
  @RequireScope('news:write')
  async createTopic(
    @Body() body: CreateTopicInput,
    @Principal() principal: AuthenticatedPrincipal,
    @Res({ passthrough: true }) reply: FastifyReply
  ) {
    const topic = await this.topicService.createTopic(body, principal.organizationId);
    reply.status(HttpStatus.CREATED);
    return topic;
  }
}
