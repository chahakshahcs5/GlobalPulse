import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Query,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { db } from '@ai-news/database';
import { NotificationService, type StoryContext } from '@ai-news/stories';
import { NestAuthGuard, Principal } from '../../common/auth.guard';
import {
  BroadcastBreakingNewsInputSchema,
  SendEditorialAlertInputSchema,
} from '@ai-news/schemas';
import { AuthService, type AuthenticatedPrincipal } from '@ai-news/auth';

@Controller('api/notifications')
export class NotificationsController {
  private notificationService = new NotificationService(db);

  @Get()
  async listNotifications(
    @Query('limit') limit?: string,
    @Principal() principal?: AuthenticatedPrincipal
  ) {
    const orgId = principal?.organizationId || 'org_default';
    const parsedLimit = limit ? parseInt(limit, 10) : 50;
    return this.notificationService.listNotifications(orgId, parsedLimit);
  }

  @Post('breaking')
  @UseGuards(NestAuthGuard)
  @HttpCode(HttpStatus.OK)
  async broadcastBreakingNews(
    @Body() body: unknown,
    @Principal() principal: AuthenticatedPrincipal
  ) {
    AuthService.requireRole(principal, 'admin', 'editor', 'ai_agent');
    AuthService.requireScope(principal, 'news:publish');

    const validated = BroadcastBreakingNewsInputSchema.parse(body);
    const ctx: StoryContext = {
      organizationId: principal.organizationId,
      authorId: principal.id,
      clientType: principal.clientType,
      createdVia: 'api',
    };

    return this.notificationService.broadcastBreakingNews(
      validated.storyId,
      validated.headline,
      validated.urgency,
      ctx
    );
  }

  @Post('editorial')
  @UseGuards(NestAuthGuard)
  @HttpCode(HttpStatus.OK)
  async sendEditorialAlert(
    @Body() body: unknown,
    @Principal() principal: AuthenticatedPrincipal
  ) {
    AuthService.requireScope(principal, 'news:write');

    const validated = SendEditorialAlertInputSchema.parse(body);
    const ctx: StoryContext = {
      organizationId: principal.organizationId,
      authorId: principal.id,
      clientType: principal.clientType,
      createdVia: 'api',
    };

    return this.notificationService.sendEditorialAlert(validated, ctx);
  }

  @Put(':id/read')
  @HttpCode(HttpStatus.OK)
  async markAsRead(@Param('id') id: string) {
    const success = await this.notificationService.markAsRead(id);
    return { success };
  }
}
