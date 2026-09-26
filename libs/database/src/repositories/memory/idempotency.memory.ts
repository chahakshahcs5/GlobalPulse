import type { IdempotencyRecord } from '@ai-news/schemas';
import type { IIdempotencyRepository } from '../../interfaces/idempotency.repository';

export class MemoryIdempotencyRepository implements IIdempotencyRepository {
  private records = new Map<string, IdempotencyRecord>();

  private makeKey(key: string, orgId: string): string {
    return `${orgId}:${key}`;
  }

  async get(key: string, orgId: string): Promise<IdempotencyRecord | null> {
    const record = this.records.get(this.makeKey(key, orgId));
    if (!record) return null;
    return { ...record };
  }

  async save(record: IdempotencyRecord): Promise<void> {
    this.records.set(this.makeKey(record.key, record.organizationId), { ...record });
  }

  async delete(key: string, orgId: string): Promise<boolean> {
    return this.records.delete(this.makeKey(key, orgId));
  }

  clear(): void {
    this.records.clear();
  }
}
