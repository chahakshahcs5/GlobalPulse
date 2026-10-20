import { Resolver, Query, Mutation, Args, Context, ResolveField, Parent } from '@nestjs/graphql';
import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import {
  AlertService,
  IngestionService,
  KnowledgeGraphService,
  SourceIntelligenceService,
  StoryIntelligenceService,
} from '@ai-news/stories';
import { db } from '@ai-news/database';
import { EventService } from '@ai-news/events';
import { buildBlockCatalog } from '@ai-news/schemas';
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
  ValidationError,
} from '@ai-news/shared';
import { ZodError } from 'zod';
import type {
  AlertRule,
  AlertTrigger,
  BreakingNewsCandidate,
  EditorialPerspective,
  Evidence,
  EvaluateAlertsResult,
  GraphTraversal,
  IngestionFeed,
  IngestionItem,
  IngestFeedResult,
  KnowledgeEdge,
  PromoteIngestionItemResult,
  SourceCorrection,
  SourceIntelligence,
  Story,
  StoryClaim,
  StoryIntelligence,
  StoryTimelineEvent,
  StoryWhatChanged,
} from '@ai-news/schemas';
import type { AuthenticatedPrincipal, NewsScope } from '@ai-news/auth';

export interface IntelligenceResolverContext {
  principal?: AuthenticatedPrincipal;
  organizationId?: string;
  userId?: string;
  clientType?: string;
  role?: string;
  scopes?: string[];
}

/**
 * Translates domain errors into HTTP exceptions so GraphQL answers with a
 * proper `errors` envelope instead of an opaque server error.
 */
function toHttpException(error: unknown): Error {
  if (error instanceof NotFoundError) return new NotFoundException(error.message);
  if (error instanceof ConflictError) return new ConflictException(error.message);
  if (error instanceof ForbiddenError) return new ForbiddenException(error.message);
  if (error instanceof UnauthorizedError) return new UnauthorizedException(error.message);
  if (error instanceof ValidationError) return new BadRequestException(error.message);
  if (error instanceof ZodError) {
    return new BadRequestException('The request payload failed schema validation.');
  }
  return error instanceof Error ? error : new Error(String(error));
}

/**
 * Wraps a service so every domain error is translated for the GraphQL layer.
 * Business rules stay in the services; only the transport representation
 * changes here.
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
              throw toHttpException(err);
            });
          }
          return result;
        } catch (err) {
          throw toHttpException(err);
        }
      };
    },
  });
}

/**
 * GraphQL surface for the intelligence domains.
 *
 * Business rules live in the shared services; this resolver only performs
 * transport-level concerns (argument plumbing, authentication, scope checks).
 */
@Injectable()
@Resolver('Story')
export class IntelligenceResolver {
  private readonly intelligence = withGraphQLErrors(new StoryIntelligenceService(db));
  private readonly graph = withGraphQLErrors(new KnowledgeGraphService(db));
  private readonly alerts = withGraphQLErrors(new AlertService(db));
  private readonly ingestion = withGraphQLErrors(new IngestionService(db));
  private readonly sourceIntelligence = withGraphQLErrors(new SourceIntelligenceService(db));
  private readonly events = withGraphQLErrors(new EventService(db));

