import type {
  Story,
  StoryClaim,
  Evidence,
  StoryTimelineEvent,
  EditorialPerspective,
  ClaimWithEvidence,
  StoryIntelligence,
  StoryWhatChanged,
  CreateStoryClaimInput,
  CreateEvidenceInput,
  CreateTimelineEventInput,
  UpdateTimelineEventInput,
  CreateEditorialPerspectiveInput,
  UpdateClaimStatusInput,
  ClientType,
} from '@ai-news/schemas';
import {
  CreateStoryClaimInputSchema,
  CreateEvidenceInputSchema,
  CreateTimelineEventInputSchema,
  UpdateTimelineEventInputSchema,
  CreateEditorialPerspectiveInputSchema,
  UpdateClaimStatusInputSchema,
  EVIDENCE_REQUIRED_CLAIM_STATUSES,
} from '@ai-news/schemas';
import type { DatabaseService } from '@ai-news/database';
import { generateId, NotFoundError, ValidationError } from '@ai-news/shared';
import { WhatChangedDiffService } from './what-changed';
import { NotificationService } from './notification.service';

export interface IntelligenceContext {
  organizationId: string;
  actorId: string;
  clientType: ClientType;
  requestId?: string;
}

/**
 * Source-of-truth service for claim/evidence/timeline/perspective data.
 *
 * All entry points (REST, GraphQL, MCP, workers) call this service, so the
 * evidence-required and tenant-isolation rules cannot be bypassed by a client.
 */
export class StoryIntelligenceService {
  constructor(private readonly db: DatabaseService) {}

  // --- Shared validation ----------------------------------------------------

  private async requireStory(storyId: string, orgId: string): Promise<Story> {
    const story = await this.db.stories.findById(storyId, orgId);
    if (!story) throw new NotFoundError('Story', storyId);
    return story;
  }

  private async requireClaim(claimId: string, storyId: string, orgId: string): Promise<StoryClaim> {
    const claim = await this.db.storyIntelligence.findClaimById(claimId, orgId);
    if (!claim || claim.storyId !== storyId) {
      throw new NotFoundError('StoryClaim', claimId);
    }
    return claim;
  }

  private async validateSourceIds(sourceIds: string[], orgId: string): Promise<void> {
    for (const sourceId of new Set(sourceIds)) {
      const source = await this.db.sources.findById(sourceId, orgId);
      if (!source) {
        throw new ValidationError(`Source "${sourceId}" does not exist in this organization.`);
      }
    }
  }

  private async audit(
    ctx: IntelligenceContext,
    action: string,
    resourceType: string,
    resourceId: string,
    payloadSummary?: Record<string, unknown>
  ): Promise<void> {
    try {
      await this.db.audit.log({
        id: generateId('aud'),
        organizationId: ctx.organizationId,
        userId: ctx.actorId,
        clientType: ctx.clientType,
        action,
        resourceType,
        resourceId,
        payloadSummary,
        requestId: ctx.requestId,
        status: 'SUCCESS',
        timestamp: new Date().toISOString(),
      });
    } catch {
      // Audit failures must never break an editorial write; the API layer logs them.
    }
  }

  // --- Evidence chain queries (§7) -------------------------------------------

  /**
   * The evidence chain for a single claim: the claim itself plus every piece
   * of evidence attached to it, with the sources they point at.
   */
  async getClaimEvidence(
    claimId: string,
    orgId: string
  ): Promise<{ claim: StoryClaim; evidence: Evidence[] }> {
    const claim = await this.db.storyIntelligence.findClaimById(claimId, orgId);
    if (!claim) throw new NotFoundError('StoryClaim', claimId);

    const evidence = await this.db.storyIntelligence.listEvidence(orgId, claim.storyId, claimId);
    return { claim, evidence };
  }

  /**
   * Every claim in the organization that cites a given source. This is the
   * "source → claims" direction of the evidence chain.
   */
  async getSourceClaims(sourceId: string, orgId: string): Promise<StoryClaim[]> {
    const source = await this.db.sources.findById(sourceId, orgId);
    if (!source) throw new NotFoundError('Source', sourceId);
    return this.db.storyIntelligence.listClaimsBySource(orgId, sourceId);
  }

  /**
   * Every story that mentions a given entity — the "entity → stories"
   * direction of the evidence chain.
   */
  async getEntityStories(entityId: string, orgId: string): Promise<Story[]> {
    const entity = await this.db.entities.findById(entityId, orgId);
    if (!entity) throw new NotFoundError('Entity', entityId);
    return this.db.stories.list({ entityId }, orgId);
  }

