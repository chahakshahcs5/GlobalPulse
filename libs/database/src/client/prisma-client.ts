import { logger } from '@ai-news/observability';
import type { PrismaClient } from '@prisma/client';

export interface DatabasePoolConfig {
  maxConnections?: number;
  idleTimeoutMs?: number;
  connectionTimeoutMs?: number;
}

export class PrismaClientManager {
  private static instance: PrismaClientManager | null = null;
  private isConnected: boolean = false;
  private client: PrismaClient | null = null;

  private constructor() {}

  public static getInstance(): PrismaClientManager {
    if (!PrismaClientManager.instance) {
      PrismaClientManager.instance = new PrismaClientManager();
    }
    return PrismaClientManager.instance;
  }

  public async getClient(): Promise<PrismaClient | null> {
    if (this.client && this.isConnected) {
      return this.client;
    }

    if (process.env.DATABASE_ENGINE === 'memory') {
      return null;
    }

    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      logger.debug('No DATABASE_URL configured; running in headless memory mode.');
      return null;
    }

    const requiresPrisma =
      process.env.DATABASE_ENGINE === 'prisma' ||
      (process.env.NODE_ENV === 'production' && process.env.DATABASE_ENGINE !== 'memory');

    // Dynamic import to prevent hard failure if prisma client is not yet generated
    const { PrismaClient: PrismaClientCtor } = await import('@prisma/client').catch(() => ({
      PrismaClient: null,
    }));
    if (!PrismaClientCtor) {
      if (requiresPrisma) {
        throw new Error(
          '@prisma/client is not generated. In production or prisma mode, run "prisma generate" to generate database client bindings.'
        );
      }
      logger.warn('@prisma/client not generated; falling back to memory repository.');
      return null;
    }

    try {
      const instance = new PrismaClientCtor({
        log: [
          { level: 'error', emit: 'stdout' },
          { level: 'warn', emit: 'stdout' },
        ],
      }) as PrismaClient;

      await instance.$connect();
      this.client = instance;
      this.isConnected = true;
      logger.info('Connected to PostgreSQL database via PrismaClient.');
      return this.client;
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      this.isConnected = false;
      this.client = null;
      if (requiresPrisma) {
        throw new Error(`Failed to connect to database in prisma/production mode: ${errMsg}`);
      }
      logger.warn(`Failed to connect to database: ${errMsg}. Operating in memory mode.`);
      return null;
    }
  }

  public async disconnect(): Promise<void> {
    if (this.client && this.isConnected) {
      try {
        await this.client.$disconnect();
        this.isConnected = false;
        this.client = null;
        logger.info('Disconnected from PostgreSQL database.');
      } catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message : String(err);
        logger.error(
          `Error disconnecting PrismaClient: ${errMsg}`,
          err instanceof Error ? err : undefined
        );
      }
    }
  }

  public isDatabaseConnected(): boolean {
    return this.isConnected;
  }
}

export const prismaManager = PrismaClientManager.getInstance();
