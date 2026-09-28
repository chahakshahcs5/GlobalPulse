import type {
  Comment,
  CommentStatus,
  StoryReaction,
  StoryReactionType,
  StoryReactionsSummary,
  BookmarkItem,
} from '@ai-news/schemas';
import type { IEngagementRepository, ReadingProgressRecord } from '../../interfaces/engagement.repository';

export class MemoryEngagementRepository implements IEngagementRepository {
  private comments = new Map<string, Comment>(); // commentId -> Comment
  private reactions = new Map<string, StoryReaction>(); // reactionId -> Reaction
  private bookmarks = new Map<string, BookmarkItem>(); // bookmarkId -> BookmarkItem
  private progress = new Map<string, ReadingProgressRecord>(); // `${userId}:${storyId}` -> ReadingProgressRecord

  // ---------------------------------------------------------------------------
  // Comments
  // ---------------------------------------------------------------------------

  async findCommentsByStory(
    storyId: string,
    options?: { status?: CommentStatus; organizationId?: string }
  ): Promise<Comment[]> {
    const list: Comment[] = [];
    for (const comment of this.comments.values()) {
      if (comment.storyId !== storyId) continue;
      if (options?.organizationId && comment.organizationId !== options.organizationId) continue;
      if (options?.status && comment.status !== options.status) continue;
      list.push({ ...comment });
    }
    // Chronological order: older first for reading conversation
    return list.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }

  async findCommentById(id: string): Promise<Comment | null> {
    const comment = this.comments.get(id);
    return comment ? { ...comment } : null;
  }

  async createComment(comment: Comment): Promise<Comment> {
    this.comments.set(comment.id, { ...comment });
    return { ...comment };
  }

  async updateComment(comment: Comment): Promise<Comment> {
    if (!this.comments.has(comment.id)) {
      throw new Error(`Comment with id ${comment.id} not found`);
    }
    this.comments.set(comment.id, { ...comment });
    return { ...comment };
  }

  async deleteComment(id: string): Promise<boolean> {
    return this.comments.delete(id);
  }

  // ---------------------------------------------------------------------------
  // Reactions
  // ---------------------------------------------------------------------------

  async toggleReaction(
    storyId: string,
    userId: string,
    organizationId: string,
    reactionType: StoryReactionType
  ): Promise<{ active: boolean; summary: StoryReactionsSummary }> {
    // Find existing reaction of this type by this user on this story
    let existingKey: string | null = null;
    for (const [key, reaction] of this.reactions.entries()) {
      if (
        reaction.storyId === storyId &&
        reaction.userId === userId &&
        reaction.reactionType === reactionType
      ) {
        existingKey = key;
        break;
      }
    }

    let active = false;
    if (existingKey) {
      this.reactions.delete(existingKey);
      active = false;
    } else {
      const id = `rxn_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      const reaction: StoryReaction = {
        id,
        storyId,
        userId,
        organizationId,
        reactionType,
        createdAt: new Date().toISOString(),
      };
      this.reactions.set(id, reaction);
      active = true;
    }

    const summary = await this.getReactions(storyId, userId);
    return { active, summary };
  }

  async getReactions(storyId: string, userId?: string): Promise<StoryReactionsSummary> {
    const counts: Record<string, number> = {
      like: 0,
      insightful: 0,
      important: 0,
      heart: 0,
    };
    const userReactions: StoryReactionType[] = [];

    for (const reaction of this.reactions.values()) {
      if (reaction.storyId === storyId) {
        counts[reaction.reactionType] = (counts[reaction.reactionType] || 0) + 1;
        if (userId && reaction.userId === userId) {
          userReactions.push(reaction.reactionType);
        }
      }
    }

    return {
      storyId,
      counts,
      userReactions,
    };
  }

  // ---------------------------------------------------------------------------
  // Bookmarks
  // ---------------------------------------------------------------------------

  async toggleBookmark(
    userId: string,
    storyId: string,
    organizationId: string
  ): Promise<{ bookmarked: boolean; bookmark?: BookmarkItem }> {
    let existingKey: string | null = null;
    for (const [key, bm] of this.bookmarks.entries()) {
      if (bm.userId === userId && bm.storyId === storyId) {
        existingKey = key;
        break;
      }
    }

    if (existingKey) {
      this.bookmarks.delete(existingKey);
      return { bookmarked: false };
    } else {
      const id = `bmk_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      const item: BookmarkItem = {
        id,
        storyId,
        userId,
        organizationId,
        createdAt: new Date().toISOString(),
      };
      this.bookmarks.set(id, item);
      return { bookmarked: true, bookmark: item };
    }
  }

