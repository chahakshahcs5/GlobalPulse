import { Queue, Worker, Job } from 'bullmq';
import { JobType } from './job-types';
import { createLogger, metrics } from '@ai-news/observability';

const logger = createLogger('bullmq-queue');

export interface BullQueueConfig {
  redisUrl?: string;
  prefix?: string;
}

export class BullQueueService {
  private static instance: BullQueueService;
  private queues: Map<string, Queue> = new Map();
  private workers: Map<string, Worker> = new Map();
  private isConnected: boolean = false;
  private redisConnectionOptions: { host: string; port: number; password?: string } | null = null;

  constructor(config?: BullQueueConfig) {
    const rawUrl = config?.redisUrl || process.env.REDIS_URL;
    if (rawUrl && process.env.NODE_ENV !== 'test') {
      try {
        const parsed = new URL(rawUrl);
        this.redisConnectionOptions = {
          host: parsed.hostname || 'localhost',
          port: parseInt(parsed.port || '6379', 10),
          password: parsed.password || undefined,
        };
        this.isConnected = true;
        logger.info(
          `Initialized BullMQ Redis connection targeting [${this.redisConnectionOptions.host}:${this.redisConnectionOptions.port}]`
        );
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        logger.debug(
          `BullMQ Redis URL parsing failed: ${errorMsg}. Operating in resilient fallback mode.`
        );
        this.isConnected = false;
      }
    }
  }

  public static getInstance(): BullQueueService {
    if (!BullQueueService.instance) {
      BullQueueService.instance = new BullQueueService();
    }
    return BullQueueService.instance;
  }

  public getQueue(queueName: string = 'globalpulse-jobs'): Queue | null {
    if (!this.isConnected || !this.redisConnectionOptions) {
      return null;
    }
    if (!this.queues.has(queueName)) {
      const q = new Queue(queueName, {
        connection: this.redisConnectionOptions,
        defaultJobOptions: {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 1000,
          },
          removeOnComplete: 100,
          removeOnFail: 500,
        },
      });
      this.queues.set(queueName, q);
    }
    return this.queues.get(queueName)!;
  }

  public async enqueueJob<T = unknown>(
    type: JobType,
    payload: T,
    opts: { id?: string; delayMs?: number; priority?: number; maxAttempts?: number } = {}
  ): Promise<{ id: string; bullJobId?: string }> {
    const fallbackId =
      opts.id ||
      `job_${type.replace('.', '_')}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const queue = this.getQueue();

    if (queue) {
      try {
        const bullJob = await queue.add(type, payload, {
          jobId: opts.id,
          delay: opts.delayMs,
          priority: opts.priority,
          attempts: opts.maxAttempts || 3,
        });
        logger.info(
          `[BullMQ] Enqueued job ${bullJob.id} on queue [${queue.name}] for type [${type}]`
        );
        return { id: fallbackId, bullJobId: String(bullJob.id) };
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        logger.warn(`[BullMQ] Fallback enqueue for [${type}]: ${errorMsg}`);
      }
    }

    return { id: fallbackId };
  }

  public registerWorker<T = unknown, R = unknown>(
    queueName: string,
    handler: (job: { id: string; name: string; data: T }) => Promise<R>,
    concurrency = 5
  ): Worker | null {
    if (!this.isConnected || !this.redisConnectionOptions) {
      return null;
    }

    const worker = new Worker(
      queueName,
      async (job: Job) => {
        logger.info(`[BullMQ] Processing job ${job.id} [${job.name}]`);
        const result = await handler({ id: String(job.id), name: job.name, data: job.data });
        metrics.incrementCounter('worker_jobs_completed_total', 1, { jobType: job.name });
        return result;
      },
      {
        connection: this.redisConnectionOptions,
        concurrency,
      }
    );

    worker.on('failed', (job, err) => {
      logger.error(`[BullMQ] Job ${job?.id} failed with error: ${err.message}`);
      metrics.incrementCounter('worker_jobs_failed_total', 1, { jobType: job?.name || 'unknown' });
    });

    this.workers.set(queueName, worker);
    return worker;
  }

  public async closeAll(): Promise<void> {
    for (const w of this.workers.values()) {
      await w.close();
    }
    for (const q of this.queues.values()) {
      await q.close();
    }
    this.workers.clear();
    this.queues.clear();
  }

  public isBullActive(): boolean {
    return this.isConnected;
  }
}

export const bullQueue = BullQueueService.getInstance();
