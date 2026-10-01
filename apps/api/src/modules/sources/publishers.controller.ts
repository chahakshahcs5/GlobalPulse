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
import { SourceService } from '@ai-news/sources';
import { db } from '@ai-news/database';
import { ApiResponse } from '../../common/response/api-response';
import { NestAuthGuard, RequireScope, Principal } from '../../common/auth.guard';
import { AuthenticatedPrincipal } from '@ai-news/auth';
import type { CreatePublisherInput } from '@ai-news/schemas';

@Controller('api/publishers')
@UseGuards(NestAuthGuard)
export class PublishersController {
  private sourceService: SourceService;

  constructor() {
    this.sourceService = new SourceService(db);
  }

  @Get()
  @RequireScope('news:read')
  async listPublishers(
    @Query('query') query: string,
    @Query('category') category: string,
    @Principal() principal: AuthenticatedPrincipal
  ) {
    const orgId = principal.organizationId;
    if (query) {
      const pubs = await this.sourceService.searchPublishers(query, orgId);
      return ApiResponse.success(pubs);
    }
    const pubs = await this.sourceService.listPublishers(orgId, category);
    return ApiResponse.success(pubs);
  }

  @Get(':slug')
  @RequireScope('news:read')
  async getPublisherProfile(
    @Param('slug') slug: string,
    @Principal() principal: AuthenticatedPrincipal
  ) {
    const profile = await this.sourceService.getPublisherProfile(
      slug,
      principal.organizationId,
      principal.id
    );
    return ApiResponse.success(profile);
  }

  @Get(':id/articles')
  @RequireScope('news:read')
  async listArticles(@Param('id') id: string, @Principal() principal: AuthenticatedPrincipal) {
    const articles = await this.sourceService.listArticlesForPublisher(
      id,
      principal.organizationId
    );
    return ApiResponse.success(articles);
  }

  @Post()
  @RequireScope('news:write')
  async createPublisher(
    @Body() body: CreatePublisherInput,
    @Principal() principal: AuthenticatedPrincipal,
    @Res({ passthrough: true }) reply: FastifyReply
  ) {
    const pub = await this.sourceService.createPublisher(body, principal.organizationId);
    reply.status(HttpStatus.CREATED);
    return ApiResponse.success(pub);
  }
}
