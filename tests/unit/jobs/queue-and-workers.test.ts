import { describe, it, expect, beforeEach } from 'vitest';
import { QueueManager } from '@ai-news/jobs';
import { WorkerService } from '../../../apps/worker/src/worker.service';

describe('Jobs Queue & Background Worker Unit Tests', () => {
  let queue: QueueManager;

  beforeEach(() => {
    // Instantiate with autoProcess: false so tests can manually orchestrate steps
    queue = new QueueManager(false);
    new WorkerService(queue);
  });

  describe('QueueManager Core Lifecycle', () => {
    it('enqueues job with unique ID and initial queued status', async () => {
      const job = await queue.enqueue('media.process_variant', {
        mediaId: 'med_test_1',
        sourceUrl: 'https://images.globalpulse.news/hero.jpg',
        formats: ['webp'],
        dimensions: [{ width: 800, height: 600, suffix: 'md' }],
      });

      expect(job.id).toMatch(/^job_media_process_variant_/);
      expect(job.status).toBe('queued');
      expect(job.progress).toBe(0);
      expect(job.attempts).toBe(0);
      expect(job.maxAttempts).toBe(3);
    });

    it('retrieves jobs filtered by status and by type', async () => {
      await queue.enqueue('export.generate_pdf', {
        storyId: 'sty_1',
        versionNumber: 1,
        layout: 'standard',
      });
      await queue.enqueue('audio.generate_briefing', {
        storyId: 'sty_2',
        voice: 'news_f',
        scriptText: 'Briefing',
      });

      const pdfJobs = queue.getJobsByType('export.generate_pdf');
      expect(pdfJobs.length).toBe(1);

      const queuedJobs = queue.getJobsByStatus('queued');
      expect(queuedJobs.length).toBe(2);
    });

    it('marks job as failed if no handler is registered for its type', async () => {
      const rawQueue = new QueueManager(false);
      const job = await rawQueue.enqueue('unregistered.custom_task', { data: 123 });

      const processed = await rawQueue.processJob(job.id);
      expect(processed.status).toBe('failed');
      expect(processed.error).toContain('No handler registered');
    });

    it('retries job when error occurs and attempts < maxAttempts', async () => {
      const retryQueue = new QueueManager(false);
      let callCount = 0;

      retryQueue.registerHandler('flaky.job', async () => {
        callCount++;
        if (callCount < 2) {
          throw new Error('Transient network glitch');
        }
        return { success: true };
      });

      const job = await retryQueue.enqueue('flaky.job', {}, { maxAttempts: 3 });

      // First run: fails and re-queues
      const attempt1 = await retryQueue.processJob(job.id);
      expect(attempt1.status).toBe('queued');
      expect(attempt1.attempts).toBe(1);

      // Second run: succeeds
      const attempt2 = await retryQueue.processJob(job.id);
      expect(attempt2.status).toBe('completed');
      expect(attempt2.attempts).toBe(2);
      expect(attempt2.result).toEqual({ success: true });
    });

    it('permanently marks job as failed when attempts reach maxAttempts', async () => {
      const failQueue = new QueueManager(false);
      failQueue.registerHandler('fatal.job', async () => {
        throw new Error('Permanent database corruption');
      });

      const job = await failQueue.enqueue('fatal.job', {}, { maxAttempts: 2 });

      // Attempt 1 -> re-queues
      await failQueue.processJob(job.id);
      expect(job.status).toBe('queued');

      // Attempt 2 -> permanent failure
      const final = await failQueue.processJob(job.id);
      expect(final.status).toBe('failed');
      expect(final.error).toBe('Permanent database corruption');
      expect(final.completedAt).toBeDefined();
    });

    it('drains entire queue sequentially with drain()', async () => {
      await queue.enqueue('export.generate_pdf', {
        storyId: 'sty_1',
        versionNumber: 1,
        layout: 'digest',
      });
      await queue.enqueue('export.generate_pdf', {
        storyId: 'sty_2',
        versionNumber: 2,
        layout: 'broadsheet',
      });

      expect(queue.getJobsByStatus('queued').length).toBe(2);

      await queue.drain();

      expect(queue.getJobsByStatus('queued').length).toBe(0);
      expect(queue.getJobsByStatus('completed').length).toBe(2);
    });
  });

  describe('WorkerService Handlers', () => {
    it('executes media.process_variant and calculates dimensional permutations', async () => {
      const job = await queue.enqueue('media.process_variant', {
        mediaId: 'med_summit_keynote',
        sourceUrl: 'https://images.globalpulse.news/keynote.jpg',
        formats: ['webp', 'avif'],
        dimensions: [
          { width: 1920, height: 1080, suffix: '1080p' },
          { width: 3840, height: 2160, suffix: '4k' },
        ],
      });

      const processed = await queue.processJob(job.id);
      expect(processed.status).toBe('completed');
      expect(processed.progress).toBe(100);
      const res = processed.result as {
        totalVariants: number;
        variants: Array<{ format: string; url: string }>;
      };
      expect(res.totalVariants).toBe(4); // 2 formats * 2 dimensions
      expect(res.variants[0].format).toBe('webp');
      expect(res.variants[0].url).toContain('keynote.jpg_1080p.webp');
    });

    it('executes search.index_story and generates mock embedding tokens', async () => {
      const job = await queue.enqueue('search.index_story', {
        storyId: 'sty_trade_2026',
        versionNumber: 1,
        title: 'Global Trade Accord Finalized in Geneva',
        summary: 'Multilateral tariffs reduced across 45 partner countries.',
        textContent: 'Full diplomatic text covering clean tech and agriculture subsidies.',
      });

      const processed = await queue.processJob(job.id);
      expect(processed.status).toBe('completed');
      const res = processed.result as {
        storyId: string;
        indexedTokens: number;
        embeddingDimensions: number;
      };
      expect(res.storyId).toBe('sty_trade_2026');
      expect(res.indexedTokens).toBeGreaterThan(10);
      expect(res.embeddingDimensions).toBe(1536);
    });

    it('executes audio.generate_briefing and calculates duration based on script length', async () => {
      const job = await queue.enqueue('audio.generate_briefing', {
        storyId: 'sty_breaking_mars',
        voice: 'news_anchor_f',
        scriptText:
          'This is GlobalPulse news. Today international space agencies confirmed the discovery of subterranean geothermal reservoirs on Mars.',
      });

      const processed = await queue.processJob(job.id);
      expect(processed.status).toBe('completed');
      const res = processed.result as { voice: string; durationSeconds: number; audioUrl: string };
      expect(res.voice).toBe('news_anchor_f');
      expect(res.durationSeconds).toBeGreaterThanOrEqual(10);
      expect(res.audioUrl).toContain('audio/sty_breaking_mars_briefing_news_anchor_f.mp3');
    });

    it('executes export.generate_pdf and produces archivable PDF artifact', async () => {
      const job = await queue.enqueue('export.generate_pdf', {
        storyId: 'sty_archive_77',
        versionNumber: 3,
        layout: 'broadsheet',
      });

      const processed = await queue.processJob(job.id);
      expect(processed.status).toBe('completed');
      const res = processed.result as { pdfUrl: string; pageCount: number };
      expect(res.pdfUrl).toBe(
        'https://cdn.globalpulse.news/archive/sty_archive_77_v3_broadsheet.pdf'
      );
      expect(res.pageCount).toBe(3);
    });
  });
});