  // --- Aggregated intelligence ---------------------------------------------

  async getStoryIntelligence(storyId: string, orgId: string): Promise<StoryIntelligence> {
    const story = await this.requireStory(storyId, orgId);
    const [claims, evidence, timeline, perspectives, whatChanged] = await Promise.all([
      this.db.storyIntelligence.listClaims(orgId, storyId),
      this.db.storyIntelligence.listEvidence(orgId, storyId),
      this.db.storyIntelligence.listTimeline(orgId, storyId),
      this.db.storyIntelligence.listPerspectives(orgId, storyId),
      this.buildWhatChanged(story, orgId),
    ]);

    const evidenceByClaim = new Map<string, Evidence[]>();
    for (const item of evidence) {
      if (!item.claimId) continue;
      const list = evidenceByClaim.get(item.claimId) ?? [];
      list.push(item);
      evidenceByClaim.set(item.claimId, list);
    }

    const claimsWithEvidence: ClaimWithEvidence[] = claims.map((claim) => ({
      ...claim,
      evidence: evidenceByClaim.get(claim.id) ?? [],
    }));

    const contested = claims.filter(
      (c) => c.status === 'CONTRADICTED' || c.status === 'DISPUTED' || c.status === 'UNSUPPORTED'
    ).length;

    return {
      storyId,
      organizationId: orgId,
      title: story.title,
      summary: story.summary,
      status: story.status,
      claims: claimsWithEvidence,
      evidence,
      timeline,
      perspectives,
      whatChanged,
      metrics: {
        sourceCount: new Set([
          ...story.sourceIds,
          ...evidence.map((e) => e.sourceId).filter((v): v is string => Boolean(v)),
        ]).size,
        claimCount: claims.length,
        supportedClaimCount: claims.filter(
          (c) => c.status === 'SUPPORTED' || c.status === 'PARTIALLY_SUPPORTED'
        ).length,
        contestedClaimCount: contested,
        evidenceCount: evidence.length,
        timelineEventCount: timeline.length,
        perspectiveCount: perspectives.length,
        updateCount: Math.max(0, story.currentVersionNumber - 1),
      },
    };
  }

  async getWhatChanged(storyId: string, orgId: string): Promise<StoryWhatChanged> {
    const story = await this.requireStory(storyId, orgId);
    return this.buildWhatChanged(story, orgId);
  }

  async buildWhatChanged(story: Story, orgId: string): Promise<StoryWhatChanged> {
    const timeline = await this.db.storyIntelligence.listTimeline(orgId, story.id, { limit: 1 });
    const versions = await this.db.stories.getVersions(story.id);
    const sorted = [...versions].sort((a, b) => a.versionNumber - b.versionNumber);
    const current = sorted.find((v) => v.versionNumber === story.currentVersionNumber);
    const previous = sorted.find((v) => v.versionNumber === story.currentVersionNumber - 1);

    let items: StoryWhatChanged['items'] = [];
    if (current && previous) {
      const diff = WhatChangedDiffService.computeDiff(
        previous.versionNumber,
        previous.blocks,
        current.blocks
      );
      items = diff.data.items.map((item) => ({
        changeType: item.changeType,
        description: item.description,
        affectedSection: item.affectedSection,
        occurredAt: current.createdAt,
      }));
      if (previous.title !== current.title) {
        items.unshift({
          changeType: 'updated',
          description: `Headline changed from "${previous.title}" to "${current.title}".`,
          affectedSection: 'title',
          occurredAt: current.createdAt,
        });
      }
    }

    if (items.length === 0) {
      items = [
        {
          changeType: 'updated',
          description:
            story.currentVersionNumber > 1
              ? 'Minor editorial refinements in the latest revision.'
              : 'Initial published version.',
          occurredAt: story.updatedAt,
        },
      ];
    }

    return {
      storyId: story.id,
      previousVersionNumber: Math.max(0, story.currentVersionNumber - 1),
      currentVersionNumber: story.currentVersionNumber,
      updatedAt: story.updatedAt,
      latestDevelopment: timeline[0],
      items,
      affectedEntityIds: story.entityIds,
      supportingSourceIds: story.sourceIds,
    };
  }

  // --- Claims ---------------------------------------------------------------

  async listClaims(storyId: string, orgId: string): Promise<StoryClaim[]> {
    await this.requireStory(storyId, orgId);
    return this.db.storyIntelligence.listClaims(orgId, storyId);
  }

