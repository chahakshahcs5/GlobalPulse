import type {
  Comment,
  CommentStatus,
  StoryReactionType,
  StoryReactionsSummary,
  BookmarkItem,
} from '@ai-news/schemas';

export interface IEngagementRepository {
  // Comments
  findCommentsByStory(
    storyId: string,
    options?: { status?: CommentStatus; organizationId?: string }
  ): Promise<Comment[]>;
  findCommentById(id: string): Promise<Comment | null>;
  createComment(comment: Comment): Promise<Comment>;
  updateComment(comment: Comment): Promise<Comment>;
  deleteComment(id: string): Promise<boolean>;

  // Reactions
  toggleReaction(
    storyId: string,
    userId: string,
    organizationId: string,
    reactionType: StoryReactionType
  ): Promise<{ active: boolean; summary: StoryReactionsSummary }>;
  getReactions(storyId: string, userId?: string): Promise<StoryReactionsSummary>;

  // Bookmarks
  toggleBookmark(
    userId: string,
    storyId: string,
    organizationId: string
  ): Promise<{ bookmarked: boolean; bookmark?: BookmarkItem }>;
  listBookmarks(userId: string, organizationId?: string): Promise<BookmarkItem[]>;

  // Reading Progress & History
  saveReadingProgress(
    userId: string,
    storyId: string,
    percentage: number,
    completed?: boolean
  ): Promise<ReadingProgressRecord>;
  getReadingProgress(userId: string, storyId: string): Promise<ReadingProgressRecord | null>;
  listReadingHistory(userId: string, limit?: number): Promise<ReadingProgressRecord[]>;

  // Social Shares (F15)
  recordShare(storyId: string, platform: string, userId?: string): Promise<{ shareCount: number }>;
  getShareCount(storyId: string): Promise<number>;

  // Poll Votes
  /**
   * Records (or moves) a reader's vote on a poll block. A reader has at most
   * one vote per block; casting again replaces the previous choice.
   */
  castPollVote(vote: PollVoteRecord): Promise<PollVoteRecord>;
  /** Every recorded vote for a poll block, in cast order. */
  getPollVotes(blockId: string): Promise<PollVoteRecord[]>;
  /** The reader's current choice on a poll block, if any. */
  getUserPollVote(blockId: string, userId: string): Promise<string | null>;
}

/**
 * A single reader vote on a poll block.
 *
 * Votes are stored separately from the story payload so that the published
 * article never has to be rewritten as votes come in.
 */
export interface PollVoteRecord {
  id: string;
  storyId: string;
  blockId: string;
  pollId: string;
  optionId: string;
  userId: string;
  organizationId: string;
  createdAt: string;
}

export interface ReadingProgressRecord {
  userId: string;
  storyId: string;
  percentage: number;
  completed: boolean;
  updatedAt: string;
}
