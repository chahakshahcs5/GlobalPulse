import type {
  Comment,
  CommentStatus,
  CommentAuthorRole,
  CreateCommentInput,
  ModerateCommentInput,
  StoryReactionType,
  StoryReactionsSummary,
  BookmarkItem,
  PollBlock,
  PollTally,
  StoryBlock,
} from '@ai-news/schemas';
import { CreateCommentInputSchema, ModerateCommentInputSchema } from '@ai-news/schemas';
import type { DatabaseService } from '@ai-news/database';
import { NotFoundError, ValidationError, generateId } from '@ai-news/shared';

export interface CommentContext {
  authorId: string;
  authorName: string;
  authorRole?: CommentAuthorRole;
  organizationId: string;
}

export interface ModeratorContext {
  moderatorId: string;
  organizationId: string;
}

export type EngagementBroadcastFn = (channel: string, eventName: string, data: unknown) => void;
let _engagementBroadcast: EngagementBroadcastFn | null = null;

export function setEngagementBroadcaster(fn: EngagementBroadcastFn): void {
  _engagementBroadcast = fn;
}

function broadcastEngagement(eventName: string, data: unknown, channel = 'all'): void {
  if (_engagementBroadcast) {
    try {
      _engagementBroadcast(channel, eventName, data);
    } catch {
      // Non-blocking
    }
  }
}

export class EngagementService {
  constructor(private readonly db: DatabaseService) {}

  // ---------------------------------------------------------------------------
  // Comments
  // ---------------------------------------------------------------------------

  async getComments(
    storyId: string,
    options?: { status?: CommentStatus },
    orgId?: string
  ): Promise<Comment[]> {
    // Verify story exists
    const story = await this.db.stories.findById(storyId, orgId);
    if (!story) {
      throw new NotFoundError('Story', storyId);
    }

    return this.db.engagement.findCommentsByStory(storyId, {
      status: options?.status,
      organizationId: orgId,
    });
  }

  async createComment(
    storyId: string,
    input: CreateCommentInput,
    ctx: CommentContext
  ): Promise<Comment> {
    const validated = CreateCommentInputSchema.parse(input);

    const story = await this.db.stories.findById(storyId, ctx.organizationId);
    if (!story) {
      throw new NotFoundError('Story', storyId);
    }

    if (validated.parentId) {
      const parent = await this.db.engagement.findCommentById(validated.parentId);
      if (!parent) {
        throw new NotFoundError('Parent Comment', validated.parentId);
      }
      if (parent.storyId !== storyId) {
        throw new ValidationError('Parent comment belongs to a different story');
      }
    }

    // Strip basic script injection
    const cleanContent = validated.content
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .trim();

    if (!cleanContent) {
      throw new ValidationError('Comment cannot be empty after sanitization');
    }

    const now = new Date().toISOString();
    const comment: Comment = {
      id: generateId('cmt'),
      storyId,
      organizationId: ctx.organizationId,
      authorId: ctx.authorId,
      authorName: validated.authorName?.trim() || ctx.authorName || 'Verified Reader',
      authorRole: ctx.authorRole || 'reader',
      content: cleanContent,
      parentId: validated.parentId,
      status: 'approved',
      likesCount: 0,
      createdAt: now,
      updatedAt: now,
    };

    const saved = await this.db.engagement.createComment(comment);
    // Comments belong to a story, so they are published on the story's
    // channel. Subscribers of 'all' still receive them, and a reader who
    // subscribes to the story directly gets them without any other traffic.
    broadcastEngagement('comment.created', { storyId, comment: saved }, `story_${storyId}`);
    return saved;
  }

  async moderateComment(
    commentId: string,
    input: ModerateCommentInput,
    ctx: ModeratorContext
  ): Promise<Comment> {
    const validated = ModerateCommentInputSchema.parse(input);
    const existing = await this.db.engagement.findCommentById(commentId);
    if (!existing) {
      throw new NotFoundError('Comment', commentId);
    }
    if (existing.organizationId !== ctx.organizationId) {
      throw new NotFoundError('Comment', commentId);
    }

    const updated: Comment = {
      ...existing,
      status: validated.status,
      moderationReason: validated.reason,
      updatedAt: new Date().toISOString(),
    };

    const saved = await this.db.engagement.updateComment(updated);
    broadcastEngagement('comment.moderated', {
      commentId: saved.id,
      storyId: saved.storyId,
      status: saved.status,
    });
    return saved;
  }

  async deleteComment(commentId: string, orgId: string): Promise<boolean> {
    const existing = await this.db.engagement.findCommentById(commentId);
    if (!existing || existing.organizationId !== orgId) {
      return false;
    }
    const result = await this.db.engagement.deleteComment(commentId);
    if (result) {
      broadcastEngagement('comment.deleted', { commentId, storyId: existing.storyId });
    }
    return result;
  }

  // ---------------------------------------------------------------------------
  // Poll Votes
  // ---------------------------------------------------------------------------

  /**
   * Resolve a poll block on a story.
   *
   * The block is looked up by id and must actually be a `poll`; anything else
   * is a client mistake and must not be treated as an empty poll.
   */
  private async resolvePollBlock(
    storyId: string,
    blockId: string,
    orgId?: string
  ): Promise<{ block: PollBlock; blocks: StoryBlock[] }> {
    const story = await this.db.stories.findById(storyId, orgId);
    if (!story) {
      throw new NotFoundError('Story', storyId);
    }

    const blocks = await this.db.stories.getBlocks(storyId);
    const block = blocks.find((b) => b.id === blockId);
    if (!block) {
      throw new NotFoundError('StoryBlock', blockId);
    }
    if (block.blockType !== 'poll') {
      throw new ValidationError(`Block "${blockId}" is not a poll`);
    }
    return { block: block as PollBlock, blocks };
  }

