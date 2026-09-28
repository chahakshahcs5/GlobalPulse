import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Query,
  Body,
  Headers,
  UseGuards,
  HttpStatus,
  HttpCode,
  Res,
} from '@nestjs/common';
import { FastifyReply } from 'fastify';
import { StoryService, SchedulingService, PersonalizationService, ClusteringService, LiveblogService } from '@ai-news/stories';
import { db } from '@ai-news/database';
import { ApiResponse } from '../../common/response/api-response';
import { NestAuthGuard, RequireScope, Roles, Principal } from '../../common/auth.guard';
import { AuthenticatedPrincipal } from '@ai-news/auth';
import {
  CreateStoryInputSchema,
  UpdateStoryInputSchema,
  CreateStoryVersionInputSchema,
  PublishStoryInputSchema,
  ReorderBlocksInputSchema,
  StoryFilterSchema,
} from './stories.dto';
import { CreateLiveblogEntryInputSchema } from '@ai-news/schemas';

import type { Story, StoryBlock, StoryVersion, FullCoverageResult, LiveblogEntry } from '@ai-news/schemas';

@Controller('api/stories')
@UseGuards(NestAuthGuard)
export class StoriesController {
  private storyService: StoryService;
  private schedulingService: SchedulingService;
  private personalizationService: PersonalizationService;
  private clusteringService: ClusteringService;
  private liveblogService: LiveblogService;

  constructor() {
    this.storyService = new StoryService(db);
    this.schedulingService = new SchedulingService(db);
    this.personalizationService = new PersonalizationService(db);
    this.clusteringService = new ClusteringService(db);
    this.liveblogService = new LiveblogService(db);
  }

  @Get()
  @RequireScope('news:read')
  async listStories(@Query() query: unknown, @Principal() principal: AuthenticatedPrincipal) {
    const orgId = principal.organizationId;
    const validated = StoryFilterSchema.parse(query || {});
    const paginated = await this.storyService.listStoriesPaginated(validated, orgId);
    return ApiResponse.paginated(
      paginated.items,
      paginated.total,
      paginated.limit,
      paginated.nextCursor,
      paginated.offset
    );
  }


  @Post()
  @Roles('admin', 'editor', 'journalist', 'ai_agent')
  @RequireScope('news:write')
  async createStory(
    @Body() body: unknown,
    @Headers('x-request-id') requestId: string,
    @Principal() principal: AuthenticatedPrincipal,
    @Res({ passthrough: true }) reply: FastifyReply
  ): Promise<Story> {
    const validated = CreateStoryInputSchema.parse(body);
    const story = await this.storyService.createStory(validated, {
      organizationId: principal.organizationId,
      authorId: principal.id,
      clientType: principal.clientType,
      createdVia: 'api',
      requestId,
    });
    reply.status(HttpStatus.CREATED);
    return story;
  }

  @Get('review-queue')
  @Roles('admin', 'editor')
  @RequireScope('news:read')
  async getReviewQueue(@Principal() principal: AuthenticatedPrincipal) {
    const queue = await this.storyService.getReviewQueue(principal.organizationId);
    return ApiResponse.paginated(queue, queue.length, 50);
  }

  @Get('scheduled/list')
  @Roles('admin', 'editor', 'ai_agent')
  @RequireScope('news:read')
  async listScheduledStories(@Principal() principal: AuthenticatedPrincipal) {
    const scheduled = await this.schedulingService.listScheduledStories(principal.organizationId);
    return ApiResponse.paginated(scheduled, scheduled.length, 50);
  }

  @Post('scheduled/sweep')
  @HttpCode(HttpStatus.OK)
  @Roles('admin', 'editor', 'ai_agent')
  @RequireScope('news:publish')
  async sweepScheduledStories(@Principal() principal: AuthenticatedPrincipal) {
    const published = await this.schedulingService.publishDueStories(principal.organizationId);
    return { success: true, count: published.length, published };
  }

  /**
   * F2: Personalized For You Feed
   */
  @Get('personalized')
  @RequireScope('news:read')
  async getPersonalizedFeed(
    @Query('limit') limitStr: string,
    @Query('cursor') cursor: string,
    @Query('includeCompleted') includeCompletedStr: string,
    @Principal() principal: AuthenticatedPrincipal
  ) {
    const limit = limitStr ? parseInt(limitStr, 10) : 20;
    const includeCompleted = includeCompletedStr === 'true';
    const result = await this.personalizationService.getPersonalizedFeed({
      userId: principal.id,
      organizationId: principal.organizationId,
      limit,
      cursor,
      includeCompleted,
    });
    return ApiResponse.paginated(
      result.items,
      result.totalCount ?? result.items.length,
      result.limit,
      result.nextCursor
    );
  }

