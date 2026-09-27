import type { Entity } from '@ai-news/schemas';
import type { IEntityRepository } from '../../interfaces/entity.repository';

interface PrismaEntityRow {
  id: string;
  organizationId: string;
  slug: string;
  name: string;
  type: string;
  description?: string | null;
  aliases: string[];
  avatarUrl?: string | null;
  metadata?: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
}

export class PrismaEntityRepository implements IEntityRepository {
  constructor(private readonly prismaGetter: () => Record<string, unknown>) {}

  private get prisma(): Record<string, unknown> {
    return this.prismaGetter();
  }

  private get entityClient(): {
    findFirst: (args: { where: Record<string, unknown> }) => Promise<PrismaEntityRow | null>;
    create: (args: { data: Record<string, unknown> }) => Promise<PrismaEntityRow>;
    update: (args: { where: Record<string, unknown>; data: Record<string, unknown> }) => Promise<PrismaEntityRow>;
    findMany: (args: { where: Record<string, unknown>; orderBy?: Record<string, unknown> }) => Promise<PrismaEntityRow[]>;
  } {
    return this.prisma.entity as {
      findFirst: (args: { where: Record<string, unknown> }) => Promise<PrismaEntityRow | null>;
      create: (args: { data: Record<string, unknown> }) => Promise<PrismaEntityRow>;
      update: (args: { where: Record<string, unknown>; data: Record<string, unknown> }) => Promise<PrismaEntityRow>;
      findMany: (args: { where: Record<string, unknown>; orderBy?: Record<string, unknown> }) => Promise<PrismaEntityRow[]>;
    };
  }

  async findById(id: string, orgId?: string): Promise<Entity | null> {
    const where: Record<string, unknown> = { id };
    if (orgId) where.organizationId = orgId;
    const row = await this.entityClient.findFirst({ where });
    return row ? this.mapToDomain(row) : null;
  }

  async findBySlug(slug: string, orgId: string): Promise<Entity | null> {
    const row = await this.entityClient.findFirst({
      where: { slug, organizationId: orgId },
    });
    return row ? this.mapToDomain(row) : null;
  }

  async create(entity: Entity): Promise<Entity> {
    const created = await this.entityClient.create({
      data: {
        id: entity.id,
        organizationId: entity.organizationId,
        slug: entity.slug,
        name: entity.name,
        type: entity.type,
        description: entity.description,
        aliases: entity.aliases || [],
        avatarUrl: entity.avatarUrl,
        metadata: entity.metadata,
      },
    });
    return this.mapToDomain(created);
  }

  async update(entity: Entity): Promise<Entity> {
    const updated = await this.entityClient.update({
      where: { id: entity.id },
      data: {
        name: entity.name,
        type: entity.type,
        description: entity.description,
        aliases: entity.aliases || [],
        avatarUrl: entity.avatarUrl,
        metadata: entity.metadata,
      },
    });
    return this.mapToDomain(updated);
  }

  async list(orgId: string): Promise<Entity[]> {
    const rows = await this.entityClient.findMany({
      where: { organizationId: orgId },
      orderBy: { name: 'asc' },
    });
    return rows.map((r) => this.mapToDomain(r));
  }

  async search(query: string, orgId: string): Promise<Entity[]> {
    const rows = await this.entityClient.findMany({
      where: {
        organizationId: orgId,
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { slug: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
        ],
      },
    });
    return rows.map((r) => this.mapToDomain(r));
  }

  private mapToDomain(row: PrismaEntityRow): Entity {
    return {
      id: row.id,
      organizationId: row.organizationId,
      slug: row.slug,
      name: row.name,
      type: row.type as Entity['type'],
      description: row.description || undefined,
      aliases: row.aliases || [],
      avatarUrl: row.avatarUrl || undefined,
      metadata: row.metadata || {},
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }
}
