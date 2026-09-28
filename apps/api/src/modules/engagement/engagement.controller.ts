import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
  HttpStatus,
  HttpCode,
  Res,
} from '@nestjs/common';
import { FastifyReply } from 'fastify';
import { EngagementService } from '@ai-news/stories';
import { db } from '@ai-news/database';
import { NestAuthGuard, RequireScope, Roles, Principal } from '../../common/auth.guard';
import type { AuthenticatedPrincipal } from '@ai-news/auth';
import type {
  CreateCommentInput,
  ModerateCommentInput,
  StoryReactionType,
} from '@ai-news/schemas';

@Controller('api')
@UseGuards(NestAuthGuard)
export class EngagementController {
  private engagementService: EngagementService;

  constructor() {
    this.engagementService = new EngagementService(db);
  }

  // ---------------------------------------------------------------------------
  // Comments
  // ---------------------------------------------------------------------------

  @Get('stories/:id/comments')
  @RequireScope('news:read')
  async getComments(
    @Param('id') storyId: string,
    @Principal() principal: AuthenticatedPrincipal
  ) {
    // Readers only see approved comments; editors/admins see all
    const isEditor = ['editor', 'admin'].includes(principal.role);
    return await this.engagementService.getComments(
      storyId,
      isEditor ? undefined : { status: 'approved' },
      principal.organizationId
    );
  }

  @Post('stories/:id/comments')
  @RequireScope('news:read')
  async createComment(
    @Param('id') storyId: string,
    @Body() body: CreateCommentInput,
    @Principal() principal: AuthenticatedPrincipal,
    @Res({ passthrough: true }) reply: FastifyReply
  ) {
    const comment = await this.engagementService.createComment(storyId, body, {
      authorId: principal.id,
      authorName: body.authorName || principal.id,
      authorRole: (principal.role as any) || 'reader',
      organizationId: principal.organizationId,
    });
    reply.status(HttpStatus.CREATED);
    return comment;
  }

  @Put('comments/:commentId/moderate')
  @HttpCode(HttpStatus.OK)
  @Roles('admin', 'editor')
  @RequireScope('news:publish')
  async moderateComment(
    @Param('commentId') commentId: string,
    @Body() body: ModerateCommentInput,
    @Principal() principal: AuthenticatedPrincipal
  ) {
    return await this.engagementService.moderateComment(commentId, body, {
      moderatorId: principal.id,
      organizationId: principal.organizationId,
    });
  }

  @Delete('comments/:commentId')
  @Roles('admin', 'editor')
  @RequireScope('news:admin')
  async deleteComment(
    @Param('commentId') commentId: string,
    @Principal() principal: AuthenticatedPrincipal,
    @Res({ passthrough: true }) reply: FastifyReply
  ) {
    const deleted = await this.engagementService.deleteComment(
      commentId,
      principal.organizationId
    );
    if (!deleted) {
      reply.status(HttpStatus.NOT_FOUND);
      return { success: false, message: 'Comment not found' };
    }
    return { success: true, message: 'Comment removed' };
  }

  // ---------------------------------------------------------------------------
  // Reactions
  // ---------------------------------------------------------------------------

  @Get('stories/:id/reactions')
  @RequireScope('news:read')
  async getReactions(
    @Param('id') storyId: string,
    @Principal() principal: AuthenticatedPrincipal
  ) {
    return await this.engagementService.getReactions(storyId, principal.id);
  }

  @Post('stories/:id/reactions')
  @HttpCode(HttpStatus.OK)
  @RequireScope('news:read')
  async toggleReaction(
    @Param('id') storyId: string,
    @Body('reactionType') reactionType: StoryReactionType,
    @Principal() principal: AuthenticatedPrincipal
  ) {
    return await this.engagementService.toggleReaction(storyId, reactionType || 'like', {
      userId: principal.id,
      organizationId: principal.organizationId,
    });
  }

  // ---------------------------------------------------------------------------
  // Bookmarks
  // ---------------------------------------------------------------------------

  @Get('bookmarks')
  @RequireScope('news:read')
  async listBookmarks(@Principal() principal: AuthenticatedPrincipal) {
    return await this.engagementService.listBookmarks(
      principal.id,
      principal.organizationId
    );
  }

  @Post('bookmarks/:storyId')
  @HttpCode(HttpStatus.OK)
  @RequireScope('news:read')
  async toggleBookmark(
    @Param('storyId') storyId: string,
    @Principal() principal: AuthenticatedPrincipal
  ) {
    return await this.engagementService.toggleBookmark(storyId, {
      userId: principal.id,
      organizationId: principal.organizationId,
    });
  }
}
