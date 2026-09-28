import type { NewsroomUser, UserRole, UserStatus } from '@ai-news/schemas';
import type { IUserRepository, FollowRecord } from '../../interfaces/user.repository';

interface PrismaUserRow {
  id: string;
  organizationId: string;
  email: string;
  name: string;
  role: string;
  scopes?: string[];
  clientType?: string;
  status?: string;
  passwordHash?: string | null;
  bio?: string | null;
  avatarUrl?: string | null;
  preferences?: any;
  createdAt: Date;
  updatedAt: Date;
}

export class PrismaUserRepository implements IUserRepository {
  constructor(private readonly prismaGetter: () => Record<string, unknown>) {}

  private get prisma(): Record<string, unknown> {
    return this.prismaGetter();
  }

  private get userClient(): {
    create: (args: { data: Record<string, unknown> }) => Promise<PrismaUserRow>;
    update: (args: {
      where: Record<string, unknown>;
      data: Record<string, unknown>;
    }) => Promise<PrismaUserRow>;
    delete: (args: { where: Record<string, unknown> }) => Promise<PrismaUserRow>;
    findUnique: (args: { where: Record<string, unknown> }) => Promise<PrismaUserRow | null>;
    findFirst: (args: { where: Record<string, unknown> }) => Promise<PrismaUserRow | null>;
    findMany: (args: {
      where?: Record<string, unknown>;
      orderBy?: Record<string, unknown>;
    }) => Promise<PrismaUserRow[]>;
  } {
    return this.prisma.user as {
      create: (args: { data: Record<string, unknown> }) => Promise<PrismaUserRow>;
      update: (args: {
        where: Record<string, unknown>;
        data: Record<string, unknown>;
      }) => Promise<PrismaUserRow>;
      delete: (args: { where: Record<string, unknown> }) => Promise<PrismaUserRow>;
      findUnique: (args: { where: Record<string, unknown> }) => Promise<PrismaUserRow | null>;
      findFirst: (args: { where: Record<string, unknown> }) => Promise<PrismaUserRow | null>;
      findMany: (args: {
        where?: Record<string, unknown>;
        orderBy?: Record<string, unknown>;
      }) => Promise<PrismaUserRow[]>;
    };
  }

  private get followClient(): any {
    return (this.prisma as any)?.followRelationship;
  }

  private mapToNewsroomUser(row: PrismaUserRow): NewsroomUser {
    return {
      id: row.id,
      organizationId: row.organizationId,
      name: row.name,
      email: row.email,
      role: (row.role as UserRole) || 'journalist',
      clientType: (row.clientType as any) || 'human_web',
      status: (row.status as UserStatus) || 'active',
      passwordHash: row.passwordHash || undefined,
      preferences: row.preferences || undefined,
      bio: row.bio || undefined,
      avatarUrl: row.avatarUrl || undefined,
      createdAt:
        row.createdAt instanceof Date ? row.createdAt.toISOString() : String(row.createdAt),
      updatedAt:
        row.updatedAt instanceof Date ? row.updatedAt.toISOString() : String(row.updatedAt),
    };
  }

  async findById(id: string, orgId?: string): Promise<NewsroomUser | null> {
    const where: Record<string, unknown> = { id };
    if (orgId) where.organizationId = orgId;
    const row = await this.userClient.findFirst({ where });
    return row ? this.mapToNewsroomUser(row) : null;
  }

  async findByEmail(email: string, orgId?: string): Promise<NewsroomUser | null> {
    const where: Record<string, unknown> = { email };
    if (orgId) where.organizationId = orgId;
    const row = await this.userClient.findFirst({ where });
    return row ? this.mapToNewsroomUser(row) : null;
  }

  async list(orgId?: string): Promise<NewsroomUser[]> {
    const where = orgId ? { organizationId: orgId } : undefined;
    const rows = await this.userClient.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((r) => this.mapToNewsroomUser(r));
  }