  /**
   * Compute the live tally for a poll.
   *
   * The tally combines two sources:
   *  - the baseline counts stored in the block payload when the story was
   *    authored (seed votes, or votes cast through another channel), and
   *  - the reader votes recorded against the story.
   *
   * Keeping them separate means the published article payload never has to be
   * rewritten as votes come in, while the displayed numbers still include
   * every vote.
   */
  async getPollTally(
    storyId: string,
    blockId: string,
    userId?: string,
    orgId?: string
  ): Promise<PollTally> {
    const { block } = await this.resolvePollBlock(storyId, blockId, orgId);
    const votes = await this.db.engagement.getPollVotes(blockId);

    const recorded = new Map<string, number>();
    for (const vote of votes) {
      recorded.set(vote.optionId, (recorded.get(vote.optionId) ?? 0) + 1);
    }

    const options = block.data.options.map((option) => {
      const voteCount = (option.voteCount ?? 0) + (recorded.get(option.id) ?? 0);
      return { id: option.id, text: option.text, voteCount };
    });

    const totalVotes = options.reduce((sum, o) => sum + o.voteCount, 0);

    return {
      pollId: block.data.pollId,
      blockId: block.id,
      storyId,
      question: block.data.question,
      totalVotes,
      closed: block.data.closed ?? false,
      options: options.map((option) => ({
        ...option,
        percentage: totalVotes > 0 ? Math.round((option.voteCount / totalVotes) * 1000) / 10 : 0,
      })),
      userVotedOptionId: userId ? await this.db.engagement.getUserPollVote(blockId, userId) : null,
    };
  }

  /**
   * Record a reader vote on a poll block and broadcast the new tally.
   *
   * A reader may change their mind: casting again replaces the previous
   * choice instead of adding a second vote.
   */
  async castPollVote(
    storyId: string,
    blockId: string,
    optionId: string,
    ctx: { userId: string; organizationId: string }
  ): Promise<PollTally> {
    const { block } = await this.resolvePollBlock(storyId, blockId, ctx.organizationId);

    if (block.data.closed) {
      throw new ValidationError('This poll has been closed');
    }
    if (block.data.expiresAt && new Date(block.data.expiresAt).getTime() < Date.now()) {
      throw new ValidationError('This poll has expired');
    }
    if (!block.data.options.some((o) => o.id === optionId)) {
      throw new ValidationError(`Option "${optionId}" is not part of this poll`);
    }

    await this.db.engagement.castPollVote({
      id: generateId('pv'),
      storyId,
      blockId,
      pollId: block.data.pollId,
      optionId,
      userId: ctx.userId,
      organizationId: ctx.organizationId,
      createdAt: new Date().toISOString(),
    });

    const tally = await this.getPollTally(storyId, blockId, ctx.userId, ctx.organizationId);

    broadcastEngagement(
      'poll.vote',
      {
        storyId,
        blockId,
        pollId: tally.pollId,
        tally,
      },
      `story_${storyId}`
    );

    return tally;
  }

  // ---------------------------------------------------------------------------
  // Reactions
  // ---------------------------------------------------------------------------

  async toggleReaction(
    storyId: string,
    reactionType: StoryReactionType,
    ctx: { userId: string; organizationId: string }
  ): Promise<{ active: boolean; summary: StoryReactionsSummary }> {
    const story = await this.db.stories.findById(storyId, ctx.organizationId);
    if (!story) {
      throw new NotFoundError('Story', storyId);
    }

    const result = await this.db.engagement.toggleReaction(
      storyId,
      ctx.userId,
      ctx.organizationId,
      reactionType
    );

    broadcastEngagement('reaction.updated', {
      storyId,
      reactionType,
      summary: result.summary,
    });

    return result;
  }

  async getReactions(storyId: string, userId?: string): Promise<StoryReactionsSummary> {
    return this.db.engagement.getReactions(storyId, userId);
  }

  // ---------------------------------------------------------------------------
  // Bookmarks
  // ---------------------------------------------------------------------------

  async toggleBookmark(
    storyId: string,
    ctx: { userId: string; organizationId: string }
  ): Promise<{ bookmarked: boolean; bookmark?: BookmarkItem }> {
    const story = await this.db.stories.findById(storyId, ctx.organizationId);
    if (!story) {
      throw new NotFoundError('Story', storyId);
    }

    return this.db.engagement.toggleBookmark(ctx.userId, storyId, ctx.organizationId);
  }

  async listBookmarks(userId: string, orgId?: string): Promise<BookmarkItem[]> {
    return this.db.engagement.listBookmarks(userId, orgId);
  }

  // ---------------------------------------------------------------------------
  // Reading Progress & History
  // ---------------------------------------------------------------------------

  async saveReadingProgress(
    storyId: string,
    percentage: number,
    ctx: { userId: string; organizationId: string; completed?: boolean }
  ) {
    const story = await this.db.stories.findById(storyId, ctx.organizationId);
    if (!story) {
      throw new NotFoundError('Story', storyId);
    }
    const record = await this.db.engagement.saveReadingProgress(
      ctx.userId,
      storyId,
      percentage,
      ctx.completed
    );

    broadcastEngagement('reading_progress.updated', {
      storyId,
      userId: ctx.userId,
      percentage: record.percentage,
      completed: record.completed,
    });

    return record;
  }

  async getReadingProgress(storyId: string, userId: string) {
    return this.db.engagement.getReadingProgress(userId, storyId);
  }

  async listReadingHistory(userId: string, limit: number = 50) {
    return this.db.engagement.listReadingHistory(userId, limit);
  }
}
