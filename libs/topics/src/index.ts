import type { Topic, CreateTopicInput } from '@ai-news/schemas';
import { CreateTopicInputSchema } from '@ai-news/schemas';
import type { DatabaseService } from '@ai-news/database';
import { NotFoundError, generateId, slugify } from '@ai-news/shared';

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
}
