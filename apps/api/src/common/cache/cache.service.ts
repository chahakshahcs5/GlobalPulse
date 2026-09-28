import Redis from 'ioredis';
import { createLogger } from '@ai-news/observability';

const logger = createLogger('cache-service');

interface CacheEntry {
  value: string;
  expiresAt: number;
}

export class CacheService {
  private redis: Redis | null = null;
  private isRedisConnected = false;
  private memoryCache = new Map<string, CacheEntry>();
  private sweepTimer: NodeJS.Timeout | null = null;

  constructor(redisUrl?: string) {
    const targetUrl = redisUrl || process.env.REDIS_URL;

    if (targetUrl && process.env.NODE_ENV !== 'test') {
      try {
        this.redis = new Redis(targetUrl, {
          connectTimeout: 2000,
          maxRetriesPerRequest: 1,
          lazyConnect: true,
          retryStrategy: (times) => (times > 3 ? null : Math.min(times * 100, 1000)),
        });

        this.redis.on('connect', () => {
          this.isRedisConnected = true;
          logger.info(
            `Redis cache connected successfully at ${targetUrl.replace(/:[^:@]*@/, ':****@')}`
          );
        });

        this.redis.on('error', (err) => {
          this.isRedisConnected = false;
          logger.debug(`Redis cache error (${err.message}). Running in resilient in-memory mode.`);
        });

        this.redis.connect().catch((err) => {
          this.isRedisConnected = false;
          logger.debug(`Initial Redis connection deferred: ${err.message}`);
        });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        logger.debug(`Redis initialization skipped: ${msg}`);
      }
    }

    // Periodically sweep expired entries from memory cache
    this.sweepTimer = setInterval(() => {
      this.sweepMemoryCache();
    }, 60000);
    if (this.sweepTimer.unref) {
      this.sweepTimer.unref();
    }
  }

  private sweepMemoryCache(): void {
    const now = Date.now();
    for (const [key, entry] of this.memoryCache.entries()) {
      if (entry.expiresAt <= now) {
        this.memoryCache.delete(key);
      }
    }
  }

  async get<T>(key: string): Promise<T | null> {
    if (this.isRedisConnected && this.redis) {
      try {
        const raw = await this.redis.get(key);
        return raw ? (JSON.parse(raw) as T) : null;
      } catch (err: unknown) {
        logger.debug(
          `Redis get failed for key "${key}": ${err instanceof Error ? err.message : String(err)}`
        );
      }
    }

    // Fallback to in-memory store
    const entry = this.memoryCache.get(key);
    if (!entry) return null;
    if (entry.expiresAt <= Date.now()) {
      this.memoryCache.delete(key);
      return null;
    }
    try {
      return JSON.parse(entry.value) as T;
    } catch {
      return null;
    }
  }

  async set<T>(key: string, value: T, ttlSeconds: number = 300): Promise<void> {
    const serialized = JSON.stringify(value);

    if (this.isRedisConnected && this.redis) {
      try {
        await this.redis.set(key, serialized, 'EX', ttlSeconds);
        return;
      } catch (err: unknown) {
        logger.debug(
          `Redis set failed for key "${key}": ${err instanceof Error ? err.message : String(err)}`
        );
      }
    }

    // In-memory store fallback
    this.memoryCache.set(key, {
      value: serialized,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
  }

  async del(key: string): Promise<void> {
    if (this.isRedisConnected && this.redis) {
      try {
        await this.redis.del(key);
      } catch (err: unknown) {
        logger.debug(
          `Redis del failed for key "${key}": ${err instanceof Error ? err.message : String(err)}`
        );
      }
    }
    this.memoryCache.delete(key);
  }

  async delByPrefix(prefix: string): Promise<void> {
    if (this.isRedisConnected && this.redis) {
      try {
        const keys = await this.redis.keys(`${prefix}*`);
        if (keys.length > 0) {
          await this.redis.del(...keys);
        }
      } catch (err: unknown) {
        logger.debug(
          `Redis delByPrefix failed for "${prefix}": ${err instanceof Error ? err.message : String(err)}`
        );
      }
    }

    for (const key of this.memoryCache.keys()) {
      if (key.startsWith(prefix)) {
        this.memoryCache.delete(key);
      }
    }
  }

  async flush(): Promise<void> {
    if (this.isRedisConnected && this.redis) {
      try {
        await this.redis.flushdb();
      } catch (err: unknown) {
        logger.debug(`Redis flush failed: ${err instanceof Error ? err.message : String(err)}`);
      }
    }
    this.memoryCache.clear();
  }

  async ping(): Promise<{
    status: 'healthy' | 'degraded';
    latencyMs: number;
    mode: 'redis' | 'memory';
    connected: boolean;
  }> {
    const start = Date.now();
    if (this.isRedisConnected && this.redis) {
      try {
        const reply = await this.redis.ping();
        const latencyMs = Date.now() - start;
        return {
          status: reply === 'PONG' ? 'healthy' : 'degraded',
          latencyMs,
          mode: 'redis',
          connected: true,
        };
      } catch {
        return {
          status: 'degraded',
          latencyMs: Date.now() - start,
          mode: 'memory',
          connected: false,
        };
      }
    }

    return {
      status: 'healthy',
      latencyMs: Date.now() - start,
      mode: 'memory',
      connected: false,
    };
  }

  async disconnect(): Promise<void> {
    if (this.sweepTimer) {
      clearInterval(this.sweepTimer);
      this.sweepTimer = null;
    }
    if (this.redis) {
      try {
        await this.redis.quit();
      } catch {
        this.redis.disconnect();
      }
      this.redis = null;
      this.isRedisConnected = false;
    }
    this.memoryCache.clear();
  }
}

export const cacheService = new CacheService();
