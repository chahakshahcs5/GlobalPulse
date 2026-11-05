import { Resolver, Query, Mutation, Args, Context } from '@nestjs/graphql';
import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
  NotFoundException,
  Inject,
  Optional,
} from '@nestjs/common';
import { StoryService, PaywallService } from '@ai-news/stories';
import { SearchService } from '@ai-news/search';
import { SourceService } from '@ai-news/sources';
import { db } from '@ai-news/database';
import type {
  Story,
  StoryVersion,
  StoryBlock,
  CreateStoryInput,
  UpdateStoryInput,
  CreateStoryVersionInput,
  SearchStoriesInput,
  ClientType,
} from '@ai-news/schemas';
import type { AuthenticatedPrincipal, NewsScope } from '@ai-news/auth';

export interface StoriesResolverContext {
  principal?: AuthenticatedPrincipal;
  organizationId?: string;
  userId?: string;
  clientType?: ClientType;
}

@Injectable()
@Resolver('Story')
export class StoriesResolver {
  private readonly storyService: StoryService;
  private readonly searchService: SearchService;
  private readonly sourceService: SourceService;
  private readonly paywallService: PaywallService;

  constructor(
    @Optional() @Inject(StoryService) storyService?: StoryService,
    @Optional() @Inject(SearchService) searchService?: SearchService,
    @Optional() @Inject(SourceService) sourceService?: SourceService
  ) {
    this.storyService = storyService || new StoryService(db);
    this.searchService = searchService || new SearchService(db);
    this.sourceService = sourceService || new SourceService(db);
    this.paywallService = new PaywallService(db);
  }

  private paywallPrincipal(
    ctx: StoriesResolverContext | undefined,
    orgId: string
  ): { id: string; organizationId: string; role: string; scopes: string[] } {
    return (
      ctx?.principal || {
        id: ctx?.userId || 'anonymous',
        organizationId: orgId,
        role: 'reader',
        scopes: ['news:read'],
      }
    );
  }

  private requirePrincipal(
    ctx?: StoriesResolverContext,
    requiredScope?: NewsScope | NewsScope[]
  ): AuthenticatedPrincipal {
    if (!ctx?.principal) {
      throw new UnauthorizedException('Authentication required for GraphQL mutations.');
    }
    if (requiredScope) {
      const scopesToCheck = Array.isArray(requiredScope) ? requiredScope : [requiredScope];
      const hasAnyScope =
        ctx.principal.role === 'admin' ||
        ctx.principal.scopes.includes('news:admin') ||
        scopesToCheck.some((s) => ctx.principal!.scopes.includes(s));

      if (!hasAnyScope) {
        throw new ForbiddenException(
          `Insufficient privileges. Required one of: [${scopesToCheck.join(', ')}], but principal has: [${ctx.principal.scopes.join(', ')}]`
        );
      }
    }
    return ctx.principal;
  }

  private canReadDrafts(ctx?: StoriesResolverContext): boolean {
    const principal = ctx?.principal;
    if (!principal) return false;
    return (
      principal.role === 'admin' ||
      principal.role === 'editor' ||
      principal.scopes.includes('news:admin') ||
      principal.scopes.includes('news:write')
    );
  }

  @Query('searchStories')
  async searchStories(
    @Args('input') input?: SearchStoriesInput,
    @Context() ctx?: StoriesResolverContext
  ): Promise<Story[]> {
    const orgId = ctx?.organizationId || ctx?.principal?.organizationId || 'org_default';
    const params: SearchStoriesInput = { limit: 20, ...(input || {}) };
    if (!this.canReadDrafts(ctx)) {
      params.status = 'PUBLISHED';
    }
    const res = await this.searchService.searchStories(params, orgId);
    const principal = this.paywallPrincipal(ctx, orgId);
    const baseAccess = await this.paywallService.getAccess(principal);
    const stories = await Promise.all(
      (res.items || []).map((item) => this.storyService.getStory(item.storyId, orgId))
    );
    const visible: Story[] = [];
    for (const story of stories) {
      if (!story) continue;
      if (baseAccess.isLocked) {
        visible.push(this.paywallService.redactIfLocked(story, baseAccess));
      } else if (story.isSubscriberOnly) {
        const access = await this.paywallService.getAccess(principal, story);
        visible.push(this.paywallService.redactIfLocked(story, access));
      } else {
        visible.push(story);
      }
    }
    return visible;
  }

