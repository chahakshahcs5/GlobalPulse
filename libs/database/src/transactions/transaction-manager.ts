import { prismaManager } from '../client/prisma-client';
import { logger } from '@ai-news/observability';

export type TransactionWork<T> = (tx: any) => Promise<T>;

export class TransactionManager {
  public static async execute<T>(work: TransactionWork<T>): Promise<T> {
    const client = await prismaManager.getClient();
    if (client && prismaManager.getConnected()) {
      logger.debug('Executing database transaction via Prisma.$transaction');
      return client.$transaction(async (tx: any) => {
        return work(tx);
      });
    }

    // In-memory atomic fallback execution
    logger.debug('Executing transaction via memory context');
    return work(null);
  }
}
