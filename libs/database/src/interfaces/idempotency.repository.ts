import type { IdempotencyRecord } from '@ai-news/schemas';

export interface IIdempotencyRepository {
  get(key: string, orgId: string): Promise<IdempotencyRecord | null>;
  save(record: IdempotencyRecord, ttlSeconds?: number): Promise<void>;
  delete(key: string, orgId: string): Promise<boolean>;
  pruneExpired(): Promise<number>;
}
