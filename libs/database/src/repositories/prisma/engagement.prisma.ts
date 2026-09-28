import type {
  Comment,
  CommentStatus,
  CommentAuthorRole,
  StoryReactionType,
  StoryReactionsSummary,
  BookmarkItem,
} from '@ai-news/schemas';
import type { IEngagementRepository } from '../../interfaces/engagement.repository';

interface PrismaCommentRow {
  id: string;
  storyId: string;
  organizationId: string;
  authorId: string;
  authorName: string;
  authorRole: string;
  content: string;
  parentId?: string | null;
  status: string;
  likesCount: number;
  moderationReason?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface PrismaReactionRow {
  id: string;
  storyId: string;
  userId: string;
  organizationId: string;
  reactionType: string;
  createdAt: Date;
}

interface PrismaBookmarkRow {
  id: string;
  storyId: string;
  userId: string;
  organizationId: string;
  createdAt: Date;
}

export class PrismaEngagementRepository implements IEngagementRepository {
  constructor(private readonly prismaGetter: () => Record<string, unknown>) {}

  private get prisma(): Record<string, unknown> {
    return this.prismaGetter();
  }

  private get commentClient(): {
    create: (args: { data: Record<string, unknown> }) => Promise<PrismaCommentRow>;
    update: (args: { where: Record<string, unknown>; data: Record<string, unknown> }) => Promise<PrismaCommentRow>;
    delete: (args: { where: Record<string, unknown> }) => Promise<PrismaCommentRow>;
    findUnique: (args: { where: Record<string, unknown> }) => Promise<PrismaCommentRow | null>;
    findMany: (args: { where: Record<string, unknown>; orderBy?: Record<string, unknown> }) => Promise<PrismaCommentRow[]>;
  } {
    return this.prisma.comment as any;
  }

  private get reactionClient(): {
    create: (args: { data: Record<string, unknown> }) => Promise<PrismaReactionRow>;
    delete: (args: { where: Record<string, unknown> }) => Promise<PrismaReactionRow>;
    findFirst: (args: { where: Record<string, unknown> }) => Promise<PrismaReactionRow | null>;
    findMany: (args: { where: Record<string, unknown> }) => Promise<PrismaReactionRow[]>;
  } {
    return this.prisma.storyReaction as any;
  }

  private get bookmarkClient(): {
    create: (args: { data: Record<string, unknown> }) => Promise<PrismaBookmarkRow>;
    delete: (args: { where: Record<string, unknown> }) => Promise<PrismaBookmarkRow>;
    findFirst: (args: { where: Record<string, unknown> }) => Promise<PrismaBookmarkRow | null>;
    findMany: (args: { where: Record<string, unknown>; orderBy?: Record<string, unknown> }) => Promise<PrismaBookmarkRow[]>;
  } {
    return this.prisma.bookmark as any;
  }

  private mapComment(row: PrismaCommentRow): Comment {
    return {
      id: row.id,
      storyId: row.storyId,
      organizationId: row.organizationId,
      authorId: row.authorId,
      authorName: row.authorName,
      authorRole: (row.authorRole as CommentAuthorRole) || 'reader',
      content: row.content,
      parentId: row.parentId || undefined,
      status: (row.status as CommentStatus) || 'approved',
      likesCount: row.likesCount || 0,
      moderationReason: row.moderationReason || undefined,
      createdAt: row.createdAt instanceof Date ? row.createdAt.toISOString() : String(row.createdAt),
      updatedAt: row.updatedAt instanceof Date ? row.updatedAt.toISOString() : String(row.updatedAt),
    };
  }

  async findCommentsByStory(
    storyId: string,
    options?: { status?: CommentStatus; organizationId?: string }
  ): Promise<Comment[]> {
    const where: Record<string, unknown> = { storyId };
    if (options?.organizationId) where.organizationId = options.organizationId;
    if (options?.status) where.status = options.status;

    const rows = await this.commentClient.findMany({
      where,
      orderBy: { createdAt: 'asc' },
    });
    return rows.map((r) => this.mapComment(r));
  }

