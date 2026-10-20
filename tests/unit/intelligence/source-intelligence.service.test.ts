import { describe, it, expect, beforeEach } from 'vitest';
import { DatabaseService } from '@ai-news/database';
import { SourceIntelligenceService, StoryService } from '@ai-news/stories';
import { NotFoundError, ValidationError } from '@ai-news/shared';

const ORG = 'org_source_intel_test';
const OTHER_ORG = 'org_source_intel_other';

describe('Source Intelligence Service (publishers, metrics, corrections)', () => {
  let db: DatabaseService;
  let service: SourceIntelligenceService;
  let stories: StoryService;

  const ctx = {
    organizationId: ORG,
    actorId: 'usr_desk',
    clientType: 'human_web' as const,
  };

  beforeEach(async () => {
    db = new DatabaseService();
    service = new SourceIntelligenceService(db);
    stories = new StoryService(db);

    await db.publishers.create({
      id: 'pub_wire',
      organizationId: ORG,
      name: 'Example Wire',
      slug: 'example-wire',
      domain: 'news.example.com',
      language: 'en',
      category: 'general',
      ownership: 'Public Benefit Corporation',
      methodology: 'Editorially independent reporting.',
      correctionPolicyUrl: 'https://news.example.com/corrections',
      foundedYear: 1998,
      isVerified: true,
      followerCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  });

  it('derives publisher metrics from sources, stories and citations', async () => {
    const source = await db.sources.create({
      id: 'src_wire_1',
      organizationId: ORG,
      url: 'https://news.example.com/markets/rates',
      title: 'Rates held',
      publisher: 'Example Wire',
      publisherId: 'pub_wire',
      publishedAt: '2026-10-20T08:00:00.000Z',
      retrievedAt: new Date().toISOString(),
      language: 'en',
      sourceType: 'NEWS_ARTICLE',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    await stories.createStory(
      {
        title: 'Central bank holds rates',
        summary: 'Policy decision coverage.',
        sourceIds: [source.id],
        topicIds: ['top_markets'],
      },
      {
        organizationId: ORG,
        authorId: 'usr_reporter',
        clientType: 'human_web',
        createdVia: 'api',
      }
    );

    const intelligence = await service.getPublisherIntelligence('pub_wire', ORG);

    expect(intelligence.publisher.id).toBe('pub_wire');
    expect(intelligence.publisher.ownership).toBe('Public Benefit Corporation');
    expect(intelligence.publisher.correctionPolicyUrl).toBe('https://news.example.com/corrections');
    expect(intelligence.publisher.foundedYear).toBe(1998);
    expect(intelligence.metrics.sourceCount).toBe(1);
    expect(intelligence.metrics.citedSourceCount).toBe(1);
    expect(intelligence.metrics.citationCount).toBe(1);
    expect(intelligence.metrics.storyCount).toBe(1);
    expect(intelligence.metrics.languages.en).toBe(1);
    expect(intelligence.metrics.sourceTypes.NEWS_ARTICLE).toBe(1);
    expect(intelligence.metrics.coverageAreas[0]).toEqual({
      topicId: 'top_markets',
      storyCount: 1,
    });
    expect(intelligence.sources[0].id).toBe(source.id);
  });

  it('records corrections and reflects them in the metrics', async () => {
    const source = await db.sources.create({
      id: 'src_wire_2',
      organizationId: ORG,
      url: 'https://news.example.com/markets/fed',
      title: 'Federal Reserve coverage',
      publisher: 'Example Wire',
      publisherId: 'pub_wire',
      retrievedAt: new Date().toISOString(),
      language: 'en',
      sourceType: 'NEWS_ARTICLE',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    await stories.createStory(
      {
        title: 'Fed signals pause',
        summary: 'Policy coverage.',
        sourceIds: [source.id],
      },
      {
        organizationId: ORG,
        authorId: 'usr_reporter',
        clientType: 'human_web',
        createdVia: 'api',
      }
    );

    const correction = await service.addCorrection(
      {
        publisherId: 'pub_wire',
        type: 'CORRECTION',
        description: 'Corrected the quoted rate from 4.5% to 4.25%.',
        issuedAt: '2026-10-20T12:00:00.000Z',
      },
      ctx
    );

    expect(correction.id).toMatch(/^cor_/);
    expect(correction.organizationId).toBe(ORG);

    const intelligence = await service.getPublisherIntelligence('pub_wire', ORG);
    expect(intelligence.metrics.correctionCount).toBe(1);
    expect(intelligence.metrics.correctionRate).toBeGreaterThan(0);
    expect(intelligence.corrections).toHaveLength(1);
  });

  it('requires at least one reference target for a correction', async () => {
    await expect(
      service.addCorrection(
        { type: 'CORRECTION', description: 'Orphan correction with no target.' },
        ctx
      )
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it('rejects corrections against unknown entities', async () => {
    await expect(
      service.addCorrection(
        { publisherId: 'pub_missing', type: 'CORRECTION', description: 'Unknown publisher.' },
        ctx
      )
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it('keeps corrections tenant-isolated', async () => {
    await service.addCorrection(
      { publisherId: 'pub_wire', type: 'CLARIFICATION', description: 'Clarified wording.' },
      ctx
    );

    expect(await service.getCorrections(ORG)).toHaveLength(1);
    expect(await service.getCorrections(OTHER_ORG)).toHaveLength(0);
    await expect(service.getPublisherIntelligence('pub_wire', OTHER_ORG)).rejects.toBeInstanceOf(
      NotFoundError
    );
  });

  it('deletes a correction', async () => {
    const correction = await service.addCorrection(
      { publisherId: 'pub_wire', type: 'UPDATE', description: 'Updated story body.' },
      ctx
    );

    await service.deleteCorrection(correction.id, ctx);
    expect(await service.getCorrections(ORG)).toHaveLength(0);
  });
});
