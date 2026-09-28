import { describe, it, expect, beforeEach } from 'vitest';
import { MemoryStoryRepository } from '../../../libs/database/src/repositories/memory/story.memory';
import { StoryService } from '../../../libs/stories/src/story.service';
import { DatabaseService } from '../../../libs/database/src/database.service';
import { encodeCursor, decodeCursor } from '../../../libs/shared/src/index';
import type { Story } from '@ai-news/schemas';

describe('API & Repository Pagination (Cursor & Offset)', () => {
  describe('encodeCursor & decodeCursor utilities', () => {
    it('correctly encodes and decodes cursor tokens', () => {
      const original = { updatedAt: '2026-09-28T12:00:00.000Z', id: 'sty_test_123' };
      const token = encodeCursor(original);
      expect(typeof token).toBe('string');
      expect(token.length).toBeGreaterThan(0);

      const decoded = decodeCursor(token);
      expect(decoded).not.toBeNull();
      expect(decoded?.id).toBe(original.id);
      expect(decoded?.updatedAt).toBe(original.updatedAt);
    });

    it('gracefully handles raw id as cursor fallback', () => {
      const decoded = decodeCursor('sty_raw_id_fallback');
      expect(decoded).not.toBeNull();
      expect(decoded?.id).toBe('sty_raw_id_fallback');
    });

    it('returns null for empty or null cursor', () => {
      expect(decodeCursor('')).toBeNull();
      expect(decodeCursor(null as any)).toBeNull();
    });
  });

  describe('MemoryStoryRepository Pagination', () => {
    let repo: MemoryStoryRepository;
    const testStories: Story[] = [];

    beforeEach(async () => {
      repo = new MemoryStoryRepository();
      testStories.length = 0;

      // Seed 10 stories with distinct timestamps
      for (let i = 1; i <= 10; i++) {
        const story: Story = {
          id: `sty_page_${String(i).padStart(2, '0')}`,
          organizationId: 'org_default',
          slug: `story-page-${i}`,
          title: `Pagination Story ${i}`,
          summary: `Summary of story ${i}`,
          status: 'PUBLISHED',
          articleType: 'technology',
          currentVersionNumber: 1,
          currentVersionId: `ver_${i}`,
          topicIds: ['top_tech'],
          entityIds: [],
          sourceIds: [],
          blocks: [],
          createdVia: 'api',
          createdByClient: 'human_web',
          authorId: 'usr_editor',
          createdAt: new Date(Date.now() - (10 - i) * 60000).toISOString(),
          updatedAt: new Date(Date.now() - (10 - i) * 60000).toISOString(),
          publishedAt: new Date(Date.now() - (10 - i) * 60000).toISOString(),
        };
        await repo.create(story);
        testStories.push(story);
      }
    });

    it('paginates using limit and offset correctly', async () => {
      const page1 = await repo.listPaginated({ limit: 4, offset: 0 }, 'org_default');
      expect(page1.total).toBe(10);
      expect(page1.items).toHaveLength(4);
      expect(page1.hasMore).toBe(true);

      const page2 = await repo.listPaginated({ limit: 4, offset: 4 }, 'org_default');
      expect(page2.total).toBe(10);
      expect(page2.items).toHaveLength(4);
      expect(page2.hasMore).toBe(true);

      // Verify no overlapping items between page 1 and page 2
      const page1Ids = page1.items.map((s) => s.id);
      const page2Ids = page2.items.map((s) => s.id);
      const intersection = page1Ids.filter((id) => page2Ids.includes(id));
      expect(intersection).toHaveLength(0);

      // Page 3: last 2 items
      const page3 = await repo.listPaginated({ limit: 4, offset: 8 }, 'org_default');
      expect(page3.items).toHaveLength(2);
      expect(page3.hasMore).toBe(false);
    });

    it('paginates sequentially using cursor navigation', async () => {
      // Fetch first page
      const page1 = await repo.listPaginated({ limit: 3 }, 'org_default');
      expect(page1.items).toHaveLength(3);
      expect(page1.hasMore).toBe(true);
      expect(page1.nextCursor).toBeDefined();

      // Fetch second page using nextCursor
      const page2 = await repo.listPaginated({ limit: 3, cursor: page1.nextCursor }, 'org_default');
      expect(page2.items).toHaveLength(3);
      expect(page2.hasMore).toBe(true);
      expect(page2.nextCursor).toBeDefined();

      // Ensure no duplicates between page 1 and page 2
      const page1Ids = new Set(page1.items.map((s) => s.id));
      for (const item of page2.items) {
        expect(page1Ids.has(item.id)).toBe(false);
      }

      // Fetch third page
      const page3 = await repo.listPaginated({ limit: 3, cursor: page2.nextCursor }, 'org_default');
      expect(page3.items).toHaveLength(3);
      expect(page3.hasMore).toBe(true);

      // Fetch final fourth page
      const page4 = await repo.listPaginated({ limit: 3, cursor: page3.nextCursor }, 'org_default');
      expect(page4.items).toHaveLength(1);
      expect(page4.hasMore).toBe(false);
      expect(page4.nextCursor).toBeUndefined();
    });

    it('works with StoryService.listStoriesPaginated and filters', async () => {
      const dbService = new DatabaseService({ engine: 'memory' });
      const storyService = new StoryService(dbService);

      // Create a draft story
      await storyService.createStory(
        {
          title: 'Draft Special Investigation',
          summary: 'In depth investigation in progress',
          articleType: 'deep_dive',
        },
        {
          organizationId: 'org_default',
          authorId: 'usr_reporter',
          clientType: 'human_web',
          createdVia: 'api',
        }
      );

      const paginated = await storyService.listStoriesPaginated({ limit: 5 }, 'org_default');
      expect(paginated.items.length).toBeGreaterThan(0);
      expect(paginated.total).toBeGreaterThan(0);

      // Filter by articleType
      const filtered = await storyService.listStoriesPaginated(
        { articleType: 'deep_dive', limit: 5 },
        'org_default'
      );
      expect(filtered.items).toHaveLength(1);
      expect(filtered.items[0].title).toBe('Draft Special Investigation');
      expect(filtered.hasMore).toBe(false);
    });
  });
});
