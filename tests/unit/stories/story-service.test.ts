import { describe, it, expect, beforeEach } from 'vitest';
import { DatabaseService } from '@ai-news/database';
import { StoryService } from '@ai-news/stories';
import { ValidationError } from '@ai-news/shared';

describe('Story Lifecycle & Versioning Service (Unit Tests)', () => {
  let db: DatabaseService;
  let storyService: StoryService;

  const ctx = {
    organizationId: 'org_test_1',
    authorId: 'usr_gemini_agent',
    clientType: 'gemini' as const,
    createdVia: 'mcp' as const,
  };

  beforeEach(() => {
    db = new DatabaseService();
    storyService = new StoryService(db);
  });

  it('creates draft story and initializes Version 1', async () => {
    const story = await storyService.createStory(
      {
        title: 'Global Semiconductor Consortium Formed',
        summary: 'Leading nations establish joint chip manufacturing standard.',
        articleType: 'analysis',
        blocks: [
          {
            id: 'blk_1',
            blockType: 'paragraph',
            sortOrder: 0,
            data: { text: 'Key tech leaders agreed on the framework today.', format: 'markdown' },
          },
        ],
      },
      ctx
    );

    expect(story.id).toMatch(/^sty_/);
    expect(story.slug).toBe('global-semiconductor-consortium-formed');
    expect(story.status).toBe('DRAFT');
    expect(story.currentVersionNumber).toBe(1);
    expect(story.blocks.length).toBe(1);

    // Verify initial version 1 snapshot was persisted
    const versions = await storyService.getStoryVersions(story.id, ctx.organizationId);
    expect(versions.length).toBe(1);
    expect(versions[0].versionNumber).toBe(1);
    expect(versions[0].title).toBe('Global Semiconductor Consortium Formed');
  });

  it('adds, updates, and reorders blocks on a draft story', async () => {
    const story = await storyService.createStory(
      {
        title: 'Renewable Grid Expansion in Southern Asia',
        summary: 'Solar and wind infrastructure updates.',
      },
      ctx
    );

    // 1. Add block
    const block1 = await storyService.addBlock(
      story.id,
      {
        id: 'p_1',
        blockType: 'paragraph',
        sortOrder: 0,
        data: { text: 'Initial dispatch.', format: 'markdown' },
      },
      ctx
    );
    expect(block1.id).toBe('p_1');

    // 2. Add chart block
    const block2 = await storyService.addBlock(
      story.id,
      {
        id: 'c_1',
        blockType: 'chart',
        sortOrder: 1,
        data: {
          chartType: 'line',
          title: 'Gigawatt Capacity',
          xAxis: { key: 'month', label: 'Month', type: 'category' },
          yAxis: { label: 'GW' },
          series: [{ name: 'Capacity', key: 'gw' }],
          values: [{ month: 'Jan', gw: 12 }, { month: 'Jun', gw: 19 }],
        },
      },
      ctx
    );
    expect(block2.id).toBe('c_1');

    // 3. Reorder blocks: c_1 first, p_1 second
    const reordered = await storyService.reorderBlocks(story.id, ['c_1', 'p_1'], ctx);
    expect(reordered[0].id).toBe('c_1');
    expect(reordered[0].sortOrder).toBe(0);
    expect(reordered[1].id).toBe('p_1');
    expect(reordered[1].sortOrder).toBe(1);
  });

  it('creates immutable Version 2 with automated WhatChanged diffing', async () => {
    const story = await storyService.createStory(
      {
        title: 'Fusion Reactor Test Reaches Net Energy Gain',
        summary: 'Initial scientific report.',
        blocks: [
          {
            id: 'b_intro',
            blockType: 'paragraph',
            sortOrder: 0,
            data: { text: 'Initial 10-second plasma test completed.', format: 'markdown' },
          },
        ],
      },
      ctx
    );

    // Update story to Version 2 with an additional quote and timeline
    const v2 = await storyService.createStoryVersion(
      story.id,
      {
        title: 'Fusion Reactor Test Reaches Net Energy Gain: Verified',
        summary: 'International peer-reviewed confirmation published.',
        changeSummary: 'Added independent laboratory verification data.',
        blocks: [
          {
            id: 'b_intro',
            blockType: 'paragraph',
            sortOrder: 0,
            data: { text: 'Initial 10-second plasma test completed with 1.3x Q-factor.', format: 'markdown' },
          },
          {
            id: 'b_quote',
            blockType: 'quote',
            sortOrder: 1,
            data: { quote: 'This is a monumental milestone for clean energy.', attribution: 'Lead Physicist' },
          },
        ],
      },
      ctx
    );

    expect(v2.versionNumber).toBe(2);
    expect(v2.changeSummary).toBe('Added independent laboratory verification data.');

    // Verify WhatChanged block was prepended to the story blocks
    const updatedStory = await storyService.getStory(story.id, ctx.organizationId);
    expect(updatedStory.currentVersionNumber).toBe(2);
    const whatChangedBlock = updatedStory.blocks.find((b) => b.blockType === 'what_changed');
    expect(whatChangedBlock).toBeDefined();

    // Verify version 1 is still intact and immutable
    const v1 = await storyService.getStoryVersion(story.id, 1, ctx.organizationId);
    expect(v1.title).toBe('Fusion Reactor Test Reaches Net Energy Gain');
    expect(v1.versionNumber).toBe(1);
  });

  it('enforces publishing rules and atomic transitions', async () => {
    // 1. Cannot publish empty story with 0 blocks
    const emptyStory = await storyService.createStory(
      {
        title: 'Empty Draft News Item',
        summary: 'Nothing here yet.',
      },
      ctx
    );
    await expect(storyService.publishStory(emptyStory.id, ctx)).rejects.toThrow(ValidationError);

    // 2. Add block and publish
    await storyService.addBlock(
      emptyStory.id,
      {
        id: 'p_valid',
        blockType: 'paragraph',
        sortOrder: 0,
        data: { text: 'Now it has content.', format: 'markdown' },
      },
      ctx
    );

    const published = await storyService.publishStory(emptyStory.id, ctx);
    expect(published.status).toBe('PUBLISHED');
    expect(published.publishedAt).toBeDefined();

    // 3. Unpublish moves back to draft
    const unpublished = await storyService.unpublishStory(emptyStory.id, ctx);
    expect(unpublished.status).toBe('DRAFT');

    // 4. Archive moves to archived
    const archived = await storyService.archiveStory(emptyStory.id, ctx);
    expect(archived.status).toBe('ARCHIVED');
  });
});