  async createClaim(
    storyId: string,
    input: Omit<CreateStoryClaimInput, 'storyId'>,
    ctx: IntelligenceContext
  ): Promise<StoryClaim> {
    const validated = CreateStoryClaimInputSchema.parse({ ...input, storyId });
    await this.requireStory(storyId, ctx.organizationId);
    await this.validateSourceIds(validated.sourceIds, ctx.organizationId);

    if (EVIDENCE_REQUIRED_CLAIM_STATUSES.has(validated.status)) {
      if (validated.sourceIds.length === 0) {
        throw new ValidationError(
          `A claim with status ${validated.status} requires at least one supporting source. Create the claim as UNVERIFIED, attach evidence, then update its status.`
        );
      }
    }

    const now = new Date().toISOString();
    const claim: StoryClaim = {
      id: generateId('clm'),
      organizationId: ctx.organizationId,
      storyId,
      text: validated.text,
      status: validated.status,
      confidence: validated.confidence,
      confidenceMethodology: validated.confidenceMethodology,
      methodology: validated.methodology,
      sourceIds: validated.sourceIds,
      citationIds: validated.citationIds,
      createdBy: ctx.actorId,
      createdAt: now,
      updatedAt: now,
    };

    const created = await this.db.storyIntelligence.createClaim(claim);
    await this.audit(ctx, `${ctx.clientType}.create_claim`, 'story_claim', created.id, {
      storyId,
      status: created.status,
    });
    return created;
  }

  async updateClaimStatus(
    storyId: string,
    claimId: string,
    input: UpdateClaimStatusInput,
    ctx: IntelligenceContext
  ): Promise<StoryClaim> {
    const validated = UpdateClaimStatusInputSchema.parse(input);
    await this.requireStory(storyId, ctx.organizationId);
    const claim = await this.requireClaim(claimId, storyId, ctx.organizationId);

    const sourceIds = validated.sourceIds ?? claim.sourceIds;
    await this.validateSourceIds(sourceIds, ctx.organizationId);

    if (EVIDENCE_REQUIRED_CLAIM_STATUSES.has(validated.status)) {
      const evidence = await this.db.storyIntelligence.listEvidence(
        ctx.organizationId,
        storyId,
        claimId
      );
      if (sourceIds.length === 0 && evidence.length === 0) {
        throw new ValidationError(
          `A claim cannot move to ${validated.status} without at least one source or evidence item.`
        );
      }
    }

    const now = new Date().toISOString();
    const updated: StoryClaim = {
      ...claim,
      status: validated.status,
      confidence: validated.confidence ?? claim.confidence,
      confidenceMethodology: validated.confidenceMethodology ?? claim.confidenceMethodology,
      methodology: validated.methodology ?? claim.methodology,
      reviewNotes: validated.reviewNotes ?? claim.reviewNotes,
      sourceIds,
      citationIds: validated.citationIds ?? claim.citationIds,
      reviewerId: ctx.actorId,
      reviewedAt: now,
      updatedAt: now,
    };

    const saved = await this.db.storyIntelligence.updateClaim(updated);
    await this.audit(ctx, `${ctx.clientType}.review_claim`, 'story_claim', saved.id, {
      storyId,
      status: saved.status,
    });
    return saved;
  }

  async deleteClaim(storyId: string, claimId: string, ctx: IntelligenceContext): Promise<void> {
    await this.requireStory(storyId, ctx.organizationId);
    await this.requireClaim(claimId, storyId, ctx.organizationId);
    const deleted = await this.db.storyIntelligence.deleteClaim(claimId, ctx.organizationId);
    if (!deleted) throw new NotFoundError('StoryClaim', claimId);
    await this.audit(ctx, `${ctx.clientType}.delete_claim`, 'story_claim', claimId, { storyId });
  }

  // --- Evidence -------------------------------------------------------------

  async listEvidence(storyId: string, orgId: string, claimId?: string): Promise<Evidence[]> {
    await this.requireStory(storyId, orgId);
    if (claimId) await this.requireClaim(claimId, storyId, orgId);
    return this.db.storyIntelligence.listEvidence(orgId, storyId, claimId);
  }

