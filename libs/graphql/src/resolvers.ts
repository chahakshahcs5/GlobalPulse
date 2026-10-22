import { DatabaseService, db } from '@ai-news/database';
import type { IResolvers } from 'mercurius';
import {
  StoryService,
  StoryIntelligenceService,
  KnowledgeGraphService,
  AlertService,
  IngestionService,
  SourceIntelligenceService,
} from '@ai-news/stories';
import { SearchService } from '@ai-news/search';
import { TopicService } from '@ai-news/topics';
import { EventService } from '@ai-news/events';
import { EntityService } from '@ai-news/entities';
import { SourceService } from '@ai-news/sources';
import { generateId } from '@ai-news/shared';
import { buildBlockCatalog } from '@ai-news/schemas';
import type {
  CreateStoryInput,
  UpdateStoryInput,
  CreateStoryVersionInput,
  Story,
  Block,
  CreateTopicInput,
  CreateEventInput,
  CreateEntityInput,
  ClientType,
  CreateStoryClaimInput,
  UpdateClaimStatusInput,
  CreateEvidenceInput,
  CreateTimelineEventInput,
  UpdateTimelineEventInput,
  CreateEditorialPerspectiveInput,
  CreateKnowledgeEdgeInput,
  GraphQueryInput,
  CreateAlertRuleInput,
  UpdateAlertRuleInput,
  CreateIngestionFeedInput,
  PromoteIngestionItemInput,
  CreateSourceCorrectionInput,
} from '@ai-news/schemas';
import type { AuthenticatedPrincipal, NewsScope } from '@ai-news/auth';
import { ForbiddenError, DomainError } from '@ai-news/shared';

export interface GraphQLContext {
  organizationId?: string;
  userId?: string;
  principal?: AuthenticatedPrincipal;
  clientType?: 'gemini' | 'gemini_spark' | 'chatgpt' | 'claude' | 'custom_mcp' | 'human_web';
  pubsub?: {
    publish: (event: { topic: string; payload: Record<string, unknown> }) => void;
    subscribe: (topic: string) => Promise<unknown>;
  };
}

function requireAuth(
  ctx?: GraphQLContext,
  requiredScope?: NewsScope | NewsScope[]
): {
  organizationId: string;
  userId: string;
  clientType: ClientType;
} {
  if (!ctx?.principal && !ctx?.userId) {
    throw new Error('UNAUTHENTICATED: Authentication required for GraphQL mutations.');
  }

  if (requiredScope && ctx?.principal) {
    const scopesToCheck = Array.isArray(requiredScope) ? requiredScope : [requiredScope];
    const hasAnyScope =
      ctx.principal.role === 'admin' ||
      ctx.principal.scopes.includes('news:admin') ||
      scopesToCheck.some((s) => ctx.principal!.scopes.includes(s));

    if (!hasAnyScope) {
      throw new ForbiddenError(
        `Insufficient privileges. Required one of: [${scopesToCheck.join(', ')}], but principal has: [${ctx.principal.scopes.join(', ')}]`
      );
    }
  }

  return {
    organizationId: ctx.organizationId || ctx.principal?.organizationId || 'org_default',
    userId: ctx.userId || ctx.principal?.id || 'usr_authenticated',
    clientType: ctx.clientType || ctx.principal?.clientType || 'human_web',
  };
}

function intelligenceContext(auth: {
  organizationId: string;
  userId: string;
  clientType: ClientType;
}) {
  return {
    organizationId: auth.organizationId,
    actorId: auth.userId,
    clientType: auth.clientType,
  };
}

/**
 * Surfaces domain errors as GraphQL errors instead of opaque server failures.
 */
function toGraphQLError(error: unknown): Error {
  if (error instanceof DomainError) {
    return new Error(`${error.code}: ${error.message}`);
  }
  if (error instanceof Error) return error;
  return new Error(String(error));
}

/**
 * Wraps a service so domain errors are translated for the GraphQL transport.
 */
