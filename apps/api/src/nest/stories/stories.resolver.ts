import { Resolver, Query, Mutation, Subscription, Args } from '@nestjs/graphql';
import { Injectable } from '@nestjs/common';
import { StoryService } from '@ai-news/stories';
import { SearchService } from '@ai-news/search';
import { DatabaseService, db } from '@ai-news/database';

@Injectable()
@Resolver('Story')
export class StoriesResolver {
  private storyService: StoryService;
  private searchService: SearchService;

  constructor() {
    this.storyService = new StoryService(db);
    this.searchService = new SearchService(db);
  }

  @Query('searchStories')
  async searchStories(@Args('input') input: any) {
    return await this.searchService.searchStories(input || {}, 'org_default');
  }

  @Query('getStory')
  async getStory(@Args('id') id: string) {
    return await this.storyService.getStory(id, 'org_default');
  }

  @Query('getStoryVersions')
  async getStoryVersions(@Args('storyId') storyId: string) {
    return await this.storyService.getStoryVersions(storyId, 'org_default');
  }

  @Mutation('createStory')
  async createStory(@Args('input') input: any) {
    return await this.storyService.createStory(input, {
      organizationId: 'org_default',
      authorId: 'usr_graphql',
      clientType: 'human_web',
      createdVia: 'api',
    });
  }

  @Mutation('updateStory')
  async updateStory(@Args('id') id: string, @Args('input') input: any) {
    return await this.storyService.updateStory(id, input, {
      organizationId: 'org_default',
      authorId: 'usr_graphql',
      clientType: 'human_web',
      createdVia: 'api',
    });
  }

  @Mutation('createStoryVersion')
  async createStoryVersion(@Args('input') input: any) {
    return await this.storyService.createStoryVersion(input, {
      organizationId: 'org_default',
      authorId: 'usr_graphql',
      clientType: input.clientType || 'human_web',
      createdVia: 'api',
    });
  }

  @Mutation('publishStory')
  async publishStory(@Args('id') id: string) {
    return await this.storyService.publishStory(id, {
      organizationId: 'org_default',
      authorId: 'usr_graphql',
      clientType: 'human_web',
      createdVia: 'api',
    });
  }

  @Mutation('unpublishStory')
  async unpublishStory(@Args('id') id: string) {
    return await this.storyService.unpublishStory(id, {
      organizationId: 'org_default',
      authorId: 'usr_graphql',
      clientType: 'human_web',
      createdVia: 'api',
    });
  }

  @Mutation('addStoryBlock')
  async addStoryBlock(@Args('storyId') storyId: string, @Args('block') block: any) {
    return await this.storyService.addBlock(storyId, block, {
      organizationId: 'org_default',
      authorId: 'usr_graphql',
      clientType: 'human_web',
      createdVia: 'api',
    });
  }
}
