import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { db } from '@ai-news/database';
import { AnalyticsService } from '@ai-news/stories';
import { NestAuthGuard, Principal, RequireScope } from '../../common/auth.guard';
import type { AuthenticatedPrincipal } from '@ai-news/auth';

@Controller('api/analytics')
@UseGuards(NestAuthGuard)
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
    const rawLimit = limit ? parseInt(limit, 10) : 10;
    const parsedLimit = Number.isFinite(rawLimit) ? Math.min(Math.max(rawLimit, 1), 50) : 10;
    return this.analyticsService.getTrendingStories(parsedLimit, orgId);
  }

  @Get('newsroom')
  @RequireScope('news:write')
  async getNewsroomMetrics(@Principal() principal: AuthenticatedPrincipal) {
    return this.analyticsService.getNewsroomMetrics(principal.organizationId);
  }
}
