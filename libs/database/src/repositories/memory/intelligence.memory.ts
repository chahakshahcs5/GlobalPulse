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

function cloneClaim(claim: StoryClaim): StoryClaim {
  return { ...claim, sourceIds: [...claim.sourceIds], citationIds: [...claim.citationIds] };
}

function cloneEvidence(evidence: Evidence): Evidence {
  return { ...evidence };
}

function cloneTimelineEvent(event: StoryTimelineEvent): StoryTimelineEvent {
  return {
    ...event,
    coordinates: event.coordinates ? ([...event.coordinates] as [number, number]) : undefined,
    entityIds: [...event.entityIds],
    sourceIds: [...event.sourceIds],
    citationIds: [...event.citationIds],
  };
}

function clonePerspective(perspective: EditorialPerspective): EditorialPerspective {
  return {
    ...perspective,
    sourceIds: [...perspective.sourceIds],
    citationIds: [...perspective.citationIds],
  };
}

export interface IntelligenceSnapshot {
  claims: Map<string, StoryClaim>;
  evidence: Map<string, Evidence>;
  timeline: Map<string, StoryTimelineEvent>;
  perspectives: Map<string, EditorialPerspective>;
}

export class MemoryStoryIntelligenceRepository implements IStoryIntelligenceRepository {
  private claims = new Map<string, StoryClaim>();
  private evidence = new Map<string, Evidence>();
  private timeline = new Map<string, StoryTimelineEvent>();
  private perspectives = new Map<string, EditorialPerspective>();

  // --- Claims ---------------------------------------------------------------

  async listClaims(
    orgId: string,
    storyId: string,
    filter?: StoryIntelligenceFilter
  ): Promise<StoryClaim[]> {
    return Array.from(this.claims.values())
      .filter((c) => c.organizationId === orgId && c.storyId === storyId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, filter?.limit ?? Number.MAX_SAFE_INTEGER)
      .map(cloneClaim);
  }

  async findClaimById(id: string, orgId: string): Promise<StoryClaim | null> {
    const claim = this.claims.get(id);
    return claim && claim.organizationId === orgId ? cloneClaim(claim) : null;
  }

