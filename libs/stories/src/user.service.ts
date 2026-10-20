import type { DatabaseService, FollowRecord } from '@ai-news/database';
import type {
  NewsroomUser,
  UserRole,
  InviteUserInput,
  RegisterUserInput,
  LoginInput,
  UpdatePreferencesInput,
  FollowTargetType,
} from '@ai-news/schemas';
import {
  RegisterUserInputSchema,
  LoginInputSchema,
  UpdatePreferencesInputSchema,
} from '@ai-news/schemas';
import { generateId, NotFoundError, ConflictError, UnauthorizedError } from '@ai-news/shared';
import { PasswordHasher, AuthService, ROLE_PERMISSIONS } from '@ai-news/auth';
import type { StoryContext } from './story.service';

export function sanitizeUser(user: NewsroomUser): NewsroomUser {
  const { passwordHash: _hash, ...safeUser } = user;
  return safeUser as NewsroomUser;
}

export interface FollowedStoryScope {
  /** Stories the reader explicitly followed. */
  direct: Set<string>;
  /** Followed stories plus every story in the clusters they belong to. */
  expanded: Set<string>;
}

/** A follow resolved into something a reader interface can display. */
export interface ResolvedFollow {
  targetType: FollowTargetType;
  targetId: string;
  label: string;
  detail?: string;
  href?: string;
}

/**
 * Resolves the stories a reader follows, expanded for cluster continuity.
 *
 * Following a story also follows that story's cluster, so when a new article
 * is published into the same cluster the reader keeps following the evolving
 * story without following every new article. Following a cluster directly
 * follows all of its stories.
 *
 * The expansion happens at read time so the stored follow records stay
 * minimal and the follow is never silently widened on disk.
 */
export async function resolveFollowedStoryScope(
  db: DatabaseService,
  userId: string,
  orgId: string = 'org_default'
): Promise<FollowedStoryScope> {
  const direct = new Set<string>();
  const expanded = new Set<string>();

  let records: FollowRecord[] = [];
  try {
    records = await db.users.listFollowing(userId);
  } catch {
    return { direct, expanded };
  }

  const followedStoryIds = records
    .filter((record) => record.targetType === 'story')
    .map((record) => record.targetId);
  const followedClusterIds = records
    .filter((record) => record.targetType === 'cluster')
    .map((record) => record.targetId);

  for (const storyId of followedStoryIds) {
    direct.add(storyId);
    expanded.add(storyId);
  }

  // Cluster continuity: a followed story carries its whole cluster.
  for (const storyId of followedStoryIds) {
    try {
      const cluster = await db.clusters.findByStoryId(storyId, orgId);
      if (!cluster) continue;
      for (const memberId of cluster.storyIds) {
        expanded.add(memberId);
      }
    } catch {
      // A missing cluster must not break the follow resolution.
    }
  }

  // A directly followed cluster follows all of its stories.
  for (const clusterId of followedClusterIds) {
    try {
      const cluster = await db.clusters.getById(clusterId, orgId);
      if (!cluster) continue;
      for (const memberId of cluster.storyIds) {
        expanded.add(memberId);
      }
    } catch {
      // Ignore missing clusters.
    }
  }

  return { direct, expanded };
}

export class UserService {
  constructor(private readonly db: DatabaseService) {}

  async listUsers(orgId: string = 'org_default'): Promise<NewsroomUser[]> {
    const users = await this.db.users.list(orgId);
    return users.map(sanitizeUser);
  }

  async getUser(userId: string, orgId: string = 'org_default'): Promise<NewsroomUser> {
    const user = await this.db.users.findById(userId, orgId);
    if (!user) {
      throw new NotFoundError('Newsroom user', userId);
    }
    return sanitizeUser(user);
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

    return { user: sanitizeUser(created), token };
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

    return { user: sanitizeUser(user), token };
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

    const updated = await this.db.users.update(user);
    return sanitizeUser(updated);
  }

