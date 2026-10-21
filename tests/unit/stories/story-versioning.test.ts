import { describe, it, expect, beforeEach } from 'vitest';
import { DatabaseService } from '@ai-news/database';
import { StoryService } from '@ai-news/stories';
import type { Story, StoryBlock } from '@ai-news/schemas';

/**
 * The version number has to survive a counter that has drifted.
 *
 * The story's `currentVersionNumber` is a convenience, not the source of
 * truth — the truth is the versions themselves, and the database enforces
 * that with a unique constraint on (storyId, versionNumber). A counter that
 * has fallen behind (a story imported from elsewhere, or one whose counter
 * failed to advance because an earlier write in the same commit threw) used
 * to make every subsequent version collide, so the story could never be
 * versioned again.
 */
describe('Story versioning', () => {
  let db: DatabaseService;
  let stories: StoryService;

  const ctx = {
    organizationId: 'org_default',
    authorId: 'usr_author',
    clientType: 'human_web' as const,
    createdVia: 'api' as const,
  };

  const paragraphBlock: StoryBlock = {
    id: 'blk_paragraph_1',
    blockType: 'paragraph',
    sortOrder: 0,
    data: { text: 'A paragraph.', format: 'markdown' },
  };

  beforeEach(async () => {
    db = new DatabaseService({ memory: true });
    stories = new StoryService(db);
  });

  async function createStory(): Promise<Story> {
    return stories.createStory(
      {
        title: 'A story',
        summary: 'A summary of the story.',
        articleType: 'developing_story',
        blocks: [paragraphBlock],
      } as never,
      ctx
    );
  }

  it('commits versions in sequence', async () => {
    const story = await createStory();

    const first = await stories.createStoryVersion(
      story.id,
      { changeSummary: 'First revision', blocks: [paragraphBlock] },
      ctx
    );
    const second = await stories.createStoryVersion(
      story.id,
      { changeSummary: 'Second revision', blocks: [paragraphBlock] },
      ctx
    );

    expect(first.versionNumber).toBe(2);
    expect(second.versionNumber).toBe(3);

    const after = await stories.getStory(story.id, ctx.organizationId);
    expect(after.currentVersionNumber).toBe(3);
  });

  it('derives the next version number from the versions when the counter has drifted', async () => {
    const story = await createStory();

    await stories.createStoryVersion(
      story.id,
      { changeSummary: 'First revision', blocks: [paragraphBlock] },
      ctx
    );

    // Simulate a counter that has fallen behind the versions.
    const drifted = await stories.getStory(story.id, ctx.organizationId);
    await db.stories.update({ ...drifted, currentVersionNumber: 1 });

    // The next commit must not collide with the version that already exists.
    const next = await stories.createStoryVersion(
      story.id,
      { changeSummary: 'Second revision', blocks: [paragraphBlock] },
      ctx
    );

    expect(next.versionNumber).toBe(3);

    const versions = await stories.getStoryVersions(story.id, ctx.organizationId);
    expect(versions.map((version) => version.versionNumber)).toEqual([3, 2, 1]);
  });

  it('records which version is current', async () => {
    const story = await createStory();

    const version = await stories.createStoryVersion(
      story.id,
      { changeSummary: 'A revision', blocks: [paragraphBlock] },
      ctx
    );

    const after = await stories.getStory(story.id, ctx.organizationId);
    expect(after.currentVersionNumber).toBe(version.versionNumber);
    expect(after.currentVersionId).toBe(version.id);
  });
});