  async findCommentById(id: string): Promise<Comment | null> {
    const row = await this.commentClient.findUnique({ where: { id } });
    return row ? this.mapComment(row) : null;
  }

  async createComment(comment: Comment): Promise<Comment> {
    const row = await this.commentClient.create({
      data: {
        id: comment.id,
        storyId: comment.storyId,
        organizationId: comment.organizationId,
        authorId: comment.authorId,
        authorName: comment.authorName,
        authorRole: comment.authorRole,
        content: comment.content,
        parentId: comment.parentId,
        status: comment.status,
        likesCount: comment.likesCount,
        moderationReason: comment.moderationReason,
        createdAt: new Date(comment.createdAt),
        updatedAt: new Date(comment.updatedAt),
      },
    });
    return this.mapComment(row);
  }

  async updateComment(comment: Comment): Promise<Comment> {
    const row = await this.commentClient.update({
      where: { id: comment.id },
      data: {
        content: comment.content,
        status: comment.status,
        likesCount: comment.likesCount,
        moderationReason: comment.moderationReason,
        updatedAt: new Date(comment.updatedAt),
      },
    });
    return this.mapComment(row);
  }

  async deleteComment(id: string): Promise<boolean> {
    try {
      await this.commentClient.delete({ where: { id } });
      return true;
    } catch {
      return false;
    }
  }

  async toggleReaction(
    storyId: string,
    userId: string,
    organizationId: string,
    reactionType: StoryReactionType
  ): Promise<{ active: boolean; summary: StoryReactionsSummary }> {
    const existing = await this.reactionClient.findFirst({
      where: { storyId, userId, reactionType },
    });

    let active = false;
    if (existing) {
      await this.reactionClient.delete({ where: { id: existing.id } });
      active = false;
    } else {
      const id = `rxn_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      await this.reactionClient.create({
        data: {
          id,
          storyId,
          userId,
          organizationId,
          reactionType,
          createdAt: new Date(),
        },
      });
      active = true;
    }

    const summary = await this.getReactions(storyId, userId);
    return { active, summary };
  }

  async getReactions(storyId: string, userId?: string): Promise<StoryReactionsSummary> {
    const allReactions = await this.reactionClient.findMany({
      where: { storyId },
    });

    const counts: Record<StoryReactionType, number> = {
      like: 0,
      insightful: 0,
      important: 0,
      heart: 0,
    };

    const userReactions: StoryReactionType[] = [];

    for (const rxn of allReactions) {
      const t = rxn.reactionType as StoryReactionType;
      if (counts[t] !== undefined) {
        counts[t]++;
      }
      if (userId && rxn.userId === userId) {
        userReactions.push(t);
      }
    }

    return {
      storyId,
      counts,
      userReactions,
    };
  }

  async toggleBookmark(
    userId: string,
    storyId: string,
    organizationId: string
  ): Promise<{ bookmarked: boolean; bookmark?: BookmarkItem }> {
    const existing = await this.bookmarkClient.findFirst({
      where: { userId, storyId },
    });

    if (existing) {
      await this.bookmarkClient.delete({ where: { id: existing.id } });
      return { bookmarked: false };
    } else {
      const id = `bm_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      const now = new Date();
      await this.bookmarkClient.create({
        data: {
          id,
          storyId,
          userId,
          organizationId,
          createdAt: now,
        },
      });
      const item: BookmarkItem = {
        id,
        storyId,
        userId,
        organizationId,
        createdAt: now.toISOString(),
      };
      return { bookmarked: true, bookmark: item };
    }
  }

  async listBookmarks(userId: string, organizationId?: string): Promise<BookmarkItem[]> {
    const where: Record<string, unknown> = { userId };
    if (organizationId) where.organizationId = organizationId;

    const rows = await this.bookmarkClient.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return rows.map((r) => ({
      id: r.id,
      storyId: r.storyId,
      userId: r.userId,
      organizationId: r.organizationId,
      createdAt: r.createdAt instanceof Date ? r.createdAt.toISOString() : String(r.createdAt),
    }));
  }
}
