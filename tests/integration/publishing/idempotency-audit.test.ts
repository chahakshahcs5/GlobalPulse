import { describe, it, expect, beforeEach } from 'vitest';
import { DatabaseService } from '@ai-news/database';
import { StoryService } from '@ai-news/stories';

describe('Idempotency & Audit Logging Integration Tests', () => {
  let db: DatabaseService;
  let storyService: StoryService;

  const ctx = {
    organizationId: 'org_test_audit',
    authorId: 'usr_scheduled_agent',
    clientType: 'gemini_spark' as const,
    createdVia: 'mcp' as const,
    requestId: 'req_xyz_123',
  };

  beforeEach(() => {
    db = new DatabaseService();
    storyService = new StoryService(db);
  });

  it('guarantees zero duplicate stories on identical idempotencyKey', async () => {
    const key = 'spark:brics-2026:2026-09-26-0800';

    // First call
    const story1 = await storyService.createStory(
      {
        title: 'BRICS 2026 Energy Framework Announcement',
        summary: 'Scheduled briefing dispatch.',
        idempotencyKey: key,
      },
      ctx
    );

    // Second call (simulating scheduled agent retry)
    const story2 = await storyService.createStory(
      {
        title: 'BRICS 2026 Energy Framework Announcement',
        summary: 'Scheduled briefing dispatch.',
        idempotencyKey: key,
      },
      ctx
    );

    expect(story1.id).toBe(story2.id);
    expect(story1.slug).toBe(story2.slug);
    expect(story1.createdAt).toBe(story2.createdAt);

    // Verify search only returns 1 story, not 2
    const searchResult = await db.stories.search({ query: 'Energy Framework' }, ctx.organizationId);
    expect(searchResult.items.length).toBe(1);
  });

  it('records client provenance and immutable audit trails', async () => {
    const story = await storyService.createStory(
      {
        title: 'New Quantum Computing Breakthrough',
        summary: 'Superconducting qubit coherence time doubles.',
        blocks: [
          {
            id: 'p_1',
            blockType: 'paragraph',
            sortOrder: 0,
            data: { text: 'Scientists achieved 10 milliseconds coherence.', format: 'markdown' },
          },
        ],
      },
      ctx
    );

    expect(story.createdVia).toBe('mcp');
    expect(story.createdByClient).toBe('gemini_spark');
    expect(story.authorId).toBe('usr_scheduled_agent');

    // Publish the story
    await storyService.publishStory(story.id, ctx);

    // Check audit logs
    const auditLogs = await db.audit.query(ctx.organizationId);
    expect(auditLogs.length).toBeGreaterThanOrEqual(2);

    const publishLog = auditLogs.find((l) => l.action === 'mcp.publish_story');
    expect(publishLog).toBeDefined();
    expect(publishLog?.clientType).toBe('gemini_spark');
    expect(publishLog?.resourceId).toBe(story.id);
  });
});
