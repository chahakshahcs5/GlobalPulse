import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { WebhookService } from '@ai-news/stories';
import { db } from '@ai-news/database';
import { NestAuthGuard, RequireScope, Roles, Principal } from '../../common/auth.guard';
import type { AuthenticatedPrincipal } from '@ai-news/auth';
import { RegisterWebhookInputSchema } from '@ai-news/schemas';
import type { WebhookSubscription, WebhookDispatchLog } from '@ai-news/schemas';

@Controller('api/mcp/webhooks')
@UseGuards(NestAuthGuard)
@Roles('admin', 'ai_agent')
@RequireScope('news:admin')
export class WebhooksController {
  private webhookService: WebhookService;

  constructor() {
    this.webhookService = new WebhookService(db);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async registerWebhook(
    @Body() body: unknown,
    @Principal() principal: AuthenticatedPrincipal
  ): Promise<WebhookSubscription> {
    const input = RegisterWebhookInputSchema.parse(body);
    return await this.webhookService.registerWebhook(principal.organizationId, input);
  }

  @Get()
  async listWebhooks(
    @Principal() principal: AuthenticatedPrincipal
  ): Promise<WebhookSubscription[]> {
    return await this.webhookService.listWebhooks(principal.organizationId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async deleteWebhook(
    @Param('id') id: string,
    @Principal() principal: AuthenticatedPrincipal
  ): Promise<{ success: boolean }> {
    const success = await this.webhookService.deleteWebhook(id, principal.organizationId);
    return { success };
  }

  @Post('test-dispatch')
  @HttpCode(HttpStatus.OK)
  async testDispatch(
    @Body() body: { event: string; payload?: Record<string, unknown> },
    @Principal() principal: AuthenticatedPrincipal
  ): Promise<WebhookDispatchLog[]> {
    return await this.webhookService.dispatch(
      body.event as any,
      body.payload || {},
      principal.organizationId
    );
  }
}
