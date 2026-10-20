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
import { z } from 'zod';
import { AlertService } from '@ai-news/stories';
import { CreateAlertRuleInputSchema, UpdateAlertRuleInputSchema } from '@ai-news/schemas';
import type { AlertRule, AlertTrigger, EvaluateAlertsResult } from '@ai-news/schemas';
import type { AuthenticatedPrincipal } from '@ai-news/auth';
import { NestAuthGuard, Principal, RequireScope, Roles } from '../../common/auth.guard';
import { db, intelligenceContext } from './context';

const EvaluateAlertInputSchema = z.object({
  resourceType: z.enum(['EVENT', 'STORY', 'INGESTION_ITEM']),
  resourceId: z.string().min(1),
});

@Controller('api/alerts')
@UseGuards(NestAuthGuard)
export class AlertsController {
  private readonly service = new AlertService(db);

  @Get('rules')
  @RequireScope('news:read')
  async listRules(
    @Query('enabled') enabled: string | undefined,
    @Principal() principal: AuthenticatedPrincipal
  ): Promise<AlertRule[]> {
    // The reader sees the organization-wide rules plus their own personal ones.
    return this.service.listRules(
      principal.organizationId,
      enabled === undefined ? undefined : enabled === 'true',
      principal.id
    );
  }

  @Get('rules/:id')
  @RequireScope('news:read')
  async getRule(
    @Param('id') id: string,
    @Principal() principal: AuthenticatedPrincipal
  ): Promise<AlertRule> {
    return this.service.getRule(id, principal.organizationId);
  }

  @Post('rules')
  @Roles('admin', 'editor', 'ai_agent')
  @RequireScope('news:write')
  async createRule(
    @Body() body: unknown,
    @Principal() principal: AuthenticatedPrincipal
  ): Promise<AlertRule> {
    return this.service.createRule(
      CreateAlertRuleInputSchema.parse(body),
      intelligenceContext(principal)
    );
  }

  @Patch('rules/:id')
  @Roles('admin', 'editor', 'ai_agent')
  @RequireScope('news:write')
  async updateRule(
    @Param('id') id: string,
    @Body() body: unknown,
    @Principal() principal: AuthenticatedPrincipal
  ): Promise<AlertRule> {
    return this.service.updateRule(
      id,
      UpdateAlertRuleInputSchema.parse(body),
      intelligenceContext(principal)
    );
  }

  @Delete('rules/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles('admin', 'editor')
  @RequireScope('news:write')
  async deleteRule(
    @Param('id') id: string,
    @Principal() principal: AuthenticatedPrincipal
  ): Promise<void> {
    await this.service.deleteRule(id, intelligenceContext(principal));
  }

  @Get('triggers')
  @RequireScope('news:read')
  async listTriggers(
    @Query('limit') limit: string | undefined,
    @Principal() principal: AuthenticatedPrincipal
  ): Promise<AlertTrigger[]> {
    const parsed = limit ? Math.min(200, Math.max(1, Number(limit) || 50)) : 50;
    return this.service.listTriggers(principal.organizationId, parsed);
  }

  @Post('evaluate')
  @HttpCode(HttpStatus.OK)
  @Roles('admin', 'editor', 'journalist', 'ai_agent')
  @RequireScope('news:write')
  async evaluate(
    @Body() body: unknown,
    @Principal() principal: AuthenticatedPrincipal
  ): Promise<EvaluateAlertsResult> {
    const validated = EvaluateAlertInputSchema.parse(body);
    return this.service.evaluate(
      validated.resourceType,
      validated.resourceId,
      intelligenceContext(principal)
    );
  }
}
