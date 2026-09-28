import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
  HttpStatus,
  HttpCode,
  NotFoundException,
} from '@nestjs/common';
import { ProvenanceService } from '@ai-news/stories';
import { db } from '@ai-news/database';
import { NestAuthGuard, RequireScope, Roles, Principal } from '../../common/auth.guard';
import type { AuthenticatedPrincipal } from '@ai-news/auth';
import { RecordStoryProvenanceInputSchema } from '@ai-news/schemas';
import type { AIStoryProvenance } from '@ai-news/schemas';

@Controller('api/stories')
export class ProvenanceController {
  private provenanceService: ProvenanceService;

  constructor() {
    this.provenanceService = new ProvenanceService(db);
  }

  @Post(':id/provenance')
  @HttpCode(HttpStatus.OK)
  @UseGuards(NestAuthGuard)
  @Roles('admin', 'editor', 'journalist', 'ai_agent')
  @RequireScope('news:write')
  async recordProvenance(
    @Param('id') storyId: string,
    @Body() body: unknown,
    @Principal() principal: AuthenticatedPrincipal
  ): Promise<AIStoryProvenance> {
    const input = RecordStoryProvenanceInputSchema.parse(body);
    return await this.provenanceService.recordProvenance(storyId, input, principal.organizationId);
  }

  @Get(':id/provenance')
  async getProvenance(
    @Param('id') storyId: string
  ): Promise<{ provenance: AIStoryProvenance; verified: boolean }> {
    const verification = await this.provenanceService.verifyProvenance(storyId);
    if (!verification.provenance) {
      throw new NotFoundException(`No AI provenance record found for story "${storyId}".`);
    }
    return {
      provenance: verification.provenance,
      verified: verification.valid,
    };
  }
}