  @Get(':id/full-coverage')
  @RequireScope('news:read')
  async getFullCoverage(
    @Param('id') id: string,
    @Principal() principal: AuthenticatedPrincipal
  ): Promise<FullCoverageResult> {
    return await this.clusteringService.getFullCoverage(id, principal.organizationId);
  }

  @Get(':id/liveblog/entries')
  @RequireScope('news:read')
  async listLiveblogEntries(
    @Param('id') storyId: string,
    @Query('limit') limitStr: string
  ): Promise<LiveblogEntry[]> {
    const limit = limitStr ? parseInt(limitStr, 10) : 100;
    return await this.liveblogService.listEntries(storyId, limit);
  }

  @Post(':id/liveblog/entries')
  @HttpCode(HttpStatus.CREATED)
  @Roles('admin', 'editor', 'journalist', 'ai_agent')
  @RequireScope('news:write')
  async addLiveblogEntry(
    @Param('id') storyId: string,
    @Body() body: unknown,
    @Principal() principal: AuthenticatedPrincipal
  ): Promise<LiveblogEntry> {
    const validated = CreateLiveblogEntryInputSchema.parse(body);
    return await this.liveblogService.addEntry(
      storyId,
      validated,
      {
        id: principal.id,
        name: principal.id,
      },
      principal.organizationId
    );
  }

  @Get(':id')
  @RequireScope('news:read')
  async getStoryById(@Param('id') id: string, @Principal() principal: AuthenticatedPrincipal): Promise<Story> {
    return await this.storyService.getStory(id, principal.organizationId);
  }

  @Get('slug/:slug')
  @RequireScope('news:read')
  async getStoryBySlug(@Param('slug') slug: string, @Principal() principal: AuthenticatedPrincipal): Promise<Story> {
    return await this.storyService.getStoryBySlug(slug, principal.organizationId);
  }

  @Put(':id')
  @Roles('admin', 'editor', 'journalist', 'ai_agent')
  @RequireScope('news:write')
  async updateStory(
    @Param('id') id: string,
    @Body() body: unknown,
    @Headers('x-request-id') requestId: string,
    @Principal() principal: AuthenticatedPrincipal
  ): Promise<Story> {
    const validated = UpdateStoryInputSchema.parse(body);
    return await this.storyService.updateStory(id, validated, {
      organizationId: principal.organizationId,
      authorId: principal.id,
      clientType: principal.clientType,
      createdVia: 'api',
      requestId,
    });
  }

  @Post(':id/blocks')
  @Roles('admin', 'editor', 'journalist', 'ai_agent')
  @RequireScope('news:write')
  async addBlock(
    @Param('id') id: string,
    @Body() body: unknown,
    @Headers('x-request-id') requestId: string,
    @Principal() principal: AuthenticatedPrincipal,
    @Res({ passthrough: true }) reply: FastifyReply
  ): Promise<StoryBlock> {
    const result = await this.storyService.addBlock(id, body, {
      organizationId: principal.organizationId,
      authorId: principal.id,
      clientType: principal.clientType,
      createdVia: 'api',
      requestId,
    });
    reply.status(HttpStatus.CREATED);
    return result;
  }

  @Put(':id/blocks/:blockId')
  @Roles('admin', 'editor', 'journalist', 'ai_agent')
  @RequireScope('news:write')
  async updateBlock(
    @Param('id') id: string,
    @Param('blockId') blockId: string,
    @Body() body: unknown,
    @Headers('x-request-id') requestId: string,
    @Principal() principal: AuthenticatedPrincipal
  ): Promise<StoryBlock> {
    return await this.storyService.updateBlock(id, blockId, body, {
      organizationId: principal.organizationId,
      authorId: principal.id,
      clientType: principal.clientType,
      createdVia: 'api',
      requestId,
    });
  }

