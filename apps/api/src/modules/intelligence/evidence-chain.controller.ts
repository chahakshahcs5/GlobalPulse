import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { StoryIntelligenceService } from '@ai-news/stories';
import type { StoryClaim, Evidence, Story } from '@ai-news/schemas';
import type { AuthenticatedPrincipal } from '@ai-news/auth';
import { NestAuthGuard, Principal, RequireScope } from '../../common/auth.guard';
import { db } from './context';

/**
 * Evidence chain queries (§7).
 *
 * These expose the documented chain in both directions:
 *
 *   Story → Claim → Evidence → Citation → Source → Publisher
 *   Story → Entity → Event → Location
 *
 * Every query is organization-scoped, so a claim, source, or entity from
 * another tenant resolves as "not found" rather than leaking.
 */
@Controller('api')
@UseGuards(NestAuthGuard)
export class EvidenceChainController {
  private readonly service = new StoryIntelligenceService(db);

  @Get('claims/:claimId/evidence')
  @RequireScope('news:read')
  async getClaimEvidence(
    @Param('claimId') claimId: string,
    @Principal() principal: AuthenticatedPrincipal
  ): Promise<{ claim: StoryClaim; evidence: Evidence[] }> {
    return this.service.getClaimEvidence(claimId, principal.organizationId);
  }

  @Get('sources/:sourceId/claims')
  @RequireScope('news:read')
  async getSourceClaims(
    @Param('sourceId') sourceId: string,
    @Principal() principal: AuthenticatedPrincipal
  ): Promise<StoryClaim[]> {
    return this.service.getSourceClaims(sourceId, principal.organizationId);
  }

  @Get('entities/:entityId/stories')
  @RequireScope('news:read')
  async getEntityStories(
    @Param('entityId') entityId: string,
    @Principal() principal: AuthenticatedPrincipal
  ): Promise<Story[]> {
    return this.service.getEntityStories(entityId, principal.organizationId);
  }
}
