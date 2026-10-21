import { describe, it, expect, expectTypeOf } from 'vitest';
import {
  StorySummarySchema,
  StoryCollectionWithStoriesSchema,
  KanbanBoardSchema,
  CalendarScheduleSchema,
  FullCoverageResultSchema,
  toStorySummary,
  toStorySummaries,
  type Story,
  type StorySummary,
} from '@ai-news/schemas';

/**
 * Summary payloads carry story *summaries*, not full stories.
 *
 * A listing, board, calendar, collection or cluster summary can hold dozens
 * of stories at once. Embedding the full story — and therefore the whole
 * story-block union — in each of them makes the inferred type of the
 * containing schema grow with every block type the platform adds, until
 * TypeScript refuses to serialize it.
 *
 * These tests are the regression guard for that: if anyone re-embeds the full
 * story schema, the blocks come back and the test fails.
 */
describe('Story summaries', () => {
  const fullStory: Story = {
    id: 'sty_1',
    organizationId: 'org_1',
    slug: 'a-story',
    title: 'A story',
    summary: 'A summary',
    status: 'PUBLISHED',
    articleType: 'breaking_news',
    currentVersionNumber: 1,
    topicIds: [],
    entityIds: [],
    sourceIds: [],
    categories: [],
    blocks: [
      {
        id: 'blk_1',
        blockType: 'paragraph',
        sortOrder: 0,
        data: { text: 'The body of the story.', format: 'markdown' },
      },
    ],
    createdVia: 'api',
    createdByClient: 'human_web',
    authorId: 'usr_1',
    idempotencyKey: 'key-1',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  };

  describe('the summary type', () => {
    it('has no blocks', () => {
      expectTypeOf<StorySummary>().not.toHaveProperty('blocks');
    });

    it('has no idempotency key', () => {
      expectTypeOf<StorySummary>().not.toHaveProperty('idempotencyKey');
    });

    it('keeps the fields a listing needs', () => {
      const summary = toStorySummary(fullStory);
      expect(summary.id).toBe('sty_1');
      expect(summary.title).toBe('A story');
      expect(summary.summary).toBe('A summary');
      expect(summary.slug).toBe('a-story');
      expect(summary.status).toBe('PUBLISHED');
      expect(summary.articleType).toBe('breaking_news');
      expect(summary.publishedAt).toBeUndefined();
    });

    it('strips the blocks and the idempotency key', () => {
      const summary = toStorySummary(fullStory);
      expect(summary).not.toHaveProperty('blocks');
      expect(summary).not.toHaveProperty('idempotencyKey');
    });

    it('maps a list of stories', () => {
      const summaries = toStorySummaries([fullStory, fullStory]);
      expect(summaries).toHaveLength(2);
      expect(summaries[0]).not.toHaveProperty('blocks');
    });

    it('strips the blocks even when a full story is parsed through it', () => {
      const parsed = StorySummarySchema.parse(fullStory);
      expect(parsed).not.toHaveProperty('blocks');
    });
  });

  describe('summary payloads', () => {
    it('a collection carries summaries, not full stories', () => {
      const parsed = StoryCollectionWithStoriesSchema.parse({
        id: 'col_1',
        name: 'Reading list',
        slug: 'reading-list',
        curatorId: 'usr_1',
        isPublic: true,
        storyIds: ['sty_1'],
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
        stories: [fullStory],
      });

      expect(parsed.stories).toHaveLength(1);
      expect(parsed.stories[0]).not.toHaveProperty('blocks');
      expect(parsed.stories[0].title).toBe('A story');
    });

    it('a kanban board carries summaries, not full stories', () => {
      const parsed = KanbanBoardSchema.parse({
        columns: {
          DRAFT: [fullStory],
          IN_REVIEW: [],
          SCHEDULED: [],
          PUBLISHED: [],
          ARCHIVED: [],
        },
        totalCount: 1,
      });

      expect(parsed.columns.DRAFT[0]).not.toHaveProperty('blocks');
    });

    it('the editorial calendar carries summaries, not full stories', () => {
      const parsed = CalendarScheduleSchema.parse({
        scheduledStories: [fullStory],
        publishedStories: [],
      });

      expect(parsed.scheduledStories[0]).not.toHaveProperty('blocks');
    });

    it('a full-coverage result carries summaries, not full stories', () => {
      const parsed = FullCoverageResultSchema.parse({
        clusterId: 'clu_1',
        storyId: 'sty_1',
        title: 'A cluster',
        summary: 'A cluster summary',
        leadStory: fullStory,
        relatedStories: [fullStory],
        perspectives: [],
        timeline: [],
      });

      expect(parsed.leadStory).not.toHaveProperty('blocks');
      expect(parsed.relatedStories[0]).not.toHaveProperty('blocks');
    });

    it('still carries the substance of a full-coverage result', () => {
      const parsed = FullCoverageResultSchema.parse({
        clusterId: 'clu_1',
        storyId: 'sty_1',
        title: 'A cluster',
        summary: 'A cluster summary',
        leadStory: fullStory,
        relatedStories: [],
        perspectives: [
          {
            storyId: 'sty_2',
            publisher: 'The Ledger',
            headline: 'A different angle',
            sourceType: 'wire',
            url: '/stories/other',
            timeAgo: '2h',
            angle: 'neutral',
          },
        ],
        timeline: [{ date: '2026-01-01', event: 'Something happened', source: 'The Ledger' }],
      });

      expect(parsed.perspectives).toHaveLength(1);
      expect(parsed.timeline).toHaveLength(1);
    });
  });
});
