import type { Topic } from '@ai-news/schemas';
import type { ITopicRepository } from '../../interfaces/topic.repository';

export class MemoryTopicRepository implements ITopicRepository {
  private topics = new Map<string, Topic>();

  async findById(id: string, orgId?: string): Promise<Topic | null> {
    const topic = this.topics.get(id);
    if (!topic) return null;
    if (orgId && topic.organizationId !== orgId) return null;
    return { ...topic };
  }

  async findBySlug(slug: string, orgId: string): Promise<Topic | null> {
    for (const topic of this.topics.values()) {
      if (topic.slug === slug && topic.organizationId === orgId) {
        return { ...topic };
      }
    }
    return null;
  }

  async create(topic: Topic): Promise<Topic> {
    if (this.topics.has(topic.id)) {
      throw new Error(`Topic with id ${topic.id} already exists`);
    }
    this.topics.set(topic.id, { ...topic });
    return { ...topic };
  }

  async update(topic: Topic): Promise<Topic> {
    if (!this.topics.has(topic.id)) {
      throw new Error(`Topic with id ${topic.id} does not exist`);
    }
    this.topics.set(topic.id, { ...topic });
    return { ...topic };
  }

  async list(orgId: string): Promise<Topic[]> {
    return Array.from(this.topics.values()).filter((t) => t.organizationId === orgId);
  }

  async search(query: string, orgId: string): Promise<Topic[]> {
    const q = query.toLowerCase();
    return Array.from(this.topics.values()).filter(
      (t) =>
        t.organizationId === orgId &&
        (t.name.toLowerCase().includes(q) ||
          t.slug.toLowerCase().includes(q) ||
          t.aliases.some((a) => a.toLowerCase().includes(q)))
    );
  }

  snapshot(): Map<string, Topic> {
    return new Map(this.topics);
  }

  restore(snapshot: Map<string, Topic>): void {
    this.topics = new Map(snapshot);
  }

  clear(): void {
    this.topics.clear();
  }
}
