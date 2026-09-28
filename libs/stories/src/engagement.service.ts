import type {
  Comment,
  CommentStatus,
  CommentAuthorRole,
  CreateCommentInput,
  ModerateCommentInput,
  StoryReactionType,
  StoryReactionsSummary,
  BookmarkItem,
} from '@ai-news/schemas';
import {
  CreateCommentInputSchema,
  ModerateCommentInputSchema,
} from '@ai-news/schemas';
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

function broadcastEngagement(eventName: string, data: unknown): void {
  if (_engagementBroadcast) {
    try {
      _engagementBroadcast('all', eventName, data);
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
    broadcastEngagement('comment.created', { storyId, comment: saved });
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
}
