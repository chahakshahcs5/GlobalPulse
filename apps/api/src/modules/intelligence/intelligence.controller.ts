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
  UseGuards,
} from '@nestjs/common';
import { StoryIntelligenceService } from '@ai-news/stories';
import {
  CreateEditorialPerspectiveInputSchema,
  CreateEvidenceInputSchema,
  CreateStoryClaimInputSchema,
  CreateTimelineEventInputSchema,
  UpdateClaimStatusInputSchema,
  UpdateTimelineEventInputSchema,
  buildBlockCatalog,
  getBlockDefinition,
  listBlockDefinitions,
} from '@ai-news/schemas';
import type {
  StoryIntelligence,
  StoryClaim,
  Evidence,
  StoryTimelineEvent,
  EditorialPerspective,
  StoryWhatChanged,
} from '@ai-news/schemas';
import type { AuthenticatedPrincipal } from '@ai-news/auth';
import { NestAuthGuard, Principal, RequireScope, Roles } from '../../common/auth.guard';
import { db, intelligenceContext } from './context';

@Controller('api')
@UseGuards(NestAuthGuard)
export class StoryIntelligenceController {
  private readonly service = new StoryIntelligenceService(db);

  @Get('stories/:storyId/intelligence')
  @RequireScope('news:read')
  async getIntelligence(
    @Param('storyId') storyId: string,
    @Principal() principal: AuthenticatedPrincipal
  ): Promise<StoryIntelligence> {
    return this.service.getStoryIntelligence(storyId, principal.organizationId);
  }

  @Get('stories/:storyId/what-changed')
  @RequireScope('news:read')
  async getWhatChanged(
    @Param('storyId') storyId: string,
    @Principal() principal: AuthenticatedPrincipal
  ): Promise<StoryWhatChanged> {
    return this.service.getWhatChanged(storyId, principal.organizationId);
  }

  // --- Claims ---------------------------------------------------------------

  @Get('stories/:storyId/claims')
  @RequireScope('news:read')
  async listClaims(
    @Param('storyId') storyId: string,
    @Principal() principal: AuthenticatedPrincipal
  ): Promise<StoryClaim[]> {
    return this.service.listClaims(storyId, principal.organizationId);
  }

  @Post('stories/:storyId/claims')
  @Roles('admin', 'editor', 'journalist', 'ai_agent')
  @RequireScope('news:write')
  async createClaim(
    @Param('storyId') storyId: string,
    @Body() body: unknown,
    @Principal() principal: AuthenticatedPrincipal
  ): Promise<StoryClaim> {
    return this.service.createClaim(
      storyId,
      CreateStoryClaimInputSchema.parse({ ...(body as object), storyId }),
      intelligenceContext(principal)
    );
  }

  @Patch('stories/:storyId/claims/:claimId/status')
  @Roles('admin', 'editor', 'journalist', 'ai_agent')
  @RequireScope('news:write')
  async updateClaimStatus(
    @Param('storyId') storyId: string,
    @Param('claimId') claimId: string,
    @Body() body: unknown,
    @Principal() principal: AuthenticatedPrincipal
  ): Promise<StoryClaim> {
    return this.service.updateClaimStatus(
      storyId,
      claimId,
      UpdateClaimStatusInputSchema.parse(body),
      intelligenceContext(principal)
    );
  }

