import type {
  Topic,
  CreateTopicInput,
  TopicDossier,
  TopicKnowledgeGraph,
  TopicTimelineMilestone,
} from '@ai-news/schemas';
export type { CreateTopicInput };
import { CreateTopicInputSchema } from '@ai-news/schemas';
import type { DatabaseService } from '@ai-news/database';
import { NotFoundError, generateId, slugify } from '@ai-news/shared';
export * from './special-desk.service';

export class TopicService {
  constructor(private readonly db: DatabaseService) {}

  async createTopic(input: CreateTopicInput, orgId: string): Promise<Topic> {
    const validated = CreateTopicInputSchema.parse(input);
    const slug = slugify(validated.name);
    const now = new Date().toISOString();

    const topic: Topic = {
      id: generateId('top'),
      organizationId: orgId,
      slug,
      name: validated.name,
      description: validated.description,
      aliases: validated.aliases || [],
      parentTopicId: validated.parentTopicId,
      createdAt: now,
      updatedAt: now,
    };

    return this.db.topics.create(topic);
  }

  async getTopic(id: string, orgId?: string): Promise<Topic> {
    const topic = await this.db.topics.findById(id, orgId);
    if (!topic) {
      throw new NotFoundError('Topic', id);
    }
    return topic;
  }

  async getTopicBySlug(slug: string, orgId: string): Promise<Topic> {
    const topic = await this.db.topics.findBySlug(slug, orgId);
    if (!topic) {
      throw new NotFoundError('Topic slug', slug);
    }
    return topic;
  }

  async listTopics(orgId: string): Promise<Topic[]> {
    return this.db.topics.list(orgId);
  }

  async searchTopics(query: string, orgId: string): Promise<Topic[]> {
    return this.db.topics.search(query, orgId);
  }

