import { logger } from '@ai-news/observability';
import type { PrismaClient } from '../../generated/client';

export interface DatabasePoolConfig {
  maxConnections?: number;
  idleTimeoutMs?: number;
  connectionTimeoutMs?: number;
}

export class PrismaClientManager {
  private static instance: PrismaClientManager | null = null;
  private isConnected: boolean = false;
  private client: PrismaClient | null = null;
  private pool: import('pg').Pool | null = null;

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

    // Dynamic import so a deployment that only uses the in-memory engine does
    // not pay the cost of loading the generated query compiler.
    const { PrismaClient: PrismaClientCtor } = await import('../../generated/client').catch(() => ({
      PrismaClient: null,
    }));
    if (!PrismaClientCtor) {
      if (requiresPrisma) {
        throw new Error(
          'The committed Prisma client is missing. On a development machine run "pnpm db:generate" and commit libs/database/generated/client.'
        );
      }
      logger.warn('Prisma client not generated; falling back to memory repository.');
      return null;
    }

    let pool: import('pg').Pool | null = null;
    try {
      const [{ PrismaPg }, { Pool }] = await Promise.all([
        import('@prisma/adapter-pg'),
        import('pg'),
      ]);
      // Prisma runs through the pure-JavaScript `pg` driver and the WASM query
      // compiler. No native Prisma engine and no platform-specific binary is
      // needed, which is what lets the same build run on Windows and Termux.
      pool = new Pool({ connectionString: databaseUrl });
      this.pool = pool;
      const adapter = new PrismaPg(pool);

      const instance = new PrismaClientCtor({
        adapter,
        log: [
          { level: 'error', emit: 'stdout' },
          { level: 'warn', emit: 'stdout' },
        ],
      }) as PrismaClient;

      await instance.$connect();
      this.client = instance;
      this.isConnected = true;
      logger.info('Connected to PostgreSQL database via Prisma driver adapter.');
      return this.client;
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      this.isConnected = false;
      this.client = null;
      if (pool) {
        await pool.end().catch(() => undefined);
        this.pool = null;
      }
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

    if (this.pool) {
      try {
        await this.pool.end();
      } catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message : String(err);
        logger.error(`Error closing PostgreSQL pool: ${errMsg}`);
      }
      this.pool = null;
    }
  }

  public isDatabaseConnected(): boolean {
    return this.isConnected;
  }
}

export const prismaManager = PrismaClientManager.getInstance();