  @Delete('stories/:storyId/claims/:claimId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles('admin', 'editor')
  @RequireScope('news:write')
  async deleteClaim(
    @Param('storyId') storyId: string,
    @Param('claimId') claimId: string,
    @Principal() principal: AuthenticatedPrincipal
  ): Promise<void> {
    await this.service.deleteClaim(storyId, claimId, intelligenceContext(principal));
  }

  // --- Evidence -------------------------------------------------------------

  @Get('stories/:storyId/evidence')
  @RequireScope('news:read')
  async listEvidence(
    @Param('storyId') storyId: string,
    @Principal() principal: AuthenticatedPrincipal
  ): Promise<Evidence[]> {
    return this.service.listEvidence(storyId, principal.organizationId);
  }

  @Post('stories/:storyId/evidence')
  @Roles('admin', 'editor', 'journalist', 'ai_agent')
  @RequireScope('news:write')
  async addEvidence(
    @Param('storyId') storyId: string,
    @Body() body: unknown,
    @Principal() principal: AuthenticatedPrincipal
  ): Promise<Evidence> {
    return this.service.addEvidence(
      storyId,
      CreateEvidenceInputSchema.parse({ ...(body as object), storyId }),
      intelligenceContext(principal)
    );
  }

  @Delete('stories/:storyId/evidence/:evidenceId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles('admin', 'editor')
  @RequireScope('news:write')
  async deleteEvidence(
    @Param('storyId') storyId: string,
    @Param('evidenceId') evidenceId: string,
    @Principal() principal: AuthenticatedPrincipal
  ): Promise<void> {
    await this.service.deleteEvidence(storyId, evidenceId, intelligenceContext(principal));
  }

  // --- Timeline -------------------------------------------------------------

  @Get('stories/:storyId/timeline')
  @RequireScope('news:read')
  async listTimeline(
    @Param('storyId') storyId: string,
    @Principal() principal: AuthenticatedPrincipal
  ): Promise<StoryTimelineEvent[]> {
    return this.service.listTimeline(storyId, principal.organizationId);
  }

  @Post('stories/:storyId/timeline')
  @Roles('admin', 'editor', 'journalist', 'ai_agent')
  @RequireScope('news:write')
  async addTimelineEvent(
    @Param('storyId') storyId: string,
    @Body() body: unknown,
    @Principal() principal: AuthenticatedPrincipal
  ): Promise<StoryTimelineEvent> {
    return this.service.addTimelineEvent(
      storyId,
      CreateTimelineEventInputSchema.parse({ ...(body as object), storyId }),
      intelligenceContext(principal)
    );
  }

  @Patch('stories/:storyId/timeline/:eventId')
  @Roles('admin', 'editor', 'journalist', 'ai_agent')
  @RequireScope('news:write')
  async updateTimelineEvent(
    @Param('storyId') storyId: string,
    @Param('eventId') eventId: string,
    @Body() body: unknown,
    @Principal() principal: AuthenticatedPrincipal
  ): Promise<StoryTimelineEvent> {
    return this.service.updateTimelineEvent(
      storyId,
      eventId,
      UpdateTimelineEventInputSchema.parse({ ...(body as object), id: eventId }),
      intelligenceContext(principal)
    );
  }

  @Delete('stories/:storyId/timeline/:eventId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles('admin', 'editor')
  @RequireScope('news:write')
  async deleteTimelineEvent(
    @Param('storyId') storyId: string,
    @Param('eventId') eventId: string,
    @Principal() principal: AuthenticatedPrincipal
  ): Promise<void> {
    await this.service.deleteTimelineEvent(storyId, eventId, intelligenceContext(principal));
  }

  // --- Editorial perspectives ----------------------------------------------

  @Get('stories/:storyId/perspectives')
  @RequireScope('news:read')
  async listPerspectives(
    @Param('storyId') storyId: string,
    @Principal() principal: AuthenticatedPrincipal
  ): Promise<EditorialPerspective[]> {
    return this.service.listPerspectives(storyId, principal.organizationId);
  }

  @Post('stories/:storyId/perspectives')
  @Roles('admin', 'editor', 'journalist', 'ai_agent')
  @RequireScope('news:write')
  async addPerspective(
    @Param('storyId') storyId: string,
    @Body() body: unknown,
    @Principal() principal: AuthenticatedPrincipal
  ): Promise<EditorialPerspective> {
    return this.service.addPerspective(
      storyId,
      CreateEditorialPerspectiveInputSchema.parse({ ...(body as object), storyId }),
      intelligenceContext(principal)
    );
  }

  @Delete('stories/:storyId/perspectives/:perspectiveId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles('admin', 'editor')
  @RequireScope('news:write')
  async deletePerspective(
    @Param('storyId') storyId: string,
    @Param('perspectiveId') perspectiveId: string,
    @Principal() principal: AuthenticatedPrincipal
  ): Promise<void> {
    await this.service.deletePerspective(storyId, perspectiveId, intelligenceContext(principal));
  }
}

@Controller('api/blocks')
@UseGuards(NestAuthGuard)
export class BlockRegistryController {
  @Get()
  @RequireScope('news:read')
  listBlocks() {
    return buildBlockCatalog();
  }

  @Get(':blockType')
  @RequireScope('news:read')
  getBlock(@Param('blockType') blockType: string) {
    const definition = getBlockDefinition(blockType);
    if (!definition) {
      return {
        error: 'NOT_FOUND',
        message: `Unknown block type "${blockType}".`,
        available: listBlockDefinitions().map((d) => d.type),
      };
    }
    return {
      type: definition.type,
      category: definition.category,
      description: definition.description,
      schemaVersion: definition.schemaVersion,
      capabilities: definition.capabilities,
      recommendedFor: definition.recommendedFor,
      example: definition.example,
    };
  }
}
