import {
  JobType,
  JobStatus,
  JobRecord,
  JobHandler,
} from './job-types';
import { logger, metrics } from '@ai-news/observability';

export interface EnqueueOptions {
  id?: string;
  maxAttempts?: number;
  delayMs?: number;
  priority?: number;
}

export class QueueManager {
  private jobs: Map<string, JobRecord> = new Map();
  private handlers: Map<JobType, JobHandler> = new Map();
  private processing: boolean = false;
  private autoProcess: boolean = true;

  constructor(autoProcess: boolean = true) {
    this.autoProcess = autoProcess;
  }

  public registerHandler<T = any, R = any>(
    type: JobType,
    handler: JobHandler<T, R>
  ): void {
    this.handlers.set(type, handler);
    logger.info(`Registered job handler for [${type}]`);
  }

  public async enqueue<T = any>(
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
      metrics.incrementCounter('worker_jobs_completed_total', 1, { jobType: job.type });
      logger.info(`Job [${id}] (${job.type}) completed successfully`);
      return job;
    } catch (err: any) {
      if (job.attempts < job.maxAttempts) {
        job.status = 'queued';
        logger.warn(`Job [${id}] failed (attempt ${job.attempts}/${job.maxAttempts}): ${err.message}. Retrying...`);
      } else {
        job.status = 'failed';
        job.error = err.message || String(err);
        job.completedAt = new Date().toISOString();
        metrics.incrementCounter('worker_jobs_failed_total', 1, { jobType: job.type });
        logger.error(`Job [${id}] permanently failed: ${err.message}`, err);
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