  async listBookmarks(userId: string, organizationId?: string): Promise<BookmarkItem[]> {
    const list: BookmarkItem[] = [];
    for (const bm of this.bookmarks.values()) {
      if (bm.userId !== userId) continue;
      if (organizationId && bm.organizationId !== organizationId) continue;
      list.push({ ...bm });
    }
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  // ---------------------------------------------------------------------------
  // Reading Progress & History
  // ---------------------------------------------------------------------------

  async saveReadingProgress(
    userId: string,
    storyId: string,
    percentage: number,
    completed?: boolean
  ): Promise<ReadingProgressRecord> {
    const key = `${userId}:${storyId}`;
    const clamped = Math.max(0, Math.min(100, Math.round(percentage)));
    const isCompleted = completed !== undefined ? completed : clamped >= 90;
    const record: ReadingProgressRecord = {
      userId,
      storyId,
      percentage: clamped,
      completed: isCompleted,
      updatedAt: new Date().toISOString(),
    };
    this.progress.set(key, record);
    return { ...record };
  }

  async getReadingProgress(userId: string, storyId: string): Promise<ReadingProgressRecord | null> {
    const record = this.progress.get(`${userId}:${storyId}`);
    return record ? { ...record } : null;
  }

  async listReadingHistory(userId: string, limit: number = 50): Promise<ReadingProgressRecord[]> {
    const list: ReadingProgressRecord[] = [];
    for (const record of this.progress.values()) {
      if (record.userId === userId) {
        list.push({ ...record });
      }
    }
    list.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    return list.slice(0, limit);
  }

  // Social Shares (F15)
  private shares: Map<string, number> = new Map();

  async recordShare(storyId: string, _platform?: string, _userId?: string): Promise<{ shareCount: number }> {
    const current = this.shares.get(storyId) || 0;
    const next = current + 1;
    this.shares.set(storyId, next);
    return { shareCount: next };
  }

  async getShareCount(storyId: string): Promise<number> {
    return this.shares.get(storyId) || 0;
  }

  snapshot(): {
    comments: Map<string, Comment>;
    reactions: Map<string, StoryReaction>;
    bookmarks: Map<string, BookmarkItem>;
    progress: Map<string, ReadingProgressRecord>;
    shares: Map<string, number>;
  } {
    return {
      comments: new Map(this.comments),
      reactions: new Map(this.reactions),
      bookmarks: new Map(this.bookmarks),
      progress: new Map(this.progress),
      shares: new Map(this.shares),
    };
  }

  restore(snapshot: {
    comments: Map<string, Comment>;
    reactions: Map<string, StoryReaction>;
    bookmarks: Map<string, BookmarkItem>;
    progress?: Map<string, ReadingProgressRecord>;
    shares?: Map<string, number>;
  }): void {
    this.comments = new Map(snapshot.comments);
    this.reactions = new Map(snapshot.reactions);
    this.bookmarks = new Map(snapshot.bookmarks);
    if (snapshot.progress) {
      this.progress = new Map(snapshot.progress);
    }
    if (snapshot.shares) {
      this.shares = new Map(snapshot.shares);
    }
  }

  clear(): void {
    this.comments.clear();
    this.reactions.clear();
    this.bookmarks.clear();
    this.progress.clear();
    this.shares.clear();
  }
}