  async addEvidence(
    storyId: string,
    input: Omit<CreateEvidenceInput, 'storyId'>,
    ctx: IntelligenceContext
  ): Promise<Evidence> {
    const validated = CreateEvidenceInputSchema.parse({ ...input, storyId });
    await this.requireStory(storyId, ctx.organizationId);
    if (validated.claimId) {
      await this.requireClaim(validated.claimId, storyId, ctx.organizationId);
    }
    if (validated.sourceId) {
      await this.validateSourceIds([validated.sourceId], ctx.organizationId);
    }

    const now = new Date().toISOString();
    const evidence: Evidence = {
      id: generateId('evd'),
      organizationId: ctx.organizationId,
      storyId,
      claimId: validated.claimId,
      sourceId: validated.sourceId,
      citationId: validated.citationId,
      type: validated.type,
      title: validated.title,
      description: validated.description,
      url: validated.url,
      excerpt: validated.excerpt,
      stance: validated.stance,
      strength: validated.strength,
      methodology: validated.methodology,
      retrievedAt: validated.retrievedAt,
      publishedAt: validated.publishedAt,
      createdBy: ctx.actorId,
      createdAt: now,
      updatedAt: now,
    };

    const created = await this.db.storyIntelligence.createEvidence(evidence);
    await this.audit(ctx, `${ctx.clientType}.add_evidence`, 'evidence', created.id, {
      storyId,
      claimId: created.claimId,
      stance: created.stance,
    });
    return created;
  }

  async deleteEvidence(
    storyId: string,
    evidenceId: string,
    ctx: IntelligenceContext
  ): Promise<void> {
    await this.requireStory(storyId, ctx.organizationId);
    const evidence = await this.db.storyIntelligence.findEvidenceById(
      evidenceId,
      ctx.organizationId
    );
    if (!evidence || evidence.storyId !== storyId) {
      throw new NotFoundError('Evidence', evidenceId);
    }
    const deleted = await this.db.storyIntelligence.deleteEvidence(evidenceId, ctx.organizationId);
    if (!deleted) throw new NotFoundError('Evidence', evidenceId);
    await this.audit(ctx, `${ctx.clientType}.delete_evidence`, 'evidence', evidenceId, { storyId });
  }

  // --- Timeline -------------------------------------------------------------

  async listTimeline(storyId: string, orgId: string): Promise<StoryTimelineEvent[]> {
    await this.requireStory(storyId, orgId);
    return this.db.storyIntelligence.listTimeline(orgId, storyId);
  }

  async addTimelineEvent(
    storyId: string,
    input: Omit<CreateTimelineEventInput, 'storyId'>,
    ctx: IntelligenceContext
  ): Promise<StoryTimelineEvent> {
    const validated = CreateTimelineEventInputSchema.parse({ ...input, storyId });
    await this.requireStory(storyId, ctx.organizationId);
    await this.validateSourceIds(validated.sourceIds, ctx.organizationId);

    const now = new Date().toISOString();
    const event: StoryTimelineEvent = {
      id: generateId('tlv'),
      organizationId: ctx.organizationId,
      storyId,
      title: validated.title,
      description: validated.description,
      eventType: validated.eventType,
      occurredAt: validated.occurredAt ?? now,
      location: validated.location,
      coordinates: validated.coordinates,
      entityIds: validated.entityIds,
      sourceIds: validated.sourceIds,
      citationIds: validated.citationIds,
      mediaUrl: validated.mediaUrl,
      authorId: ctx.actorId,
      createdAt: now,
      updatedAt: now,
    };

    const created = await this.db.storyIntelligence.createTimelineEvent(event);
    await this.audit(
      ctx,
      `${ctx.clientType}.add_timeline_event`,
      'story_timeline_event',
      created.id,
      {
        storyId,
        eventType: created.eventType,
      }
    );
    await this.notifyFollowers(storyId, created, ctx);
    return created;
  }

  /**
   * Notifies the readers following this story (or its cluster) that a new
   * development was recorded. This closes the following loop:
   * follow -> development -> notification.
   */
  private async notifyFollowers(
    storyId: string,
    event: StoryTimelineEvent,
    ctx: IntelligenceContext
  ): Promise<void> {
    const notificationService = new NotificationService(this.db);
    await notificationService.notifyFollowersOfStory(
      storyId,
      { title: event.title, description: event.description },
      {
        organizationId: ctx.organizationId,
        authorId: ctx.actorId,
        clientType: ctx.clientType,
        createdVia: 'api',
        requestId: ctx.requestId,
      }
    );
  }

