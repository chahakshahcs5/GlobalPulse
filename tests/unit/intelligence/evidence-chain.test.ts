import { describe, it, expect, beforeEach } from 'vitest';
import { DatabaseService } from '@ai-news/database';
import { StoryIntelligenceService, StoryService } from '@ai-news/stories';
import { NotFoundError } from '@ai-news/shared';

const ORG = 'org_chain_test';
const OTHER_ORG = 'org_chain_other';

describe('Evidence chain queries (§7)', () => {
  let db: DatabaseService;
  let stories: StoryService;
  let intelligence: StoryIntelligenceService;

  const ctx = {
    organizationId: ORG,
    actorId: 'usr_verifier',
    clientType: 'custom_mcp' as const,
  };

  beforeEach(async () => {
    db = new DatabaseService();
    stories = new StoryService(db);
    intelligence = new StoryIntelligenceService(db);
  });

  it('returns the claim and its evidence', async () => {
    const story = await stories.createStory(
      { title: 'Regulator fines exchange', summary: 'A fine was imposed.' },
      {
        organizationId: ORG,
        authorId: 'usr_reporter',
        clientType: 'human_web',
        createdVia: 'api',
      }
    );

    const claim = await intelligence.createClaim(
      story.id,
      { text: 'The fine totalled 4.2 million.' },
      ctx
    );
    const evidence = await intelligence.addEvidence(
      story.id,
      { claimId: claim.id, type: 'DOCUMENT', title: 'Decision notice', stance: 'SUPPORTS' },
      ctx
    );

    const chain = await intelligence.getClaimEvidence(claim.id, ORG);

    expect(chain.claim.id).toBe(claim.id);
    expect(chain.evidence).toHaveLength(1);
    expect(chain.evidence[0].id).toBe(evidence.id);
  });

  it('returns every claim that cites a source', async () => {
    const source = await db.sources.create({
      id: 'src_regulator',
      organizationId: ORG,
      url: 'https://example.org/decision',
      title: 'Decision notice',
      publisher: 'Regulator',
      retrievedAt: new Date().toISOString(),
      language: 'en',
      sourceType: 'OFFICIAL_DOCUMENT',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const story = await stories.createStory(
      { title: 'Regulator fines exchange', summary: 'A fine was imposed.' },
      {
        organizationId: ORG,
        authorId: 'usr_reporter',
        clientType: 'human_web',
        createdVia: 'api',
      }
    );

    await intelligence.createClaim(
      story.id,
      { text: 'The fine totalled 4.2 million.', sourceIds: [source.id] },
      ctx
    );
    await intelligence.createClaim(
      story.id,
      { text: 'The fine was paid in full.', sourceIds: [source.id] },
      ctx
    );
    await intelligence.createClaim(story.id, { text: 'An uncited claim.' }, ctx);

    const claims = await intelligence.getSourceClaims(source.id, ORG);

    expect(claims).toHaveLength(2);
    expect(claims.every((claim) => claim.sourceIds.includes(source.id))).toBe(true);
  });

  it('returns every story that mentions an entity', async () => {
    const entity = await db.entities.create({
      id: 'ent_exchange',
      organizationId: ORG,
      slug: 'example-exchange',
      name: 'Example Exchange',
      type: 'ORGANIZATION',
      description: 'A regulated exchange.',
      aliases: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    await stories.createStory(
      {
        title: 'Exchange fined',
        summary: 'The exchange was fined.',
        entityIds: [entity.id],
      },
      {
        organizationId: ORG,
        authorId: 'usr_reporter',
        clientType: 'human_web',
        createdVia: 'api',
      }
    );
    await stories.createStory(
      { title: 'Unrelated story', summary: 'Nothing to do with it.' },
      {
        organizationId: ORG,
        authorId: 'usr_reporter',
        clientType: 'human_web',
        createdVia: 'api',
      }
    );

    const result = await intelligence.getEntityStories(entity.id, ORG);

    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('Exchange fined');
  });

  it('keeps the chain tenant-scoped', async () => {
    const source = await db.sources.create({
      id: 'src_scoped',
      organizationId: ORG,
      url: 'https://example.org/scoped',
      title: 'Scoped source',
      publisher: 'Publisher',
      retrievedAt: new Date().toISOString(),
      language: 'en',
      sourceType: 'NEWS_ARTICLE',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    await expect(intelligence.getSourceClaims(source.id, OTHER_ORG)).rejects.toBeInstanceOf(
      NotFoundError
    );
    await expect(intelligence.getClaimEvidence('clm_missing', OTHER_ORG)).rejects.toBeInstanceOf(
      NotFoundError
    );
  });
});
