import { Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { PaywallService } from '@ai-news/stories';
import { db } from '@ai-news/database';
import { NestAuthGuard, Principal, RequireScope } from '../../common/auth.guard';
import type { AuthenticatedPrincipal } from '@ai-news/auth';

@Controller('api/paywall')
@UseGuards(NestAuthGuard)
export class PaywallController {
  private readonly paywall = new PaywallService(db);

  @Get('me')
  @RequireScope('news:read')
  async getMyAccess(@Principal() principal: AuthenticatedPrincipal) {
    return this.paywall.getAccess(principal);
  }

  @Get('access/:storyId')
  @RequireScope('news:read')
  async getStoryAccess(
    @Param('storyId') storyId: string,
    @Principal() principal: AuthenticatedPrincipal
  ) {
    const story = await db.stories.findById(storyId, principal.organizationId);
    return this.paywall.getAccess(principal, story || undefined);
  }

  @Post('read/:storyId')
  @RequireScope('news:read')
  async recordRead(
    @Param('storyId') storyId: string,
    @Principal() principal: AuthenticatedPrincipal
  ) {
    const story = await db.stories.findById(storyId, principal.organizationId);
    if (!story) {
      return this.paywall.getAccess(principal);
    }
    return this.paywall.recordRead(principal, story);
  }
}
