import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { FactCheckService } from '@ai-news/stories';
import { db } from '@ai-news/database';
import { NestAuthGuard, RequireScope, Roles, Principal } from '../../common/auth.guard';
import type { AuthenticatedPrincipal } from '@ai-news/auth';
import { CheckDuplicateInputSchema } from '@ai-news/schemas';
import type {
  FactCheckClaim,
  StoryCredibilityAssessment,
  DuplicateCheckResult,
} from '@ai-news/schemas';

@Controller('api')
@UseGuards(NestAuthGuard)
export class FactCheckController {
  private factCheckService: FactCheckService;

  constructor() {
    this.factCheckService = new FactCheckService(db);
  }

  @Get('fact-checks')
  @RequireScope('news:read')
  async listFactChecks(): Promise<FactCheckClaim[]> {
    return await this.factCheckService.listFactChecks();
  }

  @Get('stories/:id/credibility')
  @RequireScope('news:read')
  async getStoryCredibility(
    @Param('id') id: string,
    @Principal() principal: AuthenticatedPrincipal
  ): Promise<StoryCredibilityAssessment> {
    return await this.factCheckService.evaluateStoryCredibility(id, principal.organizationId);
  }

  @Post('stories/:id/credibility/evaluate')
  @HttpCode(HttpStatus.OK)
  @RequireScope('news:read')
  async evaluateStoryCredibility(
    @Param('id') id: string,
    @Principal() principal: AuthenticatedPrincipal
  ): Promise<StoryCredibilityAssessment> {
    return await this.factCheckService.evaluateStoryCredibility(id, principal.organizationId);
  }

  @Post('stories/check-duplication')
  @HttpCode(HttpStatus.OK)
  @Roles('admin', 'editor', 'journalist', 'ai_agent')
  @RequireScope('news:write')
  async checkDuplication(
    @Body() body: unknown,
    @Principal() principal: AuthenticatedPrincipal
  ): Promise<DuplicateCheckResult> {
    const validated = CheckDuplicateInputSchema.parse(body);
    return await this.factCheckService.checkDuplication(validated, principal.organizationId);
  }
}