  async updateTimelineEvent(
    storyId: string,
    eventId: string,
    input: UpdateTimelineEventInput,
    ctx: IntelligenceContext
  ): Promise<StoryTimelineEvent> {
    const validated = UpdateTimelineEventInputSchema.parse({ ...input, id: eventId });
    await this.requireStory(storyId, ctx.organizationId);
    const existing = await this.db.storyIntelligence.findTimelineEventById(
      eventId,
      ctx.organizationId
    );
    if (!existing || existing.storyId !== storyId) {
      throw new NotFoundError('StoryTimelineEvent', eventId);
    }
    if (validated.sourceIds) {
      await this.validateSourceIds(validated.sourceIds, ctx.organizationId);
    }

    const updated: StoryTimelineEvent = {
      ...existing,
      title: validated.title ?? existing.title,
      description: validated.description ?? existing.description,
      eventType: validated.eventType ?? existing.eventType,
      occurredAt: validated.occurredAt ?? existing.occurredAt,
      location: validated.location ?? existing.location,
      coordinates: validated.coordinates ?? existing.coordinates,
      entityIds: validated.entityIds ?? existing.entityIds,
      sourceIds: validated.sourceIds ?? existing.sourceIds,
      citationIds: validated.citationIds ?? existing.citationIds,
      mediaUrl: validated.mediaUrl ?? existing.mediaUrl,
      updatedAt: new Date().toISOString(),
    };

    const saved = await this.db.storyIntelligence.updateTimelineEvent(updated);
    await this.audit(
      ctx,
      `${ctx.clientType}.update_timeline_event`,
      'story_timeline_event',
      saved.id,
      { storyId }
    );
    return saved;
  }

  async deleteTimelineEvent(
    storyId: string,
    eventId: string,
    ctx: IntelligenceContext
  ): Promise<void> {
    await this.requireStory(storyId, ctx.organizationId);
    const existing = await this.db.storyIntelligence.findTimelineEventById(
      eventId,
      ctx.organizationId
    );
    if (!existing || existing.storyId !== storyId) {
      throw new NotFoundError('StoryTimelineEvent', eventId);
    }
    await this.db.storyIntelligence.deleteTimelineEvent(eventId, ctx.organizationId);
    await this.audit(
      ctx,
      `${ctx.clientType}.delete_timeline_event`,
      'story_timeline_event',
      eventId,
      { storyId }
    );
  }

  // --- Editorial perspectives ----------------------------------------------

  async listPerspectives(storyId: string, orgId: string): Promise<EditorialPerspective[]> {
    await this.requireStory(storyId, orgId);
    return this.db.storyIntelligence.listPerspectives(orgId, storyId);
  }

  async addPerspective(
    storyId: string,
    input: Omit<CreateEditorialPerspectiveInput, 'storyId'>,
    ctx: IntelligenceContext
  ): Promise<EditorialPerspective> {
    const validated = CreateEditorialPerspectiveInputSchema.parse({ ...input, storyId });
    await this.requireStory(storyId, ctx.organizationId);
    await this.validateSourceIds(validated.sourceIds, ctx.organizationId);

    const now = new Date().toISOString();
    const perspective: EditorialPerspective = {
      id: generateId('pst'),
      organizationId: ctx.organizationId,
      storyId,
      label: validated.label,
      summary: validated.summary,
      stance: validated.stance,
      sourceIds: validated.sourceIds,
      citationIds: validated.citationIds,
      quoteExcerpt: validated.quoteExcerpt,
      createdBy: ctx.actorId,
      createdAt: now,
      updatedAt: now,
    };

    const created = await this.db.storyIntelligence.createPerspective(perspective);
    await this.audit(
      ctx,
      `${ctx.clientType}.add_perspective`,
      'editorial_perspective',
      created.id,
      { storyId, stance: created.stance }
    );
    return created;
  }

  async deletePerspective(
    storyId: string,
    perspectiveId: string,
    ctx: IntelligenceContext
  ): Promise<void> {
    await this.requireStory(storyId, ctx.organizationId);
    const existing = await this.db.storyIntelligence.findPerspectiveById(
      perspectiveId,
      ctx.organizationId
    );
    if (!existing || existing.storyId !== storyId) {
      throw new NotFoundError('EditorialPerspective', perspectiveId);
    }
    await this.db.storyIntelligence.deletePerspective(perspectiveId, ctx.organizationId);
    await this.audit(
      ctx,
      `${ctx.clientType}.delete_perspective`,
      'editorial_perspective',
      perspectiveId,
      { storyId }
    );
  }
}
