import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Body,
  UseGuards,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { ClusteringService } from '@ai-news/stories';
import { db } from '@ai-news/database';
import { NestAuthGuard, RequireScope, Roles, Principal } from '../../common/auth.guard';
import type { AuthenticatedPrincipal } from '@ai-news/auth';
import { CreateClusterInputSchema } from '@ai-news/schemas';
import type { StoryCluster, FullCoverageResult } from '@ai-news/schemas';

@Controller('api/clusters')
@UseGuards(NestAuthGuard)
export class ClusteringController {
  private clusteringService: ClusteringService;

  constructor() {
    this.clusteringService = new ClusteringService(db);
  }

  @Get()
  @RequireScope('news:read')
  async listClusters(
    @Query('limit') limitStr: string,
    @Principal() principal: AuthenticatedPrincipal
  ): Promise<StoryCluster[]> {
    const limit = limitStr ? parseInt(limitStr, 10) : 20;
    return await this.clusteringService.listClusters(principal.organizationId, limit);
  }

  @Get(':id')
  @RequireScope('news:read')
  async getCluster(
    @Param('id') id: string,
    @Principal() principal: AuthenticatedPrincipal
  ): Promise<StoryCluster | null> {
    return await this.clusteringService.getCluster(id, principal.organizationId);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles('admin', 'editor', 'journalist', 'ai_agent')
  @RequireScope('news:write')
  async createCluster(
    @Body() body: unknown,
    @Principal() principal: AuthenticatedPrincipal
  ): Promise<StoryCluster> {
    const validated = CreateClusterInputSchema.parse(body);
    return await this.clusteringService.createCluster(validated, principal.organizationId);
  }

  @Get('coverage/:storyId')
  @RequireScope('news:read')
  async getFullCoverage(
    @Param('storyId') storyId: string,
    @Principal() principal: AuthenticatedPrincipal
  ): Promise<FullCoverageResult> {
    return await this.clusteringService.getFullCoverage(storyId, principal.organizationId);
  }
}
