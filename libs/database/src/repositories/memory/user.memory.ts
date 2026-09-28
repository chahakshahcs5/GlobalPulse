import type { NewsroomUser } from '@ai-news/schemas';
import type { IUserRepository } from '../../interfaces/user.repository';

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

  snapshot(): Map<string, NewsroomUser> {
    return new Map(Array.from(this.users.entries()).map(([k, v]) => [k, { ...v }]));
  }

  restore(snap: Map<string, NewsroomUser>): void {
    this.users = new Map(Array.from(snap.entries()).map(([k, v]) => [k, { ...v }]));
  }

  clear(): void {
    this.users.clear();
    this.seedBaselineUsers();
  }
}
