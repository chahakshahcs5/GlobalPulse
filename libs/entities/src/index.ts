import type { Entity, CreateEntityInput } from '@ai-news/schemas';
import { CreateEntityInputSchema } from '@ai-news/schemas';
import type { DatabaseService } from '@ai-news/database';
import { NotFoundError, generateId, slugify } from '@ai-news/shared';

export class EntityService {
  constructor(private readonly db: DatabaseService) {}

  async createEntity(input: CreateEntityInput, orgId: string): Promise<Entity> {
    const validated = CreateEntityInputSchema.parse(input);
    const slug = slugify(validated.name);
    const now = new Date().toISOString();

    const entity: Entity = {
      id: generateId('ent'),
      organizationId: orgId,
      name: validated.name,
      slug,
      type: validated.type,
      description: validated.description,
      aliases: validated.aliases || [],
      avatarUrl: validated.avatarUrl,
      metadata: validated.metadata,
      createdAt: now,
      updatedAt: now,
    };

    return this.db.entities.create(entity);
  }

  async getEntity(id: string, orgId?: string): Promise<Entity> {
    const entity = await this.db.entities.findById(id, orgId);
    if (!entity) {
      throw new NotFoundError('Entity', id);
    }
    return entity;
  }

  async getEntityBySlug(slug: string, orgId: string): Promise<Entity> {
    const entity = await this.db.entities.findBySlug(slug, orgId);
    if (!entity) {
      throw new NotFoundError('Entity slug', slug);
    }
    return entity;
  }

  async listEntities(orgId: string): Promise<Entity[]> {
    return this.db.entities.list(orgId);
  }

  async searchEntities(query: string, orgId: string): Promise<Entity[]> {
    return this.db.entities.search(query, orgId);
  }
}
