import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { BullQueueService, bullQueue } from '../../../libs/jobs/src/bull-queue.service';

describe('BullQueueService & Redis Lifecycle (Unit Tests)', () => {
  let service: BullQueueService;

  beforeEach(() => {
    service = new BullQueueService();
  });

  afterEach(async () => {
    await service.closeAll();
  });

  it('initializes in resilient fallback mode when no Redis instance is connected', () => {
    expect(service.isBullActive()).toBe(false);
    expect(service.getQueue('test-queue')).toBeNull();
  });

  it('enqueues job and returns a structured fallback job descriptor', async () => {
    const jobResult = await service.enqueueJob('media.process_variant', {
      mediaId: 'med_auto_1',
      formats: ['webp'],
    });

    expect(jobResult.id).toBeDefined();
    expect(jobResult.id).toMatch(/^job_media_process_variant_/);
    expect(jobResult.bullJobId).toBeUndefined();
  });

  it('respects custom job id when specified in enqueue options', async () => {
    const customId = 'job_custom_reservation_999';
    const jobResult = await service.enqueueJob(
      'audio.generate_briefing',
      { storyId: 'sty_test', voice: 'news_anchor_f' },
      { id: customId }
    );

    expect(jobResult.id).toBe(customId);
  });

  it('returns null when registering a worker without an active Redis connection', () => {
    const worker = service.registerWorker('globalpulse-jobs', async () => ({ status: 'done' }));
    expect(worker).toBeNull();
  });

  it('handles invalid Redis URLs gracefully in constructor without crashing', () => {
    const invalidService = new BullQueueService({ redisUrl: 'not-a-valid-url::' });
    expect(invalidService.isBullActive()).toBe(false);
  });

  it('closes queues and workers cleanly on closeAll()', async () => {
    await expect(service.closeAll()).resolves.toBeUndefined();
  });

  it('provides a functioning singleton instance bullQueue', () => {
    expect(bullQueue).toBeInstanceOf(BullQueueService);
    expect(BullQueueService.getInstance()).toBe(bullQueue);
  });
});
