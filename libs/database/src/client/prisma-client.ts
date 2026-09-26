import { logger } from '@ai-news/observability';

export interface DatabasePoolConfig {
  maxConnections?: number;
  idleTimeoutMs?: number;
  connectionTimeoutMs?: number;
}

export class PrismaClientManager {
  private static instance: PrismaClientManager | null = null;
  private isConnected: boolean = false;
  private client: any = null;

  private constructor() {}

  public static getInstance(): PrismaClientManager {
    if (!PrismaClientManager.instance) {
      PrismaClientManager.instance = new PrismaClientManager();
    }
    return PrismaClientManager.instance;
  }

  public async getClient(): Promise<any> {
    if (this.client && this.isConnected) {
      return this.client;
    }

    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      logger.debug('No DATABASE_URL configured; running in headless memory mode.');
      return null;
    }

    try {
      // Dynamic import to prevent hard failure if prisma client is not yet generated
      const { PrismaClient } = await import('@prisma/client').catch(() => ({ PrismaClient: null }));
      if (!PrismaClient) {
        logger.warn('@prisma/client not generated; falling back to memory repository.');
        return null;
      }

      this.client = new PrismaClient({
        log: [
          { level: 'error', emit: 'stdout' },
          { level: 'warn', emit: 'stdout' },
        ],
      });

      await this.client.$connect();
      this.isConnected = true;
      logger.info('Connected to PostgreSQL database via PrismaClient.');
      return this.client;
    } catch (err: any) {
      logger.warn(`Failed to connect to database: ${err.message}. Operating in memory mode.`);
      this.isConnected = false;
      this.client = null;
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
      } catch (err: any) {
        logger.error(`Error disconnecting PrismaClient: ${err.message}`, err);
      }
    }
  }

  public getConnected(): boolean {
    return this.isConnected;
  }
}

export const prismaManager = PrismaClientManager.getInstance();
