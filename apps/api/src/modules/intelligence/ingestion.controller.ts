import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CreateIngestionFeedInputSchema, PromoteIngestionItemInputSchema } from '@ai-news/schemas';
import type {
  IngestionFeed,
  IngestionItem,
  IngestFeedResult,
  PromoteIngestionItemResult,
  BreakingNewsCandidate,
} from '@ai-news/schemas';
import { IngestionService } from '@ai-news/stories';
import type { AuthenticatedPrincipal } from '@ai-news/auth';
import { NestAuthGuard, Principal, RequireScope, Roles } from '../../common/auth.guard';
import { db, intelligenceContext } from './context';

@Controller('api/ingestion')
@UseGuards(NestAuthGuard)
export class IngestionController {
  private readonly service = new IngestionService(db);

  @Get('feeds')
  @RequireScope('news:read')
  async listFeeds(@Principal() principal: AuthenticatedPrincipal): Promise<IngestionFeed[]> {
    return this.service.listFeeds(principal.organizationId);
  }

  @Post('feeds')
  @Roles('admin', 'editor', 'ai_agent')
  @RequireScope('news:write')
  async createFeed(
    @Body() body: unknown,
    @Principal() principal: AuthenticatedPrincipal
  ): Promise<IngestionFeed> {
    return this.service.createFeed(
      CreateIngestionFeedInputSchema.parse(body),
      intelligenceContext(principal)
    );
  }

  @Patch('feeds/:feedId')
  @Roles('admin', 'editor', 'ai_agent')
  @RequireScope('news:write')
  async updateFeed(
    @Param('feedId') feedId: string,
    @Body() body: unknown,
    @Principal() principal: AuthenticatedPrincipal
  ): Promise<IngestionFeed> {
    return this.service.updateFeed(feedId, body as never, intelligenceContext(principal));
  }

  @Delete('feeds/:feedId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles('admin', 'editor')
  @RequireScope('news:write')
  async deleteFeed(
    @Param('feedId') feedId: string,
    @Principal() principal: AuthenticatedPrincipal
  ): Promise<void> {
    await this.service.deleteFeed(feedId, intelligenceContext(principal));
  }

  @Post('feeds/:feedId/fetch')
  @HttpCode(HttpStatus.OK)
  @Roles('admin', 'editor', 'journalist', 'ai_agent')
  @RequireScope('news:write')
  async ingestFeed(
    @Param('feedId') feedId: string,
    @Principal() principal: AuthenticatedPrincipal
  ): Promise<IngestFeedResult> {
    return this.service.ingestFeed(feedId, intelligenceContext(principal));
  }

  @Post('fetch-all')
  @HttpCode(HttpStatus.OK)
  @Roles('admin', 'editor', 'ai_agent')
  @RequireScope('news:write')
  async ingestAll(@Principal() principal: AuthenticatedPrincipal): Promise<IngestFeedResult[]> {
    return this.service.ingestAll(intelligenceContext(principal));
  }

  @Get('items')
  @RequireScope('news:read')
  async listItems(
    @Query('feedId') feedId: string | undefined,
    @Query('status') status: string | undefined,
    @Query('query') query: string | undefined,
    @Query('limit') limit: string | undefined,
    @Query('offset') offset: string | undefined,
    @Principal() principal: AuthenticatedPrincipal
  ): Promise<IngestionItem[]> {
    return this.service.listItems(principal.organizationId, {
      feedId,
      status,
      query,
      limit: limit ? Math.min(200, Math.max(1, Number(limit) || 50)) : 50,
      offset: offset ? Math.max(0, Number(offset) || 0) : 0,
    });
  }

  @Get('items/:itemId')
  @RequireScope('news:read')
  async getItem(
    @Param('itemId') itemId: string,
    @Principal() principal: AuthenticatedPrincipal
  ): Promise<IngestionItem> {
    return this.service.getItem(itemId, principal.organizationId);
  }

  @Post('items/:itemId/promote')
  @HttpCode(HttpStatus.OK)
  @Roles('admin', 'editor', 'journalist', 'ai_agent')
  @RequireScope('news:write')
  async promoteItem(
    @Param('itemId') itemId: string,
    @Body() body: unknown,
    @Principal() principal: AuthenticatedPrincipal
  ): Promise<PromoteIngestionItemResult> {
    return this.service.promoteItem(
      itemId,
      PromoteIngestionItemInputSchema.parse({ ...(body as object), itemId }),
      intelligenceContext(principal)
    );
  }

  @Get('breaking-candidates')
  @RequireScope('news:read')
  async breakingCandidates(
    @Query('windowHours') windowHours: string | undefined,
    @Query('minIndependentSources') minSources: string | undefined,
    @Query('minStoryVelocity') minVelocity: string | undefined,
    @Query('limit') limit: string | undefined,
    @Principal() principal: AuthenticatedPrincipal
  ): Promise<BreakingNewsCandidate[]> {
    return this.service.detectBreakingCandidates(principal.organizationId, {
      windowHours: windowHours ? Number(windowHours) : undefined,
      minIndependentSources: minSources ? Number(minSources) : undefined,
      minStoryVelocity: minVelocity ? Number(minVelocity) : undefined,
      limit: limit ? Math.min(100, Math.max(1, Number(limit) || 20)) : 20,
    });
  }
}
