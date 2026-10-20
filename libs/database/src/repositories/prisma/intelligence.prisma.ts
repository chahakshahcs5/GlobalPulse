import type {
  StoryClaim,
  Evidence,
  StoryTimelineEvent,
  EditorialPerspective,
} from '@ai-news/schemas';
import type {
  IStoryIntelligenceRepository,
  StoryIntelligenceFilter,
} from '../../interfaces/intelligence.repository';
import { MemoryStoryIntelligenceRepository } from '../memory/intelligence.memory';

type Row = Record<string, unknown>;

function iso(value: unknown): string {
  return value instanceof Date ? value.toISOString() : String(value);
}

function optionalIso(value: unknown): string | undefined {
  return value ? iso(value) : undefined;
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value) ? (value as string[]) : [];
}

interface ModelClient {
  findMany: (args?: Record<string, unknown>) => Promise<Row[]>;
  findFirst: (args: Record<string, unknown>) => Promise<Row | null>;
  create: (args: { data: Record<string, unknown> }) => Promise<Row>;
  update: (args: { where: Record<string, unknown>; data: Record<string, unknown> }) => Promise<Row>;
  deleteMany: (args: { where: Record<string, unknown> }) => Promise<{ count: number }>;
  delete: (args: { where: Record<string, unknown> }) => Promise<Row>;
}

export class PrismaStoryIntelligenceRepository implements IStoryIntelligenceRepository {
  private readonly fallback = new MemoryStoryIntelligenceRepository();

  constructor(private readonly prismaGetter: () => Record<string, unknown>) {}

  private get prisma(): Record<string, unknown> {
    return this.prismaGetter();
  }

  private client(name: string): ModelClient | undefined {
    return this.prisma[name] as ModelClient | undefined;
  }

  private mapClaim(row: Row): StoryClaim {
    return {
      id: String(row.id),
      organizationId: String(row.organizationId),
      storyId: String(row.storyId),
      text: String(row.text),
      status: String(row.status) as StoryClaim['status'],
      confidence: (row.confidence as number | null) ?? undefined,
      confidenceMethodology: (row.confidenceMethodology as string | null) ?? undefined,
      methodology: (row.methodology as string | null) ?? undefined,
      reviewerId: (row.reviewerId as string | null) ?? undefined,
      reviewedAt: optionalIso(row.reviewedAt),
      reviewNotes: (row.reviewNotes as string | null) ?? undefined,
      sourceIds: stringArray(row.sourceIds),
      citationIds: stringArray(row.citationIds),
      createdBy: String(row.createdBy),
      createdAt: iso(row.createdAt),
      updatedAt: iso(row.updatedAt),
    };
  }

  private mapEvidence(row: Row): Evidence {
    return {
      id: String(row.id),
      organizationId: String(row.organizationId),
      storyId: String(row.storyId),
      claimId: (row.claimId as string | null) ?? undefined,
      sourceId: (row.sourceId as string | null) ?? undefined,
      citationId: (row.citationId as string | null) ?? undefined,
      type: String(row.type) as Evidence['type'],
      title: String(row.title),
      description: (row.description as string | null) ?? undefined,
      url: (row.url as string | null) ?? undefined,
      excerpt: (row.excerpt as string | null) ?? undefined,
      stance: String(row.stance) as Evidence['stance'],
      strength: (row.strength as number | null) ?? undefined,
      methodology: (row.methodology as string | null) ?? undefined,
      retrievedAt: optionalIso(row.retrievedAt),
      publishedAt: optionalIso(row.publishedAt),
      createdBy: String(row.createdBy),
      createdAt: iso(row.createdAt),
      updatedAt: iso(row.updatedAt),
    };
  }

