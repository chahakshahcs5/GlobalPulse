import type { Entity } from '@ai-news/schemas';

export interface IEntityRepository {
  findById(id: string, orgId?: string): Promise<Entity | null>;
  findBySlug(slug: string, orgId: string): Promise<Entity | null>;
  create(entity: Entity): Promise<Entity>;
  update(entity: Entity): Promise<Entity>;
  list(orgId: string): Promise<Entity[]>;
  search(query: string, orgId: string): Promise<Entity[]>;
}
