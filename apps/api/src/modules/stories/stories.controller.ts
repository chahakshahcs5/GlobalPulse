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
  Res,
} from '@nestjs/common';
import { FastifyReply } from 'fastify';
import { StoryService } from '@ai-news/stories';
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
  StoryFilter,
} from './stories.dto';
import type { Story, StoryBlock, StoryVersion } from '@ai-news/schemas';

@Controller('api/stories')
@UseGuards(NestAuthGuard)
export class StoriesController {
  private storyService: StoryService;

  constructor() {
    this.storyService = new StoryService(db);
  }

  @Get()
  @RequireScope('news:read')
  async listStories(@Query() query: StoryFilter, @Principal() principal: AuthenticatedPrincipal) {
    const orgId = principal.organizationId;
    const stories = await this.storyService.listStories(query, orgId);
    return ApiResponse.paginated(stories, stories.length, query?.limit || 50);
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
}
