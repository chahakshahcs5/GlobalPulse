import { prismaManager } from './prisma-client';

export interface DatabaseHealthStatus {
  status: 'connected' | 'memory_fallback' | 'error';
  engine: 'postgresql' | 'in_memory';
  latencyMs: number;
  databaseUrlConfigured: boolean;
  timestamp: string;
}

export async function checkDatabaseHealth(): Promise<DatabaseHealthStatus> {
  const hasUrl = Boolean(process.env.DATABASE_URL);
  const start = Date.now();

  if (process.env.DATABASE_ENGINE === 'memory') {
    return {
      status: 'memory_fallback',
      engine: 'in_memory',
      latencyMs: 0,
      databaseUrlConfigured: hasUrl,
      timestamp: new Date().toISOString(),
    };
  }

  try {
    const client = await prismaManager.getClient();
    if (client) {
      // Execute simple ping query
      await client.$queryRaw`SELECT 1`;
      return {
        status: 'connected',
        engine: 'postgresql',
        latencyMs: Date.now() - start,
        databaseUrlConfigured: hasUrl,
        timestamp: new Date().toISOString(),
      };
    }
  } catch {
    return {
      status: 'error',
      engine: 'in_memory',
      latencyMs: Date.now() - start,
      databaseUrlConfigured: hasUrl,
      timestamp: new Date().toISOString(),
    };
  }

  const requiresPrisma =
    process.env.DATABASE_ENGINE === 'prisma' ||
    (process.env.NODE_ENV === 'production' && process.env.DATABASE_ENGINE !== 'memory');

  return {
    status: requiresPrisma ? 'error' : 'memory_fallback',
    engine: 'in_memory',
    latencyMs: Date.now() - start,
    databaseUrlConfigured: hasUrl,
    timestamp: new Date().toISOString(),
  };
}
