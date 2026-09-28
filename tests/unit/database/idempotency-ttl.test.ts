import { describe, it, expect, beforeEach } from 'vitest';
import { MemoryIdempotencyRepository } from '@ai-news/database';
import type { IdempotencyRecord } from '@ai-news/schemas';

describe('Idempotency Repository TTL & Expiration', () => {
  let repo: MemoryIdempotencyRepository;

  beforeEach(() => {
    repo = new MemoryIdempotencyRepository();
  });

  it('saves an idempotency record with default 24-hour TTL when expiresAt is not provided', async () => {
    const record: IdempotencyRecord = {
      id: 'idemp_1',
      organizationId: 'org_test',
      key: 'key-100',
      action: 'create_story',
      responseJson: { status: 'ok', storyId: 'sty_1' },
      createdAt: new Date().toISOString(),
    };

    await repo.save(record);
    const retrieved = await repo.get('key-100', 'org_test');

    expect(retrieved).not.toBeNull();
    expect(retrieved?.key).toBe('key-100');
    expect(retrieved?.expiresAt).toBeDefined();

    const expiresTime = new Date(retrieved!.expiresAt!).getTime();
    const createdTime = new Date(record.createdAt).getTime();
    // Default TTL is 86400s (24h)
    expect(expiresTime - createdTime).toBeGreaterThanOrEqual(86300 * 1000);
  });

  it('honors custom ttlSeconds when saving', async () => {
    const record: IdempotencyRecord = {
      id: 'idemp_2',
      organizationId: 'org_test',
      key: 'key-short-ttl',
      action: 'update_block',
      responseJson: { updated: true },
      createdAt: new Date().toISOString(),
    };

    // 60 seconds TTL
    await repo.save(record, 60);
    const retrieved = await repo.get('key-short-ttl', 'org_test');

    expect(retrieved).not.toBeNull();
    const expiresTime = new Date(retrieved!.expiresAt!).getTime();
    const createdTime = new Date(record.createdAt).getTime();
    expect(expiresTime - createdTime).toBeLessThanOrEqual(61 * 1000);
  });

  it('returns null and automatically deletes record once expired', async () => {
    const pastTime = new Date(Date.now() - 5000).toISOString(); // 5 seconds in the past
    const record: IdempotencyRecord = {
      id: 'idemp_expired',
      organizationId: 'org_test',
      key: 'key-expired',
      action: 'publish_story',
      responseJson: { status: 'published' },
      createdAt: new Date(Date.now() - 10000).toISOString(),
      expiresAt: pastTime,
    };

    await repo.save(record);

    // Should return null and self-evict
    const retrieved = await repo.get('key-expired', 'org_test');
    expect(retrieved).toBeNull();

    // Verify it was deleted from storage
    const secondFetch = await repo.get('key-expired', 'org_test');
    expect(secondFetch).toBeNull();
  });

  it('pruneExpired correctly sweeps and removes all expired records in batch', async () => {
    const pastTime = new Date(Date.now() - 1000).toISOString();
    const futureTime = new Date(Date.now() + 60000).toISOString();

    await repo.save({
      id: 'idemp_exp_1',
      organizationId: 'org_test',
      key: 'exp-1',
      action: 'action_1',
      responseJson: {},
      createdAt: new Date().toISOString(),
      expiresAt: pastTime,
    });

    await repo.save({
      id: 'idemp_exp_2',
      organizationId: 'org_test',
      key: 'exp-2',
      action: 'action_2',
      responseJson: {},
      createdAt: new Date().toISOString(),
      expiresAt: pastTime,
    });

    await repo.save({
      id: 'idemp_act_1',
      organizationId: 'org_test',
      key: 'act-1',
      action: 'action_3',
      responseJson: {},
      createdAt: new Date().toISOString(),
      expiresAt: futureTime,
    });

    const prunedCount = await repo.pruneExpired();
    expect(prunedCount).toBe(2);

    expect(await repo.get('exp-1', 'org_test')).toBeNull();
    expect(await repo.get('exp-2', 'org_test')).toBeNull();
    expect(await repo.get('act-1', 'org_test')).not.toBeNull();
  });
});
