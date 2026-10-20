import { describe, it, expect, beforeEach } from 'vitest';
import { DatabaseService } from '@ai-news/database';
import { StoryIntelligenceService, StoryService } from '@ai-news/stories';
import { NotFoundError, ValidationError } from '@ai-news/shared';

const ORG = 'org_intel_test';
const OTHER_ORG = 'org_intel_other';

describe('Story Intelligence Service (claims, evidence, timeline, perspectives)', () => {
  let db: DatabaseService;
  let stories: StoryService;
  let intelligence: StoryIntelligenceService;
  let storyId: string;

  const ctx = {
    organizationId: ORG,
    actorId: 'usr_verifier',
    clientType: 'custom_mcp' as const,
  };

  beforeEach(async () => {
    db = new DatabaseService();
    stories = new StoryService(db);
    intelligence = new StoryIntelligenceService(db);

    const story = await stories.createStory(
      {
        title: 'Central Bank Cuts Rates',
        summary: 'Policy rate reduced by 25 basis points.',
        articleType: 'breaking_news',
      },
      {
        organizationId: ORG,
        authorId: 'usr_reporter',
        clientType: 'human_web',
        createdVia: 'api',
      }
    );
    storyId = story.id;
  });

  it('creates an unverified claim by default', async () => {
    const claim = await intelligence.createClaim(
      storyId,
      { text: 'The policy rate was reduced by 25 basis points.' },
      ctx
    );

    expect(claim.id).toMatch(/^clm_/);
    expect(claim.status).toBe('UNVERIFIED');
    expect(claim.storyId).toBe(storyId);
    expect(claim.organizationId).toBe(ORG);
    expect(claim.sourceIds).toEqual([]);
  });

  it('refuses a supported claim without any source', async () => {
    await expect(
      intelligence.createClaim(storyId, { text: 'Rates were cut.', status: 'SUPPORTED' }, ctx)
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it('rejects unknown source IDs on claims', async () => {
    await expect(
      intelligence.createClaim(
        storyId,
        { text: 'Rates were cut.', status: 'SUPPORTED', sourceIds: ['src_missing'] },
        ctx
      )
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it('accepts a supported claim when a real source is attached', async () => {
    const source = await db.sources.create({
      id: 'src_rate_decision',
      organizationId: ORG,
      url: 'https://example.org/central-bank/decision',
      title: 'Rate decision statement',
      publisher: 'Example Wire',
      retrievedAt: new Date().toISOString(),
      language: 'en',
      sourceType: 'OFFICIAL_DOCUMENT',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const claim = await intelligence.createClaim(
      storyId,
      { text: 'Rates were cut by 25bps.', status: 'SUPPORTED', sourceIds: [source.id] },
      ctx
    );

    expect(claim.status).toBe('SUPPORTED');
    expect(claim.sourceIds).toEqual([source.id]);
  });

  it('requires a source or evidence before a claim can become supported', async () => {
    const claim = await intelligence.createClaim(
      storyId,
      { text: 'Inflation fell to 2%.', status: 'UNVERIFIED' },
      ctx
    );

    await expect(
      intelligence.updateClaimStatus(storyId, claim.id, { status: 'SUPPORTED' }, ctx)
    ).rejects.toBeInstanceOf(ValidationError);

    const evidence = await intelligence.addEvidence(
      storyId,
      {
        claimId: claim.id,
        type: 'STATISTIC',
        title: 'Inflation release',
        stance: 'SUPPORTS',
      },
      ctx
    );
    expect(evidence.claimId).toBe(claim.id);

    const updated = await intelligence.updateClaimStatus(
      storyId,
      claim.id,
      { status: 'SUPPORTED', confidence: 0.8, confidenceMethodology: 'Single official release' },
      ctx
    );

    expect(updated.status).toBe('SUPPORTED');
    expect(updated.confidence).toBe(0.8);
    expect(updated.reviewerId).toBe(ctx.actorId);
    expect(updated.reviewedAt).toBeTruthy();
  });

  it('requires a confidence methodology whenever confidence is supplied', async () => {
    await expect(
      intelligence.createClaim(storyId, { text: 'Unverified but scored.', confidence: 0.5 }, ctx)
    ).rejects.toThrow();
  });

  it('aggregates claims, evidence, timeline, perspectives and metrics', async () => {
    const claim = await intelligence.createClaim(
      storyId,
      { text: 'Statement published at 10:00 UTC.', status: 'UNVERIFIED' },
      ctx
    );
    await intelligence.addEvidence(
      storyId,
      { claimId: claim.id, type: 'DOCUMENT', title: 'Statement PDF', stance: 'SUPPORTS' },
      ctx
    );
    await intelligence.addTimelineEvent(
      storyId,
      {
        title: 'Statement released',
        description: 'The central bank published the decision statement.',
        eventType: 'OFFICIAL_STATEMENT',
        occurredAt: '2026-10-20T10:00:00.000Z',
      },
      ctx
    );
    await intelligence.addPerspective(
      storyId,
      {
        label: 'Economists panel',
        summary: 'Panel expects a further cut next quarter.',
        stance: 'SUPPORTS',
      },
      ctx
    );

    const snapshot = await intelligence.getStoryIntelligence(storyId, ORG);

    expect(snapshot.storyId).toBe(storyId);
    expect(snapshot.claims).toHaveLength(1);
    expect(snapshot.claims[0].evidence).toHaveLength(1);
    expect(snapshot.evidence).toHaveLength(1);
    expect(snapshot.timeline).toHaveLength(1);
    expect(snapshot.perspectives).toHaveLength(1);
    expect(snapshot.metrics.claimCount).toBe(1);
    expect(snapshot.metrics.evidenceCount).toBe(1);
    expect(snapshot.metrics.timelineEventCount).toBe(1);
    expect(snapshot.metrics.perspectiveCount).toBe(1);
  });

  it('keeps intelligence tenant-isolated', async () => {
    await intelligence.createClaim(storyId, { text: 'Org A claim.' }, ctx);

    await expect(intelligence.listClaims(storyId, OTHER_ORG)).rejects.toBeInstanceOf(NotFoundError);
    await expect(intelligence.getStoryIntelligence(storyId, OTHER_ORG)).rejects.toBeInstanceOf(
      NotFoundError
    );

    // A claim from another organization cannot be attached to this story.
    const otherStory = await stories.createStory(
      { title: 'Other org story', summary: 'Different tenant.' },
      {
        organizationId: OTHER_ORG,
        authorId: 'usr_other',
        clientType: 'human_web',
        createdVia: 'api',
      }
    );
    const otherClaim = await intelligence.createClaim(
      otherStory.id,
      { text: 'Other tenant claim.' },
      { ...ctx, organizationId: OTHER_ORG }
    );

    await expect(
      intelligence.updateClaimStatus(storyId, otherClaim.id, { status: 'UNVERIFIED' }, ctx)
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it('deletes claims, evidence, timeline events and perspectives', async () => {
    const claim = await intelligence.createClaim(storyId, { text: 'Temporary claim.' }, ctx);
    const evidence = await intelligence.addEvidence(
      storyId,
      { claimId: claim.id, type: 'OTHER', title: 'Temporary evidence' },
      ctx
    );
    const event = await intelligence.addTimelineEvent(
      storyId,
      { title: 'Temporary event', description: 'Temporary development.' },
      ctx
    );
    const perspective = await intelligence.addPerspective(
      storyId,
      { label: 'Temporary voice', summary: 'Temporary perspective.' },
      ctx
    );

    await intelligence.deleteEvidence(storyId, evidence.id, ctx);
    await intelligence.deleteTimelineEvent(storyId, event.id, ctx);
    await intelligence.deletePerspective(storyId, perspective.id, ctx);
    await intelligence.deleteClaim(storyId, claim.id, ctx);

    expect(await intelligence.listClaims(storyId, ORG)).toHaveLength(0);
    expect(await intelligence.listEvidence(storyId, ORG)).toHaveLength(0);
    expect(await intelligence.listTimeline(storyId, ORG)).toHaveLength(0);
    expect(await intelligence.listPerspectives(storyId, ORG)).toHaveLength(0);
  });

  it('removes evidence that belongs to a deleted claim', async () => {
    const claim = await intelligence.createClaim(
      storyId,
      { text: 'Claim with attached evidence.' },
      ctx
    );
    await intelligence.addEvidence(
      storyId,
      { claimId: claim.id, type: 'OTHER', title: 'Attached evidence' },
      ctx
    );

    await intelligence.deleteClaim(storyId, claim.id, ctx);

    expect(await intelligence.listEvidence(storyId, ORG)).toHaveLength(0);
  });
});
