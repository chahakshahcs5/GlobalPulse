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
  bio?: string | null;
  avatarUrl?: string | null;
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
    update: (args: { where: Record<string, unknown>; data: Record<string, unknown> }) => Promise<PrismaUserRow>;
    delete: (args: { where: Record<string, unknown> }) => Promise<PrismaUserRow>;
    findUnique: (args: { where: Record<string, unknown> }) => Promise<PrismaUserRow | null>;
    findFirst: (args: { where: Record<string, unknown> }) => Promise<PrismaUserRow | null>;
    findMany: (args: { where?: Record<string, unknown>; orderBy?: Record<string, unknown> }) => Promise<PrismaUserRow[]>;
  } {
    return this.prisma.user as {
      create: (args: { data: Record<string, unknown> }) => Promise<PrismaUserRow>;
      update: (args: { where: Record<string, unknown>; data: Record<string, unknown> }) => Promise<PrismaUserRow>;
      delete: (args: { where: Record<string, unknown> }) => Promise<PrismaUserRow>;
      findUnique: (args: { where: Record<string, unknown> }) => Promise<PrismaUserRow | null>;
      findFirst: (args: { where: Record<string, unknown> }) => Promise<PrismaUserRow | null>;
      findMany: (args: { where?: Record<string, unknown>; orderBy?: Record<string, unknown> }) => Promise<PrismaUserRow[]>;
    };
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
      bio: row.bio || undefined,
      avatarUrl: row.avatarUrl || undefined,
      createdAt: row.createdAt instanceof Date ? row.createdAt.toISOString() : String(row.createdAt),
      updatedAt: row.updatedAt instanceof Date ? row.updatedAt.toISOString() : String(row.updatedAt),
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
    const key = `${userId}:${targetType}:${targetId}`;
    const record: FollowRecord = {
      userId,
      targetType,
      targetId,
      createdAt: new Date().toISOString(),
    };
    this.follows.set(key, record);
    return record;
  }

  async unfollowTarget(
    userId: string,
    targetType: 'topic' | 'entity' | 'author',
    targetId: string
  ): Promise<boolean> {
    const key = `${userId}:${targetType}:${targetId}`;
    return this.follows.delete(key);
  }

  async listFollowing(
    userId: string,
    targetType?: 'topic' | 'entity' | 'author'
  ): Promise<FollowRecord[]> {
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
    const key = `${userId}:${targetType}:${targetId}`;
    return this.follows.has(key);
  }
}