  private mapTimeline(row: Row): StoryTimelineEvent {
    const coordinates = row.coordinates as number[] | null;
    return {
      id: String(row.id),
      organizationId: String(row.organizationId),
      storyId: String(row.storyId),
      title: String(row.title),
      description: String(row.description),
      eventType: String(row.eventType) as StoryTimelineEvent['eventType'],
      occurredAt: iso(row.occurredAt),
      location: (row.location as string | null) ?? undefined,
      coordinates:
        coordinates && coordinates.length === 2
          ? ([coordinates[0], coordinates[1]] as [number, number])
          : undefined,
      entityIds: stringArray(row.entityIds),
      sourceIds: stringArray(row.sourceIds),
      citationIds: stringArray(row.citationIds),
      mediaUrl: (row.mediaUrl as string | null) ?? undefined,
      authorId: String(row.authorId),
      createdAt: iso(row.createdAt),
      updatedAt: iso(row.updatedAt),
    };
  }

  private mapPerspective(row: Row): EditorialPerspective {
    return {
      id: String(row.id),
      organizationId: String(row.organizationId),
      storyId: String(row.storyId),
      label: String(row.label),
      summary: String(row.summary),
      stance: String(row.stance) as EditorialPerspective['stance'],
      sourceIds: stringArray(row.sourceIds),
      citationIds: stringArray(row.citationIds),
      quoteExcerpt: (row.quoteExcerpt as string | null) ?? undefined,
      createdBy: String(row.createdBy),
      createdAt: iso(row.createdAt),
      updatedAt: iso(row.updatedAt),
    };
  }

  // --- Claims ---------------------------------------------------------------

  async listClaims(
    orgId: string,
    storyId: string,
    filter?: StoryIntelligenceFilter
  ): Promise<StoryClaim[]> {
    const client = this.client('storyClaim');
    if (!client) return this.fallback.listClaims(orgId, storyId, filter);
    try {
      const rows = await client.findMany({
        where: { organizationId: orgId, storyId },
        orderBy: { createdAt: 'desc' },
        take: filter?.limit,
      });
      return rows.map((r) => this.mapClaim(r));
    } catch {
      return this.fallback.listClaims(orgId, storyId, filter);
    }
  }

  async listClaimsBySource(
    orgId: string,
    sourceId: string,
    filter?: StoryIntelligenceFilter
  ): Promise<StoryClaim[]> {
    const client = this.client('storyClaim');
    if (!client) return this.fallback.listClaimsBySource(orgId, sourceId, filter);
    try {
      const rows = await client.findMany({
        where: { organizationId: orgId, sourceIds: { has: sourceId } },
        orderBy: { createdAt: 'desc' },
        take: filter?.limit,
      });
      return rows.map((r) => this.mapClaim(r));
    } catch {
      return this.fallback.listClaimsBySource(orgId, sourceId, filter);
    }
  }

  async findClaimById(id: string, orgId: string): Promise<StoryClaim | null> {
    const client = this.client('storyClaim');
    if (!client) return this.fallback.findClaimById(id, orgId);
    try {
      const row = await client.findFirst({ where: { id, organizationId: orgId } });
      return row ? this.mapClaim(row) : null;
    } catch {
      return this.fallback.findClaimById(id, orgId);
    }
  }

  async createClaim(claim: StoryClaim): Promise<StoryClaim> {
    const client = this.client('storyClaim');
    if (!client) return this.fallback.createClaim(claim);
    try {
      const row = await client.create({
        data: {
          id: claim.id,
          organizationId: claim.organizationId,
          storyId: claim.storyId,
          text: claim.text,
          status: claim.status,
          confidence: claim.confidence,
          confidenceMethodology: claim.confidenceMethodology,
          methodology: claim.methodology,
          reviewerId: claim.reviewerId,
          reviewedAt: claim.reviewedAt ? new Date(claim.reviewedAt) : null,
          reviewNotes: claim.reviewNotes,
          sourceIds: claim.sourceIds,
          citationIds: claim.citationIds,
          createdBy: claim.createdBy,
          createdAt: new Date(claim.createdAt),
          updatedAt: new Date(claim.updatedAt),
        },
      });
      return this.mapClaim(row);
    } catch {
      return this.fallback.createClaim(claim);
    }
  }

