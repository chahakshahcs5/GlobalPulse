import { describe, it, expect, beforeEach } from 'vitest';
import {
  StructuredLogger,
  createLogger,
  logger as rootLogger,
  MetricsRegistry,
  metrics,
  SimpleTracer,
  tracer,
} from '@ai-news/observability';

describe('Observability Subsystem (Unit Tests)', () => {
  describe('StructuredLogger', () => {
    let testLogger: StructuredLogger;

    beforeEach(() => {
      testLogger = new StructuredLogger({ service: 'unit-test' }, 'debug');
    });

    it('records logs with appropriate levels and timestamps', () => {
      testLogger.info('System initialization complete');
      testLogger.warn('Resource usage above nominal threshold', { threshold: 80 });
      testLogger.error('Unhandled failure encountered', new Error('Database connection dropped'));

      const entries = testLogger.getInMemoryLogs();
      expect(entries.length).toBe(3);

      expect(entries[0]?.level).toBe('info');
      expect(entries[0]?.message).toBe('System initialization complete');
      expect(entries[0]?.context?.service).toBe('unit-test');
      expect(entries[0]?.timestamp).toBeDefined();

      expect(entries[1]?.level).toBe('warn');
      expect(entries[1]?.message).toBe('Resource usage above nominal threshold');
      expect(entries[1]?.context?.threshold).toBe(80);

      expect(entries[2]?.level).toBe('error');
      expect(entries[2]?.message).toBe('Unhandled failure encountered');
      expect(entries[2]?.error?.message).toBe('Database connection dropped');
      expect(entries[2]?.error?.name).toBe('Error');
    });

    it('filters out messages below the configured minLevel', () => {
      testLogger.setLevel('warn');
      testLogger.debug('Verbose tracing info');
      testLogger.info('Standard operational heartbeat');
      testLogger.warn('Warning that should pass through');
      testLogger.error('Fatal crash');

      const entries = testLogger.getInMemoryLogs();
      expect(entries.length).toBe(2);
      expect(entries[0]?.level).toBe('warn');
      expect(entries[1]?.level).toBe('error');
    });

    it('creates child loggers that inherit and augment base context', () => {
      const child = testLogger.child({ traceId: 'trc_123', callerId: 'usr_editor_1' });
      child.info('Story published');

      const entries = child.getInMemoryLogs();
      expect(entries.length).toBe(1);
      expect(entries[0]?.context?.service).toBe('unit-test');
      expect(entries[0]?.context?.traceId).toBe('trc_123');
      expect(entries[0]?.context?.callerId).toBe('usr_editor_1');
    });

    it('clears buffered logs on clearLogs()', () => {
      testLogger.info('Temporary log 1');
      testLogger.info('Temporary log 2');
      expect(testLogger.getInMemoryLogs().length).toBe(2);

      testLogger.clearLogs();
      expect(testLogger.getInMemoryLogs().length).toBe(0);
    });

    it('createLogger helper instantiates a named child with default or specified minLevel', () => {
      const named = createLogger('media-pipeline', 'debug');
      expect(named).toBeInstanceOf(StructuredLogger);
      expect(rootLogger).toBeInstanceOf(StructuredLogger);
    });
  });

  describe('MetricsRegistry (Prometheus Metrics)', () => {
    let registry: MetricsRegistry;

    beforeEach(() => {
      registry = new MetricsRegistry();
    });

    it('increments counter with and without label sets', () => {
      registry.incrementCounter('http_requests_total', 1, { method: 'GET', status: '200' });
      registry.incrementCounter('http_requests_total', 2, { method: 'GET', status: '200' });
      registry.incrementCounter('http_requests_total', 1, { method: 'POST', status: '201' });

      expect(
        registry.getCounterValue('http_requests_total', { method: 'GET', status: '200' })
      ).toBe(3);
      expect(
        registry.getCounterValue('http_requests_total', { method: 'POST', status: '201' })
      ).toBe(1);
      // Aggregate total across all labels
      expect(registry.getCounterValue('http_requests_total')).toBe(4);
    });

    it('sets and retrieves gauge metrics', () => {
      registry.setGauge('active_realtime_connections', 42);
      expect(registry.getGaugeValue('active_realtime_connections')).toBe(42);

      registry.setGauge('active_realtime_connections', 15);
      expect(registry.getGaugeValue('active_realtime_connections')).toBe(15);

      registry.setGauge('queue_depth', 5, { queue: 'high_priority' });
      expect(registry.getGaugeValue('queue_depth', { queue: 'high_priority' })).toBe(5);
    });

    it('records histogram values and exports formatted Prometheus summaries', () => {
      registry.recordHistogram('job_duration_seconds', 0.25, { job_type: 'pdf' });
      registry.recordHistogram('job_duration_seconds', 0.75, { job_type: 'pdf' });

      const values = registry.getHistogramValues('job_duration_seconds', { job_type: 'pdf' });
      expect(values).toEqual([0.25, 0.75]);

      const metricsExport = registry.toPrometheusString();
      expect(metricsExport).toContain('# TYPE job_duration_seconds summary');
      expect(metricsExport).toContain('job_duration_seconds_count{job_type="pdf"} 2');
      expect(metricsExport).toContain('job_duration_seconds_sum{job_type="pdf"} 1');
    });

    it('resets all counters, gauges, and histograms on reset()', () => {
      registry.incrementCounter('temp_counter', 10);
      registry.setGauge('temp_gauge', 5);
      registry.recordHistogram('temp_hist', 1);

      registry.reset();
      expect(registry.getCounterValue('temp_counter')).toBe(0);
      expect(registry.getGaugeValue('temp_gauge')).toBe(0);
      expect(registry.getHistogramValues('temp_hist')).toEqual([]);
    });

    it('global singleton metrics instance is defined and operational', () => {
      expect(metrics).toBeInstanceOf(MetricsRegistry);
      metrics.incrementCounter('global_test_counter', 1);
      expect(metrics.getCounterValue('global_test_counter')).toBeGreaterThanOrEqual(1);
    });
  });

  describe('SimpleTracer (Distributed Tracing)', () => {
    let simpleTracer: SimpleTracer;

    beforeEach(() => {
      simpleTracer = new SimpleTracer();
    });

    it('manages span lifecycles, attributes, and duration calculation', () => {
      const span = simpleTracer.startSpan('render_d3_chart', {
        chartType: 'bar',
        blockId: 'blk_1',
      });
      expect(span.traceId).toBeDefined();
      expect(span.spanId).toBeDefined();
      expect(span.name).toBe('render_d3_chart');
      expect(span.status).toBe('ok');
      expect(span.attributes.chartType).toBe('bar');

      span.end();
      expect(span.endTime).toBeDefined();
      expect(span.endTime!).toBeGreaterThanOrEqual(span.startTime);

      const completed = simpleTracer.getCompletedSpans();
      expect(completed.length).toBe(1);
      expect(completed[0]?.name).toBe('render_d3_chart');
    });

    it('marks span with error status and records error attributes upon failure', () => {
      const span = simpleTracer.startSpan('publish_story');
      const simulatedError = new Error('Database write constraint failed');

      span.end(simulatedError);
      expect(span.status).toBe('error');
      expect(span.attributes['error.message']).toBe('Database write constraint failed');
      expect(span.attributes['error.name']).toBe('Error');
    });

    it('propagates parent traceId to child spans across distributed operations', () => {
      const parentSpan = simpleTracer.startSpan('http_request');
      const childSpan = simpleTracer.startSpan('db_query', {}, parentSpan.traceId);

      expect(childSpan.traceId).toBe(parentSpan.traceId);
      expect(childSpan.spanId).not.toBe(parentSpan.spanId);

      parentSpan.end();
      childSpan.end();

      const completed = simpleTracer.getCompletedSpans();
      const childInCompleted = completed.find((s) => s.spanId === childSpan.spanId);
      expect(childInCompleted?.traceId).toBe(parentSpan.traceId);
    });

    it('traceAsync executes wrapped function and captures span metrics automatically', async () => {
      const result = await simpleTracer.traceAsync(
        'search_indexing',
        { dataset: 'news' },
        async (span) => {
          span.attributes.indexedCount = 100;
          return { indexed: 100 };
        }
      );

      expect(result.indexed).toBe(100);
      const completed = simpleTracer.getCompletedSpans();
      const lastSpan = completed[completed.length - 1];
      expect(lastSpan?.name).toBe('search_indexing');
      expect(lastSpan?.attributes.indexedCount).toBe(100);
      expect(lastSpan?.status).toBe('ok');
    });

    it('traceAsync captures rethrown errors and marks span failed', async () => {
      await expect(
        simpleTracer.traceAsync('failing_operation', {}, async () => {
          throw new Error('Downstream network timeout');
        })
      ).rejects.toThrow('Downstream network timeout');

      const completed = simpleTracer.getCompletedSpans();
      const failedSpan = completed.find((s) => s.name === 'failing_operation');
      expect(failedSpan).toBeDefined();
      expect(failedSpan?.status).toBe('error');
      expect(failedSpan?.attributes['error.message']).toBe('Downstream network timeout');
    });

    it('clears spans on clear()', () => {
      const span = simpleTracer.startSpan('temporary_span');
      span.end();
      expect(simpleTracer.getCompletedSpans().length).toBe(1);

      simpleTracer.clear();
      expect(simpleTracer.getCompletedSpans().length).toBe(0);
    });

    it('global singleton tracer is defined and operational', () => {
      expect(tracer).toBeInstanceOf(SimpleTracer);
    });
  });
});
