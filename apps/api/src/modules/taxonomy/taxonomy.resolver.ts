import { Resolver, Query, Mutation, Args, Context } from '@nestjs/graphql';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { TopicService, type CreateTopicInput } from '@ai-news/topics';
import { EventService } from '@ai-news/events';
import { EntityService } from '@ai-news/entities';
import { SourceService } from '@ai-news/sources';
import { db } from '@ai-news/database';
import { generateId } from '@ai-news/shared';
import type { CreateEventInput, CreateEntityInput } from '@ai-news/schemas';
import type { AuthenticatedPrincipal } from '@ai-news/auth';

export interface CreateMediaInput {
  mediaType: string;
  title: string;
  url: string;
  caption?: string;
}

export interface ResolverContext {
  principal?: AuthenticatedPrincipal;
  organizationId?: string;
  userId?: string;
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
  async getTopic(@Args('id') id: string, @Context() ctx?: ResolverContext) {
    const orgId = ctx?.organizationId || ctx?.principal?.organizationId || 'org_default';
    return await this.topicService.getTopic(id, orgId);
  }

  @Query('getEvent')
  async getEvent(@Args('id') id: string, @Context() ctx?: ResolverContext) {
    const orgId = ctx?.organizationId || ctx?.principal?.organizationId || 'org_default';
    return await this.eventService.getEvent(id, orgId);
  }

  @Query('getEntity')
  async getEntity(@Args('id') id: string, @Context() ctx?: ResolverContext) {
    const orgId = ctx?.organizationId || ctx?.principal?.organizationId || 'org_default';
    return await this.entityService.getEntity(id, orgId);
  }

  @Query('getSources')
  async getSources(@Args('query') query?: string, @Context() ctx?: ResolverContext) {
    const orgId = ctx?.organizationId || ctx?.principal?.organizationId || 'org_default';
    if (query) {
      return await this.sourceService.searchSources(query, orgId);
    }
    return await this.sourceService.listSources(orgId);
  }

  @Mutation('createTopic')
  async createTopic(@Args('input') input: CreateTopicInput, @Context() ctx?: ResolverContext) {
    if (!ctx?.principal) {
      throw new UnauthorizedException('Authentication required for GraphQL mutations.');
    }
    const orgId = ctx.principal.organizationId || 'org_default';
    return await this.topicService.createTopic(input, orgId);
  }

  @Mutation('createEvent')
  async createEvent(@Args('input') input: CreateEventInput, @Context() ctx?: ResolverContext) {
    if (!ctx?.principal) {
      throw new UnauthorizedException('Authentication required for GraphQL mutations.');
    }
    const orgId = ctx.principal.organizationId || 'org_default';
    return await this.eventService.createEvent(input, orgId);
  }

  @Mutation('createEntity')
  async createEntity(@Args('input') input: CreateEntityInput, @Context() ctx?: ResolverContext) {
    if (!ctx?.principal) {
      throw new UnauthorizedException('Authentication required for GraphQL mutations.');
    }
    const orgId = ctx.principal.organizationId || 'org_default';
    return await this.entityService.createEntity(input, orgId);
  }

  @Mutation('createMedia')
  async createMedia(@Args('input') input: CreateMediaInput, @Context() ctx?: ResolverContext) {
    if (!ctx?.principal) {
      throw new UnauthorizedException('Authentication required for GraphQL mutations.');
    }
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
