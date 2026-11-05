import type { AuthorizationCodeEntry } from './oauth.service';

export interface AuthorizationCodeStore {
  set(entry: AuthorizationCodeEntry): Promise<void>;
  get(code: string): Promise<AuthorizationCodeEntry | null>;
  /** Atomically remove and return the entry (single-use enforcement). */
  consume(code: string): Promise<AuthorizationCodeEntry | null>;
  delete(code: string): Promise<void>;
  cleanup(): Promise<void>;
}

const KEY_PREFIX = 'oauth:code:';

export class MemoryAuthorizationCodeStore implements AuthorizationCodeStore {
  private codes = new Map<string, AuthorizationCodeEntry>();

  async set(entry: AuthorizationCodeEntry): Promise<void> {
    this.codes.set(entry.code, entry);
  }

  async get(code: string): Promise<AuthorizationCodeEntry | null> {
    return this.codes.get(code) || null;
  }

  async consume(code: string): Promise<AuthorizationCodeEntry | null> {
    const entry = this.codes.get(code) || null;
    this.codes.delete(code);
    return entry;
  }

  async delete(code: string): Promise<void> {
    this.codes.delete(code);
  }

  async cleanup(): Promise<void> {
    const now = Date.now();
    for (const [code, entry] of this.codes.entries()) {
      if (entry.expiresAt <= now) this.codes.delete(code);
    }
  }
}

interface RedisLike {
  status?: string;
  connect?: () => Promise<unknown>;
  set(key: string, value: string, ...args: Array<string | number>): Promise<unknown>;
  get(key: string): Promise<string | null>;
  del(key: string): Promise<unknown>;
  getdel?: (key: string) => Promise<string | null>;
  scanStream?: (options: { match: string; count: number }) => AsyncIterable<string[]>;
  quit?: () => Promise<unknown>;
}

/**
 * Redis-backed authorization codes.
 *
 * Codes are short-lived (5 minutes), so they are stored with a matching TTL.
 * A multi-instance API deployment can therefore issue a code on one replica
 * and exchange it on another.
 */
export class RedisAuthorizationCodeStore implements AuthorizationCodeStore {
  private client: RedisLike | null = null;
  private readonly fallback = new MemoryAuthorizationCodeStore();

  constructor(private readonly redisUrl: string) {}

  private async getClient(): Promise<RedisLike | null> {
    if (this.client) return this.client;
    try {
      const mod = (await import('ioredis')) as unknown as {
        default: new (url: string, options?: Record<string, unknown>) => RedisLike;
      };
      this.client = new mod.default(this.redisUrl, {
        // Authorization codes are short-lived; a slow/unreachable Redis must
        // not stall the token endpoint. Fail over to the local store instead.
        maxRetriesPerRequest: 1,
        enableOfflineQueue: false,
        lazyConnect: true,
        retryStrategy: () => null,
      });
      if (this.client.status === 'wait' && this.client.connect) {
        await this.client.connect();
      }
      return this.client;
    } catch {
      return null;
    }
  }

  private key(code: string): string {
    return `${KEY_PREFIX}${code}`;
  }

  async set(entry: AuthorizationCodeEntry): Promise<void> {
    try {
      const client = await this.getClient();
      if (!client) throw new Error('Redis unavailable');
      const ttl = Math.max(1, entry.expiresAt - Date.now());
      await client.set(this.key(entry.code), JSON.stringify(entry), 'PX', ttl);
    } catch {
      await this.fallback.set(entry);
    }
  }

  async get(code: string): Promise<AuthorizationCodeEntry | null> {
    try {
      const client = await this.getClient();
      if (!client) throw new Error('Redis unavailable');
      const raw = await client.get(this.key(code));
      return raw ? (JSON.parse(raw) as AuthorizationCodeEntry) : null;
    } catch {
      return this.fallback.get(code);
    }
  }

  async consume(code: string): Promise<AuthorizationCodeEntry | null> {
    try {
      const client = await this.getClient();
      if (!client) throw new Error('Redis unavailable');
      if (client.getdel) {
        const raw = await client.getdel(this.key(code));
        return raw ? (JSON.parse(raw) as AuthorizationCodeEntry) : null;
      }
      const raw = await client.get(this.key(code));
      if (!raw) return null;
      await client.del(this.key(code));
      return JSON.parse(raw) as AuthorizationCodeEntry;
    } catch {
      return this.fallback.consume(code);
    }
  }

  async delete(code: string): Promise<void> {
    try {
      const client = await this.getClient();
      if (client) await client.del(this.key(code));
    } catch {
      // Fall through to the local store.
    }
    await this.fallback.delete(code);
  }

  async cleanup(): Promise<void> {
    await this.fallback.cleanup();
  }
}

export function createAuthorizationCodeStore(): AuthorizationCodeStore {
  const redisUrl = process.env.REDIS_URL;
  if (redisUrl && process.env.NODE_ENV !== 'test') {
    return new RedisAuthorizationCodeStore(redisUrl);
  }
  return new MemoryAuthorizationCodeStore();
}