  async updateClaim(claim: StoryClaim): Promise<StoryClaim> {
    const client = this.client('storyClaim');
    if (!client) return this.fallback.updateClaim(claim);
    try {
      const row = await client.update({
        where: { id: claim.id },
        data: {
          text: claim.text,
          status: claim.status,
          confidence: claim.confidence,
          confidenceMethodology: claim.confidenceMethodology,
          methodology: claim.methodology,
          reviewerId: claim.reviewerId,
          reviewedAt: claim.reviewedAt ? new Date(claim.reviewedAt) : null,
          reviewNotes: claim.reviewNotes,
          sourceIds: claim.sourceIds,
          citationIds: claim.citationIds,
          updatedAt: new Date(claim.updatedAt),
        },
      });
      return this.mapClaim(row);
    } catch {
      return this.fallback.updateClaim(claim);
    }
  }

  async deleteClaim(id: string, orgId: string): Promise<boolean> {
    const client = this.client('storyClaim');
    if (!client) return this.fallback.deleteClaim(id, orgId);
    try {
      const result = await client.deleteMany({ where: { id, organizationId: orgId } });
      const evidenceClient = this.client('evidence');
      if (evidenceClient) {
        await evidenceClient.deleteMany({ where: { claimId: id, organizationId: orgId } });
      }
      return result.count > 0;
    } catch {
      return this.fallback.deleteClaim(id, orgId);
    }
  }

  // --- Evidence -------------------------------------------------------------

