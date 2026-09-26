import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { Injectable } from '@nestjs/common';
import { TopicService } from '@ai-news/topics';
import { EventService } from '@ai-news/events';
import { EntityService } from '@ai-news/entities';
import { SourceService } from '@ai-news/sources';
import { db } from '@ai-news/database';
import { generateId } from '@ai-news/shared';

@Injectable()
@Resolver()
export class TaxonomyResolver {
  private topicService: TopicService;
  private eventService: EventService;
  private entityService: EntityService;
  private sourceService: SourceService;

  constructor() {
    this.topicService = new TopicService(db);
    this.eventService = new EventService(db);
    this.entityService = new EntityService(db);
    this.sourceService = new SourceService(db);
  }

  @Query('getTopic')
  async getTopic(@Args('id') id: string) {
    return await this.topicService.getTopic(id, 'org_default');
  }

  @Query('getEvent')
  async getEvent(@Args('id') id: string) {
    return await this.eventService.getEvent(id, 'org_default');
  }

  @Query('getEntity')
  async getEntity(@Args('id') id: string) {
    return await this.entityService.getEntity(id, 'org_default');
  }

  @Query('getSources')
  async getSources(@Args('query') query?: string) {
    if (query) {
      return await db.sources.findMany('org_default');
    }
    return await db.sources.findMany('org_default');
  }

  @Mutation('createTopic')
  async createTopic(@Args('input') input: any) {
    return await this.topicService.createTopic(input, 'org_default');
  }

  @Mutation('createEvent')
  async createEvent(@Args('input') input: any) {
    return await this.eventService.createEvent(input, 'org_default');
  }

  @Mutation('createEntity')
  async createEntity(@Args('input') input: any) {
    return await this.entityService.createEntity(input, 'org_default');
  }

  @Mutation('attachSource')
  async attachSource(@Args('storyId') storyId: string, @Args('sourceId') sourceId: string) {
    await this.sourceService.attachSourceToStory(storyId, sourceId, 'org_default');
    return await db.stories.findById(storyId, 'org_default');
  }

  @Mutation('createMedia')
  async createMedia(@Args('input') input: any) {
    return {
      id: generateId('med'),
      type: input.mediaType,
      title: input.title,
      url: input.url,
      metadata: input.metadata || {},
      createdAt: new Date().toISOString(),
    };
  }
}
