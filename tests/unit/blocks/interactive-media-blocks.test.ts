import { describe, it, expect, beforeEach } from 'vitest';
import { DatabaseService } from '@ai-news/database';
import { StoryService } from '@ai-news/stories';
import type { ImageDiffBlock, LiveTickerBlock, PollBlock, AudioBlock } from '@ai-news/schemas';

describe('Interactive Media Story Blocks (StoryService Integration)', () => {
  let db: DatabaseService;
  let storyService: StoryService;
  let storyId: string;

  const ctx = {
    organizationId: 'org_test_media',
    authorId: 'usr_editor_1',
    clientType: 'human_web' as const,
    createdVia: 'web' as const,
  };

  beforeEach(async () => {
    db = new DatabaseService();
    storyService = new StoryService(db);

    const story = await storyService.createStory(
      {
        title: 'Satellite and Market Intelligence Dispatch',
        summary: 'Comprehensive analysis of energy transition and coastal restoration.',
        articleType: 'science',
        blocks: [],
      },
      ctx
    );
    storyId = story.id;
  });

  it('adds and updates an image_diff before/after block', async () => {
    const diffBlock: ImageDiffBlock = {
      id: 'blk_diff_test',
      blockType: 'image_diff',
      sortOrder: 0,
      data: {
        beforeUrl: 'https://example.com/satellite-before.jpg',
        afterUrl: 'https://example.com/satellite-after.jpg',
        beforeLabel: 'Year 2020',
        afterLabel: 'Year 2026',
        caption: 'Amazon basin reforestation satellite comparison.',
        orientation: 'horizontal',
        defaultSplitPercent: 50,
        credit: 'Copernicus Sentinel',
      },
    };

    const added = (await storyService.addBlock(storyId, diffBlock, ctx)) as ImageDiffBlock;
    expect(added.blockType).toBe('image_diff');
    expect(added.data.beforeLabel).toBe('Year 2020');

    // Fetch updated story
    const story = await storyService.getStory(storyId, ctx.organizationId);
    expect(story.blocks?.length).toBe(1);
    expect(story.blocks?.[0].blockType).toBe('image_diff');
  });

  it('adds and updates a live_ticker block with dynamic values and sparklines', async () => {
    const tickerBlock: LiveTickerBlock = {
      id: 'blk_ticker_test',
      blockType: 'live_ticker',
      sortOrder: 1,
      data: {
        title: 'Global Energy Indices',
        refreshIntervalSeconds: 20,
        items: [
          {
            symbol: 'BRENT',
            label: 'Brent Crude Oil',
            value: 82.5,
            delta: 1.2,
            unit: '$',
            sparkline: [81.0, 81.5, 82.0, 82.5],
          },
          {
            symbol: 'SOLAR',
            label: 'Global Solar Index',
            value: 340.2,
            delta: -0.4,
            unit: 'pts',
            sparkline: [345.0, 342.0, 341.0, 340.2],
          },
        ],
      },
    };

    const added = await storyService.addBlock(storyId, tickerBlock, ctx);
    expect(added.blockType).toBe('live_ticker');
    expect((added.data as LiveTickerBlock['data']).items.length).toBe(2);

    // Update with new tick
    const updatedData = {
      ...(added.data as LiveTickerBlock['data']),
      items: [
        {
          symbol: 'BRENT',
          label: 'Brent Crude Oil',
          value: 83.1,
          delta: 1.95,
          unit: '$',
          sparkline: [81.0, 81.5, 82.0, 82.5, 83.1],
        },
      ],
    };

    const updated = await storyService.updateBlock(
      storyId,
      added.id,
      { ...added, data: updatedData },
      ctx
    );
    expect((updated.data as LiveTickerBlock['data']).items[0].value).toBe(83.1);
  });

  it('adds an interactive poll block and records votes', async () => {
    const pollBlock: PollBlock = {
      id: 'blk_poll_test',
      blockType: 'poll',
      sortOrder: 2,
      data: {
        pollId: 'pol_energy_2026',
        question: 'Will clean energy exceed 50% of the grid by 2030?',
        options: [
          { id: 'opt_1', text: 'Yes, on track', voteCount: 10 },
          { id: 'opt_2', text: 'No, unlikely', voteCount: 5 },
        ],
        totalVotes: 15,
        closed: false,
      },
    };

    const added = (await storyService.addBlock(storyId, pollBlock, ctx)) as PollBlock;
    expect(added.blockType).toBe('poll');
    expect(added.data.totalVotes).toBe(15);

    // Simulate voting for opt_1
    const updatedOptions = added.data.options.map((o) =>
      o.id === 'opt_1' ? { ...o, voteCount: o.voteCount + 1 } : o
    );
    const updatedBlock: PollBlock = {
      ...added,
      data: {
        ...added.data,
        options: updatedOptions,
        totalVotes: added.data.totalVotes + 1,
      },
    };

    const updated = (await storyService.updateBlock(
      storyId,
      added.id,
      updatedBlock,
      ctx
    )) as PollBlock;
    expect(updated.data.totalVotes).toBe(16);
    expect(updated.data.options.find((o) => o.id === 'opt_1')?.voteCount).toBe(11);
  });

  it('adds an audio block with read-along cue points', async () => {
    const audioBlock: AudioBlock = {
      id: 'blk_audio_test',
      blockType: 'audio',
      sortOrder: 3,
      data: {
        url: 'https://cdn.example.com/audio/dispatch.mp3',
        title: 'Executive Audio Dispatch: Summit Briefing',
        narrator: 'Aria (AI Anchor)',
        durationSeconds: 120,
        language: 'en',
        transcript: 'Welcome to GlobalPulse. Today world leaders agreed on new carbon standards.',
        cuePoints: [
          { timeMs: 0, text: 'Welcome to GlobalPulse.' },
          { timeMs: 2500, text: 'Today world leaders agreed on new carbon standards.' },
        ],
      },
    };

    const added = (await storyService.addBlock(storyId, audioBlock, ctx)) as AudioBlock;
    expect(added.blockType).toBe('audio');
    expect(added.data.cuePoints?.length).toBe(2);
    expect(added.data.cuePoints?.[0].timeMs).toBe(0);
    expect(added.data.cuePoints?.[1].text).toContain('world leaders');
  });
});