  async listEvidence(
    orgId: string,
    storyId: string,
    claimId?: string,
    filter?: StoryIntelligenceFilter
  ): Promise<Evidence[]> {
    const client = this.client('evidence');
    if (!client) return this.fallback.listEvidence(orgId, storyId, claimId, filter);
    try {
      const where: Record<string, unknown> = { organizationId: orgId, storyId };
      if (claimId !== undefined) where.claimId = claimId;
      const rows = await client.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: filter?.limit,
      });
      return rows.map((r) => this.mapEvidence(r));
    } catch {
      return this.fallback.listEvidence(orgId, storyId, claimId, filter);
    }
  }

  async findEvidenceById(id: string, orgId: string): Promise<Evidence | null> {
    const client = this.client('evidence');
    if (!client) return this.fallback.findEvidenceById(id, orgId);
    try {
      const row = await client.findFirst({ where: { id, organizationId: orgId } });
      return row ? this.mapEvidence(row) : null;
    } catch {
      return this.fallback.findEvidenceById(id, orgId);
    }
  }

  async createEvidence(evidence: Evidence): Promise<Evidence> {
    const client = this.client('evidence');
    if (!client) return this.fallback.createEvidence(evidence);
    try {
      const row = await client.create({ data: this.evidenceData(evidence, true) });
      return this.mapEvidence(row);
    } catch {
      return this.fallback.createEvidence(evidence);
    }
  }

  async updateEvidence(evidence: Evidence): Promise<Evidence> {
    const client = this.client('evidence');
    if (!client) return this.fallback.updateEvidence(evidence);
    try {
      const row = await client.update({
        where: { id: evidence.id },
        data: this.evidenceData(evidence, false),
      });
      return this.mapEvidence(row);
    } catch {
      return this.fallback.updateEvidence(evidence);
    }
  }

  private evidenceData(evidence: Evidence, includeId: boolean): Record<string, unknown> {
    const data: Record<string, unknown> = {
      organizationId: evidence.organizationId,
      storyId: evidence.storyId,
      claimId: evidence.claimId ?? null,
      sourceId: evidence.sourceId ?? null,
      citationId: evidence.citationId ?? null,
      type: evidence.type,
      title: evidence.title,
      description: evidence.description,
      url: evidence.url,
      excerpt: evidence.excerpt,
      stance: evidence.stance,
      strength: evidence.strength,
      methodology: evidence.methodology,
      retrievedAt: evidence.retrievedAt ? new Date(evidence.retrievedAt) : null,
      publishedAt: evidence.publishedAt ? new Date(evidence.publishedAt) : null,
      createdBy: evidence.createdBy,
      updatedAt: new Date(evidence.updatedAt),
    };
    if (includeId) {
      data.id = evidence.id;
      data.createdAt = new Date(evidence.createdAt);
    }
    return data;
  }

  async deleteEvidence(id: string, orgId: string): Promise<boolean> {
    const client = this.client('evidence');
    if (!client) return this.fallback.deleteEvidence(id, orgId);
    try {
      const result = await client.deleteMany({ where: { id, organizationId: orgId } });
      return result.count > 0;
    } catch {
      return this.fallback.deleteEvidence(id, orgId);
    }
  }

  // --- Timeline -------------------------------------------------------------

  async listTimeline(
    orgId: string,
    storyId: string,
    filter?: StoryIntelligenceFilter
  ): Promise<StoryTimelineEvent[]> {
    const client = this.client('storyTimelineEvent');
    if (!client) return this.fallback.listTimeline(orgId, storyId, filter);
    try {
      const rows = await client.findMany({
        where: { organizationId: orgId, storyId },
        orderBy: { occurredAt: 'desc' },
        take: filter?.limit,
      });
      return rows.map((r) => this.mapTimeline(r));
    } catch {
      return this.fallback.listTimeline(orgId, storyId, filter);
    }
  }

  async findTimelineEventById(id: string, orgId: string): Promise<StoryTimelineEvent | null> {
    const client = this.client('storyTimelineEvent');
    if (!client) return this.fallback.findTimelineEventById(id, orgId);
    try {
      const row = await client.findFirst({ where: { id, organizationId: orgId } });
      return row ? this.mapTimeline(row) : null;
    } catch {
      return this.fallback.findTimelineEventById(id, orgId);
    }
  }

  async createTimelineEvent(event: StoryTimelineEvent): Promise<StoryTimelineEvent> {
    const client = this.client('storyTimelineEvent');
    if (!client) return this.fallback.createTimelineEvent(event);
    try {
      const row = await client.create({ data: this.timelineData(event, true) });
      return this.mapTimeline(row);
    } catch {
      return this.fallback.createTimelineEvent(event);
    }
  }

  async updateTimelineEvent(event: StoryTimelineEvent): Promise<StoryTimelineEvent> {
    const client = this.client('storyTimelineEvent');
    if (!client) return this.fallback.updateTimelineEvent(event);
    try {
      const row = await client.update({
        where: { id: event.id },
        data: this.timelineData(event, false),
      });
      return this.mapTimeline(row);
    } catch {
      return this.fallback.updateTimelineEvent(event);
    }
  }

  private timelineData(event: StoryTimelineEvent, includeId: boolean): Record<string, unknown> {
    const data: Record<string, unknown> = {
      organizationId: event.organizationId,
      storyId: event.storyId,
      title: event.title,
      description: event.description,
      eventType: event.eventType,
      occurredAt: new Date(event.occurredAt),
      location: event.location,
      coordinates: event.coordinates ?? [],
      entityIds: event.entityIds,
      sourceIds: event.sourceIds,
      citationIds: event.citationIds,
      mediaUrl: event.mediaUrl,
      authorId: event.authorId,
      updatedAt: new Date(event.updatedAt),
    };
    if (includeId) {
      data.id = event.id;
      data.createdAt = new Date(event.createdAt);
    }
    return data;
  }

  async deleteTimelineEvent(id: string, orgId: string): Promise<boolean> {
    const client = this.client('storyTimelineEvent');
    if (!client) return this.fallback.deleteTimelineEvent(id, orgId);
    try {
      const result = await client.deleteMany({ where: { id, organizationId: orgId } });
      return result.count > 0;
    } catch {
      return this.fallback.deleteTimelineEvent(id, orgId);
    }
  }

  // --- Perspectives ---------------------------------------------------------

  async listPerspectives(
    orgId: string,
    storyId: string,
    filter?: StoryIntelligenceFilter
  ): Promise<EditorialPerspective[]> {
    const client = this.client('editorialPerspective');
    if (!client) return this.fallback.listPerspectives(orgId, storyId, filter);
    try {
      const rows = await client.findMany({
        where: { organizationId: orgId, storyId },
        orderBy: { createdAt: 'desc' },
        take: filter?.limit,
      });
      return rows.map((r) => this.mapPerspective(r));
    } catch {
      return this.fallback.listPerspectives(orgId, storyId, filter);
    }
  }

  async findPerspectiveById(id: string, orgId: string): Promise<EditorialPerspective | null> {
    const client = this.client('editorialPerspective');
    if (!client) return this.fallback.findPerspectiveById(id, orgId);
    try {
      const row = await client.findFirst({ where: { id, organizationId: orgId } });
      return row ? this.mapPerspective(row) : null;
    } catch {
      return this.fallback.findPerspectiveById(id, orgId);
    }
  }

  async createPerspective(perspective: EditorialPerspective): Promise<EditorialPerspective> {
    const client = this.client('editorialPerspective');
    if (!client) return this.fallback.createPerspective(perspective);
    try {
      const row = await client.create({ data: this.perspectiveData(perspective, true) });
      return this.mapPerspective(row);
    } catch {
      return this.fallback.createPerspective(perspective);
    }
  }

  async updatePerspective(perspective: EditorialPerspective): Promise<EditorialPerspective> {
    const client = this.client('editorialPerspective');
    if (!client) return this.fallback.updatePerspective(perspective);
    try {
      const row = await client.update({
        where: { id: perspective.id },
        data: this.perspectiveData(perspective, false),
      });
      return this.mapPerspective(row);
    } catch {
      return this.fallback.updatePerspective(perspective);
    }
  }

  private perspectiveData(
    perspective: EditorialPerspective,
    includeId: boolean
  ): Record<string, unknown> {
    const data: Record<string, unknown> = {
      organizationId: perspective.organizationId,
      storyId: perspective.storyId,
      label: perspective.label,
      summary: perspective.summary,
      stance: perspective.stance,
      sourceIds: perspective.sourceIds,
      citationIds: perspective.citationIds,
      quoteExcerpt: perspective.quoteExcerpt,
      createdBy: perspective.createdBy,
      updatedAt: new Date(perspective.updatedAt),
    };
    if (includeId) {
      data.id = perspective.id;
      data.createdAt = new Date(perspective.createdAt);
    }
    return data;
  }

  async deletePerspective(id: string, orgId: string): Promise<boolean> {
    const client = this.client('editorialPerspective');
    if (!client) return this.fallback.deletePerspective(id, orgId);
    try {
      const result = await client.deleteMany({ where: { id, organizationId: orgId } });
      return result.count > 0;
    } catch {
      return this.fallback.deletePerspective(id, orgId);
    }
  }

  async deleteForStory(storyId: string, orgId: string): Promise<void> {
    const clients = ['evidence', 'storyClaim', 'storyTimelineEvent', 'editorialPerspective'];
    const available = clients.map((name) => this.client(name)).filter(Boolean) as ModelClient[];
    if (available.length === 0) {
      await this.fallback.deleteForStory(storyId, orgId);
      return;
    }
    for (const client of available) {
      try {
        await client.deleteMany({ where: { organizationId: orgId, storyId } });
      } catch {
        // Individual table misses should not block story cleanup.
      }
    }
  }
}
