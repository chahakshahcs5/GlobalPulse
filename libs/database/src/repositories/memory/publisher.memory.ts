import type { Publisher } from '@ai-news/schemas';
import type { IPublisherRepository } from '../../interfaces/publisher.repository';

export class MemoryPublisherRepository implements IPublisherRepository {
  private publishers = new Map<string, Publisher>();

  async findById(id: string, orgId?: string): Promise<Publisher | null> {
    const pub = this.publishers.get(id);
    if (!pub) return null;
    if (orgId && pub.organizationId !== orgId) return null;
    return { ...pub };
  }

  async findBySlug(slug: string, orgId: string): Promise<Publisher | null> {
    for (const pub of this.publishers.values()) {
      if (pub.slug === slug && pub.organizationId === orgId) {
        return { ...pub };
      }
    }
    return null;
  }

  async findByDomain(domain: string, orgId: string): Promise<Publisher | null> {
    const normDomain = domain
      .toLowerCase()
      .replace(/^https?:\/\//, '')
      .replace(/^www\./, '')
      .split('/')[0];
    for (const pub of this.publishers.values()) {
      if (pub.organizationId === orgId) {
        const pubDomain = pub.domain
          .toLowerCase()
          .replace(/^https?:\/\//, '')
          .replace(/^www\./, '')
          .split('/')[0];
        if (pubDomain === normDomain) {
          return { ...pub };
        }
      }
    }
    return null;
  }

  async create(publisher: Publisher): Promise<Publisher> {
    if (this.publishers.has(publisher.id)) {
      throw new Error(`Publisher with id ${publisher.id} already exists`);
    }
    this.publishers.set(publisher.id, { ...publisher });
    return { ...publisher };
  }

  async update(publisher: Publisher): Promise<Publisher> {
    if (!this.publishers.has(publisher.id)) {
      throw new Error(`Publisher with id ${publisher.id} does not exist`);
    }
    this.publishers.set(publisher.id, { ...publisher });
    return { ...publisher };
  }

  async list(orgId: string, category?: string, limit = 100): Promise<Publisher[]> {
    return Array.from(this.publishers.values())
      .filter(
        (p) =>
          p.organizationId === orgId &&
          (!category || category === 'all' || p.category.toLowerCase() === category.toLowerCase())
      )
      .slice(0, limit);
  }

  async search(query: string, orgId: string): Promise<Publisher[]> {
    const q = query.toLowerCase();
    return Array.from(this.publishers.values()).filter(
      (p) =>
        p.organizationId === orgId &&
        (p.name.toLowerCase().includes(q) ||
          p.domain.toLowerCase().includes(q) ||
          p.slug.toLowerCase().includes(q) ||
          (p.description && p.description.toLowerCase().includes(q)))
    );
  }

  snapshot(): Map<string, Publisher> {
    return new Map(this.publishers);
  }

  restore(snapshot: Map<string, Publisher>): void {
    this.publishers = new Map(snapshot);
  }

  clear(): void {
    this.publishers.clear();
  }
}
