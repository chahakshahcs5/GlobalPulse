import type { IdempotencyRecord } from '@ai-news/schemas';
import type { IIdempotencyRepository } from '../../interfaces/idempotency.repository';

export class MemoryIdempotencyRepository implements IIdempotencyRepository {
  private records = new Map<string, IdempotencyRecord>();
  public static readonly DEFAULT_TTL_SECONDS = 86400; // 24 hours

  private makeKey(key: string, orgId: string): string {
    return `${orgId}:${key}`;
  }

  async get(key: string, orgId: string): Promise<IdempotencyRecord | null> {
    const fullKey = this.makeKey(key, orgId);
    const record = this.records.get(fullKey);
    if (!record) return null;

    // Check TTL expiration
    if (record.expiresAt && new Date(record.expiresAt).getTime() <= Date.now()) {
      this.records.delete(fullKey);
      return null;
    }

    return { ...record };
  }

  async save(record: IdempotencyRecord, ttlSeconds: number = MemoryIdempotencyRepository.DEFAULT_TTL_SECONDS): Promise<void> {
    const expiresAt = record.expiresAt || new Date(Date.now() + ttlSeconds * 1000).toISOString();
    this.records.set(this.makeKey(record.key, record.organizationId), {
      ...record,
      expiresAt,
    });
  }

  async delete(key: string, orgId: string): Promise<boolean> {
    return this.records.delete(this.makeKey(key, orgId));
  }

  async pruneExpired(): Promise<number> {
    const now = Date.now();
    let prunedCount = 0;
    for (const [key, record] of this.records.entries()) {
      if (record.expiresAt && new Date(record.expiresAt).getTime() <= now) {
        this.records.delete(key);
        prunedCount++;
      }
    }
    return prunedCount;
  }

  snapshot(): Map<string, IdempotencyRecord> {
    return new Map(Array.from(this.records.entries()).map(([k, v]) => [k, { ...v }]));
  }

  restore(snapshot: Map<string, IdempotencyRecord>): void {
    this.records = new Map(Array.from(snapshot.entries()).map(([k, v]) => [k, { ...v }]));
  }

  clear(): void {
    this.records.clear();
  }
}
