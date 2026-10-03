import type { DatabaseService, FollowRecord } from '@ai-news/database';
import type {
  NewsroomUser,
  UserRole,
  InviteUserInput,
  RegisterUserInput,
  LoginInput,
  UpdatePreferencesInput,
} from '@ai-news/schemas';
import {
  RegisterUserInputSchema,
  LoginInputSchema,
  UpdatePreferencesInputSchema,
} from '@ai-news/schemas';
import { generateId, NotFoundError, ConflictError, UnauthorizedError } from '@ai-news/shared';
import { PasswordHasher, AuthService, ROLE_PERMISSIONS } from '@ai-news/auth';
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

  /**
   * F1: User Registration
   */
  async register(input: RegisterUserInput): Promise<{ user: NewsroomUser; token: string }> {
    const validated = RegisterUserInputSchema.parse(input);
    const existing = await this.db.users.findByEmail(validated.email, validated.organizationId);
    if (existing) {
      throw new ConflictError(`User with email "${validated.email}" is already registered.`);
    }

    const passwordHash = PasswordHasher.hash(validated.password);
    const now = new Date().toISOString();
    const userId = generateId('usr');

    const newUser: NewsroomUser = {
      id: userId,
      organizationId: validated.organizationId,
      name: validated.name,
      email: validated.email.toLowerCase(),
      role: 'reader',
      clientType: 'human_web',
      status: 'active',
      passwordHash,
      preferences: {
        categories: [],
        emailFrequency: 'daily',
        readingHistoryEnabled: true,
        theme: 'system',
      },
      createdAt: now,
      updatedAt: now,
    };

    const created = await this.db.users.create(newUser);

    const token = AuthService.generateToken({
      id: created.id,
      organizationId: created.organizationId,
      role: created.role,
      email: created.email,
      clientType: created.clientType,
      scopes: ROLE_PERMISSIONS[created.role],
    });

    return { user: created, token };
  }

  /**
   * F1: User Login
   */
  async login(input: LoginInput): Promise<{ user: NewsroomUser; token: string }> {
    const validated = LoginInputSchema.parse(input);
    const user = await this.db.users.findByEmail(validated.email, validated.organizationId);
    if (!user) {
      throw new UnauthorizedError('Invalid email or password.');
    }

    // Reject login if user has no passwordHash set (e.g. passwordless/OAuth-only account)
    if (!user.passwordHash) {
      throw new UnauthorizedError('Invalid email or password.');
    }

    const isValid = PasswordHasher.verify(validated.password, user.passwordHash);
    if (!isValid) {
      throw new UnauthorizedError('Invalid email or password.');
    }

    const token = AuthService.generateToken({
      id: user.id,
      organizationId: user.organizationId,
      role: user.role,
      email: user.email,
      clientType: user.clientType,
      scopes: ROLE_PERMISSIONS[user.role],
    });

    return { user, token };
  }

  /**
   * F1: User Preferences Update
   */
  async updatePreferences(
    userId: string,
    input: UpdatePreferencesInput,
    orgId: string = 'org_default'
  ): Promise<NewsroomUser> {
    const validated = UpdatePreferencesInputSchema.parse(input);
    const user = await this.getUser(userId, orgId);

    const currentPrefs = user.preferences || {
      categories: [],
      emailFrequency: 'daily',
      readingHistoryEnabled: true,
      theme: 'system',
    };

    user.preferences = {
      categories:
        validated.categories !== undefined ? validated.categories : currentPrefs.categories,
      emailFrequency:
        validated.emailFrequency !== undefined
          ? validated.emailFrequency
          : currentPrefs.emailFrequency,
      readingHistoryEnabled:
        validated.readingHistoryEnabled !== undefined
          ? validated.readingHistoryEnabled
          : currentPrefs.readingHistoryEnabled,
      theme: validated.theme !== undefined ? validated.theme : currentPrefs.theme,
    };
    user.updatedAt = new Date().toISOString();

    return this.db.users.update(user);
  }

  /**
   * F17: Follow Topics, Entities, Authors & Sources
   */
  async followTarget(
    userId: string,
    targetType: 'topic' | 'entity' | 'author' | 'source',
    targetId: string
  ): Promise<FollowRecord> {
    const record = await this.db.users.followTarget(userId, targetType, targetId);
    if (targetType === 'source') {
      try {
        let pub = await this.db.publishers.findById(targetId);
        if (!pub) {
          const list = await this.db.publishers.list('org_default');
          pub = list.find((p) => p.slug === targetId || p.domain === targetId) || null;
        }
        if (pub) {
          pub.followerCount = (pub.followerCount || 0) + 1;
          await this.db.publishers.update(pub);
        }
      } catch {}
    }
    return record;
  }

  async unfollowTarget(
    userId: string,
    targetType: 'topic' | 'entity' | 'author' | 'source',
    targetId: string
  ): Promise<boolean> {
    const removed = await this.db.users.unfollowTarget(userId, targetType, targetId);
    if (removed && targetType === 'source') {
      try {
        let pub = await this.db.publishers.findById(targetId);
        if (!pub) {
          const list = await this.db.publishers.list('org_default');
          pub = list.find((p) => p.slug === targetId || p.domain === targetId) || null;
        }
        if (pub && pub.followerCount > 0) {
          pub.followerCount -= 1;
          await this.db.publishers.update(pub);
        }
      } catch {}
    }
    return removed;
  }

  async listFollowing(
    userId: string,
    targetType?: 'topic' | 'entity' | 'author' | 'source'
  ): Promise<FollowRecord[]> {
    return this.db.users.listFollowing(userId, targetType);
  }

  async isFollowing(
    userId: string,
    targetType: 'topic' | 'entity' | 'author' | 'source',
    targetId: string
  ): Promise<boolean> {
    return this.db.users.isFollowing(userId, targetType, targetId);
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