  async create(user: NewsroomUser): Promise<NewsroomUser> {
    const row = await this.userClient.create({
      data: {
        id: user.id,
        organizationId: user.organizationId,
        email: user.email,
        name: user.name,
        role: user.role,
        clientType: user.clientType,
        status: user.status,
        passwordHash: user.passwordHash,
        preferences: user.preferences,
        bio: user.bio,
        avatarUrl: user.avatarUrl,
        createdAt: new Date(user.createdAt),
        updatedAt: new Date(user.updatedAt),
      },
    });
    return this.mapToNewsroomUser(row);
  }

  async update(user: NewsroomUser): Promise<NewsroomUser> {
    const row = await this.userClient.update({
      where: { id: user.id },
      data: {
        name: user.name,
        email: user.email,
        role: user.role,
        clientType: user.clientType,
        status: user.status,
        passwordHash: user.passwordHash,
        preferences: user.preferences,
        bio: user.bio,
        avatarUrl: user.avatarUrl,
        updatedAt: new Date(user.updatedAt),
      },
    });
    return this.mapToNewsroomUser(row);
  }

  async delete(id: string, orgId?: string): Promise<boolean> {
    try {
      const where: Record<string, unknown> = { id };
      if (orgId) where.organizationId = orgId;
      await this.userClient.delete({ where });
      return true;
    } catch {
      return false;
    }
  }

  // ---------------------------------------------------------------------------
  // Following Interests (F17)
  // ---------------------------------------------------------------------------
  private follows = new Map<string, FollowRecord>();

  async followTarget(
    userId: string,
    targetType: 'topic' | 'entity' | 'author',
    targetId: string
  ): Promise<FollowRecord> {
    const now = new Date().toISOString();
    const record: FollowRecord = {
      userId,
      targetType,
      targetId,
      createdAt: now,
    };

    if (this.followClient) {
      try {
        await this.followClient.upsert({
          where: {
            userId_targetType_targetId: {
              userId,
              targetType,
              targetId,
            },
          },
          create: {
            userId,
            targetType,
            targetId,
            createdAt: new Date(now),
          },
          update: {},
        });
        return record;
      } catch {
        // Fallback to memory below
      }
    }

    const key = `${userId}:${targetType}:${targetId}`;
    this.follows.set(key, record);
    return record;
  }

  async unfollowTarget(
    userId: string,
    targetType: 'topic' | 'entity' | 'author',
    targetId: string
  ): Promise<boolean> {
    if (this.followClient) {
      try {
        await this.followClient.deleteMany({
          where: { userId, targetType, targetId },
        });
        return true;
      } catch {
        // Fallback to memory
      }
    }

    const key = `${userId}:${targetType}:${targetId}`;
    return this.follows.delete(key);
  }

  async listFollowing(
    userId: string,
    targetType?: 'topic' | 'entity' | 'author'
  ): Promise<FollowRecord[]> {
    if (this.followClient) {
      try {
        const where: Record<string, unknown> = { userId };
        if (targetType) where.targetType = targetType;
        const rows = await this.followClient.findMany({
          where,
          orderBy: { createdAt: 'desc' },
        });
        return rows.map((r: any) => ({
          userId: r.userId,
          targetType: r.targetType as 'topic' | 'entity' | 'author',
          targetId: r.targetId,
          createdAt: r.createdAt instanceof Date ? r.createdAt.toISOString() : String(r.createdAt),
        }));
      } catch {
        // Fallback to memory below
      }
    }

    const list: FollowRecord[] = [];
    for (const record of this.follows.values()) {
      if (record.userId === userId) {
        if (!targetType || record.targetType === targetType) {
          list.push({ ...record });
        }
      }
    }
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async isFollowing(
    userId: string,
    targetType: 'topic' | 'entity' | 'author',
    targetId: string
  ): Promise<boolean> {
    if (this.followClient) {
      try {
        const row = await this.followClient.findFirst({
          where: { userId, targetType, targetId },
        });
        return Boolean(row);
      } catch {
        // Fallback to memory
      }
    }

    const key = `${userId}:${targetType}:${targetId}`;
    return this.follows.has(key);
  }
}
