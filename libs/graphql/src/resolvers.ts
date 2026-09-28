import { DatabaseService, db } from '@ai-news/database';
import { StoryService } from '@ai-news/stories';
import { SearchService } from '@ai-news/search';
import { TopicService } from '@ai-news/topics';
import { EventService } from '@ai-news/events';
import { EntityService } from '@ai-news/entities';
import { SourceService } from '@ai-news/sources';
import { generateId } from '@ai-news/shared';
import type {
  CreateStoryInput,
  UpdateStoryInput,
  CreateStoryVersionInput,
  Story,
  Block,
  CreateTopicInput,
  CreateEventInput,
  CreateEntityInput,
} from '@ai-news/schemas';

export interface GraphQLContext {
  organizationId?: string;
  userId?: string;
  clientType?: 'gemini' | 'gemini_spark' | 'chatgpt' | 'claude' | 'custom_mcp' | 'human_web';
  pubsub?: {
    publish: (event: { topic: string; payload: Record<string, unknown> }) => void;
    subscribe: (topic: string) => Promise<unknown>;
  };
}

export function createResolvers(database: DatabaseService = db) {
  const storyService = new StoryService(database);
  const searchService = new SearchService(database);
  const topicService = new TopicService(database);
  const eventService = new EventService(database);
  const entityService = new EntityService(database);
  const sourceService = new SourceService(database);

  // In-memory media store
  const mediaStore = new Map<string, Record<string, unknown>>();

  return {
    Query: {
      searchStories: async (
        _: unknown,
        { input }: { input?: Record<string, unknown> },
        ctx?: GraphQLContext
      ) => {
        const orgId = ctx?.organizationId || 'org_default';
        const res = await searchService.searchStories(input || {}, orgId);
        return res.items || [];
      },

      getStory: async (_: unknown, { id }: { id: string }, ctx?: GraphQLContext) => {
        const orgId = ctx?.organizationId || 'org_default';
        return await storyService.getStory(id, orgId);
      },

      getStoryVersions: async (
        _: unknown,
        { storyId }: { storyId: string },
        ctx?: GraphQLContext
      ) => {
        const orgId = ctx?.organizationId || 'org_default';
        return await storyService.getStoryVersions(storyId, orgId);
      },

      getTopic: async (_: unknown, { id }: { id: string }, ctx?: GraphQLContext) => {
        const orgId = ctx?.organizationId || 'org_default';
        return await topicService.getTopic(id, orgId);
      },

      getEvent: async (_: unknown, { id }: { id: string }, ctx?: GraphQLContext) => {
        const orgId = ctx?.organizationId || 'org_default';
        return await eventService.getEvent(id, orgId);
      },

      getEntity: async (_: unknown, { id }: { id: string }, ctx?: GraphQLContext) => {
        const orgId = ctx?.organizationId || 'org_default';
        return await entityService.getEntity(id, orgId);
      },

      getSources: async (_: unknown, { query }: { query?: string }, ctx?: GraphQLContext) => {
        const orgId = ctx?.organizationId || 'org_default';
        if (query) {
          return await searchService.searchSources(query, orgId);
        }
        return await database.sources.list(orgId);
      },
    },

    Mutation: {
      createStory: async (
        _: unknown,
        { input }: { input: CreateStoryInput },
        ctx?: GraphQLContext
      ) => {
        const orgId = ctx?.organizationId || 'org_default';
        const userId = ctx?.userId || 'usr_graphql_user';
        const clientType = ctx?.clientType || 'human_web';

        const story = await storyService.createStory(input, {
          organizationId: orgId,
          authorId: userId,
          clientType,
          createdVia: 'api',
        });

        if (ctx?.pubsub) {
          ctx.pubsub.publish({
            topic: 'STORY_UPDATED',
            payload: { storyUpdated: story as unknown as Record<string, unknown> },
          });
        }

        return story;
      },

      updateStory: async (
        _: unknown,
        { id, input }: { id: string; input: UpdateStoryInput },
        ctx?: GraphQLContext
      ) => {
        const orgId = ctx?.organizationId || 'org_default';
        const userId = ctx?.userId || 'usr_graphql_user';
        const clientType = ctx?.clientType || 'human_web';

        const story = await storyService.updateStory(id, input, {
          organizationId: orgId,
          authorId: userId,
          clientType,
          createdVia: 'api',
        });

        if (ctx?.pubsub) {
          ctx.pubsub.publish({
            topic: 'STORY_UPDATED',
            payload: { storyUpdated: story as unknown as Record<string, unknown> },
          });
        }

        return story;
      },

      createStoryVersion: async (
        _: unknown,
        {
          input,
        }: {
          input: CreateStoryVersionInput & {
            storyId: string;
            clientType?:
              'gemini' | 'gemini_spark' | 'chatgpt' | 'claude' | 'custom_mcp' | 'human_web';
          };
        },
        ctx?: GraphQLContext
      ) => {
        const orgId = ctx?.organizationId || 'org_default';
        const userId = ctx?.userId || 'usr_graphql_user';
        const clientType = input.clientType || ctx?.clientType || 'human_web';

        const version = await storyService.createStoryVersion(input.storyId, input, {
          organizationId: orgId,
          authorId: userId,
          clientType,
          createdVia: 'api',
        });

        const story = await storyService.getStory(input.storyId, orgId);
        if (ctx?.pubsub && story) {
          ctx.pubsub.publish({
            topic: 'STORY_UPDATED',
            payload: { storyUpdated: story as unknown as Record<string, unknown> },
          });
        }

        return version;
      },

      publishStory: async (_: unknown, { id }: { id: string }, ctx?: GraphQLContext) => {
        const orgId = ctx?.organizationId || 'org_default';
        const userId = ctx?.userId || 'usr_graphql_user';
        const clientType = ctx?.clientType || 'human_web';

        const story = await storyService.publishStory(id, {
          organizationId: orgId,
          authorId: userId,
          clientType,
          createdVia: 'api',
        });

        if (ctx?.pubsub) {
          ctx.pubsub.publish({
            topic: 'STORY_UPDATED',
            payload: { storyUpdated: story as unknown as Record<string, unknown> },
          });
        }

        return story;
      },

      unpublishStory: async (_: unknown, { id }: { id: string }, ctx?: GraphQLContext) => {
        const orgId = ctx?.organizationId || 'org_default';
        const userId = ctx?.userId || 'usr_graphql_user';
        const clientType = ctx?.clientType || 'human_web';

        const story = await storyService.unpublishStory(id, {
          organizationId: orgId,
          authorId: userId,
          clientType,
          createdVia: 'api',
        });

        if (ctx?.pubsub) {
          ctx.pubsub.publish({
            topic: 'STORY_UPDATED',
            payload: { storyUpdated: story as unknown as Record<string, unknown> },
          });
        }

        return story;
      },

      addStoryBlock: async (
        _: unknown,
        { storyId, block }: { storyId: string; block: Block },
        ctx?: GraphQLContext
      ) => {
        const orgId = ctx?.organizationId || 'org_default';
        const userId = ctx?.userId || 'usr_graphql_user';
        const clientType = ctx?.clientType || 'human_web';

        const addedBlock = await storyService.addBlock(storyId, block, {
          organizationId: orgId,
          authorId: userId,
          clientType,
          createdVia: 'api',
        });

        const story = await storyService.getStory(storyId, orgId);
        if (ctx?.pubsub && story) {
          ctx.pubsub.publish({
            topic: 'STORY_UPDATED',
            payload: { storyUpdated: story as unknown as Record<string, unknown> },
          });
        }

        return addedBlock;
      },

      attachSource: async (
        _: unknown,
        { storyId, sourceId }: { storyId: string; sourceId: string },
        ctx?: GraphQLContext
      ) => {
        const orgId = ctx?.organizationId || 'org_default';
        await sourceService.attachSourceToStory(storyId, sourceId, orgId);
        return await storyService.getStory(storyId, orgId);
      },

      createMedia: async (
        _: unknown,
        {
          input,
        }: {
          input: {
            mediaType: string;
            title: string;
            url: string;
            metadata?: Record<string, unknown>;
          };
        }
      ) => {
        const media = {
          id: generateId('med'),
          type: input.mediaType,
          title: input.title,
          url: input.url,
          metadata: input.metadata || {},
          createdAt: new Date().toISOString(),
        };
        mediaStore.set(media.id, media);
        return media;
      },

      createTopic: async (
        _: unknown,
        { input }: { input: CreateTopicInput },
        ctx?: GraphQLContext
      ) => {
        const orgId = ctx?.organizationId || 'org_default';
        return await topicService.createTopic(input, orgId);
      },

      createEvent: async (
        _: unknown,
        { input }: { input: CreateEventInput },
        ctx?: GraphQLContext
      ) => {
        const orgId = ctx?.organizationId || 'org_default';
        return await eventService.createEvent(input, orgId);
      },

      createEntity: async (
        _: unknown,
        { input }: { input: CreateEntityInput },
        ctx?: GraphQLContext
      ) => {
        const orgId = ctx?.organizationId || 'org_default';
        return await entityService.createEntity(input, orgId);
      },
    },

    Subscription: {
      storyUpdated: {
        subscribe: async (
          _: unknown,
          _args: { storyId?: string },
          context: { pubsub?: { subscribe: (t: string) => Promise<unknown> } }
        ) => {
          if (!context.pubsub) {
            throw new Error('PubSub is not configured');
          }
          return await context.pubsub.subscribe('STORY_UPDATED');
        },
        resolve: (payload: { storyUpdated: Story }) => payload.storyUpdated,
      },

      jobUpdated: {
        subscribe: async (
          _: unknown,
          _args: { jobId?: string },
          context: { pubsub?: { subscribe: (t: string) => Promise<unknown> } }
        ) => {
          if (!context.pubsub) {
            throw new Error('PubSub is not configured');
          }
          return await context.pubsub.subscribe('JOB_UPDATED');
        },
        resolve: (payload: { jobUpdated: Record<string, unknown> }) => payload.jobUpdated,
      },
    },

    Story: {
      blocks: async (parent: Story) => {
        if (parent.blocks && Array.isArray(parent.blocks)) {
          return parent.blocks;
        }
        return await database.stories.getBlocks(parent.id);
      },
      versions: async (parent: Story, _: unknown, ctx?: GraphQLContext) => {
        const orgId = ctx?.organizationId || parent.organizationId || 'org_default';
        return await storyService.getStoryVersions(parent.id, orgId);
      },
    },
  };
}
