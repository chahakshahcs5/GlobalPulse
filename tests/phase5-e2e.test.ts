import { describe, it, expect, beforeEach } from 'vitest';
import { StructuredLogger, MetricsRegistry, SimpleTracer } from '@ai-news/observability';
import { QueueManager } from '@ai-news/jobs';
import { WorkerService } from '../apps/worker/src/worker.service';
import { OfflineStorageService } from '../apps/mobile/src/services/storage';
import { MobileBlockRenderer } from '../apps/mobile/src/components/MobileBlockRenderer';
import { runEndToEndScenario } from '../scripts/demo-e2e';
import React from 'react';

describe('Phase 5: Background Jobs, Mobile Client & Observability', () => {
  describe('Observability Engine', () => {
    it('structured logger formats logs with context and child inheritance', () => {
      const logger = new StructuredLogger({ service: 'news-api' }, 'debug');
      const child = logger.child({ traceId: 'tr_123', clientType: 'gemini' });

      child.info('MCP tool invoked', { toolName: 'publish_story' });

      const logs = child.getInMemoryLogs();
      expect(logs.length).toBe(1);
      expect(logs[0].level).toBe('info');
      expect(logs[0].message).toBe('MCP tool invoked');
      expect(logs[0].context?.service).toBe('news-api');
      expect(logs[0].context?.traceId).toBe('tr_123');
      expect(logs[0].context?.clientType).toBe('gemini');
      expect(logs[0].context?.toolName).toBe('publish_story');
    });

    it('metrics registry records counters, gauges, and exports Prometheus metrics', () => {
      const registry = new MetricsRegistry();

      registry.incrementCounter('story_publications_total', 1, { client: 'gemini_spark' });
      registry.incrementCounter('story_publications_total', 2, { client: 'gemini_spark' });
      registry.setGauge('active_websockets', 42);
      registry.recordHistogram('mcp_latency_ms', 35, { tool: 'create_story' });

      expect(registry.getCounterValue('story_publications_total', { client: 'gemini_spark' })).toBe(3);
      expect(registry.getGaugeValue('active_websockets')).toBe(42);

      const promOutput = registry.toPrometheusString();
      expect(promOutput).toContain('# TYPE story_publications_total counter');
      expect(promOutput).toContain('story_publications_total{client="gemini_spark"} 3');
      expect(promOutput).toContain('# TYPE active_websockets gauge');
      expect(promOutput).toContain('active_websockets 42');
      expect(promOutput).toContain('mcp_latency_ms_count{tool="create_story"} 1');
      expect(promOutput).toContain('mcp_latency_ms_sum{tool="create_story"} 35');
    });

    it('simple tracer creates spans with timing and status', async () => {
      const tracer = new SimpleTracer();

      const result = await tracer.traceAsync('mcp.tool.execution', { tool: 'search_stories' }, async (span) => {
        expect(span.name).toBe('mcp.tool.execution');
        expect(span.attributes.tool).toBe('search_stories');
        return { count: 5 };
      });

      expect(result.count).toBe(5);
      const completed = tracer.getCompletedSpans();
      expect(completed.length).toBe(1);
      expect(completed[0].status).toBe('ok');
      expect(completed[0].endTime).toBeGreaterThanOrEqual(completed[0].startTime);
    });
  });

  describe('Background Worker & Queue Manager', () => {
    let queue: QueueManager;
    let workerService: WorkerService;

    beforeEach(() => {
      queue = new QueueManager(false); // Manual processing for deterministic tests
      workerService = new WorkerService(queue);
    });

    it('processes media variants job and calculates dimensions', async () => {
      const job = await queue.enqueue('media.process_variant', {
        mediaId: 'med_001',
        sourceUrl: 'https://images.globalpulse.news/summit.jpg',
        formats: ['webp', 'avif'],
        dimensions: [
          { width: 800, height: 450, suffix: 'thumb' },
          { width: 1920, height: 1080, suffix: 'hd' },
        ],
      });

      expect(job.status).toBe('queued');
      await queue.drain();

      const processed = queue.getJob(job.id);
      expect(processed?.status).toBe('completed');
      expect(processed?.progress).toBe(100);
      expect((processed?.result as any).totalVariants).toBe(4);
      expect((processed?.result as any).variants[0].url).toContain('summit.jpg_thumb.webp');
    });

    it('processes search indexing job and extracts keywords', async () => {
      const job = await queue.enqueue('search.index_story', {
        storyId: 'sty_test_99',
        versionNumber: 2,
        title: 'Semiconductor Fabrication Plant Opened',
        summary: 'Massive investments announced for 2nm lithography in Ohio.',
        textContent: 'Full narrative body describing cleanrooms and EUV machines.',
      });

      await queue.drain();

      const processed = queue.getJob(job.id);
      expect(processed?.status).toBe('completed');
      expect((processed?.result as any).indexedTokens).toBeGreaterThan(10);
      expect((processed?.result as any).embeddingDimensions).toBe(1536);
    });

    it('processes audio briefing generation job', async () => {
      const job = await queue.enqueue('audio.generate_briefing', {
        storyId: 'sty_audio_01',
        voice: 'news_anchor_f',
        scriptText: 'This is the two minute audio briefing summarizing the latest headlines.',
      });

      await queue.drain();

      const processed = queue.getJob(job.id);
      expect(processed?.status).toBe('completed');
      expect((processed?.result as any).voice).toBe('news_anchor_f');
      expect((processed?.result as any).audioUrl).toContain('sty_audio_01_briefing_news_anchor_f.mp3');
      expect((processed?.result as any).durationSeconds).toBeGreaterThanOrEqual(10);
    });
  });

  describe('Mobile Client & Offline Storage', () => {
    let storage: OfflineStorageService;

    beforeEach(() => {
      storage = new OfflineStorageService();
    });

    it('caches stories for offline reading and manages bookmarks', () => {
      const testStory = {
        id: 'sty_mob_01',
        slug: 'climate-accord-2026',
        title: 'New Climate Accord Signed',
        summary: 'Global delegates agree on binding carbon thresholds.',
        articleType: 'breaking',
        currentVersionNumber: 1,
        blocks: [{ id: 'b1', blockType: 'paragraph', data: { text: 'Article text' } }],
        savedAt: new Date().toISOString(),
        readStatus: false,
      };

      storage.saveStory(testStory);
      expect(storage.getStory('sty_mob_01')?.title).toBe('New Climate Accord Signed');
      expect(storage.getAllSavedStories().length).toBe(1);

      // Bookmark toggle
      const isSaved = storage.toggleBookmark('sty_mob_01');
      expect(isSaved).toBe(true);
      expect(storage.isBookmarked('sty_mob_01')).toBe(true);

      const unSaved = storage.toggleBookmark('sty_mob_01');
      expect(unSaved).toBe(false);
      expect(storage.isBookmarked('sty_mob_01')).toBe(false);

      // Read status
      storage.markAsRead('sty_mob_01');
      expect(storage.getStory('sty_mob_01')?.readStatus).toBe(true);
    });

    it('renders mobile blocks safely', () => {
      const blocks = [
        { id: 'h1', blockType: 'heading', data: { text: 'Headline', level: 1 } },
        { id: 'p1', blockType: 'paragraph', data: { text: 'Paragraph content' } },
        { id: 'q1', blockType: 'quote', data: { quote: 'Direct quote', attribution: 'Official' } },
        {
          id: 'c1',
          blockType: 'chart',
          data: { chartType: 'bar', title: 'GDP Growth', values: [{ x: 1, y: 2 }] },
        },
        {
          id: 't1',
          blockType: 'timeline',
          data: {
            items: [{ date: '2026-09-26', headline: 'Summit Begins', body: 'Delegates arrive' }],
          },
        },
        { id: 'stat1', blockType: 'statistic', data: { value: '41T', label: 'Total Output', change: '+12%' } },
      ];

      const element = MobileBlockRenderer({ blocks });
      expect(element).toBeDefined();
      expect(element.props.children.length).toBe(6);
    });
  });

  describe('Full Multi-Agent End-to-End Workflow', () => {
    it('executes complete multi-agent workflow: discovery -> search -> source -> version -> publish -> jobs -> audit', async () => {
      const result = await runEndToEndScenario();

      expect(result.story.currentVersionNumber).toBe(2);
      expect(result.story.status).toBe('PUBLISHED');
      expect(result.story.title).toContain('BRICS 2026 Accord Signed');
      expect(result.sourceId).toMatch(/^src_/);
      expect(result.auditCount).toBeGreaterThanOrEqual(4);
      expect(result.jobsCompleted).toBeGreaterThanOrEqual(3);
    });
  });
});
