import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CitizenTipsService } from '@ai-news/stories';
import { db } from '@ai-news/database';
import { NestAuthGuard, Principal, RequireScope } from '../../common/auth.guard';
import type { AuthenticatedPrincipal } from '@ai-news/auth';
import { ReviewCitizenTipInputSchema, SubmitCitizenTipInputSchema } from '@ai-news/schemas';

@Controller('api/tips')
@UseGuards(NestAuthGuard)
export class TipsController {
  private readonly tipsService = new CitizenTipsService(db);

  /**
   * Public tip intake. The endpoint deliberately requires no write scope: a
   * whistleblower is not a newsroom user. Rate limiting still applies.
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async submitTip(@Body() body: unknown, @Principal() principal: AuthenticatedPrincipal) {
    const input = SubmitCitizenTipInputSchema.parse(body);
    return this.tipsService.submitTip(input, principal.organizationId);
  }

  @Get()
  @RequireScope('news:write')
  async listTips(
    @Query('status') status: string,
    @Query('urgency') urgency: string,
    @Query('category') category: string,
    @Query('limit') limit: string,
    @Principal() principal: AuthenticatedPrincipal
  ) {
    return this.tipsService.listTips(principal.organizationId, {
      status: status as never,
      urgency: urgency as never,
      category,
      limit: limit ? parseInt(limit, 10) : 50,
    });
  }

  @Get(':id')
  @RequireScope('news:write')
  async getTip(@Param('id') id: string, @Principal() principal: AuthenticatedPrincipal) {
    return this.tipsService.getTipById(id, principal.organizationId);
  }

  @Patch(':id')
  @RequireScope('news:write')
  async reviewTip(
    @Param('id') id: string,
    @Body() body: unknown,
    @Principal() principal: AuthenticatedPrincipal
  ) {
    const input = ReviewCitizenTipInputSchema.parse(body);
    return this.tipsService.reviewTip(
      id,
      input.status,
      input.editorialNotes,
      principal.organizationId
    );
  }
}
