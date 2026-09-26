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
import { NestAuthGuard, RequireScope, Principal } from '../common/auth.guard';
import {
  CreateStoryInputSchema,
  UpdateStoryInputSchema,
  CreateStoryVersionInputSchema,
  PublishStoryInputSchema,
  ReorderBlocksInputSchema,
} from '../../modules/stories/stories.dto';

@Controller('api/stories')
@UseGuards(NestAuthGuard)
export class StoriesController {
  private storyService: StoryService;

  constructor() {
    this.storyService = new StoryService(db);
  }

  @Get()
  @RequireScope('news:read')
  async listStories(@Query() query: any, @Principal() principal: any) {
    const orgId = principal.organizationId;
    const stories = await this.storyService.listStories(query, orgId);
    return ApiResponse.paginated(stories, stories.length, query?.limit || 50);
  }

  @Post()
  @RequireScope('news:write')
  async createStory(
    @Body() body: any,
    @Headers('x-request-id') requestId: string,
    @Principal() principal: any,
    @Res({ passthrough: true }) reply: FastifyReply
  ) {
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
  async getStoryById(@Param('id') id: string, @Principal() principal: any) {
    return await this.storyService.getStory(id, principal.organizationId);
  }

  @Get('slug/:slug')
  @RequireScope('news:read')
  async getStoryBySlug(@Param('slug') slug: string, @Principal() principal: any) {
    return await this.storyService.getStoryBySlug(slug, principal.organizationId);
  }

  @Put(':id')
  @RequireScope('news:write')
  async updateStory(
    @Param('id') id: string,
    @Body() body: any,
    @Headers('x-request-id') requestId: string,
    @Principal() principal: any
  ) {
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
  @RequireScope('news:write')
  async addBlock(
    @Param('id') id: string,
    @Body() body: any,
    @Headers('x-request-id') requestId: string,
    @Principal() principal: any,
    @Res({ passthrough: true }) reply: FastifyReply
  ) {
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
  @RequireScope('news:write')
  async updateBlock(
    @Param('id') id: string,
    @Param('blockId') blockId: string,
    @Body() body: any,
    @Headers('x-request-id') requestId: string,
    @Principal() principal: any
  ) {
    return await this.storyService.updateBlock(id, blockId, body, {
      organizationId: principal.organizationId,
      authorId: principal.id,
      clientType: principal.clientType,
      createdVia: 'api',
      requestId,
    });
  }

  @Delete(':id/blocks/:blockId')
  @RequireScope('news:write')
  async removeBlock(
    @Param('id') id: string,
    @Param('blockId') blockId: string,
    @Headers('x-request-id') requestId: string,
    @Principal() principal: any,
    @Res({ passthrough: true }) reply: FastifyReply
  ) {
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
  @RequireScope('news:write')
  async reorderBlocks(
    @Param('id') id: string,
    @Body() body: any,
    @Headers('x-request-id') requestId: string,
    @Principal() principal: any
  ) {
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
  @RequireScope('news:write')
  async createVersion(
    @Param('id') id: string,
    @Body() body: any,
    @Headers('x-request-id') requestId: string,
    @Principal() principal: any,
    @Res({ passthrough: true }) reply: FastifyReply
  ) {
    const validated = CreateStoryVersionInputSchema.parse({ ...body, storyId: id });
    const version = await this.storyService.createStoryVersion(validated, {
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
  async listVersions(@Param('id') id: string, @Principal() principal: any) {
    const versions = await this.storyService.getStoryVersions(id, principal.organizationId);
    return ApiResponse.success(versions);
  }

  @Get(':id/versions/:vId')
  @RequireScope('news:read')
  async getVersionById(
    @Param('id') id: string,
    @Param('vId') vId: string,
    @Principal() principal: any
  ) {
    return await this.storyService.getStoryVersion(id, vId, principal.organizationId);
  }

  @Post(':id/publish')
  @RequireScope('news:publish')
  async publishStory(
    @Param('id') id: string,
    @Body() body: any,
    @Headers('x-request-id') requestId: string,
    @Principal() principal: any
  ) {
    const validated = PublishStoryInputSchema.parse(body || {});
    return await this.storyService.publishStory(id, {
      organizationId: principal.organizationId,
      authorId: principal.id,
      clientType: principal.clientType,
      createdVia: 'api',
      requestId,
      idempotencyKey: validated.idempotencyKey,
    });
  }

  @Post(':id/unpublish')
  @RequireScope('news:publish')
  async unpublishStory(
    @Param('id') id: string,
    @Headers('x-request-id') requestId: string,
    @Principal() principal: any
  ) {
    return await this.storyService.unpublishStory(id, {
      organizationId: principal.organizationId,
      authorId: principal.id,
      clientType: principal.clientType,
      createdVia: 'api',
      requestId,
    });
  }

  @Post(':id/retract')
  @RequireScope('news:publish')
  async retractStory(
    @Param('id') id: string,
    @Body('reason') reason: string,
    @Headers('x-request-id') requestId: string,
    @Principal() principal: any
  ) {
    return await this.storyService.retractStory(id, reason, {
      organizationId: principal.organizationId,
      authorId: principal.id,
      clientType: principal.clientType,
      createdVia: 'api',
      requestId,
    });
  }

  @Post(':id/archive')
  @RequireScope('news:admin')
  async archiveStory(
    @Param('id') id: string,
    @Headers('x-request-id') requestId: string,
    @Principal() principal: any
  ) {
    return await this.storyService.archiveStory(id, {
      organizationId: principal.organizationId,
      authorId: principal.id,
      clientType: principal.clientType,
      createdVia: 'api',
      requestId,
    });
  }
}