  @Delete(':id/blocks/:blockId')
  @Roles('admin', 'editor', 'journalist', 'ai_agent')
  @RequireScope('news:write')
  async removeBlock(
    @Param('id') id: string,
    @Param('blockId') blockId: string,
    @Headers('x-request-id') requestId: string,
    @Principal() principal: AuthenticatedPrincipal,
    @Res({ passthrough: true }) reply: FastifyReply
  ): Promise<void> {
    await this.storyService.removeBlock(id, blockId, {
      organizationId: principal.organizationId,
      authorId: principal.id,
      clientType: principal.clientType,
      createdVia: 'api',
      requestId,
    });
    reply.status(HttpStatus.NO_CONTENT);
  }

  @Put(':id/blocks/reorder')
  @Roles('admin', 'editor', 'journalist', 'ai_agent')
  @RequireScope('news:write')
  async reorderBlocks(
    @Param('id') id: string,
    @Body() body: unknown,
    @Headers('x-request-id') requestId: string,
    @Principal() principal: AuthenticatedPrincipal
  ): Promise<StoryBlock[]> {
    const validated = ReorderBlocksInputSchema.parse(body);
    return await this.storyService.reorderBlocks(id, validated.blockIds, {
      organizationId: principal.organizationId,
      authorId: principal.id,
      clientType: principal.clientType,
      createdVia: 'api',
      requestId,
    });
  }

  @Post(':id/versions')
  @Roles('admin', 'editor', 'journalist', 'ai_agent')
  @RequireScope('news:write')
  async createVersion(
    @Param('id') id: string,
    @Body() body: unknown,
    @Headers('x-request-id') requestId: string,
    @Principal() principal: AuthenticatedPrincipal,
    @Res({ passthrough: true }) reply: FastifyReply
  ): Promise<StoryVersion> {
    const validated = CreateStoryVersionInputSchema.parse(body);
    const version = await this.storyService.createStoryVersion(id, validated, {
      organizationId: principal.organizationId,
      authorId: principal.id,
      clientType: principal.clientType,
      createdVia: 'api',
      requestId,
    });
    reply.status(HttpStatus.CREATED);
    return version;
  }

  @Get(':id/versions')
  @RequireScope('news:read')
  async listVersions(@Param('id') id: string, @Principal() principal: AuthenticatedPrincipal): Promise<StoryVersion[]> {
    return await this.storyService.getStoryVersions(id, principal.organizationId);
  }

  @Get(':id/versions/:vId')
  @RequireScope('news:read')
  async getVersionById(
    @Param('id') id: string,
    @Param('vId') vId: string,
    @Principal() principal: AuthenticatedPrincipal
  ): Promise<StoryVersion> {
    const versionNumber = parseInt(vId, 10);
    return await this.storyService.getStoryVersion(id, isNaN(versionNumber) ? 1 : versionNumber, principal.organizationId);
  }

  @Post(':id/publish')
  @Roles('admin', 'editor', 'ai_agent')
  @RequireScope('news:publish')
  async publishStory(
    @Param('id') id: string,
    @Body() body: unknown,
    @Headers('x-request-id') requestId: string,
    @Principal() principal: AuthenticatedPrincipal,
    @Res({ passthrough: true }) reply: FastifyReply
  ): Promise<Story> {
    const validated = PublishStoryInputSchema.parse(body || {});
    const published = await this.storyService.publishStory(
      id,
      {
        organizationId: principal.organizationId,
        authorId: principal.id,
        clientType: principal.clientType,
        createdVia: 'api',
        requestId,
      },
      validated.idempotencyKey
    );
    reply.status(HttpStatus.OK);
    return published;
  }

  @Post(':id/schedule')
  @HttpCode(HttpStatus.OK)
  @Roles('admin', 'editor', 'journalist', 'ai_agent')
  @RequireScope('news:write')
  async scheduleStory(
    @Param('id') id: string,
    @Body() body: { publishAt: string },
    @Headers('x-request-id') requestId: string,
    @Principal() principal: AuthenticatedPrincipal
  ): Promise<Story> {
    return await this.schedulingService.scheduleStory(id, body?.publishAt, {
      organizationId: principal.organizationId,
      authorId: principal.id,
      clientType: principal.clientType,
      createdVia: 'api',
      requestId,
    });
  }

  @Post(':id/submit-review')
  @HttpCode(HttpStatus.OK)
  @Roles('admin', 'editor', 'journalist', 'ai_agent')
  @RequireScope('news:write')
  async submitReview(
    @Param('id') id: string,
    @Headers('x-request-id') requestId: string,
    @Principal() principal: AuthenticatedPrincipal
  ): Promise<Story> {
    return await this.storyService.submitForReview(id, {
      organizationId: principal.organizationId,
      authorId: principal.id,
      clientType: principal.clientType,
      createdVia: 'api',
      requestId,
    });
  }

