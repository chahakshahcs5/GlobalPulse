import type {
  StoryClaim,
  Evidence,
  StoryTimelineEvent,
  EditorialPerspective,
} from '@ai-news/schemas';

export interface StoryIntelligenceFilter {
  limit?: number;
}

/**
 * Durable storage for first-class story intelligence.
 *
 * Every method requires organizationId and enforces it in the query, so a
 * repository can never leak rows across tenants even if a caller supplies a
 * storyId from another organization.
 */
export interface IStoryIntelligenceRepository {
  /**
   * Every claim, every piece of evidence and every timeline event the
   * newsroom holds, with the claims that have evidence counted.
   *
   * One pass rather than three queries per story: the newsroom's metrics
   * asked for this story by story, and the numbers took half a minute to
   * arrive.
   */
  summariseCoverage(orgId: string): Promise<{
    claimCount: number;
    evidenceCount: number;
    claimsWithEvidence: number;
    timelineEventCount: number;
  }>;
  listClaims(
    orgId: string,
    storyId: string,
    filter?: StoryIntelligenceFilter
  ): Promise<StoryClaim[]>;
  findClaimById(id: string, orgId: string): Promise<StoryClaim | null>;
  /** Every claim in the organization that cites a given source. */
  listClaimsBySource(
    orgId: string,
    sourceId: string,
    filter?: StoryIntelligenceFilter
  ): Promise<StoryClaim[]>;
  createClaim(claim: StoryClaim): Promise<StoryClaim>;
  updateClaim(claim: StoryClaim): Promise<StoryClaim>;
  deleteClaim(id: string, orgId: string): Promise<boolean>;

  listEvidence(
    orgId: string,
    storyId: string,
    claimId?: string,
    filter?: StoryIntelligenceFilter
  ): Promise<Evidence[]>;
  findEvidenceById(id: string, orgId: string): Promise<Evidence | null>;
  createEvidence(evidence: Evidence): Promise<Evidence>;
  updateEvidence(evidence: Evidence): Promise<Evidence>;
  deleteEvidence(id: string, orgId: string): Promise<boolean>;

  listTimeline(
    orgId: string,
    storyId: string,
    filter?: StoryIntelligenceFilter
  ): Promise<StoryTimelineEvent[]>;
  findTimelineEventById(id: string, orgId: string): Promise<StoryTimelineEvent | null>;
  createTimelineEvent(event: StoryTimelineEvent): Promise<StoryTimelineEvent>;
  updateTimelineEvent(event: StoryTimelineEvent): Promise<StoryTimelineEvent>;
  deleteTimelineEvent(id: string, orgId: string): Promise<boolean>;

  listPerspectives(
    orgId: string,
    storyId: string,
    filter?: StoryIntelligenceFilter
  ): Promise<EditorialPerspective[]>;
  findPerspectiveById(id: string, orgId: string): Promise<EditorialPerspective | null>;
  createPerspective(perspective: EditorialPerspective): Promise<EditorialPerspective>;
  updatePerspective(perspective: EditorialPerspective): Promise<EditorialPerspective>;
  deletePerspective(id: string, orgId: string): Promise<boolean>;

  /** Remove every intelligence row attached to a story (story deletion). */
  deleteForStory(storyId: string, orgId: string): Promise<void>;
}
