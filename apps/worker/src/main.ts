import './env';

import { bullQueue, defaultQueue } from '@ai-news/jobs';
import { logger } from '@ai-news/observability';
import { db as defaultDatabase, prismaManager, type DatabaseService } from '@ai-news/database';
import { WorkerService } from './worker.service';

export interface SchedulerOptions {
  /** How often ingestion feeds are polled, in minutes. */
  ingestionIntervalMinutes?: number;
  /** How often alert rules are evaluated against recent stories, in minutes. */
  alertIntervalMinutes?: number;
  /** Maximum stories evaluated per alert sweep (per organization). */
  maxStoriesPerSweep?: number;
}

function readPositiveInt(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return Math.floor(parsed);
}

/**
 * Repeating background sweeps.
 *
 * Both sweeps are tenant-aware: organization IDs are enumerated explicitly and
 * every enqueued job carries its own organizationId, so tenant isolation is
 * preserved end-to-end instead of relying on a shared/global scope.
 */
export function startScheduler(
  worker: WorkerService,
  database: DatabaseService = defaultDatabase,
  options: SchedulerOptions = {}
): () => void {
  const ingestionIntervalMs =
    (options.ingestionIntervalMinutes ??
      readPositiveInt(process.env.INGESTION_POLL_INTERVAL_MINUTES, 15)) * 60_000;
  const alertIntervalMs =
    (options.alertIntervalMinutes ??
      readPositiveInt(process.env.ALERT_EVALUATION_INTERVAL_MINUTES, 5)) * 60_000;
  const maxStoriesPerSweep = options.maxStoriesPerSweep ?? 25;

  const queue = worker.getQueue();

  const organizationIds = async (): Promise<string[]> => {
    const ids = await database.ingestion.listOrganizationIds();
    return ids.length ? ids : ['org_default'];
  };

  const ingestionTimer = setInterval(() => {
    void (async () => {
      try {
        for (const organizationId of await organizationIds()) {
          await queue.enqueue('ingestion.fetch_feed', { organizationId });
        }
      } catch (err: unknown) {
        logger.error(
          `Scheduled ingestion sweep failed: ${err instanceof Error ? err.message : String(err)}`
        );
      }
    })();
  }, ingestionIntervalMs);
  ingestionTimer.unref?.();

  const alertTimer = setInterval(() => {
    void (async () => {
      try {
        for (const organizationId of await organizationIds()) {
          const stories = await database.stories.list(
            { limit: maxStoriesPerSweep },
            organizationId
          );
          for (const story of stories) {
            await queue.enqueue('alerts.evaluate', {
              resourceType: 'STORY',
              resourceId: story.id,
              organizationId,
            });
          }
        }
      } catch (err: unknown) {
        logger.error(
          `Scheduled alert sweep failed: ${err instanceof Error ? err.message : String(err)}`
        );
      }
    })();
  }, alertIntervalMs);
  alertTimer.unref?.();

  logger.info(
    `Scheduler started: ingestion every ${ingestionIntervalMs / 60000}m, alerts every ${alertIntervalMs / 60000}m`
  );

  return () => {
    clearInterval(ingestionTimer);
    clearInterval(alertTimer);
  };
}

export async function bootstrap() {
  logger.info('Starting Background Worker Service...');
  const workerService = new WorkerService(defaultQueue, defaultDatabase);
  const stopScheduler = startScheduler(workerService, defaultDatabase);
  logger.info('Worker handlers registered and listening for jobs.');
  return { workerService, stopScheduler };
}

if (require.main === module) {
  // The worker has no listening socket. A ref'd timer keeps the process alive
  // even when Redis is absent (memory fallback), and gives Ctrl+C something to
  // interrupt cleanly on Windows and Termux alike.
  const keepAlive = setInterval(() => undefined, 60_000);

  bootstrap()
    .then(({ stopScheduler }) => {
      let shuttingDown = false;
      const signals: NodeJS.Signals[] = ['SIGINT', 'SIGTERM', 'SIGBREAK'];
      for (const signal of signals) {
        process.once(signal, async () => {
          if (shuttingDown) return;
          shuttingDown = true;
          logger.info(`Received ${signal}. Shutting down background worker...`);
          clearInterval(keepAlive);
          stopScheduler();
          try {
            await bullQueue.closeAll();
            await defaultQueue.disconnect();
            await prismaManager.disconnect();
            process.exit(0);
          } catch (err: unknown) {
            logger.error(
              `Error during worker shutdown: ${err instanceof Error ? err.message : String(err)}`
            );
            process.exit(1);
          }
        });
      }
    })
    .catch((err) => {
      clearInterval(keepAlive);
      logger.error(`Worker startup failed: ${err.message}`, err);
      process.exit(1);
    });
}
