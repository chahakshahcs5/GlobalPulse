import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CreateSourceCorrectionInputSchema } from '@ai-news/schemas';
import type { SourceCorrection, SourceIntelligence } from '@ai-news/schemas';
import { SourceIntelligenceService } from '@ai-news/stories';
import type { AuthenticatedPrincipal } from '@ai-news/auth';
import { NestAuthGuard, Principal, RequireScope, Roles } from '../../common/auth.guard';
import { db, intelligenceContext } from './context';

@Controller('api')
@UseGuards(NestAuthGuard)
export class SourceIntelligenceController {
  private readonly service = new SourceIntelligenceService(db);

  @Get('publishers/:publisherId/intelligence')
  @RequireScope('news:read')
  async getPublisherIntelligence(
    @Param('publisherId') publisherId: string,
    @Principal() principal: AuthenticatedPrincipal
  ): Promise<SourceIntelligence> {
    return this.service.getPublisherIntelligence(publisherId, principal.organizationId);
  }

  @Get('source-corrections')
  @RequireScope('news:read')
  async listCorrections(
    @Query('publisherId') publisherId: string | undefined,
    @Query('sourceId') sourceId: string | undefined,
    @Query('storyId') storyId: string | undefined,
    @Query('limit') limit: string | undefined,
    @Principal() principal: AuthenticatedPrincipal
  ): Promise<SourceCorrection[]> {
    return this.service.getCorrections(principal.organizationId, {
      publisherId,
      sourceId,
      storyId,
      limit: limit ? Math.min(200, Math.max(1, Number(limit) || 50)) : 50,
    });
  }

  @Post('source-corrections')
  @Roles('admin', 'editor', 'journalist', 'ai_agent')
  @RequireScope('news:write')
  async addCorrection(
    @Body() body: unknown,
    @Principal() principal: AuthenticatedPrincipal
  ): Promise<SourceCorrection> {
    return this.service.addCorrection(
      CreateSourceCorrectionInputSchema.parse(body),
      intelligenceContext(principal)
    );
  }

  @Delete('source-corrections/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles('admin', 'editor')
  @RequireScope('news:write')
  async deleteCorrection(
    @Param('id') id: string,
    @Principal() principal: AuthenticatedPrincipal
  ): Promise<void> {
    await this.service.deleteCorrection(id, intelligenceContext(principal));
  }
}
