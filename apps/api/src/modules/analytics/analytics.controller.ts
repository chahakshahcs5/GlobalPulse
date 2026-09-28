import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { db } from '@ai-news/database';
import { AnalyticsService } from '@ai-news/stories';
import { NestAuthGuard, Principal } from '../../common/auth.guard';
import type { AuthenticatedPrincipal } from '@ai-news/auth';

@Controller('api/analytics')
export class AnalyticsController {
  private analyticsService = new AnalyticsService(db);

  @Get('stories/:id')
  async getStoryAnalytics(
    @Param('id') storyId: string,
    @Principal() principal?: AuthenticatedPrincipal
  ) {
    const orgId = principal?.organizationId || 'org_default';
    return this.analyticsService.getStoryAnalytics(storyId, orgId);
  }

  @Get('trending')
  async getTrendingStories(
    @Query('limit') limit?: string,
    @Principal() principal?: AuthenticatedPrincipal
  ) {
    const orgId = principal?.organizationId || 'org_default';
    const parsedLimit = limit ? parseInt(limit, 10) : 10;
    return this.analyticsService.getTrendingStories(parsedLimit, orgId);
  }

  @Get('newsroom')
  @UseGuards(NestAuthGuard)
  async getNewsroomMetrics(@Principal() principal: AuthenticatedPrincipal) {
    return this.analyticsService.getNewsroomMetrics(principal.organizationId);
  }
}
