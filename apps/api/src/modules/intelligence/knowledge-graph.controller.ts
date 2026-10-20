import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CreateKnowledgeEdgeInputSchema, GraphQueryInputSchema } from '@ai-news/schemas';
import type { KnowledgeEdge } from '@ai-news/schemas';
import { KnowledgeGraphService } from '@ai-news/stories';
import type { AuthenticatedPrincipal } from '@ai-news/auth';
import { NestAuthGuard, Principal, RequireScope, Roles } from '../../common/auth.guard';
import { db, intelligenceContext } from './context';

@Controller('api/graph')
@UseGuards(NestAuthGuard)
export class KnowledgeGraphController {
  private readonly service = new KnowledgeGraphService(db);

  @Get('edges')
  @RequireScope('news:read')
  async listEdges(
    @Query('fromType') fromType: string | undefined,
    @Query('fromId') fromId: string | undefined,
    @Query('toType') toType: string | undefined,
    @Query('toId') toId: string | undefined,
    @Query('relation') relation: string | undefined,
    @Query('limit') limit: string | undefined,
    @Principal() principal: AuthenticatedPrincipal
  ): Promise<KnowledgeEdge[]> {
    return this.service.listEdges(principal.organizationId, {
      fromType,
      fromId,
      toType,
      toId,
      relation,
      limit: limit ? Math.min(500, Math.max(1, Number(limit) || 100)) : 100,
    });
  }

  @Post('edges')
  @Roles('admin', 'editor', 'journalist', 'ai_agent')
  @RequireScope('news:write')
  async addEdge(
    @Body() body: unknown,
    @Principal() principal: AuthenticatedPrincipal
  ): Promise<KnowledgeEdge> {
    return this.service.addEdge(
      CreateKnowledgeEdgeInputSchema.parse(body),
      intelligenceContext(principal)
    );
  }

  @Delete('edges/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles('admin', 'editor')
  @RequireScope('news:write')
  async deleteEdge(
    @Param('id') id: string,
    @Principal() principal: AuthenticatedPrincipal
  ): Promise<void> {
    await this.service.deleteEdge(id, intelligenceContext(principal));
  }

  @Get('neighborhood')
  @RequireScope('news:read')
  async neighborhood(
    @Query('nodeType') nodeType: string,
    @Query('nodeId') nodeId: string,
    @Query('depth') depth: string | undefined,
    @Query('limit') limit: string | undefined,
    @Principal() principal: AuthenticatedPrincipal
  ) {
    const validated = GraphQueryInputSchema.parse({
      nodeType,
      nodeId,
      depth: depth ? Number(depth) : 1,
      limit: limit ? Number(limit) : 100,
    });
    return this.service.query(validated, principal.organizationId);
  }

  @Post('query')
  @HttpCode(HttpStatus.OK)
  @RequireScope('news:read')
  async query(@Body() body: unknown, @Principal() principal: AuthenticatedPrincipal) {
    return this.service.query(GraphQueryInputSchema.parse(body), principal.organizationId);
  }

  @Post('stories/:storyId/index')
  @HttpCode(HttpStatus.OK)
  @Roles('admin', 'editor', 'journalist', 'ai_agent')
  @RequireScope('news:write')
  async indexStory(
    @Param('storyId') storyId: string,
    @Principal() principal: AuthenticatedPrincipal
  ): Promise<KnowledgeEdge[]> {
    const story = await db.stories.findById(storyId, principal.organizationId);
    if (!story) {
      return [];
    }
    return this.service.indexStory(story, intelligenceContext(principal));
  }
}
