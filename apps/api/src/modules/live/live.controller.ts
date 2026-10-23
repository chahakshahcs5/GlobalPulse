import { Controller, Get, Put, Param, Body, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { NestAuthGuard, RequireScope, Roles, Principal } from '../../common/auth.guard';
import { LiveFeedService, type LiveFeed } from '@ai-news/stories';
import { LiveFeedUpdateSchema, type LiveFeedUpdate } from '@ai-news/schemas';
import { ValidationError } from '@ai-news/shared';
import { db } from '@ai-news/database';
import type { AuthenticatedPrincipal } from '@ai-news/auth';

@Controller('api/live')
@UseGuards(NestAuthGuard)
export class LiveController {
  private readonly liveFeeds: LiveFeedService;

  constructor() {
    this.liveFeeds = new LiveFeedService(db);
  }

  @Get('feeds')
  @RequireScope('news:read')
  async listFeeds(@Principal() principal: AuthenticatedPrincipal): Promise<LiveFeed[]> {
    return this.liveFeeds.listFeeds({ organizationId: principal.organizationId });
  }

  @Get('feeds/:key')
  @RequireScope('news:read')
  async getFeed(
    @Param('key') key: string,
    @Principal() principal: AuthenticatedPrincipal
  ): Promise<LiveFeed> {
    const feed = await this.liveFeeds.getFeed(key, { organizationId: principal?.organizationId });
    if (!feed) {
      throw new ValidationError(`No live feed registered for key "${key}"`);
    }
    return feed;
  }

  /**
   * Create or replace a live feed.
   *
   * Every update is pushed to readers over the feed's realtime channel, so a
   * published story picks up new numbers without being republished.
   */
  @Put('feeds/:key')
  @HttpCode(HttpStatus.OK)
  @Roles('admin', 'editor', 'journalist', 'ai_agent')
  @RequireScope('news:write')
  async updateFeed(
    @Param('key') key: string,
    @Body() body: unknown,
    @Principal() principal: AuthenticatedPrincipal
  ): Promise<LiveFeed> {
    const parsed = LiveFeedUpdateSchema.safeParse(body);
    if (!parsed.success) {
      throw new ValidationError(
        `Invalid live feed payload: ${parsed.error.errors
          .map((e) => `${e.path.join('.')}: ${e.message}`)
          .join(', ')}`
      );
    }
    return this.liveFeeds.setFeed(key, parsed.data as LiveFeedUpdate, {
      organizationId: principal.organizationId,
    });
  }
}
