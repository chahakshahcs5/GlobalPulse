import type { DatabaseService } from '@ai-news/database';
import type {
  Story,
  AttributionSignal,
  ReaderConsumptionProfile,
  DepthPreference,
} from '@ai-news/schemas';
import { type PaginatedResult, encodeCursor, decodeCursor, generateId } from '@ai-news/shared';

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

export interface ScoredStoryWithAttribution {
  story: Story;
  score: number;
  reasons: string[];
  signals: AttributionSignal[];
}

export interface OfflineDigest {
  digestId: string;
  generatedAt: string;
  title: string;
  totalStories: number;
  totalEstimatedReadingMinutes: number;
  stories: Story[];
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

  /**
   * Generates a personalized feed with granular attribution signals explaining
   * why each dispatch was ranked for this reader, incorporating algorithm tuning.
   */
  async getPersonalizedFeedWithAttribution(options: PersonalizedFeedOptions = {}): Promise<{
    items: ScoredStoryWithAttribution[];
    nextCursor?: string;
    hasMore: boolean;
    limit: number;
    totalCount: number;
  }> {
    const orgId = options.organizationId || 'org_default';
    const limit = Math.min(options.limit || 20, 50);

    const stories = await this.db.stories.list({
      status: 'PUBLISHED',
      limit: 150,
    });

    if (stories.length === 0) {
      return { items: [], hasMore: false, limit, totalCount: 0 };
    }

    const followedTopics = new Set<string>();
    const followedEntities = new Set<string>();
    const followedAuthors = new Set<string>();
    const preferredCategories = new Set<string>();
    const readStoryIds = new Map<string, boolean>();

    let depthPreference: DepthPreference = 'balanced';
    let serendipityWeight = 30;

    if (options.userId) {
      try {
        const [user, following, history] = await Promise.all([
          this.db.users.findById(options.userId, orgId),
          this.db.users.listFollowing(options.userId),
          this.db.engagement.listReadingHistory(options.userId, 100),
        ]);

        if (user?.preferences) {
          if (user.preferences.categories) {
            user.preferences.categories.forEach((c) => preferredCategories.add(c.toLowerCase()));
          }
          if (user.preferences.depthPreference) {
            depthPreference = user.preferences.depthPreference;
          }
          if (typeof user.preferences.serendipityWeight === 'number') {
            serendipityWeight = user.preferences.serendipityWeight;
          }
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

    const now = Date.now();
    const scored: ScoredStoryWithAttribution[] = [];

    for (const story of stories) {
      const isCompleted = readStoryIds.get(story.id);
      if (isCompleted && !options.includeCompleted) {
        continue;
      }

      let score = 50;
      const reasons: string[] = [];
      const signals: AttributionSignal[] = [];

      // Recency boost
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
            signals.push({
              type: 'followed_topic',
              target: tid,
              contribution: 40,
              explanation: `Story covers topic #${tid} which you follow`,
            });
          }
        }
      }

      // Followed entities
      if (story.entityIds && story.entityIds.length > 0) {
        for (const eid of story.entityIds) {
          if (followedEntities.has(eid)) {
            score += 30;
            reasons.push('Cited entity interest');
            signals.push({
              type: 'entity_interest',
              target: eid,
              contribution: 30,
              explanation: `Mentions key entity ${eid} from your watch list`,
            });
          }
        }
      }

      // Followed author
      if (story.authorId && followedAuthors.has(story.authorId)) {
        score += 35;
        reasons.push('Followed journalist');
        signals.push({
          type: 'followed_author',
          target: story.authorId,
          contribution: 35,
          explanation: `Reported by author ${story.authorId} you follow`,
        });
      }

      // Preferred categories
      const storyCat = story.articleType?.toLowerCase() || '';
      if (storyCat && preferredCategories.has(storyCat)) {
        score += 25;
        reasons.push(`Preferred desk: ${story.articleType}`);
        signals.push({
          type: 'category_affinity',
          target: storyCat,
          contribution: 25,
          explanation: `Matches your high reading interest in ${story.articleType}`,
        });
      }

      // Depth preference tuning
      const readingTime = story.readingTimeMinutes || 3;
      if (depthPreference === 'quick' && readingTime <= 3) {
        score += 20;
        reasons.push('Brevity match (Quick Digest)');
        signals.push({
          type: 'reading_depth',
          target: 'quick',
          contribution: 20,
          explanation: 'Concise dispatch matching your quick summary preference',
        });
      } else if (
        depthPreference === 'deep_dive' &&
        (readingTime >= 5 || (story.wordCount || 0) >= 800)
      ) {
        score += 25;
        reasons.push('In-depth investigative dispatch');
        signals.push({
          type: 'reading_depth',
          target: 'deep_dive',
          contribution: 25,
          explanation: 'Comprehensive reporting matching your deep-dive reading mode',
        });
      }

      // Serendipity injection for unfamiliar categories
      if (
        preferredCategories.size > 0 &&
        !preferredCategories.has(storyCat) &&
        serendipityWeight > 40
      ) {
        const serendipityBoost = Math.round(serendipityWeight * 0.3);
        score += serendipityBoost;
        reasons.push('Serendipity Discovery');
        signals.push({
          type: 'serendipity_discovery',
          target: storyCat || 'diverse',
          contribution: serendipityBoost,
          explanation: 'Curated outside your usual reading bubble to broaden your perspective',
        });
      }

      // Resume reading
      if (readStoryIds.has(story.id) && !isCompleted) {
        score += 15;
        reasons.push('Resume reading');
        signals.push({
          type: 'resume_reading',
          target: story.id,
          contribution: 15,
          explanation: 'You started this story earlier',
        });
      }

      scored.push({ story, score, reasons, signals });
    }

    scored.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return new Date(b.story.updatedAt).getTime() - new Date(a.story.updatedAt).getTime();
    });

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
    const hasMore = startIndex + limit < scored.length;
    const nextCursor =
      hasMore && paged.length > 0 ? encodeCursor(paged[paged.length - 1].story) : undefined;

    return {
      items: paged,
      nextCursor,
      hasMore,
      limit,
      totalCount: scored.length,
    };
  }

  /**
   * Generates a reader consumption profile analyzing diversity, reading minutes, and topic balance.
   */
  async getReaderConsumptionProfile(
    userId: string,
    orgId: string = 'org_default'
  ): Promise<ReaderConsumptionProfile> {
    const history = await this.db.engagement.listReadingHistory(userId, 100);
    const user = await this.db.users.findById(userId, orgId);

    const categoryCounts: Record<string, number> = {};
    const topicCounts: Record<string, number> = {};
    let totalMinutes = 0;

    for (const h of history) {
      totalMinutes += Math.max(1, Math.round(((h.percentage || 100) / 100) * 3));
      try {
        const story = await this.db.stories.findById(h.storyId, orgId);
        if (story) {
          const cat = story.articleType || 'general';
          categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
          if (story.topicIds) {
            for (const tid of story.topicIds) {
              topicCounts[tid] = (topicCounts[tid] || 0) + 1;
            }
          }
        }
      } catch {
        // Continue loop
      }
    }

    const uniqueCats = Object.keys(categoryCounts).length;
    const diversityScore = Math.min(100, Math.round(uniqueCats * 20));

    return {
      userId,
      totalReadingMinutes: Math.max(totalMinutes, 15),
      storiesReadCount: history.length,
      categoryDistribution: categoryCounts,
      topicDistribution: topicCounts,
      diversityScore,
      depthHabit: user?.preferences?.depthPreference || 'balanced',
    };
  }

  /**
   * Bundles top stories into a standalone offline reading digest for offline flight/commute access.
   */
  async exportOfflineDigest(
    options: { userId?: string; count?: number; organizationId?: string } = {}
  ): Promise<OfflineDigest> {
    const count = Math.min(options.count || 10, 25);
    const feed = await this.getPersonalizedFeed({
      userId: options.userId,
      organizationId: options.organizationId,
      limit: count,
    });

    const stories = feed.items;
    const totalMins = stories.reduce((sum, s) => sum + (s.readingTimeMinutes || 3), 0);

    return {
      digestId: generateId('digest'),
      generatedAt: new Date().toISOString(),
      title: 'GlobalPulse Offline Reader Briefing',
      totalStories: stories.length,
      totalEstimatedReadingMinutes: totalMins,
      stories,
    };
  }
}
