import { Controller, Get, Post, Param, Query, Body, UseGuards, HttpStatus, Res } from '@nestjs/common';
import { FastifyReply } from 'fastify';
import { SourceService } from '@ai-news/sources';
import { db } from '@ai-news/database';
import { ApiResponse } from '../../common/response/api-response';
import { NestAuthGuard, RequireScope, Principal } from '../../common/auth.guard';

@Controller('api/sources')
@UseGuards(NestAuthGuard)
export class SourcesController {
  private sourceService: SourceService;

  constructor() {
    this.sourceService = new SourceService(db);
  }

  @Get()
  @RequireScope('news:read')
  async listSources(@Query('query') query: string, @Principal() principal: any) {
    const orgId = principal.organizationId;
    if (query) {
      const sources = await this.sourceService.searchSources(query, orgId);
      return ApiResponse.success(sources);
    }
    return await this.sourceService.listSources(orgId);
  }

  @Get(':id')
  @RequireScope('news:read')
  async getSource(@Param('id') id: string, @Principal() principal: any) {
    return await this.sourceService.getSource(id, principal.organizationId);
  }

  @Post()
  @RequireScope('news:write')
  async createSource(
    @Body() body: any,
    @Principal() principal: any,
    @Res({ passthrough: true }) reply: FastifyReply
  ) {
    const source = await this.sourceService.createSource(body, principal.organizationId);
    reply.status(HttpStatus.CREATED);
    return source;
  }

  @Post('attach')
  @RequireScope('news:write')
  async attachSource(@Body() body: { storyId: string; sourceId: string }, @Principal() principal: any) {
    await this.sourceService.attachSourceToStory(body.storyId, body.sourceId, principal.organizationId);
    return { success: true, storyId: body.storyId, sourceId: body.sourceId };
  }

  @Post('citations')
  @RequireScope('news:write')
  async createCitation(
    @Body() body: any,
    @Principal() principal: any,
    @Res({ passthrough: true }) reply: FastifyReply
  ) {
    const citation = await this.sourceService.createCitation({
      ...body,
      orgId: principal.organizationId,
    });
    reply.status(HttpStatus.CREATED);
    return citation;
  }

  @Get(':id/citations')
  @RequireScope('news:read')
  async listCitations(@Param('id') id: string) {
    return await this.sourceService.listCitationsForSource(id);
  }
}
