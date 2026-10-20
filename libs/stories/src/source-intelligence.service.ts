import type {
  SourceIntelligence,
  SourceCorrection,
  CreateSourceCorrectionInput,
  Publisher,
} from '@ai-news/schemas';
import { CreateSourceCorrectionInputSchema } from '@ai-news/schemas';
import type { DatabaseService } from '@ai-news/database';
import { generateId, NotFoundError, ValidationError } from '@ai-news/shared';
import type { IntelligenceContext } from './intelligence.service';

/**
 * Publisher/source transparency and correction tracking.
 *
 * Metrics are derived from existing sources, citations, and stories so they
 * stay consistent regardless of which client (REST, MCP, GraphQL, worker) asks.
 */
export class SourceIntelligenceService {
  constructor(private readonly db: DatabaseService) {}

  async getCorrections(
    orgId: string,
    filter?: { publisherId?: string; sourceId?: string; storyId?: string; limit?: number }
  ): Promise<SourceCorrection[]> {
    return this.db.sourceCorrections.list(orgId, filter);
  }

  async addCorrection(
    input: CreateSourceCorrectionInput,
    ctx: IntelligenceContext
  ): Promise<SourceCorrection> {
    const validated = CreateSourceCorrectionInputSchema.parse(input);
    if (!validated.publisherId && !validated.sourceId && !validated.storyId) {
      throw new ValidationError(
        'A correction must reference at least one publisher, source, or story.'
      );
    }

    if (validated.publisherId) {
      const publisher = await this.db.publishers.findById(
        validated.publisherId,
        ctx.organizationId
      );
      if (!publisher) throw new NotFoundError('Publisher', validated.publisherId);
    }
    if (validated.sourceId) {
      const source = await this.db.sources.findById(validated.sourceId, ctx.organizationId);
      if (!source) throw new NotFoundError('Source', validated.sourceId);
    }
    if (validated.storyId) {
      const story = await this.db.stories.findById(validated.storyId, ctx.organizationId);
      if (!story) throw new NotFoundError('Story', validated.storyId);
    }

    const created = await this.db.sourceCorrections.create({
      id: generateId('cor'),
      organizationId: ctx.organizationId,
      publisherId: validated.publisherId,
      sourceId: validated.sourceId,
      storyId: validated.storyId,
      type: validated.type,
      description: validated.description,
      issuedAt: validated.issuedAt ?? new Date().toISOString(),
      url: validated.url,
      recordedBy: ctx.actorId,
      createdAt: new Date().toISOString(),
    });

    await this.audit(ctx, 'record_source_correction', created.id, {
      type: created.type,
      publisherId: created.publisherId,
      sourceId: created.sourceId,
      storyId: created.storyId,
    });
    return created;
  }

  async deleteCorrection(id: string, ctx: IntelligenceContext): Promise<void> {
    const existing = await this.db.sourceCorrections.findById(id, ctx.organizationId);
    if (!existing) throw new NotFoundError('SourceCorrection', id);
    await this.db.sourceCorrections.delete(id, ctx.organizationId);
    await this.audit(ctx, 'delete_source_correction', id);
  }

  async getPublisherIntelligence(publisherId: string, orgId: string): Promise<SourceIntelligence> {
    const publisher = await this.db.publishers.findById(publisherId, orgId);
    if (!publisher) throw new NotFoundError('Publisher', publisherId);

    const [sources, corrections, stories] = await Promise.all([
      this.db.sources.listByPublisher(publisherId, orgId),
      this.db.sourceCorrections.list(orgId, { publisherId }),
      this.db.stories.list({ limit: 1000 }, orgId),
    ]);

    const sourceIds = new Set(sources.map((source) => source.id));
    const citingStories = stories.filter((story) =>
      story.sourceIds.some((id) => sourceIds.has(id))
    );
    const citedSourceIds = new Set(
      citingStories.flatMap((story) => story.sourceIds.filter((id) => sourceIds.has(id)))
    );

    let citationCount = 0;
    for (const story of citingStories) {
      for (const sourceId of story.sourceIds) {
        if (sourceIds.has(sourceId)) citationCount++;
      }
    }

    const languages: Record<string, number> = {};
    const sourceTypes: Record<string, number> = {};
    for (const source of sources) {
      languages[source.language] = (languages[source.language] ?? 0) + 1;
      sourceTypes[source.sourceType] = (sourceTypes[source.sourceType] ?? 0) + 1;
    }

    const topicCounts = new Map<string, number>();
    for (const story of citingStories) {
      for (const topicId of story.topicIds) {
        topicCounts.set(topicId, (topicCounts.get(topicId) ?? 0) + 1);
      }
    }

    const correctionCount = corrections.filter((c) => c.type === 'CORRECTION').length;
    const retractionCount = corrections.filter((c) => c.type === 'RETRACTION').length;
    const lastPublishedAt = sources
      .map((source) => source.publishedAt)
      .filter((value): value is string => Boolean(value))
      .sort()
      .at(-1);

    const methodologyNotes: string[] = [];
    if (sources.length === 0) {
      methodologyNotes.push(
        'No registered sources reference this publisher; count-based metrics are zero.'
      );
    }

    return {
      publisher: this.publisherProfile(publisher),
      metrics: {
        sourceCount: sources.length,
        citedSourceCount: citedSourceIds.size,
        citationCount,
        storyCount: citingStories.length,
        correctionCount,
        retractionCount,
        correctionRate:
          citingStories.length === 0
            ? 0
            : Math.min(1, Number((corrections.length / citingStories.length).toFixed(3))),
        languages,
        sourceTypes,
        coverageAreas: Array.from(topicCounts.entries())
          .map(([topicId, storyCount]) => ({ topicId, storyCount }))
          .sort((a, b) => b.storyCount - a.storyCount)
          .slice(0, 50),
        lastPublishedAt,
      },
      corrections,
      sources: sources.map((source) => ({
        id: source.id,
        title: source.title,
        url: source.url,
        sourceType: source.sourceType,
        publishedAt: source.publishedAt,
        retrievedAt: source.retrievedAt,
      })),
      methodologyNotes,
    };
  }

  private publisherProfile(publisher: Publisher): SourceIntelligence['publisher'] {
    return {
      id: publisher.id,
      name: publisher.name,
      slug: publisher.slug,
      domain: publisher.domain,
      description: publisher.description,
      country: publisher.country,
      language: publisher.language,
      websiteUrl: publisher.websiteUrl,
      ownership: publisher.ownership,
      methodology: publisher.methodology,
      correctionPolicyUrl: publisher.correctionPolicyUrl,
      foundedYear: publisher.foundedYear,
      isVerified: publisher.isVerified,
    };
  }

  private async audit(
    ctx: IntelligenceContext,
    action: string,
    resourceId: string,
    payloadSummary?: Record<string, unknown>
  ): Promise<void> {
    try {
      await this.db.audit.log({
        id: generateId('aud'),
        organizationId: ctx.organizationId,
        userId: ctx.actorId,
        clientType: ctx.clientType,
        action: `${ctx.clientType}.${action}`,
        resourceType: 'source_correction',
        resourceId,
        payloadSummary,
        requestId: ctx.requestId,
        status: 'SUCCESS',
        timestamp: new Date().toISOString(),
      });
    } catch {
      // non-blocking
    }
  }
}