  /**
   * Generates a topic dossier with storyline milestones, sentiment breakdown, linked entities, and co-occurring topics.
   */
  async getTopicDossier(slugOrId: string, orgId: string = 'org_default'): Promise<TopicDossier> {
    let topic: Topic | null = null;
    try {
      topic = await this.db.topics.findBySlug(slugOrId, orgId);
    } catch {
      // try by id
    }
    if (!topic) {
      try {
        topic = await this.db.topics.findById(slugOrId, orgId);
      } catch {
        // fallback synthetic topic
      }
    }

    if (!topic) {
      const name = slugOrId
        .split(/[-_]/)
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');
      topic = {
        id: `top_${slugOrId.replace(/[^a-z0-9]/gi, '_').toLowerCase()}`,
        organizationId: orgId,
        slug: slugify(slugOrId),
        name,
        description: `Comprehensive editorial monitoring on ${name}`,
        aliases: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }

    const allStories = await this.db.stories.list({
      status: 'PUBLISHED',
      limit: 100,
    });

    const topicSlug = topic.slug.toLowerCase();
    const topicId = topic.id;

    const matchingStories = allStories.filter(
      (s) =>
        (s.topicIds &&
          (s.topicIds.includes(topicId) ||
            s.topicIds.some((t) => t.toLowerCase() === topicSlug))) ||
        s.slug.toLowerCase().includes(topicSlug) ||
        (s.title || '').toLowerCase().includes(topicSlug)
    );

    // Build timeline milestones
    const timeline: TopicTimelineMilestone[] = [];
    for (const story of matchingStories) {
      timeline.push({
        date: story.publishedAt || story.createdAt,
        headline: story.title,
        storyId: story.id,
        storySlug: story.slug,
        sourcePublisher: story.createdVia === 'admin' ? 'GlobalPulse Staff' : 'Editorial Wire',
      });

      // Extract milestones from timeline blocks
      if (story.blocks) {
        for (const block of story.blocks) {
          if (block.blockType === 'timeline' && block.data && typeof block.data === 'object') {
            const tl = block.data as { items?: Array<{ date: string; headline: string }> };
            if (Array.isArray(tl.items)) {
              for (const it of tl.items.slice(0, 2)) {
                timeline.push({
                  date: it.date,
                  headline: it.headline,
                  storyId: story.id,
                  storySlug: story.slug,
                });
              }
            }
          }
        }
      }
    }

    // Sort timeline descending by date
    timeline.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Sentiment calculation
    const sentiment = { positive: 0, cautious: 0, critical: 0, neutral: 0 };
    for (const story of matchingStories) {
      let foundSentiment = false;
      if (story.blocks) {
        for (const block of story.blocks) {
          if (block.blockType === 'summary' && block.data && typeof block.data === 'object') {
            const sumData = block.data as {
              sentiment?: 'positive' | 'cautious' | 'critical' | 'neutral';
            };
            if (sumData.sentiment && sumData.sentiment in sentiment) {
              sentiment[sumData.sentiment]++;
              foundSentiment = true;
            }
          }
        }
      }
      if (!foundSentiment) {
        sentiment.neutral++;
      }
    }

    // Extract key entities
    const entityCountMap = new Map<string, number>();
    for (const story of matchingStories) {
      if (story.entityIds) {
        for (const eid of story.entityIds) {
          entityCountMap.set(eid, (entityCountMap.get(eid) || 0) + 1);
        }
      }
    }

    const keyEntities: TopicDossier['keyEntities'] = [];
    for (const [eid] of Array.from(entityCountMap.entries()).slice(0, 6)) {
      try {
        const ent = await this.db.entities.findById(eid, orgId);
        if (ent) {
          keyEntities.push({
            id: ent.id,
            name: ent.name,
            type: ent.type,
            avatarUrl: ent.avatarUrl,
          });
        } else {
          keyEntities.push({
            id: eid,
            name: eid.replace(/^(ent_|e_)/, '').replace(/_/g, ' '),
            type: 'Entity',
          });
        }
      } catch {
        keyEntities.push({
          id: eid,
          name: eid.replace(/^(ent_|e_)/, '').replace(/_/g, ' '),
          type: 'Entity',
        });
      }
    }

    // Extract related topics via co-occurrence
    const relatedCountMap = new Map<string, number>();
    for (const story of matchingStories) {
      if (story.topicIds) {
        for (const tid of story.topicIds) {
          if (tid !== topicId && tid.toLowerCase() !== topicSlug) {
            relatedCountMap.set(tid, (relatedCountMap.get(tid) || 0) + 1);
          }
        }
      }
    }

    const relatedTopics: TopicDossier['relatedTopics'] = [];
    for (const [tid, count] of Array.from(relatedCountMap.entries()).slice(0, 8)) {
      const cleanName = tid
        .replace(/^(top_|t_)/, '')
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase());
      relatedTopics.push({
        id: tid,
        name: cleanName,
        slug: slugify(cleanName),
        coOccurrenceCount: count,
      });
    }

    return {
      topic,
      storyCount: matchingStories.length,
      timeline: timeline.slice(0, 10),
      sentiment,
      keyEntities,
      relatedTopics,
    };
  }

  /**
   * Builds the network knowledge graph of topics and their co-occurrence edge weights.
   */
  async getTopicKnowledgeGraph(orgId: string = 'org_default'): Promise<TopicKnowledgeGraph> {
    const topics = await this.db.topics.list(orgId);
    const stories = await this.db.stories.list({ status: 'PUBLISHED', limit: 150 });

    const storyCountByTopic = new Map<string, number>();
    const edgeWeights = new Map<string, number>();

    for (const story of stories) {
      const tids = story.topicIds || [];
      for (const tid of tids) {
        storyCountByTopic.set(tid, (storyCountByTopic.get(tid) || 0) + 1);
      }

      for (let i = 0; i < tids.length; i++) {
        for (let j = i + 1; j < tids.length; j++) {
          const u = tids[i] < tids[j] ? tids[i] : tids[j];
          const v = tids[i] < tids[j] ? tids[j] : tids[i];
          const key = `${u}:::${v}`;
          edgeWeights.set(key, (edgeWeights.get(key) || 0) + 1);
        }
      }
    }

    const nodes: TopicKnowledgeGraph['nodes'] = topics.map((t) => ({
      id: t.id,
      name: t.name,
      slug: t.slug,
      storyCount: storyCountByTopic.get(t.id) || 0,
    }));

    const edges: TopicKnowledgeGraph['edges'] = [];
    for (const [pair, weight] of edgeWeights.entries()) {
      const [source, target] = pair.split(':::');
      edges.push({ source, target, weight });
    }

    return { nodes, edges };
  }
}
