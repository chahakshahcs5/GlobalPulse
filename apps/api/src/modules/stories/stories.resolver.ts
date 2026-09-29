import { Resolver, Query, Mutation, Args, Context } from '@nestjs/graphql';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { StoryService } from '@ai-news/stories';
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
import type { AuthenticatedPrincipal } from '@ai-news/auth';

export interface StoriesResolverContext {
  principal?: AuthenticatedPrincipal;
  organizationId?: string;
  userId?: string;
  clientType?: ClientType;
}

@Injectable()
@Resolver('Story')
export class StoriesResolver {
  private storyService: StoryService;
  private searchService: SearchService;
  private sourceService: SourceService;

  constructor() {
    this.storyService = new StoryService(db);
    this.searchService = new SearchService(db);
    this.sourceService = new SourceService(db);
  }

  private requirePrincipal(ctx?: StoriesResolverContext): AuthenticatedPrincipal {
    if (!ctx?.principal) {
      throw new UnauthorizedException('Authentication required for GraphQL mutations.');
    }
    return ctx.principal;
  }

  @Query('searchStories')
  async searchStories(
    @Args('input') input?: SearchStoriesInput,
    @Context() ctx?: StoriesResolverContext
  ): Promise<Story[]> {
    const orgId = ctx?.organizationId || ctx?.principal?.organizationId || 'org_default';
    const params: SearchStoriesInput = { limit: 20, ...(input || {}) };
    const res = await this.searchService.searchStories(params, orgId);
    const stories = await Promise.all(
      (res.items || []).map((item) => this.storyService.getStory(item.storyId, orgId))
    );
    return stories.filter((s): s is Story => s !== null);
  }

  @Query('getStory')
  async getStory(@Args('id') id: string, @Context() ctx?: StoriesResolverContext): Promise<Story> {
    const orgId = ctx?.organizationId || ctx?.principal?.organizationId || 'org_default';
    return await this.storyService.getStory(id, orgId);
  }

  @Query('getStoryVersions')
  async getStoryVersions(
    @Args('storyId') storyId: string,
    @Context() ctx?: StoriesResolverContext
  ): Promise<StoryVersion[]> {
    const orgId = ctx?.organizationId || ctx?.principal?.organizationId || 'org_default';
    return await this.storyService.getStoryVersions(storyId, orgId);
  }

  @Mutation('createStory')
  async createStory(
    @Args('input') input: CreateStoryInput,
    @Context() ctx?: StoriesResolverContext
  ): Promise<Story> {
    const principal = this.requirePrincipal(ctx);
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
    const principal = this.requirePrincipal(ctx);
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
    const principal = this.requirePrincipal(ctx);
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
    const principal = this.requirePrincipal(ctx);
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
    const principal = this.requirePrincipal(ctx);
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
    const principal = this.requirePrincipal(ctx);
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
    const principal = this.requirePrincipal(ctx);
    await this.sourceService.attachSourceToStory(storyId, sourceId, principal.organizationId);
    return await this.storyService.getStory(storyId, principal.organizationId);
  }
}