  /**
   * F17: Follow Topics, Entities, Authors, Sources, Stories & Clusters
   */
  async followTarget(
    userId: string,
    targetType: FollowTargetType,
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
    targetType: FollowTargetType,
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

  async listFollowing(userId: string, targetType?: FollowTargetType): Promise<FollowRecord[]> {
    return this.db.users.listFollowing(userId, targetType);
  }

  /**
   * Resolves the reader's follows into displayable entries: a label, a
   * secondary detail, and a link path, so the reader UI never has to guess
   * what an identifier refers to.
   */
  async listFollowingResolved(
    userId: string,
    orgId: string = 'org_default'
  ): Promise<ResolvedFollow[]> {
    const records = await this.listFollowing(userId);
    const resolved: ResolvedFollow[] = [];

    for (const record of records) {
      const entry = await this.resolveFollow(record, orgId);
      if (entry) resolved.push(entry);
    }

    return resolved;
  }

  private async resolveFollow(record: FollowRecord, orgId: string): Promise<ResolvedFollow | null> {
    const { targetType, targetId } = record;

    try {
      switch (targetType) {
        case 'story': {
          const story = await this.db.stories.findById(targetId, orgId);
          if (!story) return null;
          return {
            targetType,
            targetId,
            label: story.title,
            detail: story.articleType,
            href: `/stories/${story.slug}`,
          };
        }
        case 'cluster': {
          const cluster = await this.db.clusters.getById(targetId, orgId);
          if (!cluster) return null;
          return {
            targetType,
            targetId,
            label: cluster.title,
            detail: `${cluster.storyIds.length} article(s)`,
            href: '/following',
          };
        }
        case 'topic': {
          const topic = await this.db.topics.findById(targetId, orgId);
          if (!topic) return null;
          return {
            targetType,
            targetId,
            label: topic.name,
            detail: topic.description,
            href: `/topics/${topic.slug}`,
          };
        }
        case 'entity': {
          const entity = await this.db.entities.findById(targetId, orgId);
          if (!entity) return null;
          return {
            targetType,
            targetId,
            label: entity.name,
            detail: entity.description,
            href: `/entities/${entity.id}`,
          };
        }
        case 'author': {
          const user = await this.db.users.findById(targetId, orgId);
          if (!user) return null;
          return {
            targetType,
            targetId,
            label: user.name ?? user.email ?? targetId,
            detail: user.role,
          };
        }
        case 'source': {
          const source = await this.db.sources.findById(targetId, orgId);
          if (!source) return null;
          return {
            targetType,
            targetId,
            label: source.title,
            detail: source.publisher,
            href: '/sources',
          };
        }
        case 'event': {
          const event = await this.db.events.findById(targetId, orgId);
          if (!event) return null;
          return {
            targetType,
            targetId,
            label: event.title,
            detail: event.location,
            href: `/events/${event.id}`,
          };
        }
        default:
          return null;
      }
    } catch {
      // A follow whose target was deleted is simply skipped.
      return null;
    }
  }

  async isFollowing(
    userId: string,
    targetType: FollowTargetType,
    targetId: string
  ): Promise<boolean> {
    return this.db.users.isFollowing(userId, targetType, targetId);
  }

  /**
   * Resolves the set of stories a reader follows, expanded for cluster
   * continuity. See {@link resolveFollowedStoryScope}.
   */
  async getFollowedStoryIds(userId: string, orgId: string = 'org_default'): Promise<Set<string>> {
    const scope = await resolveFollowedStoryScope(this.db, userId, orgId);
    return scope.expanded;
  }

  /**
   * Same as {@link getFollowedStoryIds} but also reports which stories were
   * followed directly, so callers can distinguish "the story you follow" from
   * "a new article in the cluster you follow".
   */
  async getFollowedStoryScope(
    userId: string,
    orgId: string = 'org_default'
  ): Promise<FollowedStoryScope> {
    return resolveFollowedStoryScope(this.db, userId, orgId);
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

    return sanitizeUser(saved);
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

    return sanitizeUser(saved);
  }
}
