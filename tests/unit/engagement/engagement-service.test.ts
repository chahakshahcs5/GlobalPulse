import { describe, it, expect, beforeEach } from 'vitest';
import { DatabaseService } from '@ai-news/database';
import { StoryService, EngagementService } from '@ai-news/stories';

describe('EngagementService Unit Tests (Comments, Reactions, Bookmarks)', () => {
  let db: DatabaseService;
  let storyService: StoryService;
  let engagementService: EngagementService;
  let storyId: string;

  const ctx = {
    organizationId: 'org_test_engagement',
    authorId: 'usr_editor_1',
    clientType: 'human_web' as const,
    createdVia: 'web' as const,
  };

  beforeEach(async () => {
    db = new DatabaseService();
    storyService = new StoryService(db);
    engagementService = new EngagementService(db);

    const story = await storyService.createStory(
      {
        title: 'Global Energy Summit Concludes',
        summary: 'Nations commit to clean energy targets by 2030.',
        articleType: 'science',
        blocks: [
          {
            id: 'blk_1',
            blockType: 'paragraph',
            sortOrder: 0,
            data: { text: 'Key leaders agreed on renewable targets.', format: 'markdown' },
          },
        ],
      },
      ctx
    );
    storyId = story.id;
  });

  describe('Comments', () => {
    it('creates top-level and threaded comments with HTML sanitization', async () => {
      const comment1 = await engagementService.createComment(
        storyId,
        {
          content: 'Excellent coverage of the summit. <script>alert("xss")</script>',
          authorName: 'Alice Reader',
        },
        {
          authorId: 'usr_alice',
          authorName: 'Alice Reader',
          authorRole: 'reader',
          organizationId: ctx.organizationId,
        }
      );

      expect(comment1.id).toMatch(/^cmt_/);
      expect(comment1.content).toBe('Excellent coverage of the summit.');
      expect(comment1.authorName).toBe('Alice Reader');
      expect(comment1.status).toBe('approved');

      // Threaded reply
      const reply = await engagementService.createComment(
        storyId,
        {
          content: 'Agreed, especially regarding the solar targets.',
          authorName: 'Bob Reader',
          parentId: comment1.id,
        },
        {
          authorId: 'usr_bob',
          authorName: 'Bob Reader',
          authorRole: 'subscriber',
          organizationId: ctx.organizationId,
        }
      );

      expect(reply.parentId).toBe(comment1.id);

      const allComments = await engagementService.getComments(storyId, undefined, ctx.organizationId);
      expect(allComments.length).toBe(2);
    });

    it('moderates a comment and deletes a comment', async () => {
      const comment = await engagementService.createComment(
        storyId,
        { content: 'Spammy content link here' },
        {
          authorId: 'usr_spammer',
          authorName: 'Spammer',
          organizationId: ctx.organizationId,
        }
      );

      const moderated = await engagementService.moderateComment(
        comment.id,
        { status: 'hidden', reason: 'Self-promotional spam' },
        { moderatorId: 'usr_editor_1', organizationId: ctx.organizationId }
      );

      expect(moderated.status).toBe('hidden');
      expect(moderated.moderationReason).toBe('Self-promotional spam');

      const deleted = await engagementService.deleteComment(comment.id, ctx.organizationId);
      expect(deleted).toBe(true);
    });
  });

  describe('Reactions', () => {
    it('toggles reactions and aggregates counts correctly', async () => {
      // User 1 reacts 'like'
      const res1 = await engagementService.toggleReaction(storyId, 'like', {
        userId: 'usr_user_1',
        organizationId: ctx.organizationId,
      });
      expect(res1.active).toBe(true);
      expect(res1.summary.counts.like).toBe(1);

      // User 2 reacts 'like' and 'insightful'
      await engagementService.toggleReaction(storyId, 'like', {
        userId: 'usr_user_2',
        organizationId: ctx.organizationId,
      });
      const res2 = await engagementService.toggleReaction(storyId, 'insightful', {
        userId: 'usr_user_2',
        organizationId: ctx.organizationId,
      });

      expect(res2.summary.counts.like).toBe(2);
      expect(res2.summary.counts.insightful).toBe(1);

      // User 1 un-reacts 'like'
      const res3 = await engagementService.toggleReaction(storyId, 'like', {
        userId: 'usr_user_1',
        organizationId: ctx.organizationId,
      });
      expect(res3.active).toBe(false);
      expect(res3.summary.counts.like).toBe(1);
    });
  });

  describe('Bookmarks', () => {
    it('toggles bookmarks and lists user saved stories', async () => {
      const res1 = await engagementService.toggleBookmark(storyId, {
        userId: 'usr_reader_99',
        organizationId: ctx.organizationId,
      });
      expect(res1.bookmarked).toBe(true);

      const bookmarks = await engagementService.listBookmarks('usr_reader_99', ctx.organizationId);
      expect(bookmarks.length).toBe(1);
      expect(bookmarks[0].storyId).toBe(storyId);

      // Toggle off
      const res2 = await engagementService.toggleBookmark(storyId, {
        userId: 'usr_reader_99',
        organizationId: ctx.organizationId,
      });
      expect(res2.bookmarked).toBe(false);

      const emptyBookmarks = await engagementService.listBookmarks('usr_reader_99', ctx.organizationId);
      expect(emptyBookmarks.length).toBe(0);
    });
  });
});
