import type { Entity } from '@ai-news/schemas';
import type { IEntityRepository } from '../../interfaces/entity.repository';

export class PrismaEntityRepository implements IEntityRepository {
  constructor(private readonly prismaGetter: () => any) {}

  private get prisma() {
    return this.prismaGetter();
  }

  async findById(id: string, orgId?: string): Promise<Entity | null> {
    const where: any = { id };
    if (orgId) where.organizationId = orgId;
    const row = await this.prisma.entity.findFirst({ where });
    return row ? this.mapToDomain(row) : null;
  }

  async findBySlug(slug: string, orgId: string): Promise<Entity | null> {
    const row = await this.prisma.entity.findFirst({
      where: { slug, organizationId: orgId },
    });
    return row ? this.mapToDomain(row) : null;
  }

  async create(entity: Entity): Promise<Entity> {
    const created = await this.prisma.entity.create({
      data: {
        id: entity.id,
        organizationId: entity.organizationId,
        slug: entity.slug,
        name: entity.name,
        entityType: entity.entityType as any,
        description: entity.description,
        metadata: entity.metadata as any,
      },
    });
    return this.mapToDomain(created);
  }

  async update(entity: Entity): Promise<Entity> {
    const updated = await this.prisma.entity.update({
      where: { id: entity.id },
      data: {
        name: entity.name,
        entityType: entity.entityType as any,
        description: entity.description,
        metadata: entity.metadata as any,
      },
    });
    return this.mapToDomain(updated);
  }

  async list(orgId: string): Promise<Entity[]> {
    const rows = await this.prisma.entity.findMany({
      where: { organizationId: orgId },
      orderBy: { name: 'asc' },
    });
    return rows.map((r: any) => this.mapToDomain(r));
  }

  async search(query: string, orgId: string): Promise<Entity[]> {
    const rows = await this.prisma.entity.findMany({
      where: {
        organizationId: orgId,
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { slug: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
        ],
      },
    });
    return rows.map((r: any) => this.mapToDomain(r));
  }

  private mapToDomain(row: any): Entity {
    return {
      id: row.id,
      organizationId: row.organizationId,
      slug: row.slug,
      name: row.name,
      entityType: row.entityType,
      description: row.description,
      metadata: row.metadata || {},
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }
}
