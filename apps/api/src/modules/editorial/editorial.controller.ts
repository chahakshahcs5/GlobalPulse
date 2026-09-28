import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Body,
  UseGuards,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { CollaborationService } from '@ai-news/stories';
import { db } from '@ai-news/database';
import { NestAuthGuard, RequireScope, Roles, Principal } from '../../common/auth.guard';
import type { AuthenticatedPrincipal } from '@ai-news/auth';
import { TransitionStatusInputSchema } from '@ai-news/schemas';
import type {
  StoryLock,
  StoryPresence,
  KanbanBoard,
  CalendarSchedule,
  Story,
} from '@ai-news/schemas';

@Controller('api')
@UseGuards(NestAuthGuard)
export class EditorialController {
  private collaborationService: CollaborationService;

  constructor() {
    this.collaborationService = new CollaborationService(db);
  }

  // --- F8: Multi-Author Presence & Locking ---

  @Post('stories/:id/lock/acquire')
  @HttpCode(HttpStatus.OK)
  @Roles('admin', 'editor', 'journalist', 'ai_agent')
  @RequireScope('news:write')
  async acquireLock(
    @Param('id') storyId: string,
    @Principal() principal: AuthenticatedPrincipal
  ): Promise<{ success: boolean; lock?: StoryLock; heldBy?: unknown }> {
    return await this.collaborationService.acquireLock(
      storyId,
      {
        id: principal.id,
        name: principal.id,
        role: principal.role,
        clientType: principal.clientType,
      },
      300,
      principal.organizationId
    );
  }

  @Post('stories/:id/lock/release')
  @HttpCode(HttpStatus.OK)
  @Roles('admin', 'editor', 'journalist', 'ai_agent')
  @RequireScope('news:write')
  async releaseLock(
    @Param('id') storyId: string,
    @Principal() principal: AuthenticatedPrincipal
  ): Promise<{ success: boolean }> {
    const success = await this.collaborationService.releaseLock(storyId, principal.id);
    return { success };
  }

  @Post('stories/:id/lock/heartbeat')
  @HttpCode(HttpStatus.OK)
  @Roles('admin', 'editor', 'journalist', 'ai_agent')
  @RequireScope('news:write')
  async heartbeat(
    @Param('id') storyId: string,
    @Principal() principal: AuthenticatedPrincipal
  ): Promise<{ success: boolean; expiresAt?: string }> {
    return await this.collaborationService.heartbeat(storyId, {
      id: principal.id,
      name: principal.id,
      role: principal.role,
      clientType: principal.clientType,
    });
  }

  @Get('stories/:id/presence')
  @RequireScope('news:read')
  async getPresence(
    @Param('id') storyId: string,
    @Principal() principal: AuthenticatedPrincipal
  ): Promise<StoryPresence> {
    this.collaborationService.pingPresence(storyId, { id: principal.id, name: principal.id });
    return await this.collaborationService.getPresence(storyId);
  }

  // --- F9: Editorial Kanban & Calendar ---

  @Get('editorial/kanban')
  @Roles('admin', 'editor', 'journalist', 'ai_agent')
  @RequireScope('news:read')
  async getKanbanBoard(@Principal() principal: AuthenticatedPrincipal): Promise<KanbanBoard> {
    return await this.collaborationService.getKanbanBoard(principal.organizationId);
  }

  @Get('editorial/calendar')
  @Roles('admin', 'editor', 'journalist', 'ai_agent')
  @RequireScope('news:read')
  async getCalendarSchedule(@Principal() principal: AuthenticatedPrincipal): Promise<CalendarSchedule> {
    return await this.collaborationService.getCalendarSchedule(principal.organizationId);
  }

  @Put('stories/:id/status')
  @HttpCode(HttpStatus.OK)
  @Roles('admin', 'editor', 'journalist', 'ai_agent')
  @RequireScope('news:write')
  async transitionStatus(
    @Param('id') storyId: string,
    @Body() body: unknown,
    @Principal() principal: AuthenticatedPrincipal
  ): Promise<Story> {
    const validated = TransitionStatusInputSchema.parse(body);
    return await this.collaborationService.transitionStoryStatus(
      storyId,
      validated.status,
      principal.organizationId,
      validated.scheduledPublishAt
    );
  }
}