  private requirePrincipal(
    ctx?: IntelligenceResolverContext,
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
        scopesToCheck.some((scope) => ctx.principal!.scopes.includes(scope));

      if (!hasAnyScope) {
        throw new ForbiddenException(
          `Insufficient privileges. Required one of: [${scopesToCheck.join(', ')}], but principal has: [${ctx.principal.scopes.join(', ')}]`
        );
      }
    }
    return ctx.principal;
  }

  private orgId(ctx?: IntelligenceResolverContext): string {
    return ctx?.organizationId || ctx?.principal?.organizationId || 'org_default';
  }

  private context(ctx?: IntelligenceResolverContext) {
    const principal = ctx?.principal;
    return {
      organizationId: this.orgId(ctx),
      actorId: principal?.id || ctx?.userId || 'usr_graphql',
      clientType: (principal?.clientType || ctx?.clientType || 'human_web') as
        'gemini' | 'gemini_spark' | 'chatgpt' | 'claude' | 'custom_mcp' | 'human_web',
    };
  }

  // --- Queries ---------------------------------------------------------------

  @Query('getStoryIntelligence')
  async getStoryIntelligence(
    @Args('storyId') storyId: string,
    @Context() ctx?: IntelligenceResolverContext
  ): Promise<StoryIntelligence> {
    return await this.intelligence.getStoryIntelligence(storyId, this.orgId(ctx));
  }

  @Query('getStoryWhatChanged')
  async getStoryWhatChanged(
    @Args('storyId') storyId: string,
    @Context() ctx?: IntelligenceResolverContext
  ): Promise<StoryWhatChanged> {
    return await this.intelligence.getWhatChanged(storyId, this.orgId(ctx));
  }

  @Query('getStoryClaims')
  async getStoryClaims(
    @Args('storyId') storyId: string,
    @Context() ctx?: IntelligenceResolverContext
  ): Promise<StoryClaim[]> {
    return await this.intelligence.listClaims(storyId, this.orgId(ctx));
  }

  @Query('getStoryEvidence')
  async getStoryEvidence(
    @Args('storyId') storyId: string,
    @Context() ctx?: IntelligenceResolverContext
  ): Promise<Evidence[]> {
    return await this.intelligence.listEvidence(storyId, this.orgId(ctx));
  }

  @Query('getStoryTimeline')
  async getStoryTimeline(
    @Args('storyId') storyId: string,
    @Context() ctx?: IntelligenceResolverContext
  ): Promise<StoryTimelineEvent[]> {
    return await this.intelligence.listTimeline(storyId, this.orgId(ctx));
  }

  @Query('getStoryPerspectives')
  async getStoryPerspectives(
    @Args('storyId') storyId: string,
    @Context() ctx?: IntelligenceResolverContext
  ): Promise<EditorialPerspective[]> {
    return await this.intelligence.listPerspectives(storyId, this.orgId(ctx));
  }

  @Query('getKnowledgeEdges')
  async getKnowledgeEdges(
    @Args('fromType', { type: () => String, nullable: true }) fromType: string | undefined,
    @Args('fromId', { type: () => String, nullable: true }) fromId: string | undefined,
    @Args('toType', { type: () => String, nullable: true }) toType: string | undefined,
    @Args('toId', { type: () => String, nullable: true }) toId: string | undefined,
    @Args('relation', { type: () => String, nullable: true }) relation: string | undefined,
    @Args('limit', { type: () => Number, nullable: true }) limit: number | undefined,
    @Context() ctx?: IntelligenceResolverContext
  ): Promise<KnowledgeEdge[]> {
    return await this.graph.listEdges(this.orgId(ctx), {
      fromType,
      fromId,
      toType,
      toId,
      relation,
      limit,
    });
  }

  @Query('getGraphNeighborhood')
  async getGraphNeighborhood(
    @Args('nodeType') nodeType: string,
    @Args('nodeId') nodeId: string,
    @Args('depth', { type: () => Number, nullable: true }) depth: number | undefined,
    @Args('limit', { type: () => Number, nullable: true }) limit: number | undefined,
    @Context() ctx?: IntelligenceResolverContext
  ): Promise<GraphTraversal> {
    return await this.graph.getNeighborhood(
      nodeType as Parameters<KnowledgeGraphService['getNeighborhood']>[0],
      nodeId,
      this.orgId(ctx),
      depth,
      limit
    );
  }

  @Query('queryKnowledgeGraph')
  async queryKnowledgeGraph(
    @Args('input') input: Record<string, unknown>,
    @Context() ctx?: IntelligenceResolverContext
  ): Promise<unknown> {
    return await this.graph.query(
      {
        ...(input as Record<string, unknown>),
        depth: (input.depth as number | undefined) ?? 1,
        limit: (input.limit as number | undefined) ?? 100,
      } as never,
      this.orgId(ctx)
    );
  }

  @Query('getAlertRules')
  async getAlertRules(
    @Args('enabled', { type: () => Boolean, nullable: true }) enabled: boolean | undefined,
    @Context() ctx?: IntelligenceResolverContext
  ): Promise<AlertRule[]> {
    return await this.alerts.listRules(this.orgId(ctx), enabled);
  }

  @Query('getAlertRule')
  async getAlertRule(
    @Args('id') id: string,
    @Context() ctx?: IntelligenceResolverContext
  ): Promise<AlertRule> {
    return await this.alerts.getRule(id, this.orgId(ctx));
  }

  @Query('getAlertTriggers')
  async getAlertTriggers(
    @Args('limit', { type: () => Number, nullable: true }) limit: number | undefined,
    @Context() ctx?: IntelligenceResolverContext
  ): Promise<AlertTrigger[]> {
    return await this.alerts.listTriggers(this.orgId(ctx), limit ?? 50);
  }

  @Query('getIngestionFeeds')
  async getIngestionFeeds(@Context() ctx?: IntelligenceResolverContext): Promise<IngestionFeed[]> {
    return await this.ingestion.listFeeds(this.orgId(ctx));
  }

  @Query('getIngestionItems')
  async getIngestionItems(
    @Args('feedId', { type: () => String, nullable: true }) feedId: string | undefined,
    @Args('status', { type: () => String, nullable: true }) status: string | undefined,
    @Args('query', { type: () => String, nullable: true }) query: string | undefined,
    @Args('limit', { type: () => Number, nullable: true }) limit: number | undefined,
    @Args('offset', { type: () => Number, nullable: true }) offset: number | undefined,
    @Context() ctx?: IntelligenceResolverContext
  ): Promise<IngestionItem[]> {
    return await this.ingestion.listItems(this.orgId(ctx), {
      feedId,
      status,
      query,
      limit,
      offset,
    });
  }

  @Query('getBreakingNewsCandidates')
  async getBreakingNewsCandidates(
    @Args('limit', { type: () => Number, nullable: true }) limit: number | undefined,
    @Context() ctx?: IntelligenceResolverContext
  ): Promise<BreakingNewsCandidate[]> {
    return await this.ingestion.detectBreakingCandidates(this.orgId(ctx), { limit });
  }

  @Query('getSourceCorrections')
  async getSourceCorrections(
    @Args('publisherId', { type: () => String, nullable: true }) publisherId: string | undefined,
    @Args('sourceId', { type: () => String, nullable: true }) sourceId: string | undefined,
    @Args('storyId', { type: () => String, nullable: true }) storyId: string | undefined,
    @Args('limit', { type: () => Number, nullable: true }) limit: number | undefined,
    @Context() ctx?: IntelligenceResolverContext
  ): Promise<SourceCorrection[]> {
    return await this.sourceIntelligence.getCorrections(this.orgId(ctx), {
      publisherId,
      sourceId,
      storyId,
      limit,
    });
  }

  @Query('getPublisherIntelligence')
  async getPublisherIntelligence(
    @Args('publisherId') publisherId: string,
    @Context() ctx?: IntelligenceResolverContext
  ): Promise<SourceIntelligence> {
    return await this.sourceIntelligence.getPublisherIntelligence(publisherId, this.orgId(ctx));
  }

  @Query('getBlockCatalog')
  getBlockCatalog(): Record<string, unknown> {
    return buildBlockCatalog() as unknown as Record<string, unknown>;
  }

  // --- Evidence chain (§7) ---------------------------------------------------

  @Query('getClaimEvidence')
  async getClaimEvidence(
    @Args('claimId') claimId: string,
    @Context() ctx?: IntelligenceResolverContext
  ): Promise<{ claim: StoryClaim; evidence: Evidence[] }> {
    return await this.intelligence.getClaimEvidence(claimId, this.orgId(ctx));
  }

  @Query('getSourceClaims')
  async getSourceClaims(
    @Args('sourceId') sourceId: string,
    @Context() ctx?: IntelligenceResolverContext
  ): Promise<StoryClaim[]> {
    return await this.intelligence.getSourceClaims(sourceId, this.orgId(ctx));
  }

  @Query('getEntityStories')
  async getEntityStories(
    @Args('entityId') entityId: string,
    @Context() ctx?: IntelligenceResolverContext
  ): Promise<Story[]> {
    return await this.intelligence.getEntityStories(entityId, this.orgId(ctx));
  }

  @Query('getEventMap')
  async getEventMap(
    @Args('input', { type: () => Object, nullable: true })
    input: Record<string, unknown> | undefined,
    @Context() ctx?: IntelligenceResolverContext
  ): Promise<{ count: number; points: unknown[] }> {
    const points = await this.events.listEventsForMap(this.orgId(ctx), (input ?? {}) as never);
    return { count: points.length, points };
  }

  @Query('getEventHeatmap')
  async getEventHeatmap(
    @Args('input', { type: () => Object, nullable: true })
    input: Record<string, unknown> | undefined,
    @Args('precision', { type: () => Number, nullable: true }) precision: number | undefined,
    @Context() ctx?: IntelligenceResolverContext
  ): Promise<unknown> {
    return await this.events.getEventHeatmap(this.orgId(ctx), {
      ...((input ?? {}) as Record<string, unknown>),
      precision,
    } as never);
  }

  // --- Mutations -------------------------------------------------------------

  @Mutation('createClaim')
  async createClaim(
    @Args('storyId') storyId: string,
    @Args('input') input: Record<string, unknown>,
    @Context() ctx?: IntelligenceResolverContext
  ): Promise<StoryClaim> {
    this.requirePrincipal(ctx, 'news:write');
    return await this.intelligence.createClaim(
      storyId,
      { ...(input as Record<string, unknown>) } as never,
      this.context(ctx)
    );
  }

  @Mutation('updateClaimStatus')
  async updateClaimStatus(
    @Args('storyId') storyId: string,
    @Args('claimId') claimId: string,
    @Args('input') input: Record<string, unknown>,
    @Context() ctx?: IntelligenceResolverContext
  ): Promise<StoryClaim> {
    this.requirePrincipal(ctx, 'news:write');
    return await this.intelligence.updateClaimStatus(
      storyId,
      claimId,
      input as never,
      this.context(ctx)
    );
  }

  @Mutation('deleteClaim')
  async deleteClaim(
    @Args('storyId') storyId: string,
    @Args('claimId') claimId: string,
    @Context() ctx?: IntelligenceResolverContext
  ): Promise<boolean> {
    this.requirePrincipal(ctx, 'news:write');
    await this.intelligence.deleteClaim(storyId, claimId, this.context(ctx));
    return true;
  }

  @Mutation('addEvidence')
  async addEvidence(
    @Args('storyId') storyId: string,
    @Args('input') input: Record<string, unknown>,
    @Context() ctx?: IntelligenceResolverContext
  ): Promise<Evidence> {
    this.requirePrincipal(ctx, 'news:write');
    return await this.intelligence.addEvidence(
      storyId,
      { ...(input as Record<string, unknown>) } as never,
      this.context(ctx)
    );
  }

  @Mutation('deleteEvidence')
  async deleteEvidence(
    @Args('storyId') storyId: string,
    @Args('evidenceId') evidenceId: string,
    @Context() ctx?: IntelligenceResolverContext
  ): Promise<boolean> {
    this.requirePrincipal(ctx, 'news:write');
    await this.intelligence.deleteEvidence(storyId, evidenceId, this.context(ctx));
    return true;
  }

  @Mutation('addTimelineEvent')
  async addTimelineEvent(
    @Args('storyId') storyId: string,
    @Args('input') input: Record<string, unknown>,
    @Context() ctx?: IntelligenceResolverContext
  ): Promise<StoryTimelineEvent> {
    this.requirePrincipal(ctx, 'news:write');
    return await this.intelligence.addTimelineEvent(
      storyId,
      { ...(input as Record<string, unknown>) } as never,
      this.context(ctx)
    );
  }

  @Mutation('updateTimelineEvent')
  async updateTimelineEvent(
    @Args('storyId') storyId: string,
    @Args('eventId') eventId: string,
    @Args('input') input: Record<string, unknown>,
    @Context() ctx?: IntelligenceResolverContext
  ): Promise<StoryTimelineEvent> {
    this.requirePrincipal(ctx, 'news:write');
    return await this.intelligence.updateTimelineEvent(
      storyId,
      eventId,
      { ...(input as Record<string, unknown>), id: eventId } as never,
      this.context(ctx)
    );
  }

  @Mutation('deleteTimelineEvent')
  async deleteTimelineEvent(
    @Args('storyId') storyId: string,
    @Args('eventId') eventId: string,
    @Context() ctx?: IntelligenceResolverContext
  ): Promise<boolean> {
    this.requirePrincipal(ctx, 'news:write');
    await this.intelligence.deleteTimelineEvent(storyId, eventId, this.context(ctx));
    return true;
  }

  @Mutation('addPerspective')
  async addPerspective(
    @Args('storyId') storyId: string,
    @Args('input') input: Record<string, unknown>,
    @Context() ctx?: IntelligenceResolverContext
  ): Promise<EditorialPerspective> {
    this.requirePrincipal(ctx, 'news:write');
    return await this.intelligence.addPerspective(
      storyId,
      { ...(input as Record<string, unknown>) } as never,
      this.context(ctx)
    );
  }

  @Mutation('deletePerspective')
  async deletePerspective(
    @Args('storyId') storyId: string,
    @Args('perspectiveId') perspectiveId: string,
    @Context() ctx?: IntelligenceResolverContext
  ): Promise<boolean> {
    this.requirePrincipal(ctx, 'news:write');
    await this.intelligence.deletePerspective(storyId, perspectiveId, this.context(ctx));
    return true;
  }

  @Mutation('addKnowledgeEdge')
  async addKnowledgeEdge(
    @Args('input') input: Record<string, unknown>,
    @Context() ctx?: IntelligenceResolverContext
  ): Promise<KnowledgeEdge> {
    this.requirePrincipal(ctx, 'news:write');
    return await this.graph.addEdge(input as never, this.context(ctx));
  }

  @Mutation('deleteKnowledgeEdge')
  async deleteKnowledgeEdge(
    @Args('id') id: string,
    @Context() ctx?: IntelligenceResolverContext
  ): Promise<boolean> {
    this.requirePrincipal(ctx, 'news:write');
    await this.graph.deleteEdge(id, this.context(ctx));
    return true;
  }

  @Mutation('createAlertRule')
  async createAlertRule(
    @Args('input') input: Record<string, unknown>,
    @Context() ctx?: IntelligenceResolverContext
  ): Promise<AlertRule> {
    this.requirePrincipal(ctx, 'news:write');
    return await this.alerts.createRule(input as never, this.context(ctx));
  }

  @Mutation('updateAlertRule')
  async updateAlertRule(
    @Args('id') id: string,
    @Args('input') input: Record<string, unknown>,
    @Context() ctx?: IntelligenceResolverContext
  ): Promise<AlertRule> {
    this.requirePrincipal(ctx, 'news:write');
    return await this.alerts.updateRule(id, input as never, this.context(ctx));
  }

  @Mutation('deleteAlertRule')
  async deleteAlertRule(
    @Args('id') id: string,
    @Context() ctx?: IntelligenceResolverContext
  ): Promise<boolean> {
    this.requirePrincipal(ctx, 'news:write');
    await this.alerts.deleteRule(id, this.context(ctx));
    return true;
  }

  @Mutation('evaluateAlerts')
  async evaluateAlerts(
    @Args('resourceType') resourceType: 'EVENT' | 'STORY' | 'INGESTION_ITEM',
    @Args('resourceId') resourceId: string,
    @Context() ctx?: IntelligenceResolverContext
  ): Promise<EvaluateAlertsResult> {
    this.requirePrincipal(ctx, 'news:write');
    return await this.alerts.evaluate(resourceType, resourceId, this.context(ctx));
  }

  @Mutation('createIngestionFeed')
  async createIngestionFeed(
    @Args('input') input: Record<string, unknown>,
    @Context() ctx?: IntelligenceResolverContext
  ): Promise<IngestionFeed> {
    this.requirePrincipal(ctx, 'news:write');
    return await this.ingestion.createFeed(input as never, this.context(ctx));
  }

  @Mutation('updateIngestionFeed')
  async updateIngestionFeed(
    @Args('id') id: string,
    @Args('input') input: Record<string, unknown>,
    @Context() ctx?: IntelligenceResolverContext
  ): Promise<IngestionFeed> {
    this.requirePrincipal(ctx, 'news:write');
    return await this.ingestion.updateFeed(id, input as never, this.context(ctx));
  }

  @Mutation('deleteIngestionFeed')
  async deleteIngestionFeed(
    @Args('id') id: string,
    @Context() ctx?: IntelligenceResolverContext
  ): Promise<boolean> {
    this.requirePrincipal(ctx, 'news:write');
    await this.ingestion.deleteFeed(id, this.context(ctx));
    return true;
  }

  @Mutation('ingestFeed')
  async ingestFeed(
    @Args('feedId') feedId: string,
    @Context() ctx?: IntelligenceResolverContext
  ): Promise<IngestFeedResult> {
    this.requirePrincipal(ctx, 'news:write');
    return await this.ingestion.ingestFeed(feedId, this.context(ctx));
  }

  @Mutation('promoteIngestionItem')
  async promoteIngestionItem(
    @Args('itemId') itemId: string,
    @Args('input', { type: () => Object, nullable: true })
    input: Record<string, unknown> | undefined,
    @Context() ctx?: IntelligenceResolverContext
  ): Promise<PromoteIngestionItemResult> {
    this.requirePrincipal(ctx, 'news:write');
    return await this.ingestion.promoteItem(
      itemId,
      { ...((input ?? {}) as Record<string, unknown>) } as never,
      this.context(ctx)
    );
  }

  @Mutation('addSourceCorrection')
  async addSourceCorrection(
    @Args('input') input: Record<string, unknown>,
    @Context() ctx?: IntelligenceResolverContext
  ): Promise<SourceCorrection> {
    this.requirePrincipal(ctx, 'news:write');
    return await this.sourceIntelligence.addCorrection(input as never, this.context(ctx));
  }

  @Mutation('deleteSourceCorrection')
  async deleteSourceCorrection(
    @Args('id') id: string,
    @Context() ctx?: IntelligenceResolverContext
  ): Promise<boolean> {
    this.requirePrincipal(ctx, 'news:write');
    await this.sourceIntelligence.deleteCorrection(id, this.context(ctx));
    return true;
  }
}

/**
 * Resolves the evidence attached to a claim. When the parent already carries
 * its evidence (aggregated intelligence payload) it is reused; otherwise the
 * evidence is loaded for the claim.
 */
@Injectable()
@Resolver('Claim')
export class ClaimEvidenceResolver {
  private readonly intelligence = withGraphQLErrors(new StoryIntelligenceService(db));

  @ResolveField('evidence')
  async evidence(
    @Parent() parent: { id: string; storyId: string; evidence?: Evidence[] },
    @Context() ctx?: IntelligenceResolverContext
  ): Promise<Evidence[]> {
    if (Array.isArray(parent.evidence)) return parent.evidence;
    const orgId = ctx?.organizationId || ctx?.principal?.organizationId || 'org_default';
    return await this.intelligence.listEvidence(parent.storyId, orgId, parent.id);
  }
}
