import type {
  Comment,
  CommentStatus,
  CommentAuthorRole,
  StoryReactionType,
  StoryReactionsSummary,
  BookmarkItem,
} from '@ai-news/schemas';
import type { IEngagementRepository, ReadingProgressRecord } from '../../interfaces/engagement.repository';

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

  // ---------------------------------------------------------------------------
  // Reading Progress & History
  // ---------------------------------------------------------------------------
  private progressMap = new Map<string, ReadingProgressRecord>();

  private get progressClient(): any {
    return (this.prisma as any)?.readingProgress;
  }

  private get shareClient(): any {
    return (this.prisma as any)?.storyShare;
  }

  async saveReadingProgress(
    userId: string,
    storyId: string,
    percentage: number,
    completed?: boolean
  ): Promise<ReadingProgressRecord> {
    const clamped = Math.max(0, Math.min(100, Math.round(percentage)));
    const isCompleted = completed !== undefined ? completed : clamped >= 90;
    const now = new Date();
    const record: ReadingProgressRecord = {
      userId,
      storyId,
      percentage: clamped,
      completed: isCompleted,
      updatedAt: now.toISOString(),
    };

    if (this.progressClient) {
      try {
        await this.progressClient.upsert({
          where: { userId_storyId: { userId, storyId } },
          create: {
            userId,
            storyId,
            percentage: clamped,
            completed: isCompleted,
            updatedAt: now,
          },
          update: {
            percentage: clamped,
            completed: isCompleted,
            updatedAt: now,
          },
        });
        return record;
      } catch {
        // Fallback to memory below
      }
    }

    this.progressMap.set(`${userId}:${storyId}`, record);
    return record;
  }

  async getReadingProgress(userId: string, storyId: string): Promise<ReadingProgressRecord | null> {
    if (this.progressClient) {
      try {
        const row = await this.progressClient.findUnique({
          where: { userId_storyId: { userId, storyId } },
        });
        if (row) {
          return {
            userId: row.userId,
            storyId: row.storyId,
            percentage: row.percentage,
            completed: row.completed,
            updatedAt: row.updatedAt instanceof Date ? row.updatedAt.toISOString() : String(row.updatedAt),
          };
        }
      } catch {
        // Fallback to memory below
      }
    }
    return this.progressMap.get(`${userId}:${storyId}`) || null;
  }

  async listReadingHistory(userId: string, limit: number = 50): Promise<ReadingProgressRecord[]> {
    if (this.progressClient) {
      try {
        const rows = await this.progressClient.findMany({
          where: { userId },
          orderBy: { updatedAt: 'desc' },
          take: limit,
        });
        if (rows && rows.length > 0) {
          return rows.map((r: any) => ({
            userId: r.userId,
            storyId: r.storyId,
            percentage: r.percentage,
            completed: r.completed,
            updatedAt: r.updatedAt instanceof Date ? r.updatedAt.toISOString() : String(r.updatedAt),
          }));
        }
      } catch {
        // Fallback to memory below
      }
    }

    const list: ReadingProgressRecord[] = [];
    for (const record of this.progressMap.values()) {
      if (record.userId === userId) list.push(record);
    }
    return list
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, limit);
  }

  // ---------------------------------------------------------------------------
  // Social Shares (F15)
  // ---------------------------------------------------------------------------
  private shareCounts = new Map<string, number>();

  async recordShare(storyId: string, platform?: string, userId?: string): Promise<{ shareCount: number }> {
    if (this.shareClient) {
      try {
        await this.shareClient.create({
          data: {
            storyId,
            platform: platform || null,
            userId: userId || null,
            createdAt: new Date(),
          },
        });
        const count = await this.shareClient.count({
          where: { storyId },
        });
        return { shareCount: count };
      } catch {
        // Fallback to memory below
      }
    }

    const count = (this.shareCounts.get(storyId) || 0) + 1;
    this.shareCounts.set(storyId, count);
    return { shareCount: count };
  }

  async getShareCount(storyId: string): Promise<number> {
    if (this.shareClient) {
      try {
        return await this.shareClient.count({ where: { storyId } });
      } catch {
        // Fallback to memory below
      }
    }
    return this.shareCounts.get(storyId) || 0;
  }
}
