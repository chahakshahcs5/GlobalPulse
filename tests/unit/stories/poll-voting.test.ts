import { describe, it, expect, beforeEach } from 'vitest';
import { DatabaseService } from '@ai-news/database';
import { EngagementService, StoryService } from '@ai-news/stories';
import type { PollBlock, PollTally } from '@ai-news/schemas';

/**
 * Reader poll voting.
 *
 * Votes are recorded on the server so the tally is shared across every
 * reader, a reader has at most one vote per poll, and the published article
 * payload is never rewritten as votes come in.
 */
describe('Poll voting', () => {
  let db: DatabaseService;
  let stories: StoryService;
  let engagement: EngagementService;

  const ORG = 'org_poll_test';
  const BLOCK_ID = 'blk_poll_test';

  const ctx = {
    organizationId: ORG,
    authorId: 'usr_reporter',
    clientType: 'human_web' as const,
    createdVia: 'api' as const,
  };

  async function seedStoryWithPoll(
    options: { voteCount?: number; totalVotes?: number; closed?: boolean } = {}
  ) {
    const story = await stories.createStory(
      { title: 'Grid transition poll', summary: 'Will clean energy pass 50%?' },
      ctx
    );

    const poll: PollBlock = {
      id: BLOCK_ID,
      blockType: 'poll',
      sortOrder: 0,
      data: {
        pollId: 'pol_grid_2026',
        question: 'Will clean energy exceed 50% of the grid by 2030?',
        options: [
          { id: 'opt_1', text: 'Yes, on track', voteCount: options.voteCount ?? 10 },
          { id: 'opt_2', text: 'No, unlikely', voteCount: 5 },
        ],
        totalVotes: options.totalVotes ?? 15,
        closed: options.closed ?? false,
      },
    };

    await stories.addBlock(story.id, poll, ctx);
    return story;
  }

  function option(tally: PollTally, id: string) {
    const found = tally.options.find((o) => o.id === id);
    if (!found) throw new Error(`option ${id} missing from tally`);
    return found;
  }

  beforeEach(() => {
    db = new DatabaseService();
    stories = new StoryService(db);
    engagement = new EngagementService(db);
  });

  it('records a vote and folds it into the baseline tally', async () => {
    const story = await seedStoryWithPoll();

    const tally = await engagement.castPollVote(story.id, BLOCK_ID, 'opt_1', {
      userId: 'usr_a',
      organizationId: ORG,
    });

    // Baseline was opt_1=10 / opt_2=5 (15 total). One reader votes opt_1.
    expect(option(tally, 'opt_1').voteCount).toBe(11);
    expect(option(tally, 'opt_2').voteCount).toBe(5);
    expect(tally.totalVotes).toBe(16);
    expect(tally.userVotedOptionId).toBe('opt_1');
  });

  it('never rewrites the published article payload when a vote comes in', async () => {
    const story = await seedStoryWithPoll();

    await engagement.castPollVote(story.id, BLOCK_ID, 'opt_2', {
      userId: 'usr_a',
      organizationId: ORG,
    });

    const blocks = await db.stories.getBlocks(story.id);
    const poll = blocks.find((b) => b.id === BLOCK_ID) as PollBlock;

    // The story payload stays exactly as authored; votes live beside it.
    expect(poll.data.totalVotes).toBe(15);
    expect(poll.data.options.find((o) => o.id === 'opt_2')?.voteCount).toBe(5);
  });

  it("replaces a reader's previous choice instead of counting it twice", async () => {
    const story = await seedStoryWithPoll();

    await engagement.castPollVote(story.id, BLOCK_ID, 'opt_1', {
      userId: 'usr_a',
      organizationId: ORG,
    });
    const afterSecond = await engagement.castPollVote(story.id, BLOCK_ID, 'opt_2', {
      userId: 'usr_a',
      organizationId: ORG,
    });

    // Still a single vote from this reader — it just moved to opt_2.
    expect(option(afterSecond, 'opt_1').voteCount).toBe(10);
    expect(option(afterSecond, 'opt_2').voteCount).toBe(6);
    expect(afterSecond.totalVotes).toBe(16);
    expect(afterSecond.userVotedOptionId).toBe('opt_2');
  });

  it('counts every reader separately', async () => {
    const story = await seedStoryWithPoll();

    await engagement.castPollVote(story.id, BLOCK_ID, 'opt_1', {
      userId: 'usr_a',
      organizationId: ORG,
    });
    const tally = await engagement.castPollVote(story.id, BLOCK_ID, 'opt_1', {
      userId: 'usr_b',
      organizationId: ORG,
    });

    expect(option(tally, 'opt_1').voteCount).toBe(12);
    expect(tally.totalVotes).toBe(17);
  });

  it('computes percentages against the combined tally', async () => {
    const story = await seedStoryWithPoll();

    const tally = await engagement.castPollVote(story.id, BLOCK_ID, 'opt_1', {
      userId: 'usr_a',
      organizationId: ORG,
    });

    // 11 of 16 => 68.75%, rounded to one decimal.
    expect(option(tally, 'opt_1').percentage).toBeCloseTo(68.8, 1);
    expect(option(tally, 'opt_2').percentage).toBeCloseTo(31.3, 1);
  });

  it("reports the reader's own choice only to that reader", async () => {
    const story = await seedStoryWithPoll();

    await engagement.castPollVote(story.id, BLOCK_ID, 'opt_1', {
      userId: 'usr_a',
      organizationId: ORG,
    });

    const forVoter = await engagement.getPollTally(story.id, BLOCK_ID, 'usr_a', ORG);
    const forOther = await engagement.getPollTally(story.id, BLOCK_ID, 'usr_b', ORG);

    expect(forVoter.userVotedOptionId).toBe('opt_1');
    expect(forOther.userVotedOptionId).toBeNull();
    // Both readers see the same shared numbers.
    expect(forOther.totalVotes).toBe(forVoter.totalVotes);
  });

  it('rejects a vote on a closed poll', async () => {
    const story = await seedStoryWithPoll({ closed: true });

    await expect(
      engagement.castPollVote(story.id, BLOCK_ID, 'opt_1', {
        userId: 'usr_a',
        organizationId: ORG,
      })
    ).rejects.toThrow(/closed/i);
  });

  it('rejects a vote on an option that is not part of the poll', async () => {
    const story = await seedStoryWithPoll();

    await expect(
      engagement.castPollVote(story.id, BLOCK_ID, 'opt_ghost', {
        userId: 'usr_a',
        organizationId: ORG,
      })
    ).rejects.toThrow(/not part of this poll/i);
  });

  it('rejects a vote against a block that is not a poll', async () => {
    const story = await stories.createStory(
      { title: 'No poll here', summary: 'A plain story' },
      ctx
    );

    await expect(engagement.getPollTally(story.id, 'blk_missing', 'usr_a', ORG)).rejects.toThrow();
  });

  it('rejects a vote on a story in another organisation', async () => {
    const story = await seedStoryWithPoll();

    await expect(
      engagement.castPollVote(story.id, BLOCK_ID, 'opt_1', {
        userId: 'usr_a',
        organizationId: 'org_other',
      })
    ).rejects.toThrow();
  });
});
