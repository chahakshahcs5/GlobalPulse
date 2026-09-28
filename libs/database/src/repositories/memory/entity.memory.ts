import type { Entity } from '@ai-news/schemas';
import type { IEntityRepository } from '../../interfaces/entity.repository';

export class MemoryEntityRepository implements IEntityRepository {
  private entities = new Map<string, Entity>();

  async findById(id: string, orgId?: string): Promise<Entity | null> {
    const entity = this.entities.get(id);
    if (!entity) return null;
    if (orgId && entity.organizationId !== orgId) return null;
    return { ...entity };
  }

  async findBySlug(slug: string, orgId: string): Promise<Entity | null> {
    for (const entity of this.entities.values()) {
      if (entity.slug === slug && entity.organizationId === orgId) {
        return { ...entity };
      }
    }
    return null;
  }

  async create(entity: Entity): Promise<Entity> {
    if (this.entities.has(entity.id)) {
      throw new Error(`Entity with id ${entity.id} already exists`);
    }
    this.entities.set(entity.id, { ...entity });
    return { ...entity };
  }

  async update(entity: Entity): Promise<Entity> {
    if (!this.entities.has(entity.id)) {
      throw new Error(`Entity with id ${entity.id} does not exist`);
    }
    this.entities.set(entity.id, { ...entity });
    return { ...entity };
  }

  async list(orgId: string): Promise<Entity[]> {
    return Array.from(this.entities.values()).filter((e) => e.organizationId === orgId);
  }

  async search(query: string, orgId: string): Promise<Entity[]> {
    const q = query.toLowerCase();
    return Array.from(this.entities.values()).filter(
      (e) =>
        e.organizationId === orgId &&
        (e.name.toLowerCase().includes(q) ||
          e.slug.toLowerCase().includes(q) ||
          (e.description && e.description.toLowerCase().includes(q)) ||
          e.aliases?.some((a) => a.toLowerCase().includes(q)))
    );
  }

  snapshot(): Map<string, Entity> {
    return new Map(this.entities);
  }

  restore(snapshot: Map<string, Entity>): void {
    this.entities = new Map(snapshot);
  }

  clear(): void {
    this.entities.clear();
  }
}
