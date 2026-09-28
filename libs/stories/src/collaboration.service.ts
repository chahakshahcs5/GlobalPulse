import type { DatabaseService } from '@ai-news/database';
import type {
  Story,
  StoryLock,
  StoryLockUser,
  StoryPresence,
  StoryPresenceUser,
  KanbanBoard,
  CalendarSchedule,
  StoryStatus,
} from '@ai-news/schemas';

export class CollaborationService {
  private locks = new Map<string, StoryLock>();
  private presence = new Map<string, Map<string, StoryPresenceUser>>();

  constructor(private readonly db: DatabaseService) {}

  /**
   * F8: Acquires an exclusive lease lock for editing a story.
   * Default lease duration is 300 seconds (5 minutes).
   */
  async acquireLock(
    storyId: string,
    user: StoryLockUser,
    ttlSeconds: number = 300,
    orgId: string = 'org_default'
  ): Promise<{ success: boolean; lock?: StoryLock; heldBy?: StoryLockUser }> {
    const story = await this.db.stories.findById(storyId, orgId);
    if (!story) {
      throw new Error(`Story with id ${storyId} was not found`);
    }

    const now = Date.now();
    const existing = this.locks.get(storyId);

    if (existing && new Date(existing.expiresAt).getTime() > now) {
      if (existing.lockedBy.id === user.id) {
        // Renew lease for the same user
        existing.expiresAt = new Date(now + ttlSeconds * 1000).toISOString();
        return { success: true, lock: existing };
      }
      return { success: false, lock: existing, heldBy: existing.lockedBy };
    }

    const lock: StoryLock = {
      storyId,
      lockedBy: user,
      acquiredAt: new Date(now).toISOString(),
      expiresAt: new Date(now + ttlSeconds * 1000).toISOString(),
    };

    this.locks.set(storyId, lock);
    this.pingPresence(storyId, { id: user.id, name: user.name });
    return { success: true, lock };
  }

  /**
   * Releases lease lock for a story.
   */
  async releaseLock(storyId: string, userId: string): Promise<boolean> {
    const existing = this.locks.get(storyId);
    if (!existing) return true;

    if (existing.lockedBy.id === userId) {
      this.locks.delete(storyId);
      return true;
    }
    return false;
  }

  /**
   * Heartbeat to extend active lock lease and signal editor presence.
   */
  async heartbeat(
    storyId: string,
    user: StoryLockUser,
    ttlSeconds: number = 300
  ): Promise<{ success: boolean; expiresAt?: string }> {
    const existing = this.locks.get(storyId);
    const now = Date.now();

    if (existing && existing.lockedBy.id === user.id && new Date(existing.expiresAt).getTime() > now) {
      existing.expiresAt = new Date(now + ttlSeconds * 1000).toISOString();
      this.pingPresence(storyId, { id: user.id, name: user.name });
      return { success: true, expiresAt: existing.expiresAt };
    }

    // If lock expired but nobody else holds it, re-acquire
    if (!existing || new Date(existing.expiresAt).getTime() <= now) {
      const res = await this.acquireLock(storyId, user, ttlSeconds);
      return { success: res.success, expiresAt: res.lock?.expiresAt };
    }

    return { success: false };
  }

  /**
   * Tracks user presence on a story.
   */
  pingPresence(storyId: string, user: { id: string; name: string }): void {
    if (!this.presence.has(storyId)) {
      this.presence.set(storyId, new Map());
    }
    const storyUsers = this.presence.get(storyId)!;
    storyUsers.set(user.id, {
      id: user.id,
      name: user.name,
      lastSeenAt: new Date().toISOString(),
    });
  }

  /**
   * Retrieves active users currently viewing/editing a story (pruned to last 2 minutes).
   */
  async getPresence(storyId: string): Promise<StoryPresence> {
    const storyUsers = this.presence.get(storyId);
    if (!storyUsers) {
      return { storyId, activeUsers: [] };
    }

    const twoMinutesAgo = Date.now() - 2 * 60 * 1000;
    const active: StoryPresenceUser[] = [];

    for (const [userId, user] of storyUsers.entries()) {
      if (new Date(user.lastSeenAt).getTime() >= twoMinutesAgo) {
        active.push(user);
      } else {
        storyUsers.delete(userId);
      }
    }

    return { storyId, activeUsers: active };
  }

  /**
   * F9: Retrieves newsroom pipeline Kanban board organized by status.
   */
  async getKanbanBoard(orgId: string = 'org_default'): Promise<KanbanBoard> {
    const all = await this.db.stories.listPaginated({ limit: 500 }, orgId);
    const columns: Record<StoryStatus, Story[]> = {
      DRAFT: [],
      IN_REVIEW: [],
      SCHEDULED: [],
      PUBLISHED: [],
      ARCHIVED: [],
    };

    for (const story of all.items) {
      if (columns[story.status]) {
        columns[story.status].push(story);
      }
    }

    return {
      columns,
      totalCount: all.items.length,
    };
  }

  /**
   * F9: Retrieves chronological release schedule for editorial calendar.
   */
  async getCalendarSchedule(orgId: string = 'org_default'): Promise<CalendarSchedule> {
    const all = await this.db.stories.listPaginated({ limit: 500 }, orgId);
    const scheduledStories = all.items
      .filter((s) => s.status === 'SCHEDULED' && s.scheduledPublishAt)
      .sort((a, b) => new Date(a.scheduledPublishAt!).getTime() - new Date(b.scheduledPublishAt!).getTime());

    const publishedStories = all.items
      .filter((s) => s.status === 'PUBLISHED')
      .sort((a, b) => new Date(b.publishedAt || b.createdAt).getTime() - new Date(a.publishedAt || a.createdAt).getTime());

    return {
      scheduledStories,
      publishedStories,
    };
  }

  /**
   * Transitions story status with validation.
   */
  async transitionStoryStatus(
    storyId: string,
    targetStatus: StoryStatus,
    orgId: string = 'org_default',
    scheduledPublishAt?: string
  ): Promise<Story> {
    const story = await this.db.stories.findById(storyId, orgId);
    if (!story) {
      throw new Error(`Story with id ${storyId} was not found`);
    }

    story.status = targetStatus;
    story.updatedAt = new Date().toISOString();

    if (targetStatus === 'SCHEDULED') {
      if (!scheduledPublishAt) {
        throw new Error('scheduledPublishAt is required when scheduling a story');
      }
      story.scheduledPublishAt = scheduledPublishAt;
    } else if (targetStatus === 'PUBLISHED' && !story.publishedAt) {
      story.publishedAt = new Date().toISOString();
    }

    return this.db.stories.update(story);
  }
}
