import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DatabaseService } from '@ai-news/database';
import {
  CollaborationService,
  MemoryDistributedLockStore,
  RedisDistributedLockStore,
} from '../../../libs/stories/src/collaboration.service';

describe('Distributed Lock Store Unit Tests', () => {
  let db: DatabaseService;
  const user1 = { id: 'usr_sarah', name: 'Sarah Connor', clientType: 'human_web', role: 'editor' };
  const user2 = { id: 'usr_john', name: 'John Connor', clientType: 'human_web', role: 'journalist' };
  const storyId = 'sty_lock_test_1';

  beforeEach(async () => {
    db = new DatabaseService({ memory: true });
    await db.initialize();
    await db.stories.create({
      id: storyId,
      slug: 'lock-test-slug',
      title: 'Distributed Lock Story',
      summary: 'Testing distributed locks across instances',
      status: 'DRAFT',
      articleType: 'breaking_news',
      authorId: user1.id,
      organizationId: 'org_default',
      blocks: [],
      currentVersionNumber: 1,
      createdVia: 'web',
      createdByClient: 'human_web',
      topicIds: [],
      entityIds: [],
      sourceIds: [],
      readingTimeMinutes: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  });

  describe('MemoryDistributedLockStore', () => {
    it('acquires, prevents collision, and releases lock', async () => {
      const lockStore = new MemoryDistributedLockStore();
      const service = new CollaborationService(db, lockStore);

      const acquire1 = await service.acquireLock(storyId, user1, 60);
      expect(acquire1.success).toBe(true);
      expect(acquire1.lock?.lockedBy.id).toBe(user1.id);

      // User 2 cannot acquire while held by User 1
      const acquire2 = await service.acquireLock(storyId, user2, 60);
      expect(acquire2.success).toBe(false);
      expect(acquire2.heldBy?.id).toBe(user1.id);

      // User 1 releases
      const released = await service.releaseLock(storyId, user1.id);
      expect(released).toBe(true);

      // User 2 can now acquire
      const acquireAgain = await service.acquireLock(storyId, user2, 60);
      expect(acquireAgain.success).toBe(true);
      expect(acquireAgain.lock?.lockedBy.id).toBe(user2.id);
    });
  });

  describe('RedisDistributedLockStore', () => {
    it('persists and retrieves locks using simulated Redis client commands', async () => {
      const redisStorage = new Map<string, string>();
      const mockRedisClient = {
        get: vi.fn(async (key: string) => redisStorage.get(key) || null),
        set: vi.fn(async (key: string, val: string) => {
          redisStorage.set(key, val);
          return 'OK';
        }),
        del: vi.fn(async (key: string) => {
          const existed = redisStorage.delete(key);
          return existed ? 1 : 0;
        }),
      };

      const redisStore = new RedisDistributedLockStore(mockRedisClient);
      const service = new CollaborationService(db, redisStore);

      const res = await service.acquireLock(storyId, user1, 120);
      expect(res.success).toBe(true);
      expect(mockRedisClient.set).toHaveBeenCalled();

      // Check simulated Redis storage
      const redisKey = `gp:lock:story:${storyId}`;
      expect(redisStorage.has(redisKey)).toBe(true);

      // Collision check
      const resCollision = await service.acquireLock(storyId, user2, 120);
      expect(resCollision.success).toBe(false);
      expect(resCollision.heldBy?.id).toBe(user1.id);

      // Release
      const released = await service.releaseLock(storyId, user1.id);
      expect(released).toBe(true);
      expect(redisStorage.has(redisKey)).toBe(false);
    });
  });
});
