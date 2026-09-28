import { describe, it, expect, beforeEach } from 'vitest';
import { DatabaseService } from '@ai-news/database';

describe('Transactional Integrity & Rollback Handling', () => {
  let db: DatabaseService;

  beforeEach(() => {
    db = new DatabaseService({ memory: true });
  });

  it('persists changes when runInTransaction completes without errors', async () => {
    const result = await db.runInTransaction(async () => {
      await db.stories.create({
        id: 'sty_tx_1',
        organizationId: 'org_test',
        slug: 'tx-story-1',
        title: 'Transaction Committed Story',
        summary: 'Committed successfully',
        status: 'DRAFT',
        articleType: 'breaking_news',
        currentVersionNumber: 1,
        currentVersionId: 'ver_tx_1',
        topicIds: [],
        entityIds: [],
        sourceIds: [],
        createdByClient: 'human_web',
        createdVia: 'api',
        blocks: [],
        authorId: 'usr_author',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      await db.audit.log({
        id: 'aud_tx_1',
        organizationId: 'org_test',
        userId: 'usr_author',
        clientType: 'human_web',
        action: 'test.create',
        resourceType: 'story',
        resourceId: 'sty_tx_1',
        status: 'SUCCESS',
        timestamp: new Date().toISOString(),
      });

      return 'success_payload';
    });

    expect(result).toBe('success_payload');
    const saved = await db.stories.findById('sty_tx_1', 'org_test');
    expect(saved).not.toBeNull();
    expect(saved?.title).toBe('Transaction Committed Story');

    const auditLogs = await db.audit.query('org_test');
    expect(auditLogs).toHaveLength(1);
    expect(auditLogs[0].id).toBe('aud_tx_1');
  });

  it('rolls back all mutations if an error occurs inside runInTransaction', async () => {
    // Initial baseline state
    await db.stories.create({
      id: 'sty_baseline',
      organizationId: 'org_test',
      slug: 'baseline',
      title: 'Baseline Story',
      summary: 'Baseline',
      status: 'PUBLISHED',
      articleType: 'breaking_news',
      currentVersionNumber: 1,
      currentVersionId: 'ver_base',
      topicIds: [],
      entityIds: [],
      sourceIds: [],
      createdByClient: 'human_web',
      createdVia: 'api',
      blocks: [],
      authorId: 'usr_author',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    let caughtError: Error | null = null;

    try {
      await db.runInTransaction(async () => {
        // Mutation 1: Create a new story
        await db.stories.create({
          id: 'sty_rollback_candidate',
          organizationId: 'org_test',
          slug: 'rollback-candidate',
          title: 'Should Rollback',
          summary: 'Should not exist after error',
          status: 'DRAFT',
          articleType: 'breaking_news',
          currentVersionNumber: 1,
          currentVersionId: 'ver_rb_1',
          topicIds: [],
          entityIds: [],
          sourceIds: [],
          createdByClient: 'human_web',
          createdVia: 'api',
          blocks: [],
          authorId: 'usr_author',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });

        // Mutation 2: Modify baseline story
        await db.stories.update({
          id: 'sty_baseline',
          organizationId: 'org_test',
          slug: 'baseline-modified',
          title: 'Corrupted Baseline Title',
          summary: 'Corrupted',
          status: 'ARCHIVED',
          articleType: 'breaking_news',
          currentVersionNumber: 1,
          currentVersionId: 'ver_base',
          topicIds: [],
          entityIds: [],
          sourceIds: [],
          createdByClient: 'human_web',
          createdVia: 'api',
          blocks: [],
          authorId: 'usr_author',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });

        // Mutation 3: Audit log entry
        await db.audit.log({
          id: 'aud_rollback_1',
          organizationId: 'org_test',
          userId: 'usr_author',
          clientType: 'human_web',
          action: 'corrupt.action',
          resourceType: 'story',
          status: 'SUCCESS',
          timestamp: new Date().toISOString(),
        });

        // Failure trigger
        throw new Error('Simulated Database Deadlock or Validation Error');
      });
    } catch (err) {
      caughtError = err as Error;
    }

    expect(caughtError).not.toBeNull();
    expect(caughtError?.message).toBe('Simulated Database Deadlock or Validation Error');

    // Verify Mutation 1 was rolled back
    const candidate = await db.stories.findById('sty_rollback_candidate', 'org_test');
    expect(candidate).toBeNull();

    // Verify Mutation 2 was rolled back to original baseline
    const baseline = await db.stories.findById('sty_baseline', 'org_test');
    expect(baseline).not.toBeNull();
    expect(baseline?.title).toBe('Baseline Story');
    expect(baseline?.status).toBe('PUBLISHED');

    // Verify Mutation 3 was rolled back (no phantom audit log)
    const logs = await db.audit.query('org_test');
    expect(logs).toHaveLength(0);
  });

  it('rolls back events, topics, entities, sources, and engagement across failed transactions', async () => {
    const now = new Date().toISOString();
    // Setup initial baseline
    await db.events.create({
      id: 'evt_baseline',
      organizationId: 'org_test',
      slug: 'base-event',
      title: 'Base Event',
      summary: 'Base Event Summary',
      status: 'ACTIVE',
      occurredAt: now,
      storyIds: [],
      topicIds: [],
      entityIds: [],
      sourceIds: [],
      createdAt: now,
      updatedAt: now,
    });

    await db.topics.create({
      id: 'top_baseline',
      organizationId: 'org_test',
      slug: 'base-topic',
      name: 'Base Topic',
      aliases: [],
      createdAt: now,
      updatedAt: now,
    });

    let caughtError: Error | null = null;
    try {
      await db.runInTransaction(async () => {
        await db.events.create({
          id: 'evt_corrupted',
          organizationId: 'org_test',
          slug: 'corrupt-event',
          title: 'Corrupt Event',
          summary: 'Corrupt Summary',
          status: 'ACTIVE',
          occurredAt: now,
          storyIds: [],
          topicIds: [],
          entityIds: [],
          sourceIds: [],
          createdAt: now,
          updatedAt: now,
        });

        await db.topics.create({
          id: 'top_corrupted',
          organizationId: 'org_test',
          slug: 'corrupt-topic',
          name: 'Corrupt Topic',
          aliases: [],
          createdAt: now,
          updatedAt: now,
        });

        await db.entities.create({
          id: 'ent_corrupted',
          organizationId: 'org_test',
          slug: 'corrupt-entity',
          name: 'Corrupt Entity',
          type: 'ORGANIZATION',
          aliases: [],
          createdAt: now,
          updatedAt: now,
        });

        await db.sources.create({
          id: 'src_corrupted',
          organizationId: 'org_test',
          url: 'https://corrupt.example.com',
          title: 'Corrupt Source',
          publisher: 'Corrupt Publisher',
          sourceType: 'NEWS_ARTICLE',
          retrievedAt: now,
          language: 'en',
          createdAt: now,
          updatedAt: now,
        });

        await db.engagement.createComment({
          id: 'cmt_corrupted',
          storyId: 'sty_any',
          authorId: 'usr_test',
          authorName: 'Test User',
          authorRole: 'reader',
          likesCount: 0,
          organizationId: 'org_test',
          content: 'This comment should not persist',
          status: 'approved',
          createdAt: now,
          updatedAt: now,
        });

        throw new Error('Mid-transaction explosion');
      });
    } catch (err) {
      caughtError = err as Error;
    }

    expect(caughtError?.message).toBe('Mid-transaction explosion');

    // Check that none of the corrupted items were committed
    expect(await db.events.findById('evt_corrupted', 'org_test')).toBeNull();
    expect(await db.topics.findById('top_corrupted', 'org_test')).toBeNull();
    expect(await db.entities.findById('ent_corrupted', 'org_test')).toBeNull();
    expect(await db.sources.findById('src_corrupted', 'org_test')).toBeNull();
    expect(await db.engagement.findCommentById('cmt_corrupted')).toBeNull();

    // Check baseline is intact
    expect(await db.events.findById('evt_baseline', 'org_test')).not.toBeNull();
    expect(await db.topics.findById('top_baseline', 'org_test')).not.toBeNull();
  });

  it('rolls back clusters, liveblogs, newsletters, collections, webhooks, and provenance across failed transactions', async () => {
    const now = new Date().toISOString();

    // Baseline newsletter and collection
    await db.newsletters.subscribe('reader@example.com', 'daily', ['tech']);
    await db.collections.create({
      id: 'col_baseline',
      name: 'Baseline Collection',
      slug: 'baseline-collection',
      curatorId: 'usr_curator',
      isPublic: true,
      storyIds: [],
    });

    let caughtError: Error | null = null;
    try {
      await db.runInTransaction(async () => {
        // Mutate clusters
        await db.clusters.create({
          id: 'clu_corrupted',
          organizationId: 'org_test',
          title: 'Corrupted Cluster',
          summary: 'Should not persist',
          leadStoryId: 'sty_1',
          storyIds: ['sty_1'],
          topic: 'tech',
          category: 'technology',
          perspectives: [],
          timeline: [],
          createdAt: now,
          updatedAt: now,
        });

        // Mutate liveblogs
        await db.liveblogs.addEntry({
          id: 'lb_corrupted',
          storyId: 'sty_1',
          headline: 'Corrupted Live Entry',
          content: 'Should not persist',
          isKeyEvent: false,
          author: { id: 'usr_1', name: 'Author' },
          timestamp: now,
        });

        // Mutate newsletters
        await db.newsletters.subscribe('uncommitted@example.com', 'weekly', ['world']);

        // Mutate collections
        await db.collections.create({
          id: 'col_corrupted',
          name: 'Corrupted Collection',
          slug: 'corrupted-col',
          curatorId: 'usr_curator',
          isPublic: true,
          storyIds: [],
        });

        // Mutate webhooks
        await db.webhooks.createSubscription({
          id: 'wh_corrupted',
          organizationId: 'org_test',
          url: 'https://corrupt.example.com/webhook',
          events: ['story.published'],
          secret: 'whsec_test',
          active: true,
          createdAt: now,
          updatedAt: now,
        });

        // Mutate provenance
        await db.provenance.saveProvenance({
          id: 'prv_corrupted',
          storyId: 'sty_corrupted',
          generatorModel: 'gemini-1.5-pro',
          promptHash: 'hash123',
          confidenceScore: 0.95,
          watermarkSignature: 'sig123',
          generationTimestamp: now,
          createdAt: now,
        });

        throw new Error('Simulated failure during multi-domain operation');
      });
    } catch (err) {
      caughtError = err as Error;
    }

    expect(caughtError?.message).toBe('Simulated failure during multi-domain operation');

    // Verify all corrupted additions were rolled back
    expect(await db.clusters.getById('clu_corrupted', 'org_test')).toBeNull();
    const liveEntries = await db.liveblogs.listEntries('sty_1');
    expect(liveEntries.find((e) => e.id === 'lb_corrupted')).toBeUndefined();
    expect(await db.newsletters.getSubscription('uncommitted@example.com')).toBeNull();
    expect(await db.collections.findById('col_corrupted')).toBeNull();
    expect(await db.webhooks.findSubscriptionById('wh_corrupted', 'org_test')).toBeNull();
    expect(await db.provenance.getProvenance('sty_corrupted')).toBeNull();

    // Verify baseline remained intact
    expect(await db.newsletters.getSubscription('reader@example.com')).not.toBeNull();
    expect(await db.collections.findById('col_baseline')).not.toBeNull();
  });
});