function withGraphQLErrors<T extends object>(service: T): T {
  return new Proxy(service, {
    get(target, property, receiver) {
      const value = Reflect.get(target, property, receiver) as unknown;
      if (typeof value !== 'function') return value;
      return (...args: unknown[]) => {
        try {
          const result = (value as (...a: unknown[]) => unknown).apply(target, args);
          if (result instanceof Promise) {
            return result.catch((err: unknown) => {
              throw toGraphQLError(err);
            });
          }
          return result;
        } catch (err) {
          throw toGraphQLError(err);
        }
      };
    },
  });
}

/**
 * The resolver map.
 *
 * The return type is stated rather than inferred: the resolvers reach the
 * whole `StoryBlock` union, which grows with every block type the platform
 * adds, and the compiler cannot write out a type that large. The shape the
 * map has is the one mercurius expects.
 */
export function createResolvers(database: DatabaseService = db): IResolvers {
  const storyService = new StoryService(database);
  const searchService = new SearchService(database);
  const topicService = new TopicService(database);
  const eventService = withGraphQLErrors(new EventService(database));
  const entityService = new EntityService(database);
  const sourceService = new SourceService(database);
  const intelligenceService = withGraphQLErrors(new StoryIntelligenceService(database));
  const knowledgeGraphService = withGraphQLErrors(new KnowledgeGraphService(database));
  const alertService = withGraphQLErrors(new AlertService(database));
  const ingestionService = withGraphQLErrors(new IngestionService(database));
  const sourceIntelligenceService = withGraphQLErrors(new SourceIntelligenceService(database));

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

      // --- Story intelligence ------------------------------------------------

      getStoryIntelligence: async (
        _: unknown,
        { storyId }: { storyId: string },
        ctx?: GraphQLContext
      ) => {
        const orgId = ctx?.organizationId || 'org_default';
        return await intelligenceService.getStoryIntelligence(storyId, orgId);
      },

      getStoryWhatChanged: async (
        _: unknown,
        { storyId }: { storyId: string },
        ctx?: GraphQLContext
      ) => {
        const orgId = ctx?.organizationId || 'org_default';
        return await intelligenceService.getWhatChanged(storyId, orgId);
      },

      getStoryClaims: async (
        _: unknown,
        { storyId }: { storyId: string },
        ctx?: GraphQLContext
      ) => {
        const orgId = ctx?.organizationId || 'org_default';
        return await intelligenceService.listClaims(storyId, orgId);
      },

      getStoryEvidence: async (
        _: unknown,
        { storyId }: { storyId: string },
        ctx?: GraphQLContext
      ) => {
        const orgId = ctx?.organizationId || 'org_default';
        return await intelligenceService.listEvidence(storyId, orgId);
      },

      getStoryTimeline: async (
        _: unknown,
        { storyId }: { storyId: string },
        ctx?: GraphQLContext
      ) => {
        const orgId = ctx?.organizationId || 'org_default';
        return await intelligenceService.listTimeline(storyId, orgId);
      },

      getStoryPerspectives: async (
        _: unknown,
        { storyId }: { storyId: string },
        ctx?: GraphQLContext
      ) => {
        const orgId = ctx?.organizationId || 'org_default';
        return await intelligenceService.listPerspectives(storyId, orgId);
      },

      // --- Knowledge graph ---------------------------------------------------

      getKnowledgeEdges: async (
        _: unknown,
        filter: {
          fromType?: string;
          fromId?: string;
          toType?: string;
          toId?: string;
          relation?: string;
          limit?: number;
        },
        ctx?: GraphQLContext
      ) => {
        const orgId = ctx?.organizationId || 'org_default';
        return await knowledgeGraphService.listEdges(orgId, filter);
      },

      getGraphNeighborhood: async (
        _: unknown,
        {
          nodeType,
          nodeId,
          depth,
          limit,
        }: { nodeType: string; nodeId: string; depth?: number; limit?: number },
        ctx?: GraphQLContext
      ) => {
        const orgId = ctx?.organizationId || 'org_default';
        return await knowledgeGraphService.getNeighborhood(
          nodeType as Parameters<KnowledgeGraphService['getNeighborhood']>[0],
          nodeId,
          orgId,
          depth,
          limit
        );
      },

      queryKnowledgeGraph: async (
        _: unknown,
        { input }: { input: GraphQueryInput },
        ctx?: GraphQLContext
      ) => {
        const orgId = ctx?.organizationId || 'org_default';
        return await knowledgeGraphService.query(input, orgId);
      },

      // --- Alerts ------------------------------------------------------------

      getAlertRules: async (
        _: unknown,
        { enabled }: { enabled?: boolean },
        ctx?: GraphQLContext
      ) => {
        const orgId = ctx?.organizationId || 'org_default';
        return await alertService.listRules(orgId, enabled);
      },

      getAlertRule: async (_: unknown, { id }: { id: string }, ctx?: GraphQLContext) => {
        const orgId = ctx?.organizationId || 'org_default';
        return await alertService.getRule(id, orgId);
      },

      getAlertTriggers: async (_: unknown, { limit }: { limit?: number }, ctx?: GraphQLContext) => {
        const orgId = ctx?.organizationId || 'org_default';
        return await alertService.listTriggers(orgId, limit ?? 50);
      },

      // --- Ingestion ---------------------------------------------------------

      getIngestionFeeds: async (_: unknown, __: unknown, ctx?: GraphQLContext) => {
        const orgId = ctx?.organizationId || 'org_default';
        return await ingestionService.listFeeds(orgId);
      },

      getIngestionItems: async (
        _: unknown,
        filter: {
          feedId?: string;
          status?: string;
          query?: string;
          limit?: number;
          offset?: number;
        },
        ctx?: GraphQLContext
      ) => {
        const orgId = ctx?.organizationId || 'org_default';
        return await ingestionService.listItems(orgId, filter);
      },

      getBreakingNewsCandidates: async (
        _: unknown,
        { limit }: { limit?: number },
        ctx?: GraphQLContext
      ) => {
        const orgId = ctx?.organizationId || 'org_default';
        return await ingestionService.detectBreakingCandidates(orgId, { limit });
      },

      // --- Source intelligence ----------------------------------------------

      getSourceCorrections: async (
        _: unknown,
        filter: {
          publisherId?: string;
          sourceId?: string;
          storyId?: string;
          limit?: number;
        },
        ctx?: GraphQLContext
      ) => {
        const orgId = ctx?.organizationId || 'org_default';
        return await sourceIntelligenceService.getCorrections(orgId, filter);
      },

      getPublisherIntelligence: async (
        _: unknown,
        { publisherId }: { publisherId: string },
        ctx?: GraphQLContext
      ) => {
        const orgId = ctx?.organizationId || 'org_default';
        return await sourceIntelligenceService.getPublisherIntelligence(publisherId, orgId);
      },

      getBlockCatalog: async () => buildBlockCatalog(),

      // --- Evidence chain (§7) ---------------------------------------------

      getClaimEvidence: async (
        _: unknown,
        { claimId }: { claimId: string },
        ctx?: GraphQLContext
      ) => {
        const orgId = ctx?.organizationId || 'org_default';
        return await intelligenceService.getClaimEvidence(claimId, orgId);
      },

      getSourceClaims: async (
        _: unknown,
        { sourceId }: { sourceId: string },
        ctx?: GraphQLContext
      ) => {
        const orgId = ctx?.organizationId || 'org_default';
        return await intelligenceService.getSourceClaims(sourceId, orgId);
      },

      getEntityStories: async (
        _: unknown,
        { entityId }: { entityId: string },
        ctx?: GraphQLContext
      ) => {
        const orgId = ctx?.organizationId || 'org_default';
        return await intelligenceService.getEntityStories(entityId, orgId);
      },

      getEventMap: async (
        _: unknown,
        { input }: { input?: Record<string, unknown> },
        ctx?: GraphQLContext
      ) => {
        const orgId = ctx?.organizationId || 'org_default';
        const points = await eventService.listEventsForMap(orgId, (input ?? {}) as never);
        return { count: points.length, points };
      },

      getEventHeatmap: async (
        _: unknown,
        { input, precision }: { input?: Record<string, unknown>; precision?: number },
        ctx?: GraphQLContext
      ) => {
        const orgId = ctx?.organizationId || 'org_default';
        return await eventService.getEventHeatmap(orgId, {
          ...((input ?? {}) as Record<string, unknown>),
          precision,
        } as never);
      },
    },

    Mutation: {
      createStory: async (
        _: unknown,
        { input }: { input: CreateStoryInput },
        ctx?: GraphQLContext
      ) => {
        const auth = requireAuth(ctx, 'news:write');

        const story = await storyService.createStory(input, {
          organizationId: auth.organizationId,
          authorId: auth.userId,
          clientType: auth.clientType,
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
        const auth = requireAuth(ctx, 'news:write');

        const story = await storyService.updateStory(id, input, {
          organizationId: auth.organizationId,
          authorId: auth.userId,
          clientType: auth.clientType,
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
        const auth = requireAuth(ctx, 'news:write');
        const clientType = input.clientType || auth.clientType;

        const version = await storyService.createStoryVersion(input.storyId, input, {
          organizationId: auth.organizationId,
          authorId: auth.userId,
          clientType,
          createdVia: 'api',
        });

        const story = await storyService.getStory(input.storyId, auth.organizationId);
        if (ctx?.pubsub && story) {
          ctx.pubsub.publish({
            topic: 'STORY_UPDATED',
            payload: { storyUpdated: story as unknown as Record<string, unknown> },
          });
        }

        return version;
      },

      publishStory: async (_: unknown, { id }: { id: string }, ctx?: GraphQLContext) => {
        const auth = requireAuth(ctx, 'news:publish');

        const story = await storyService.publishStory(id, {
          organizationId: auth.organizationId,
          authorId: auth.userId,
          clientType: auth.clientType,
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
        const auth = requireAuth(ctx, 'news:publish');

        const story = await storyService.unpublishStory(id, {
          organizationId: auth.organizationId,
          authorId: auth.userId,
          clientType: auth.clientType,
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
        const auth = requireAuth(ctx, 'news:write');

        const addedBlock = await storyService.addBlock(storyId, block, {
          organizationId: auth.organizationId,
          authorId: auth.userId,
          clientType: auth.clientType,
          createdVia: 'api',
        });

        const story = await storyService.getStory(storyId, auth.organizationId);
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
        const auth = requireAuth(ctx, ['news:sources', 'news:write']);
        await sourceService.attachSourceToStory(storyId, sourceId, auth.organizationId);
        return await storyService.getStory(storyId, auth.organizationId);
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
        },
        ctx?: GraphQLContext
      ) => {
        requireAuth(ctx, ['news:media', 'news:write']);
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
        const auth = requireAuth(ctx, ['news:topics', 'news:write']);
        return await topicService.createTopic(input, auth.organizationId);
      },

      createEvent: async (
        _: unknown,
        { input }: { input: CreateEventInput },
        ctx?: GraphQLContext
      ) => {
        const auth = requireAuth(ctx, 'news:write');
        return await eventService.createEvent(input, auth.organizationId);
      },

      createEntity: async (
        _: unknown,
        { input }: { input: CreateEntityInput },
        ctx?: GraphQLContext
      ) => {
        const auth = requireAuth(ctx, 'news:write');
        return await entityService.createEntity(input, auth.organizationId);
      },

      // --- Story intelligence ------------------------------------------------

      createClaim: async (
        _: unknown,
        { storyId, input }: { storyId: string; input: Omit<CreateStoryClaimInput, 'storyId'> },
        ctx?: GraphQLContext
      ) => {
        const auth = requireAuth(ctx, 'news:write');
        return await intelligenceService.createClaim(
          storyId,
          { ...input },
          intelligenceContext(auth)
        );
      },

      updateClaimStatus: async (
        _: unknown,
        {
          storyId,
          claimId,
          input,
        }: { storyId: string; claimId: string; input: UpdateClaimStatusInput },
        ctx?: GraphQLContext
      ) => {
        const auth = requireAuth(ctx, 'news:write');
        return await intelligenceService.updateClaimStatus(
          storyId,
          claimId,
          input,
          intelligenceContext(auth)
        );
      },

      deleteClaim: async (
        _: unknown,
        { storyId, claimId }: { storyId: string; claimId: string },
        ctx?: GraphQLContext
      ) => {
        const auth = requireAuth(ctx, 'news:write');
        await intelligenceService.deleteClaim(storyId, claimId, intelligenceContext(auth));
        return true;
      },

      addEvidence: async (
        _: unknown,
        { storyId, input }: { storyId: string; input: Omit<CreateEvidenceInput, 'storyId'> },
        ctx?: GraphQLContext
      ) => {
        const auth = requireAuth(ctx, 'news:write');
        return await intelligenceService.addEvidence(
          storyId,
          { ...input },
          intelligenceContext(auth)
        );
      },

      deleteEvidence: async (
        _: unknown,
        { storyId, evidenceId }: { storyId: string; evidenceId: string },
        ctx?: GraphQLContext
      ) => {
        const auth = requireAuth(ctx, 'news:write');
        await intelligenceService.deleteEvidence(storyId, evidenceId, intelligenceContext(auth));
        return true;
      },

      addTimelineEvent: async (
        _: unknown,
        { storyId, input }: { storyId: string; input: Omit<CreateTimelineEventInput, 'storyId'> },
        ctx?: GraphQLContext
      ) => {
        const auth = requireAuth(ctx, 'news:write');
        return await intelligenceService.addTimelineEvent(
          storyId,
          { ...input },
          intelligenceContext(auth)
        );
      },

      updateTimelineEvent: async (
        _: unknown,
        {
          storyId,
          eventId,
          input,
        }: { storyId: string; eventId: string; input: UpdateTimelineEventInput },
        ctx?: GraphQLContext
      ) => {
        const auth = requireAuth(ctx, 'news:write');
        return await intelligenceService.updateTimelineEvent(
          storyId,
          eventId,
          input,
          intelligenceContext(auth)
        );
      },

      deleteTimelineEvent: async (
        _: unknown,
        { storyId, eventId }: { storyId: string; eventId: string },
        ctx?: GraphQLContext
      ) => {
        const auth = requireAuth(ctx, 'news:write');
        await intelligenceService.deleteTimelineEvent(storyId, eventId, intelligenceContext(auth));
        return true;
      },

      addPerspective: async (
        _: unknown,
        {
          storyId,
          input,
        }: { storyId: string; input: Omit<CreateEditorialPerspectiveInput, 'storyId'> },
        ctx?: GraphQLContext
      ) => {
        const auth = requireAuth(ctx, 'news:write');
        return await intelligenceService.addPerspective(
          storyId,
          { ...input },
          intelligenceContext(auth)
        );
      },

      deletePerspective: async (
        _: unknown,
        { storyId, perspectiveId }: { storyId: string; perspectiveId: string },
        ctx?: GraphQLContext
      ) => {
        const auth = requireAuth(ctx, 'news:write');
        await intelligenceService.deletePerspective(
          storyId,
          perspectiveId,
          intelligenceContext(auth)
        );
        return true;
      },

      // --- Knowledge graph ---------------------------------------------------

      addKnowledgeEdge: async (
        _: unknown,
        { input }: { input: CreateKnowledgeEdgeInput },
        ctx?: GraphQLContext
      ) => {
        const auth = requireAuth(ctx, 'news:write');
        return await knowledgeGraphService.addEdge(input, intelligenceContext(auth));
      },

      deleteKnowledgeEdge: async (_: unknown, { id }: { id: string }, ctx?: GraphQLContext) => {
        const auth = requireAuth(ctx, 'news:write');
        await knowledgeGraphService.deleteEdge(id, intelligenceContext(auth));
        return true;
      },

      // --- Alerts ------------------------------------------------------------

      createAlertRule: async (
        _: unknown,
        { input }: { input: CreateAlertRuleInput },
        ctx?: GraphQLContext
      ) => {
        const auth = requireAuth(ctx, 'news:write');
        return await alertService.createRule(input, intelligenceContext(auth));
      },

      updateAlertRule: async (
        _: unknown,
        { id, input }: { id: string; input: UpdateAlertRuleInput },
        ctx?: GraphQLContext
      ) => {
        const auth = requireAuth(ctx, 'news:write');
        return await alertService.updateRule(id, input, intelligenceContext(auth));
      },

      deleteAlertRule: async (_: unknown, { id }: { id: string }, ctx?: GraphQLContext) => {
        const auth = requireAuth(ctx, 'news:write');
        await alertService.deleteRule(id, intelligenceContext(auth));
        return true;
      },

      evaluateAlerts: async (
        _: unknown,
        {
          resourceType,
          resourceId,
        }: { resourceType: 'EVENT' | 'STORY' | 'INGESTION_ITEM'; resourceId: string },
        ctx?: GraphQLContext
      ) => {
        const auth = requireAuth(ctx, 'news:write');
        return await alertService.evaluate(resourceType, resourceId, intelligenceContext(auth));
      },

      // --- Ingestion ---------------------------------------------------------

      createIngestionFeed: async (
        _: unknown,
        { input }: { input: CreateIngestionFeedInput },
        ctx?: GraphQLContext
      ) => {
        const auth = requireAuth(ctx, 'news:write');
        return await ingestionService.createFeed(input, intelligenceContext(auth));
      },

      updateIngestionFeed: async (
        _: unknown,
        { id, input }: { id: string; input: Partial<CreateIngestionFeedInput> },
        ctx?: GraphQLContext
      ) => {
        const auth = requireAuth(ctx, 'news:write');
        return await ingestionService.updateFeed(id, input, intelligenceContext(auth));
      },

      deleteIngestionFeed: async (_: unknown, { id }: { id: string }, ctx?: GraphQLContext) => {
        const auth = requireAuth(ctx, 'news:write');
        await ingestionService.deleteFeed(id, intelligenceContext(auth));
        return true;
      },

      ingestFeed: async (_: unknown, { feedId }: { feedId: string }, ctx?: GraphQLContext) => {
        const auth = requireAuth(ctx, 'news:write');
        return await ingestionService.ingestFeed(feedId, intelligenceContext(auth));
      },

      promoteIngestionItem: async (
        _: unknown,
        { itemId, input }: { itemId: string; input?: Omit<PromoteIngestionItemInput, 'itemId'> },
        ctx?: GraphQLContext
      ) => {
        const auth = requireAuth(ctx, 'news:write');
        return await ingestionService.promoteItem(
          itemId,
          { ...(input ?? {}) },
          intelligenceContext(auth)
        );
      },

      // --- Source intelligence ----------------------------------------------

      addSourceCorrection: async (
        _: unknown,
        { input }: { input: CreateSourceCorrectionInput },
        ctx?: GraphQLContext
      ) => {
        const auth = requireAuth(ctx, 'news:write');
        return await sourceIntelligenceService.addCorrection(input, intelligenceContext(auth));
      },

      deleteSourceCorrection: async (_: unknown, { id }: { id: string }, ctx?: GraphQLContext) => {
        const auth = requireAuth(ctx, 'news:write');
        await sourceIntelligenceService.deleteCorrection(id, intelligenceContext(auth));
        return true;
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

    Claim: {
      evidence: async (
        parent: { id: string; storyId: string; evidence?: unknown[] },
        _: unknown,
        ctx?: GraphQLContext
      ) => {
        if (Array.isArray(parent.evidence)) return parent.evidence;
        const orgId = ctx?.organizationId || 'org_default';
        return await intelligenceService.listEvidence(parent.storyId, orgId, parent.id);
      },
    },
  };
}
