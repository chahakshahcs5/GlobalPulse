import { describe, it, expect, beforeEach } from 'vitest';
import { DatabaseService } from '@ai-news/database';
import {
  DeterministicEnrichmentProvider,
  IngestionEnrichmentService,
  INGESTION_PIPELINE_STAGES,
} from '@ai-news/stories';
import type { IngestionItem } from '@ai-news/schemas';

const ORG = 'org_enrich_test';

function buildItem(overrides: Partial<IngestionItem> = {}): IngestionItem {
  const now = new Date().toISOString();
  return {
    id: 'ing_1',
    organizationId: ORG,
    feedId: 'fd_1',
    url: 'https://news.example.com/story',
    title: 'Example Exchange fined after outage',
    summary: 'The Example Exchange was fined 4.2 million after an outage.',
    contentText: 'The Example Exchange was fined 4.2 million after an outage.',
    retrievedAt: now,
    dedupeHash: 'hash_1',
    status: 'NEW',
    signals: {
      entityIds: [],
      topicIds: [],
      independentSourceCount: 1,
      officialSource: false,
    },
    claimTexts: [],
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

describe('Ingestion enrichment (§37)', () => {
  let db: DatabaseService;
  let enrichment: IngestionEnrichmentService;

  beforeEach(async () => {
    db = new DatabaseService();
    enrichment = new IngestionEnrichmentService(db);

    await db.entities.create({
      id: 'ent_exchange',
      organizationId: ORG,
      slug: 'example-exchange',
      name: 'Example Exchange',
      type: 'ORGANIZATION',
      description: 'A regulated exchange.',
      aliases: ['ExampleEx'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    await db.topics.create({
      id: 'top_markets',
      organizationId: ORG,
      slug: 'markets',
      name: 'Markets',
      description: 'Market structure and trading',
      aliases: ['market structure'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  });

  /** Stores the item first, exactly like the ingestion pipeline does. */
  async function storeItem(item: IngestionItem): Promise<IngestionItem> {
    return db.ingestion.createItem(item);
  }

  it('documents the pipeline stages', () => {
    expect(INGESTION_PIPELINE_STAGES).toContain('entity_extraction');
    expect(INGESTION_PIPELINE_STAGES).toContain('topic_classification');
    expect(INGESTION_PIPELINE_STAGES).toContain('claim_extraction');
    expect(INGESTION_PIPELINE_STAGES.indexOf('deduplicate')).toBeLessThan(
      INGESTION_PIPELINE_STAGES.indexOf('entity_extraction')
    );
  });

  it('extracts known entities by name and alias', async () => {
    const byName = await enrichment.enrichItem(await storeItem(buildItem()));
    expect(byName.signals.entityIds).toContain('ent_exchange');

    const byAlias = await enrichment.enrichItem(
      await storeItem(
        buildItem({
          id: 'ing_2',
          title: 'ExampleEx announces a trading halt',
          summary: 'ExampleEx announced a trading halt this morning.',
          contentText: undefined,
        })
      )
    );
    expect(byAlias.signals.entityIds).toContain('ent_exchange');
  });

  it('classifies topics by token overlap', async () => {
    const item = await enrichment.enrichItem(
      await storeItem(
        buildItem({
          title: 'Markets react to the trading halt',
          summary: 'Market structure questions were raised today.',
        })
      )
    );

    expect(item.signals.topicIds).toContain('top_markets');
  });

  it('extracts candidate claims with their evidence signals', async () => {
    const item = await enrichment.enrichItem(await storeItem(buildItem()));

    expect(item.claimTexts.length).toBeGreaterThan(0);
    expect(item.claimTexts[0]).toContain('fined');
  });

  it('merges enrichment with the feed defaults instead of replacing them', async () => {
    const item = await enrichment.enrichItem(
      await storeItem(
        buildItem({
          signals: {
            entityIds: ['ent_default'],
            topicIds: ['top_default'],
            independentSourceCount: 1,
            officialSource: false,
          },
        })
      )
    );

    expect(item.signals.entityIds).toContain('ent_default');
    expect(item.signals.entityIds).toContain('ent_exchange');
    expect(item.signals.topicIds).toContain('top_default');
  });

  it('supports a pluggable provider', async () => {
    const provider = {
      name: 'test-provider',
      extractEntities: async () => ['ent_from_provider'],
      classifyTopics: async () => ['top_from_provider'],
      extractClaims: async () => ['A claim from the provider.'],
    };

    const custom = new IngestionEnrichmentService(db, provider);
    const item = await custom.enrichItem(await storeItem(buildItem()));

    expect(custom.providerName).toBe('test-provider');
    expect(item.signals.entityIds).toEqual(['ent_from_provider']);
    expect(item.signals.topicIds).toEqual(['top_from_provider']);
    expect(item.claimTexts).toEqual(['A claim from the provider.']);
  });

  it('never breaks ingestion when the taxonomy is empty', async () => {
    const emptyDb = new DatabaseService();
    const service = new IngestionEnrichmentService(emptyDb);
    const item = await service.enrichItem(
      await emptyDb.ingestion.createItem(buildItem({ organizationId: 'org_empty' }))
    );

    expect(item.signals.entityIds).toEqual([]);
    expect(item.signals.topicIds).toEqual([]);
  });

  it('exposes a deterministic provider by default', () => {
    expect(enrichment.providerName).toBe('deterministic');
    expect(new DeterministicEnrichmentProvider().name).toBe('deterministic');
  });
});
