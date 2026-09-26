import { Controller, Get, Post, Query, Body, UseGuards } from '@nestjs/common';
import { SearchService } from '@ai-news/search';
import { db } from '@ai-news/database';
import { NestAuthGuard, RequireScope, Principal } from '../common/auth.guard';

@Controller('api/search')
@UseGuards(NestAuthGuard)
export class SearchController {
  private searchService: SearchService;

  constructor() {
    this.searchService = new SearchService(db);
  }

  @Get('stories')
  @RequireScope('news:read')
  async searchStories(@Query() query: any, @Principal() principal: any) {
    const orgId = principal.organizationId;
    return await this.searchService.searchStories(query, orgId);
  }

  @Post('similar')
  @RequireScope('news:read')
  async findSimilarStories(@Body() body: any, @Principal() principal: any) {
    const orgId = principal.organizationId;
    return await this.searchService.findSimilarStories(body, orgId);
  }

  @Get('federated')
  @RequireScope('news:read')
  async searchAll(@Query('q') q: string, @Principal() principal: any) {
    const orgId = principal.organizationId;
    const query = q || '';

    const [storiesResult, events, topics, entities, sources] = await Promise.all([
      this.searchService.searchStories({ query, limit: 10 }, orgId),
      this.searchService.searchEvents(query, orgId),
      this.searchService.searchTopics(query, orgId),
      this.searchService.searchEntities(query, orgId),
      this.searchService.searchSources(query, orgId),
    ]);

    return {
      stories: storiesResult.items,
      events,
      topics,
      entities,
      sources,
    };
  }
}
