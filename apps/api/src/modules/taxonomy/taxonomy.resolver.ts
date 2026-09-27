import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { Injectable } from '@nestjs/common';
import { TopicService, type CreateTopicInput } from '@ai-news/topics';
import { EventService } from '@ai-news/events';
import { EntityService } from '@ai-news/entities';
import { SourceService } from '@ai-news/sources';
import { db } from '@ai-news/database';
import { generateId } from '@ai-news/shared';
import type { CreateEventInput, CreateEntityInput } from '@ai-news/schemas';

export interface CreateMediaInput {
  mediaType: string;
  title: string;
  url: string;
  caption?: string;
}

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
      return await this.sourceService.searchSources(query, 'org_default');
    }
    return await this.sourceService.listSources('org_default');
  }

  @Mutation('createTopic')
  async createTopic(@Args('input') input: CreateTopicInput) {
    return await this.topicService.createTopic(input, 'org_default');
  }

  @Mutation('createEvent')
  async createEvent(@Args('input') input: CreateEventInput) {
    return await this.eventService.createEvent(input, 'org_default');
  }

  @Mutation('createEntity')
  async createEntity(@Args('input') input: CreateEntityInput) {
    return await this.entityService.createEntity(input, 'org_default');
  }

  @Mutation('createMedia')
  async createMedia(@Args('input') input: CreateMediaInput) {
    return {
      id: generateId('med'),
      type: input.mediaType,
      title: input.title,
      url: input.url,
      caption: input.caption,
      createdAt: new Date().toISOString(),
    };
  }
}