  @Query('getStory')
  async getStory(@Args('id') id: string, @Context() ctx?: StoriesResolverContext): Promise<Story> {
    const orgId = ctx?.organizationId || ctx?.principal?.organizationId || 'org_default';
    const story = await this.storyService.getStory(id, orgId);
    if (!this.canReadDrafts(ctx) && story.status !== 'PUBLISHED') {
      throw new NotFoundException(`Story with id "${id}" was not found.`);
    }
    const access = await this.paywallService.getAccess(this.paywallPrincipal(ctx, orgId), story);
    return this.paywallService.redactIfLocked(story, access);
  }

  @Query('getStoryVersions')
  async getStoryVersions(
    @Args('storyId') storyId: string,
    @Context() ctx?: StoriesResolverContext
  ): Promise<StoryVersion[]> {
    const orgId = ctx?.organizationId || ctx?.principal?.organizationId || 'org_default';
    const story = await this.storyService.getStory(storyId, orgId);
    if (!this.canReadDrafts(ctx) && story.status !== 'PUBLISHED') {
      throw new NotFoundException(`Story with id "${storyId}" was not found.`);
    }
    const access = await this.paywallService.getAccess(this.paywallPrincipal(ctx, orgId), story);
    if (access.isLocked) {
      throw new NotFoundException(`Story with id "${storyId}" was not found.`);
    }
    return await this.storyService.getStoryVersions(storyId, orgId);
  }

  @Mutation('createStory')
  async createStory(
    @Args('input') input: CreateStoryInput,
    @Context() ctx?: StoriesResolverContext
  ): Promise<Story> {
    const principal = this.requirePrincipal(ctx, 'news:write');
    return await this.storyService.createStory(input, {
      organizationId: principal.organizationId,
      authorId: principal.id,
      clientType: principal.clientType,
      createdVia: 'api',
    });
  }

  @Mutation('updateStory')
  async updateStory(
    @Args('id') id: string,
    @Args('input') input: UpdateStoryInput,
    @Context() ctx?: StoriesResolverContext
  ): Promise<Story> {
    const principal = this.requirePrincipal(ctx, 'news:write');
    return await this.storyService.updateStory(id, input, {
      organizationId: principal.organizationId,
      authorId: principal.id,
      clientType: principal.clientType,
      createdVia: 'api',
    });
  }

  @Mutation('createStoryVersion')
  async createStoryVersion(
    @Args('input') input: CreateStoryVersionInput & { storyId: string },
    @Context() ctx?: StoriesResolverContext
  ): Promise<StoryVersion> {
    const principal = this.requirePrincipal(ctx, 'news:write');
    return await this.storyService.createStoryVersion(input.storyId, input, {
      organizationId: principal.organizationId,
      authorId: principal.id,
      clientType: principal.clientType,
      createdVia: 'api',
    });
  }

  @Mutation('publishStory')
  async publishStory(
    @Args('id') id: string,
    @Context() ctx?: StoriesResolverContext
  ): Promise<Story> {
    const principal = this.requirePrincipal(ctx, 'news:publish');
    return await this.storyService.publishStory(id, {
      organizationId: principal.organizationId,
      authorId: principal.id,
      clientType: principal.clientType,
      createdVia: 'api',
    });
  }

  @Mutation('unpublishStory')
  async unpublishStory(
    @Args('id') id: string,
    @Context() ctx?: StoriesResolverContext
  ): Promise<Story> {
    const principal = this.requirePrincipal(ctx, 'news:publish');
    return await this.storyService.unpublishStory(id, {
      organizationId: principal.organizationId,
      authorId: principal.id,
      clientType: principal.clientType,
      createdVia: 'api',
    });
  }

  @Mutation('addStoryBlock')
  async addStoryBlock(
    @Args('storyId') storyId: string,
    @Args('block') block: unknown,
    @Context() ctx?: StoriesResolverContext
  ): Promise<StoryBlock> {
    const principal = this.requirePrincipal(ctx, 'news:write');
    return await this.storyService.addBlock(storyId, block, {
      organizationId: principal.organizationId,
      authorId: principal.id,
      clientType: principal.clientType,
      createdVia: 'api',
    });
  }

  @Mutation('attachSource')
  async attachSource(
    @Args('storyId') storyId: string,
    @Args('sourceId') sourceId: string,
    @Context() ctx?: StoriesResolverContext
  ): Promise<Story> {
    const principal = this.requirePrincipal(ctx, ['news:sources', 'news:write']);
    await this.sourceService.attachSourceToStory(storyId, sourceId, principal.organizationId);
    return await this.storyService.getStory(storyId, principal.organizationId);
  }
}
