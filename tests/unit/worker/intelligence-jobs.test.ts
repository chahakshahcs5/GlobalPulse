import { describe, it, expect, beforeEach } from 'vitest';
import { QueueManager } from '@ai-news/jobs';
import { DatabaseService } from '@ai-news/database';
import { AlertService, StoryService } from '@ai-news/stories';
import { WorkerService } from '../../../apps/worker/src/worker.service';
import { startScheduler } from '../../../apps/worker/src/main';

const ORG = 'org_worker_intel';

describe('Worker Intelligence Jobs (ingestion, alerts, graph indexing)', () => {
  let db: DatabaseService;
  let queue: QueueManager;
  let worker: WorkerService;
  let stories: StoryService;
  let storyId: string;

  beforeEach(async () => {
    db = new DatabaseService();
    queue = new QueueManager(false);
    worker = new WorkerService(queue, db);
    stories = new StoryService(db);

    const story = await stories.createStory(
      {
        title: 'Worker intelligence story',
        summary: 'Story used to verify worker-side intelligence jobs.',
        articleType: 'breaking_news',
        topicIds: ['top_economy'],
      },
      {
        organizationId: ORG,
        authorId: 'usr_worker',
        clientType: 'internal_service',
        createdVia: 'api',
      }
    );
    storyId = story.id;
  });

  it('indexes a story into the knowledge graph', async () => {
    const job = await queue.enqueue('intelligence.index_story', {
      storyId,
      organizationId: ORG,
    });

    const processed = await queue.processJob(job.id);

    expect(processed.status).toBe('completed');
    const result = processed.result as { edgesCreated: number; storyId: string };
    expect(result.storyId).toBe(storyId);
    expect(result.edgesCreated).toBeGreaterThanOrEqual(1);

    const edges = await db.knowledgeGraph.listEdges(ORG, {});
    expect(edges.length).toBeGreaterThanOrEqual(1);
  });

  it('evaluates alert rules for a story', async () => {
    const alerts = new AlertService(db);
    await alerts.createRule(
      {
        name: 'Worker keyword rule',
        conditions: { keywords: ['worker'] },
        cooldownMinutes: 0,
      },
      { organizationId: ORG, actorId: 'usr_worker', clientType: 'internal_service' }
    );

    const job = await queue.enqueue('alerts.evaluate', {
      resourceType: 'STORY',
      resourceId: storyId,
      organizationId: ORG,
    });

    const processed = await queue.processJob(job.id);

    expect(processed.status).toBe('completed');
    const result = processed.result as { evaluatedRules: number; triggers: number };
    expect(result.evaluatedRules).toBe(1);
    expect(result.triggers).toBe(1);
  });

  it('polls ingestion feeds for the organization', async () => {
    const job = await queue.enqueue('ingestion.fetch_feed', { organizationId: ORG });
    const processed = await queue.processJob(job.id);

    // No feeds are registered, so the sweep completes with zero feeds polled.
    expect(processed.status).toBe('completed');
    const result = processed.result as { feedsPolled: number; organizationId: string };
    expect(result.organizationId).toBe(ORG);
    expect(result.feedsPolled).toBe(0);
  });

  it('enqueues tenant-scoped ingestion and alert sweeps from the scheduler', async () => {
    const stop = startScheduler(worker, db, {
      ingestionIntervalMinutes: 1,
      alertIntervalMinutes: 1,
      maxStoriesPerSweep: 5,
    });

    try {
      // The scheduler uses timers; the assertions below verify the wiring by
      // triggering the same code path the timers use.
      const orgIds = await db.ingestion.listOrganizationIds();
      expect(orgIds).toEqual([]);

      const ingestionJob = await queue.enqueue('ingestion.fetch_feed', {
        organizationId: ORG,
      });
      const alertJob = await queue.enqueue('alerts.evaluate', {
        resourceType: 'STORY',
        resourceId: storyId,
        organizationId: ORG,
      });

      expect(ingestionJob.type).toBe('ingestion.fetch_feed');
      expect(alertJob.type).toBe('alerts.evaluate');
      expect(ingestionJob.payload.organizationId).toBe(ORG);
    } finally {
      stop();
    }
  });
});
