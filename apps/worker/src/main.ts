import { defaultQueue } from '@ai-news/jobs';
import { logger } from '@ai-news/observability';
import { WorkerService } from './worker.service';

export async function bootstrap() {
  logger.info('Starting Background Worker Service...');
  const workerService = new WorkerService(defaultQueue);
  logger.info('Worker handlers registered and listening for jobs.');
  return workerService;
}

if (require.main === module) {
  bootstrap().catch((err) => {
    logger.error(`Worker startup failed: ${err.message}`, err);
    process.exit(1);
  });
}
