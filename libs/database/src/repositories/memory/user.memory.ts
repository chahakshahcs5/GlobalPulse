import type { NewsroomUser } from '@ai-news/schemas';
import type { IUserRepository, FollowRecord } from '../../interfaces/user.repository';

export class MemoryUserRepository implements IUserRepository {
  private users = new Map<string, NewsroomUser>();

  constructor() {
    this.seedBaselineUsers();
  }

  private seedBaselineUsers(): void {
    const now = new Date().toISOString();
    const baselineUsers: NewsroomUser[] = [
      {
        id: 'usr_admin',
        organizationId: 'org_default',
        name: 'Elena Rostova',
        email: 'admin@news.platform',
        role: 'admin',
        clientType: 'human_web',
        status: 'active',
        bio: 'Editor-in-Chief & Lead Newsroom Administrator',
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'usr_editor',
        organizationId: 'org_default',
        name: 'Marcus Vance',
        email: 'editor@news.platform',
        role: 'editor',
        clientType: 'human_web',
        status: 'active',
        bio: 'Senior Managing Editor for Global Desk',
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'usr_journalist_1',
        organizationId: 'org_default',
        name: 'Sarah Chen',
        email: 'journalist@news.platform',
        role: 'journalist',
        clientType: 'human_web',
        status: 'active',
        bio: 'Senior Technology & AI Investigative Reporter',
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'usr_gemini_agent',
        organizationId: 'org_default',
        name: 'Gemini Newsroom AI',
        email: 'gemini@ai.globalpulse.news',
        role: 'ai_agent',
        clientType: 'gemini_spark',
        status: 'active',
        bio: 'Autonomous investigative reporter powered by Gemini 2.5 Flash',
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'usr_chatgpt_agent',
        organizationId: 'org_default',
        name: 'ChatGPT FactChecker AI',
        email: 'chatgpt@ai.globalpulse.news',
        role: 'ai_agent',
        clientType: 'chatgpt',
        status: 'active',
        bio: 'Research and real-time fact-checking agent',
        createdAt: now,
        updatedAt: now,
      },
    ];

    for (const u of baselineUsers) {
      this.users.set(u.id, u);
    }
  }

  async findById(id: string, orgId?: string): Promise<NewsroomUser | null> {
    const user = this.users.get(id);
    if (!user) return null;
    if (orgId && user.organizationId !== orgId) return null;
    return { ...user };
  }

  async findByEmail(email: string, orgId?: string): Promise<NewsroomUser | null> {
    for (const u of this.users.values()) {
      if (u.email.toLowerCase() === email.toLowerCase() && (!orgId || u.organizationId === orgId)) {
        return { ...u };
      }
    }
    return null;
  }

  async list(orgId?: string): Promise<NewsroomUser[]> {
    const all = Array.from(this.users.values());
    if (orgId) {
      return all.filter((u) => u.organizationId === orgId).map((u) => ({ ...u }));
    }
    return all.map((u) => ({ ...u }));
  }

  async create(user: NewsroomUser): Promise<NewsroomUser> {
    if (this.users.has(user.id)) {
      throw new Error(`User with id "${user.id}" already exists`);
    }
    this.users.set(user.id, { ...user });
    return { ...user };
  }

  async update(user: NewsroomUser): Promise<NewsroomUser> {
    if (!this.users.has(user.id)) {
      throw new Error(`User with id "${user.id}" does not exist`);
    }
    this.users.set(user.id, { ...user, updatedAt: new Date().toISOString() });
    return { ...user };
  }

  async delete(id: string, orgId?: string): Promise<boolean> {
    const u = this.users.get(id);
    if (!u) return false;
    if (orgId && u.organizationId !== orgId) return false;
    return this.users.delete(id);
  }

  // ---------------------------------------------------------------------------
  // Following Interests (F17)
  // ---------------------------------------------------------------------------
  private follows = new Map<string, FollowRecord>(); // `${userId}:${targetType}:${targetId}` -> FollowRecord

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
    return { ...record };
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

  snapshot(): { users: Map<string, NewsroomUser>; follows: Map<string, FollowRecord> } {
    return {
      users: new Map(this.users),
      follows: new Map(this.follows),
    };
  }

  restore(snap: any): void {
    if (snap instanceof Map) {
      this.users = new Map(snap);
    } else if (snap && snap.users) {
      this.users = new Map(snap.users);
      if (snap.follows) {
        this.follows = new Map(snap.follows);
      }
    }
  }

  clear(): void {
    this.users.clear();
    this.follows.clear();
    this.seedBaselineUsers();
  }
}
