import type { DatabaseService } from '@ai-news/database';
import type { Story } from '@ai-news/schemas';
import { type PaginatedResult, encodeCursor, decodeCursor } from '@ai-news/shared';

export interface PersonalizedFeedOptions {
  userId?: string;
  organizationId?: string;
  limit?: number;
  cursor?: string;
  includeCompleted?: boolean;
}

export interface ScoredStory {
  story: Story;
  score: number;
  reasons: string[];
}

export class PersonalizationService {
  constructor(private readonly db: DatabaseService) {}

  /**
   * Generates a personalized "For You" feed for a user or fallback curated feed for guests.
   * Ranking signals:
   * 1. Followed topics & entities (+40 / +30)
   * 2. Category interest matches (+25)
   * 3. Author affiliation (+35)
   * 4. Recency exponential decay (half-life = 24h)
   * 5. Read history penalty (downranks read stories)
   */
  async getPersonalizedFeed(
    options: PersonalizedFeedOptions = {}
  ): Promise<PaginatedResult<Story>> {
    const orgId = options.organizationId || 'org_default';
    const limit = Math.min(options.limit || 20, 50);

    // 1. Fetch all published stories in organization
    const stories = await this.db.stories.list({
      status: 'PUBLISHED',
      limit: 150,
    });

    if (stories.length === 0) {
      return { items: [], hasMore: false, limit };
    }

    // 2. Fetch reader profile & engagement signals if userId is present
    const followedTopics = new Set<string>();
    const followedEntities = new Set<string>();
    const followedAuthors = new Set<string>();
    const preferredCategories = new Set<string>();
    const readStoryIds = new Map<string, boolean>(); // storyId -> completed

    if (options.userId) {
      try {
        const [user, following, history] = await Promise.all([
          this.db.users.findById(options.userId, orgId),
          this.db.users.listFollowing(options.userId),
          this.db.engagement.listReadingHistory(options.userId, 100),
        ]);

        if (user?.preferences?.categories) {
          user.preferences.categories.forEach((c) => preferredCategories.add(c.toLowerCase()));
        }

        for (const f of following) {
          if (f.targetType === 'topic') followedTopics.add(f.targetId.toLowerCase());
          if (f.targetType === 'entity') followedEntities.add(f.targetId);
          if (f.targetType === 'author') followedAuthors.add(f.targetId);
        }

        for (const h of history) {
          readStoryIds.set(h.storyId, h.completed);
        }
      } catch {
        // Fallback gracefully on profile fetch failure
      }
    }

    // 3. Compute relevance scores
    const now = Date.now();

    const scored: ScoredStory[] = [];

    for (const story of stories) {
      const isCompleted = readStoryIds.get(story.id);
      if (isCompleted && !options.includeCompleted) {
        // Skip already completed stories by default
        continue;
      }

      let score = 50; // Base score
      const reasons: string[] = [];

      // Recency decay: score *= 2^(-age / halfLife)
      const pubTime = story.publishedAt
        ? new Date(story.publishedAt).getTime()
        : new Date(story.createdAt).getTime();
      const ageHours = Math.max(0, (now - pubTime) / (1000 * 60 * 60));
      const recencyBoost = Math.max(0.1, Math.exp(-ageHours / 24));
      score *= recencyBoost;

      // Followed topics
      if (story.topicIds && story.topicIds.length > 0) {
        for (const tid of story.topicIds) {
          if (followedTopics.has(tid.toLowerCase())) {
            score += 40;
            reasons.push(`Follows #${tid}`);
          }
        }
      }

      // Followed entities
      if (story.entityIds && story.entityIds.length > 0) {
        for (const eid of story.entityIds) {
          if (followedEntities.has(eid)) {
            score += 30;
            reasons.push('Cited entity interest');
          }
        }
      }

      // Followed author
      if (story.authorId && followedAuthors.has(story.authorId)) {
        score += 35;
        reasons.push('Followed journalist');
      }

      // Preferred categories
      if (story.articleType && preferredCategories.has(story.articleType.toLowerCase())) {
        score += 25;
        reasons.push(`Preferred topic: ${story.articleType}`);
      }

      // If story was partially read, boost slightly to encourage completion
      if (readStoryIds.has(story.id) && !isCompleted) {
        score += 15;
        reasons.push('Resume reading');
      }

      scored.push({ story, score, reasons });
    }

    // 4. Sort descending by score
    scored.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return new Date(b.story.updatedAt).getTime() - new Date(a.story.updatedAt).getTime();
    });

    // 5. Cursor pagination
    let startIndex = 0;
    if (options.cursor) {
      const decoded = decodeCursor(options.cursor);
      if (decoded?.id) {
        const foundIndex = scored.findIndex((s) => s.story.id === decoded.id);
        if (foundIndex !== -1) {
          startIndex = foundIndex + 1;
        }
      }
    }

    const paged = scored.slice(startIndex, startIndex + limit);
    const items = paged.map((s) => s.story);
    const hasMore = startIndex + limit < scored.length;
    const nextCursor =
      hasMore && items.length > 0 ? encodeCursor(items[items.length - 1]) : undefined;

    return {
      items,
      nextCursor,
      hasMore,
      limit,
      totalCount: scored.length,
    };
  }
}