  @Post(':id/review')
  @HttpCode(HttpStatus.OK)
  @Roles('admin', 'editor')
  @RequireScope('news:publish')
  async reviewStory(
    @Param('id') id: string,
    @Body() body: { action: 'approve' | 'reject'; feedback?: string },
    @Headers('x-request-id') requestId: string,
    @Principal() principal: AuthenticatedPrincipal
  ): Promise<Story> {
    return await this.storyService.reviewStory(id, body, {
      organizationId: principal.organizationId,
      authorId: principal.id,
      clientType: principal.clientType,
      createdVia: 'api',
      requestId,
    });
  }

  @Post(':id/approve')
  @HttpCode(HttpStatus.OK)
  @Roles('admin', 'editor')
  @RequireScope('news:publish')
  async approveStory(
    @Param('id') id: string,
    @Body() body: { feedback?: string },
    @Headers('x-request-id') requestId: string,
    @Principal() principal: AuthenticatedPrincipal
  ): Promise<Story> {
    return await this.storyService.reviewStory(id, { action: 'approve', feedback: body?.feedback }, {
      organizationId: principal.organizationId,
      authorId: principal.id,
      clientType: principal.clientType,
      createdVia: 'api',
      requestId,
    });
  }

  @Post(':id/reject')
  @HttpCode(HttpStatus.OK)
  @Roles('admin', 'editor')
  @RequireScope('news:publish')
  async rejectStory(
    @Param('id') id: string,
    @Body() body: { feedback?: string },
    @Headers('x-request-id') requestId: string,
    @Principal() principal: AuthenticatedPrincipal
  ): Promise<Story> {
    return await this.storyService.reviewStory(id, { action: 'reject', feedback: body?.feedback }, {
      organizationId: principal.organizationId,
      authorId: principal.id,
      clientType: principal.clientType,
      createdVia: 'api',
      requestId,
    });
  }

  @Post(':id/unpublish')
  @Roles('admin', 'editor')
  @RequireScope('news:publish')
  async unpublishStory(
    @Param('id') id: string,
    @Headers('x-request-id') requestId: string,
    @Principal() principal: AuthenticatedPrincipal
  ): Promise<Story> {
    return await this.storyService.unpublishStory(id, {
      organizationId: principal.organizationId,
      authorId: principal.id,
      clientType: principal.clientType,
      createdVia: 'api',
      requestId,
    });
  }

  @Post(':id/retract')
  @Roles('admin', 'editor')
  @RequireScope('news:publish')
  async retractStory(
    @Param('id') id: string,
    @Headers('x-request-id') requestId: string,
    @Principal() principal: AuthenticatedPrincipal
  ): Promise<Story> {
    return await this.storyService.unpublishStory(id, {
      organizationId: principal.organizationId,
      authorId: principal.id,
      clientType: principal.clientType,
      createdVia: 'api',
      requestId,
    });
  }

  @Post(':id/archive')
  @Roles('admin')
  @RequireScope('news:admin')
  async archiveStory(
    @Param('id') id: string,
    @Headers('x-request-id') requestId: string,
    @Principal() principal: AuthenticatedPrincipal
  ): Promise<Story> {
    return await this.storyService.archiveStory(id, {
      organizationId: principal.organizationId,
      authorId: principal.id,
      clientType: principal.clientType,
      createdVia: 'api',
      requestId,
    });
  }

  @Delete(':id')
  @Roles('admin')
  @RequireScope('news:admin')
  async deleteStory(
    @Param('id') id: string,
    @Headers('x-request-id') requestId: string,
    @Principal() principal: AuthenticatedPrincipal,
    @Res({ passthrough: true }) reply: FastifyReply
  ): Promise<{ success: boolean; message: string }> {
    const deleted = await this.storyService.deleteStory(id, {
      organizationId: principal.organizationId,
      authorId: principal.id,
      clientType: principal.clientType,
      createdVia: 'api',
      requestId,
    });
    if (!deleted) {
      reply.status(HttpStatus.NOT_FOUND);
      return { success: false, message: 'Story not found' };
    }
    return { success: true, message: 'Story permanently deleted' };
  }
}
