import { describe, it, expect, beforeEach } from 'vitest';
import { DatabaseService } from '@ai-news/database';
import { seedDatabase } from '../../../libs/database/prisma/seed';

describe('Production Database Core Integration Tests', () => {
  let db: DatabaseService;

  beforeEach(() => {
    db = new DatabaseService();
  });

  describe('Database Service & Health', () => {
    it('initializes repositories and reports health status', async () => {
      expect(db.stories).toBeDefined();
      expect(db.events).toBeDefined();
      expect(db.topics).toBeDefined();
      expect(db.entities).toBeDefined();
      expect(db.sources).toBeDefined();
      expect(db.idempotency).toBeDefined();
      expect(db.audit).toBeDefined();

      const health = await db.getHealth();
      expect(health.status).toBeDefined();
      expect(health.engine).toBeDefined();
      expect(health.latencyMs).toBeGreaterThanOrEqual(0);
    });

    it('executes atomic transactions via TransactionManager', async () => {
      const result = await db.runInTransaction(async (_tx) => {
        return { committed: true, value: 42 };
      });
      expect(result.committed).toBe(true);
      expect(result.value).toBe(42);
    });
  });

  describe('Story Repository', () => {
    it('creates, lists with filters, and manages block revisions', async () => {
      const story = await db.stories.create({
        id: 'sty_test_01',
        organizationId: 'org_test',
        slug: 'quantum-computing-breakthrough',
        title: 'Quantum Advantage Achieved in Cryptography',
        summary: 'Researchers demonstrate 1000-qubit fault-tolerant simulation.',
        status: 'PUBLISHED',
        articleType: 'science',
        authorId: 'usr_ai_01',
        createdByClient: 'gemini',
        createdVia: 'api',
        currentVersionNumber: 1,
        topicIds: ['top_quantum'],
        entityIds: ['ent_qubit_lab'],
        sourceIds: ['src_nature_01'],
        blocks: [
          {
            id: 'blk_1',
            blockType: 'paragraph',
            sortOrder: 0,
            data: { text: 'Paragraph text', format: 'plain' },
          },
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      expect(story.id).toBe('sty_test_01');

      // List with filter
      const published = await db.stories.list({ status: 'PUBLISHED' }, 'org_test');
      expect(published.length).toBe(1);
      expect(published[0].title).toBe('Quantum Advantage Achieved in Cryptography');

      // Query filter
      const queryResults = await db.stories.list({ query: 'Quantum' }, 'org_test');
      expect(queryResults.length).toBe(1);

      // Versioning
      await db.stories.createVersion({
        id: 'ver_test_01',
        storyId: story.id,
        versionNumber: 1,
        title: story.title,
        summary: story.summary,
        changeSummary: 'Initial version',
        blocks: story.blocks,
        authorId: 'usr_ai_01',
        clientType: 'gemini',
        createdAt: new Date().toISOString(),
      });

      const versions = await db.stories.getVersions(story.id);
      expect(versions.length).toBe(1);
      expect(versions[0].versionNumber).toBe(1);

      const v1 = await db.stories.getVersion(story.id, 1);
      expect(v1?.title).toBe(story.title);
    });
  });

  describe('Sources, Citations & Claims', () => {
    it('registers sources and links granular citations', async () => {
      const source = await db.sources.create({
        id: 'src_sec_filing',
        organizationId: 'org_test',
        url: 'https://sec.gov/filings/12345',
        title: 'Annual 10-K Report',
        publisher: 'U.S. Securities and Exchange Commission',
        publishedAt: '2026-09-26T00:00:00Z',
        retrievedAt: new Date().toISOString(),
        language: 'en',
        sourceType: 'OFFICIAL_DOCUMENT',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      expect(source.id).toBe('src_sec_filing');

      const citation = await db.sources.createCitation({
        id: 'cit_01',
        organizationId: 'org_test',
        storyId: 'sty_test_01',
        sourceId: source.id,
        claimText: 'Revenue exceeded $10B in Q3',
        confidenceScore: 0.99,
        createdAt: new Date().toISOString(),
      });
      expect(citation.id).toBe('cit_01');

      const citations = await db.sources.getCitationsForStory('sty_test_01');
      expect(citations.length).toBe(1);
      expect(citations[0].claimText).toBe('Revenue exceeded $10B in Q3');
    });
  });

  describe('Audit Trail & Idempotency', () => {
    it('logs audit records and handles idempotent idempotency checks', async () => {
      await db.audit.log({
        id: 'aud_test_01',
        organizationId: 'org_test',
        userId: 'usr_agent_01',
        clientType: 'gemini_spark',
        action: 'mcp.publish_story',
        resourceType: 'story',
        resourceId: 'sty_test_01',
        status: 'SUCCESS',
        durationMs: 42,
        timestamp: new Date().toISOString(),
      });

      const logs = await db.audit.query('org_test', { clientType: 'gemini_spark' });
      expect(logs.length).toBe(1);
      expect(logs[0].action).toBe('mcp.publish_story');

      // Idempotency
      await db.idempotency.save({
        id: 'idemp_01',
        organizationId: 'org_test',
        key: 'idemp_key_abc',
        action: 'publish_story',
        responseJson: { success: true },
        createdAt: new Date().toISOString(),
      });

      const record = await db.idempotency.get('idemp_key_abc', 'org_test');
      expect(record).toBeDefined();
      expect((record?.responseJson as { success?: boolean })?.success).toBe(true);
    });
  });

  describe('Enterprise Database Seeder', () => {
    it('populates rich baseline newsroom dataset', async () => {
      await seedDatabase(db);

      const topics = await db.topics.list('org_default');
      expect(topics.length).toBeGreaterThanOrEqual(3);

      const entities = await db.entities.list('org_default');
      expect(entities.length).toBeGreaterThanOrEqual(2);

      const sources = await db.sources.list('org_default');
      expect(sources.length).toBeGreaterThanOrEqual(2);

      const stories = await db.stories.list({}, 'org_default');
      expect(stories.length).toBeGreaterThanOrEqual(1);

      const flagship = stories.find((s) => s.slug.includes('brics-expansion-2026'));
      expect(flagship).toBeDefined();
      expect(flagship?.blocks.length).toBe(4);
      expect(flagship?.currentVersionNumber).toBe(2);
    });
  });
});
