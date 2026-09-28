import { randomUUID } from 'crypto';
import type { DatabaseService } from '@ai-news/database';
import type {
  Story,
  StoryCluster,
  CreateClusterInput,
  FullCoverageResult,
  ClusterPerspective,
  ClusterTimelineItem,
} from '@ai-news/schemas';

function formatTimeAgo(isoString: string): string {
  try {
    const diffMs = Date.now() - new Date(isoString).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  } catch {
    return 'Recently';
  }
}

function resolvePublisher(story: Story): string {
  if (story.createdVia === 'admin') return 'GlobalPulse Editorial';
  if (story.createdByClient === 'gemini') return 'Gemini Wire';
  if (story.createdByClient === 'claude') return 'Anthropic Analysis';
  if (story.createdByClient === 'chatgpt') return 'OpenAI News Dispatch';
  return 'Associated News';
}

function resolveAngle(index: number, articleType?: string): string {
  if (articleType === 'analysis' || articleType === 'deep_dive') return 'analysis';
  if (articleType === 'breaking_news') return 'developing';
  if (articleType === 'explainer') return 'background';
  const angles = ['center', 'international', 'in_depth', 'industry', 'regional'];
  return angles[index % angles.length];
}

export class ClusteringService {
  constructor(private readonly db: DatabaseService) {}

  /**
   * Retrieves Google News style "Full Coverage" for a story, dynamically constructing
   * a cluster with multi-source perspectives and chronological timeline if one does not exist.
   */
  async getFullCoverage(storyId: string, orgId: string = 'org_default'): Promise<FullCoverageResult> {
    const leadStory = await this.db.stories.findById(storyId, orgId);
    if (!leadStory) {
      throw new Error(`Story with id ${storyId} was not found`);
    }

    let cluster = await this.db.clusters.findByStoryId(storyId, orgId);

    if (!cluster) {
      // Auto-cluster candidate stories from database
      const candidatesResult = await this.db.stories.listPaginated({ limit: 100 }, orgId);
      const otherStories = candidatesResult.items.filter((s) => s.id !== leadStory.id);

      // Score relevance
      const scored: Array<{ story: Story; score: number }> = [];
      const leadTitleWords = new Set(leadStory.title.toLowerCase().split(/\s+/).filter((w) => w.length > 3));

      for (const other of otherStories) {
        let score = 0;
        if (leadStory.eventId && other.eventId && leadStory.eventId === other.eventId) {
          score += 60;
        }

        const sharedTopics = (leadStory.topicIds || []).filter((t) => (other.topicIds || []).includes(t));
        score += sharedTopics.length * 25;

        const sharedEntities = (leadStory.entityIds || []).filter((e) => (other.entityIds || []).includes(e));
        score += sharedEntities.length * 20;

        if (leadStory.articleType === other.articleType) {
          score += 10;
        }

        const otherWords = other.title.toLowerCase().split(/\s+/).filter((w) => w.length > 3);
        const overlap = otherWords.filter((w) => leadTitleWords.has(w)).length;
        score += overlap * 15;

        if (score > 15) {
          scored.push({ story: other, score });
        }
      }

      scored.sort((a, b) => b.score - a.score);
      const matchedStories = scored.slice(0, 5).map((s) => s.story);

      // Synthesize multi-source perspectives
      const perspectives: ClusterPerspective[] = [
        {
          storyId: leadStory.id,
          publisher: resolvePublisher(leadStory),
          headline: leadStory.title,
          excerpt: leadStory.summary,
          sourceType: 'lead_report',
          url: `/stories/${leadStory.slug}`,
          timeAgo: formatTimeAgo(leadStory.publishedAt || leadStory.createdAt),
          angle: 'primary',
          stance: 'center',
          publishedAt: leadStory.publishedAt || leadStory.createdAt,
        },
      ];

      matchedStories.forEach((other, idx) => {
        perspectives.push({
          storyId: other.id,
          publisher: resolvePublisher(other),
          headline: other.title,
          excerpt: other.summary,
          sourceType: other.articleType,
          url: `/stories/${other.slug}`,
          timeAgo: formatTimeAgo(other.publishedAt || other.createdAt),
          angle: resolveAngle(idx, other.articleType),
          stance: resolveAngle(idx, other.articleType),
          publishedAt: other.publishedAt || other.createdAt,
        });
      });

      // Synthesize timeline
      const timeline: ClusterTimelineItem[] = [
        {
          date: leadStory.publishedAt || leadStory.createdAt,
          event: leadStory.title,
          source: resolvePublisher(leadStory),
          storyId: leadStory.id,
        },
      ];

      for (const other of matchedStories) {
        timeline.push({
          date: other.publishedAt || other.createdAt,
          event: other.title,
          source: resolvePublisher(other),
          storyId: other.id,
        });
      }

      // Sort timeline chronologically
      timeline.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      const now = new Date().toISOString();
      const newCluster: StoryCluster = {
        id: `cls_${randomUUID().replace(/-/g, '').slice(0, 16)}`,
        organizationId: orgId,
        title: leadStory.title,
        summary: leadStory.summary,
        leadStoryId: leadStory.id,
        storyIds: [leadStory.id, ...matchedStories.map((s) => s.id)],
        topic: (leadStory.topicIds && leadStory.topicIds[0]) || undefined,
        category: leadStory.articleType,
        perspectives,
        timeline,
        createdAt: now,
        updatedAt: now,
      };

      cluster = await this.db.clusters.create(newCluster);
    }

    // Hydrate all related stories
    const relatedStoryIds = (cluster.storyIds || []).filter((id) => id !== leadStory.id);
    const relatedStories: Story[] = [];
    for (const rid of relatedStoryIds) {
      const s = await this.db.stories.findById(rid, orgId);
      if (s) relatedStories.push(s);
    }

    return {
      clusterId: cluster.id,
      storyId: leadStory.id,
      title: cluster.title,
      summary: cluster.summary || leadStory.summary,
      leadStory,
      relatedStories,
      perspectives: cluster.perspectives,
      timeline: cluster.timeline,
    };
  }

  async listClusters(orgId: string = 'org_default', limit: number = 20): Promise<StoryCluster[]> {
    return this.db.clusters.list(orgId, limit);
  }

  async getCluster(id: string, orgId?: string): Promise<StoryCluster | null> {
    return this.db.clusters.getById(id, orgId);
  }

  async createCluster(input: CreateClusterInput, orgId: string = 'org_default'): Promise<StoryCluster> {
    const now = new Date().toISOString();
    const cluster: StoryCluster = {
      id: `cls_${randomUUID().replace(/-/g, '').slice(0, 16)}`,
      organizationId: orgId,
      title: input.title,
      summary: input.summary,
      leadStoryId: input.leadStoryId,
      storyIds: input.storyIds ? Array.from(new Set([input.leadStoryId, ...input.storyIds])) : [input.leadStoryId],
      topic: input.topic,
      category: input.category,
      perspectives: input.perspectives || [],
      timeline: input.timeline || [],
      createdAt: now,
      updatedAt: now,
    };
    return this.db.clusters.create(cluster);
  }
}
