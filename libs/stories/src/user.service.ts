import type { DatabaseService } from '@ai-news/database';
import type { NewsroomUser, UserRole, InviteUserInput } from '@ai-news/schemas';
import { generateId, NotFoundError, ConflictError } from '@ai-news/shared';
import type { StoryContext } from './story.service';

export class UserService {
  constructor(private readonly db: DatabaseService) {}

  async listUsers(orgId: string = 'org_default'): Promise<NewsroomUser[]> {
    return this.db.users.list(orgId);
  }

  async getUser(userId: string, orgId: string = 'org_default'): Promise<NewsroomUser> {
    const user = await this.db.users.findById(userId, orgId);
    if (!user) {
      throw new NotFoundError('Newsroom user', userId);
    }
    return user;
  }

  async assignRole(userId: string, role: UserRole, ctx: StoryContext): Promise<NewsroomUser> {
    const user = await this.getUser(userId, ctx.organizationId);
    const oldRole = user.role;
    user.role = role;
    user.updatedAt = new Date().toISOString();

    const saved = await this.db.runInTransaction(async () => {
      const updated = await this.db.users.update(user);

      await this.db.audit.log({
        id: generateId('aud'),
        organizationId: ctx.organizationId,
        userId: ctx.authorId,
        clientType: ctx.clientType,
        action: `${ctx.createdVia || 'mcp'}.assign_user_role`,
        resourceType: 'user',
        resourceId: userId,
        payloadSummary: { email: user.email, oldRole, newRole: role },
        requestId: ctx.requestId,
        status: 'SUCCESS',
        timestamp: user.updatedAt,
      });

      return updated;
    });

    return saved;
  }

  async inviteUser(input: InviteUserInput, ctx: StoryContext): Promise<NewsroomUser> {
    const existing = await this.db.users.findByEmail(input.email, ctx.organizationId);
    if (existing) {
      throw new ConflictError(`User with email "${input.email}" already exists.`);
    }

    const now = new Date().toISOString();
    const newUser: NewsroomUser = {
      id: generateId('usr'),
      organizationId: ctx.organizationId,
      name: input.name,
      email: input.email.toLowerCase(),
      role: input.role,
      clientType: input.clientType,
      status: 'invited',
      bio: input.bio,
      createdAt: now,
      updatedAt: now,
    };

    const saved = await this.db.runInTransaction(async () => {
      const created = await this.db.users.create(newUser);

      await this.db.audit.log({
        id: generateId('aud'),
        organizationId: ctx.organizationId,
        userId: ctx.authorId,
        clientType: ctx.clientType,
        action: `${ctx.createdVia || 'mcp'}.invite_user`,
        resourceType: 'user',
        resourceId: created.id,
        payloadSummary: { email: input.email, role: input.role, name: input.name },
        requestId: ctx.requestId,
        status: 'SUCCESS',
        timestamp: now,
      });

      return created;
    });

    return saved;
  }
}
