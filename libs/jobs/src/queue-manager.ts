import Redis from 'ioredis';
import {
  JobType,
  JobStatus,
  JobRecord,
  JobHandler,
} from './job-types';
import { logger, metrics } from '@ai-news/observability';
import { bullQueue } from './bull-queue.service';

export interface EnqueueOptions {
  id?: string;
  maxAttempts?: number;
  delayMs?: number;
  priority?: number;
}

export class QueueManager {
  private jobs: Map<string, JobRecord> = new Map();
  private handlers: Map<JobType, JobHandler> = new Map();
  private autoProcess: boolean = true;
  private redis: Redis | null = null;
  private isRedisActive: boolean = false;

  constructor(autoProcess: boolean = true) {
    this.autoProcess = autoProcess;
    const redisUrl = process.env.REDIS_URL;
    if (redisUrl && process.env.NODE_ENV !== 'test') {
      try {
        this.redis = new Redis(redisUrl, {
          lazyConnect: true,
          maxRetriesPerRequest: 1,
          enableOfflineQueue: false,
        });
        this.redis.connect().then(() => {
          this.isRedisActive = true;
          logger.info(`QueueManager connected to Redis at ${redisUrl}`);
        }).catch((err) => {
          logger.warn(`Redis connection failed for QueueManager: ${err.message}. Running in memory fallback.`);
          this.isRedisActive = false;
        });
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        logger.warn(`Redis initialization skipped: ${errorMsg}`);
        this.isRedisActive = false;
      }
    }
  }


  public registerHandler<T = unknown, R = unknown>(
    type: JobType,
    handler: JobHandler<T, R>
  ): void {
    this.handlers.set(type, handler as JobHandler);
    logger.info(`Registered job handler for [${type}]`);
  }

  public async enqueue<T = unknown>(
    type: JobType,
    payload: T,
    options: EnqueueOptions = {}
  ): Promise<JobRecord<T>> {
    const id = options.id || `job_${type.replace('.', '_')}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    
    const record: JobRecord<T> = {
      id,
      type,
      payload,
      status: 'queued',
      progress: 0,
      attempts: 0,
      maxAttempts: options.maxAttempts || 3,
      createdAt: new Date().toISOString(),
    };

    this.jobs.set(id, record as JobRecord);
    if (this.redis && this.isRedisActive) {
      try {
        await this.redis.set(`globalpulse:jobs:${id}`, JSON.stringify(record));
        await this.redis.lpush(`globalpulse:queue:${type}`, id);
        await bullQueue.enqueueJob(type, payload, { id, delayMs: options.delayMs, priority: options.priority, maxAttempts: options.maxAttempts });
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        logger.debug(`Redis write error: ${errorMsg}`);
      }
    }
    metrics.incrementCounter('worker_jobs_enqueued_total', 1, { jobType: type });
    logger.info(`Enqueued background job [${id}] of type [${type}]`);

    if (this.autoProcess) {
      // Non-blocking trigger of processor
      setImmediate(() => {
        this.processNext().catch((err) => {
          logger.error(`Error in background queue processor: ${err.message}`, err);
        });
      });
    }

    return record;
  }

  public getJob(id: string): JobRecord | undefined {
    return this.jobs.get(id);
  }

  public getJobsByType(type: JobType): JobRecord[] {
    return Array.from(this.jobs.values()).filter((j) => j.type === type);
  }

  public getJobsByStatus(status: JobStatus): JobRecord[] {
    return Array.from(this.jobs.values()).filter((j) => j.status === status);
  }

  public async processJob(id: string): Promise<JobRecord> {
    const job = this.jobs.get(id);
    if (!job) {
      throw new Error(`Job not found: ${id}`);
    }

    const handler = this.handlers.get(job.type);
    if (!handler) {
      job.status = 'failed';
      job.error = `No handler registered for job type: ${job.type}`;
      metrics.incrementCounter('worker_jobs_failed_total', 1, { jobType: job.type });
      return job;
    }

    job.status = 'active';
    job.startedAt = new Date().toISOString();
    job.attempts += 1;

    const updateProgress = (pct: number) => {
      job.progress = Math.min(100, Math.max(0, pct));
    };

    try {
      const result = await handler(job, updateProgress);
      job.status = 'completed';
      job.progress = 100;
      job.result = result;
      job.completedAt = new Date().toISOString();
      if (this.redis && this.isRedisActive) {
        try {
          await this.redis.set(`globalpulse:jobs:${id}`, JSON.stringify(job));
        } catch {}
      }
      metrics.incrementCounter('worker_jobs_completed_total', 1, { jobType: job.type });
      logger.info(`Job [${id}] (${job.type}) completed successfully`);
      return job;
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      if (job.attempts < job.maxAttempts) {
        job.status = 'queued';
        logger.warn(`Job [${id}] failed (attempt ${job.attempts}/${job.maxAttempts}): ${errorMsg}. Retrying...`);
      } else {
        job.status = 'failed';
        job.error = errorMsg;
        job.completedAt = new Date().toISOString();
        metrics.incrementCounter('worker_jobs_failed_total', 1, { jobType: job.type });
        logger.error(
          `Job [${id}] permanently failed: ${errorMsg}`,
          err instanceof Error ? err : new Error(String(err))
        );
      }
      if (this.redis && this.isRedisActive) {
        try {
          await this.redis.set(`globalpulse:jobs:${id}`, JSON.stringify(job));
        } catch {}
      }
      return job;
    }
  }

  public async processNext(): Promise<JobRecord | null> {
    const queuedJob = Array.from(this.jobs.values()).find((j) => j.status === 'queued');
    if (!queuedJob) return null;
    return this.processJob(queuedJob.id);
  }

  public async drain(): Promise<void> {
    let job: JobRecord | null = null;
    do {
      job = await this.processNext();
    } while (job !== null);
  }

  public clear(): void {
    this.jobs.clear();
  }
}

export const defaultQueue = new QueueManager();