  async listClaimsBySource(
    orgId: string,
    sourceId: string,
    filter?: StoryIntelligenceFilter
  ): Promise<StoryClaim[]> {
    return Array.from(this.claims.values())
      .filter((c) => c.organizationId === orgId && c.sourceIds.includes(sourceId))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, filter?.limit ?? Number.MAX_SAFE_INTEGER)
      .map(cloneClaim);
  }

  async createClaim(claim: StoryClaim): Promise<StoryClaim> {
    if (this.claims.has(claim.id)) {
      throw new Error(`Claim with id ${claim.id} already exists`);
    }
    const stored = cloneClaim(claim);
    this.claims.set(stored.id, stored);
    return cloneClaim(stored);
  }

  async updateClaim(claim: StoryClaim): Promise<StoryClaim> {
    const existing = this.claims.get(claim.id);
    if (!existing || existing.organizationId !== claim.organizationId) {
      throw new Error(`Claim with id ${claim.id} does not exist`);
    }
    const stored = cloneClaim(claim);
    this.claims.set(stored.id, stored);
    return cloneClaim(stored);
  }

  async deleteClaim(id: string, orgId: string): Promise<boolean> {
    const existing = this.claims.get(id);
    if (!existing || existing.organizationId !== orgId) return false;
    this.claims.delete(id);
    for (const [evidenceId, evidence] of this.evidence) {
      if (evidence.claimId === id) this.evidence.delete(evidenceId);
    }
    return true;
  }

  // --- Evidence -------------------------------------------------------------

  async listEvidence(
    orgId: string,
    storyId: string,
    claimId?: string,
    filter?: StoryIntelligenceFilter
  ): Promise<Evidence[]> {
    return Array.from(this.evidence.values())
      .filter(
        (e) =>
          e.organizationId === orgId &&
          e.storyId === storyId &&
          (claimId === undefined || e.claimId === claimId)
      )
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, filter?.limit ?? Number.MAX_SAFE_INTEGER)
      .map(cloneEvidence);
  }

  async findEvidenceById(id: string, orgId: string): Promise<Evidence | null> {
    const item = this.evidence.get(id);
    return item && item.organizationId === orgId ? cloneEvidence(item) : null;
  }

  async createEvidence(evidence: Evidence): Promise<Evidence> {
    if (this.evidence.has(evidence.id)) {
      throw new Error(`Evidence with id ${evidence.id} already exists`);
    }
    const stored = cloneEvidence(evidence);
    this.evidence.set(stored.id, stored);
    return cloneEvidence(stored);
  }

  async updateEvidence(evidence: Evidence): Promise<Evidence> {
    const existing = this.evidence.get(evidence.id);
    if (!existing || existing.organizationId !== evidence.organizationId) {
      throw new Error(`Evidence with id ${evidence.id} does not exist`);
    }
    const stored = cloneEvidence(evidence);
    this.evidence.set(stored.id, stored);
    return cloneEvidence(stored);
  }

  async deleteEvidence(id: string, orgId: string): Promise<boolean> {
    const existing = this.evidence.get(id);
    if (!existing || existing.organizationId !== orgId) return false;
    this.evidence.delete(id);
    return true;
  }

  // --- Timeline -------------------------------------------------------------

  async listTimeline(
    orgId: string,
    storyId: string,
    filter?: StoryIntelligenceFilter
  ): Promise<StoryTimelineEvent[]> {
    return Array.from(this.timeline.values())
      .filter((e) => e.organizationId === orgId && e.storyId === storyId)
      .sort((a, b) => b.occurredAt.localeCompare(a.occurredAt))
      .slice(0, filter?.limit ?? Number.MAX_SAFE_INTEGER)
      .map(cloneTimelineEvent);
  }

  async findTimelineEventById(id: string, orgId: string): Promise<StoryTimelineEvent | null> {
    const event = this.timeline.get(id);
    return event && event.organizationId === orgId ? cloneTimelineEvent(event) : null;
  }

  async createTimelineEvent(event: StoryTimelineEvent): Promise<StoryTimelineEvent> {
    if (this.timeline.has(event.id)) {
      throw new Error(`Timeline event with id ${event.id} already exists`);
    }
    const stored = cloneTimelineEvent(event);
    this.timeline.set(stored.id, stored);
    return cloneTimelineEvent(stored);
  }

  async updateTimelineEvent(event: StoryTimelineEvent): Promise<StoryTimelineEvent> {
    const existing = this.timeline.get(event.id);
    if (!existing || existing.organizationId !== event.organizationId) {
      throw new Error(`Timeline event with id ${event.id} does not exist`);
    }
    const stored = cloneTimelineEvent(event);
    this.timeline.set(stored.id, stored);
    return cloneTimelineEvent(stored);
  }

  async deleteTimelineEvent(id: string, orgId: string): Promise<boolean> {
    const existing = this.timeline.get(id);
    if (!existing || existing.organizationId !== orgId) return false;
    this.timeline.delete(id);
    return true;
  }

  // --- Perspectives ---------------------------------------------------------

  async listPerspectives(
    orgId: string,
    storyId: string,
    filter?: StoryIntelligenceFilter
  ): Promise<EditorialPerspective[]> {
    return Array.from(this.perspectives.values())
      .filter((p) => p.organizationId === orgId && p.storyId === storyId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, filter?.limit ?? Number.MAX_SAFE_INTEGER)
      .map(clonePerspective);
  }

  async findPerspectiveById(id: string, orgId: string): Promise<EditorialPerspective | null> {
    const perspective = this.perspectives.get(id);
    return perspective && perspective.organizationId === orgId
      ? clonePerspective(perspective)
      : null;
  }

  async createPerspective(perspective: EditorialPerspective): Promise<EditorialPerspective> {
    if (this.perspectives.has(perspective.id)) {
      throw new Error(`Perspective with id ${perspective.id} already exists`);
    }
    const stored = clonePerspective(perspective);
    this.perspectives.set(stored.id, stored);
    return clonePerspective(stored);
  }

  async updatePerspective(perspective: EditorialPerspective): Promise<EditorialPerspective> {
    const existing = this.perspectives.get(perspective.id);
    if (!existing || existing.organizationId !== perspective.organizationId) {
      throw new Error(`Perspective with id ${perspective.id} does not exist`);
    }
    const stored = clonePerspective(perspective);
    this.perspectives.set(stored.id, stored);
    return clonePerspective(stored);
  }

  async deletePerspective(id: string, orgId: string): Promise<boolean> {
    const existing = this.perspectives.get(id);
    if (!existing || existing.organizationId !== orgId) return false;
    this.perspectives.delete(id);
    return true;
  }

  async deleteForStory(storyId: string, orgId: string): Promise<void> {
    for (const [id, claim] of this.claims) {
      if (claim.storyId === storyId && claim.organizationId === orgId) this.claims.delete(id);
    }
    for (const [id, item] of this.evidence) {
      if (item.storyId === storyId && item.organizationId === orgId) this.evidence.delete(id);
    }
    for (const [id, event] of this.timeline) {
      if (event.storyId === storyId && event.organizationId === orgId) this.timeline.delete(id);
    }
    for (const [id, perspective] of this.perspectives) {
      if (perspective.storyId === storyId && perspective.organizationId === orgId) {
        this.perspectives.delete(id);
      }
    }
  }

  snapshot(): IntelligenceSnapshot {
    return {
      claims: new Map(this.claims),
      evidence: new Map(this.evidence),
      timeline: new Map(this.timeline),
      perspectives: new Map(this.perspectives),
    };
  }

  restore(snapshot: IntelligenceSnapshot): void {
    this.claims = new Map(snapshot.claims);
    this.evidence = new Map(snapshot.evidence);
    this.timeline = new Map(snapshot.timeline);
    this.perspectives = new Map(snapshot.perspectives);
  }

  clear(): void {
    this.claims.clear();
    this.evidence.clear();
    this.timeline.clear();
    this.perspectives.clear();
  }
}
