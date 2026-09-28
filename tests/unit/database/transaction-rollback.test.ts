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
});
