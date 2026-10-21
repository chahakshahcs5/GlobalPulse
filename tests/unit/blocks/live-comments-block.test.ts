import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { DatabaseService } from '@ai-news/database';
import { EngagementService, StoryService, setEngagementBroadcaster } from '@ai-news/stories';
import {
  LiveCommentsBlockSchema,
  StoryBlockSchema,
  getBlockDefinition,
  listBlockTypes,
} from '@ai-news/schemas';

const base = { id: 'blk_lcmt_test', sortOrder: 0 };

const validData = {
  title: 'What readers are saying',
  description: 'The latest approved comments on this story.',
  maxComments: 10,
  showCta: true,
};

describe('Live comments block', () => {
  it('validates the thread settings', () => {
    const block = LiveCommentsBlockSchema.parse({
      ...base,
      blockType: 'live_comments',
      data: validData,
    });
    expect(block.data.title).toBe('What readers are saying');
    expect(block.data.maxComments).toBe(10);
  });

  it('is part of the story block union', () => {
    const parsed = StoryBlockSchema.parse({
      ...base,
      blockType: 'live_comments',
      data: validData,
    });
    expect(parsed.blockType).toBe('live_comments');
  });

  it('rejects a block with no title', () => {
    expect(() =>
      LiveCommentsBlockSchema.parse({
        ...base,
        blockType: 'live_comments',
        data: { ...validData, title: '' },
      })
    ).toThrow();
  });

  it('is registered as an interactive block', () => {
    expect(listBlockTypes()).toContain('live_comments');
    const definition = getBlockDefinition('live_comments');
    expect(definition?.category).toBe('interactive');
  });

  describe('comment events', () => {
    let db: DatabaseService;
    let stories: StoryService;
    let engagement: EngagementService;
    let broadcasts: Array<{ channel: string; eventName: string; data: unknown }>;

    const ORG = 'org_live_comments_test';

    beforeEach(() => {
      db = new DatabaseService();
      stories = new StoryService(db);
      engagement = new EngagementService(db);
      broadcasts = [];
      setEngagementBroadcaster((channel, eventName, data) => {
        broadcasts.push({ channel, eventName, data });
      });
    });

    afterEach(() => {
      setEngagementBroadcaster(null as never);
    });

    it('publishes a new comment on the story channel', async () => {
      const story = await stories.createStory(
        { title: 'A story with a live comment thread', summary: 'Readers are talking.' },
        {
          organizationId: ORG,
          authorId: 'usr_reporter',
          clientType: 'human_web',
          createdVia: 'api',
        }
      );

      await engagement.createComment(
        story.id,
        { content: 'The methodology section is worth reading first.' },
        { authorId: 'usr_a', authorName: 'Reader A', organizationId: ORG }
      );

      expect(broadcasts).toHaveLength(1);
      expect(broadcasts[0].eventName).toBe('comment.created');
      // Comments belong to a story, so they go out on the story's channel.
      // Subscribers of 'all' still receive them.
      expect(broadcasts[0].channel).toBe(`story_${story.id}`);
    });

    it('does not broadcast a comment on a story that does not exist', async () => {
      await expect(
        engagement.createComment(
          'sty_missing',
          { content: 'Hello' },
          { authorId: 'usr_a', authorName: 'Reader A', organizationId: ORG }
        )
      ).rejects.toThrow();
      expect(broadcasts).toHaveLength(0);
    });
  });
});
