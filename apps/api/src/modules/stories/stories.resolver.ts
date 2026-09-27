import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { Injectable } from '@nestjs/common';
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
} from '@ai-news/schemas';

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

  @Query('searchStories')
  async searchStories(@Args('input') input?: SearchStoriesInput): Promise<Story[]> {
    const params: SearchStoriesInput = { limit: 20, ...(input || {}) };
    const res = await this.searchService.searchStories(params, 'org_default');
    const stories = await Promise.all(
      (res.items || []).map((item) => this.storyService.getStory(item.storyId, 'org_default'))
    );
    return stories.filter((s): s is Story => s !== null);
  }

  @Query('getStory')
  async getStory(@Args('id') id: string): Promise<Story> {
    return await this.storyService.getStory(id, 'org_default');
  }

  @Query('getStoryVersions')
  async getStoryVersions(@Args('storyId') storyId: string): Promise<StoryVersion[]> {
    return await this.storyService.getStoryVersions(storyId, 'org_default');
  }

  @Mutation('createStory')
  async createStory(@Args('input') input: CreateStoryInput): Promise<Story> {
    return await this.storyService.createStory(input, {
      organizationId: 'org_default',
      authorId: 'usr_graphql',
      clientType: 'human_web',
      createdVia: 'api',
    });
  }

  @Mutation('updateStory')
  async updateStory(@Args('id') id: string, @Args('input') input: UpdateStoryInput): Promise<Story> {
    return await this.storyService.updateStory(id, input, {
      organizationId: 'org_default',
      authorId: 'usr_graphql',
      clientType: 'human_web',
      createdVia: 'api',
    });
  }

  @Mutation('createStoryVersion')
  async createStoryVersion(@Args('input') input: CreateStoryVersionInput & { storyId: string }): Promise<StoryVersion> {
    return await this.storyService.createStoryVersion(input.storyId, input, {
      organizationId: 'org_default',
      authorId: 'usr_graphql',
      clientType: 'human_web',
      createdVia: 'api',
    });
  }

  @Mutation('publishStory')
  async publishStory(@Args('id') id: string): Promise<Story> {
    return await this.storyService.publishStory(id, {
      organizationId: 'org_default',
      authorId: 'usr_graphql',
      clientType: 'human_web',
      createdVia: 'api',
    });
  }

  @Mutation('unpublishStory')
  async unpublishStory(@Args('id') id: string): Promise<Story> {
    return await this.storyService.unpublishStory(id, {
      organizationId: 'org_default',
      authorId: 'usr_graphql',
      clientType: 'human_web',
      createdVia: 'api',
    });
  }

  @Mutation('addStoryBlock')
  async addStoryBlock(@Args('storyId') storyId: string, @Args('block') block: unknown): Promise<StoryBlock> {
    return await this.storyService.addBlock(storyId, block, {
      organizationId: 'org_default',
      authorId: 'usr_graphql',
      clientType: 'human_web',
      createdVia: 'api',
    });
  }

  @Mutation('attachSource')
  async attachSource(@Args('storyId') storyId: string, @Args('sourceId') sourceId: string): Promise<Story> {
    await this.sourceService.attachSourceToStory(storyId, sourceId, 'org_default');
    return await this.storyService.getStory(storyId, 'org_default');
  }
}
