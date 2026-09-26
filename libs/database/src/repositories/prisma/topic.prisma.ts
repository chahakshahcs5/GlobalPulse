import type { Topic } from '@ai-news/schemas';
import type { ITopicRepository } from '../../interfaces/topic.repository';

export class PrismaTopicRepository implements ITopicRepository {
  constructor(private readonly prismaGetter: () => any) {}

  private get prisma() {
    return this.prismaGetter();
  }

  async findById(id: string, orgId?: string): Promise<Topic | null> {
    const where: any = { id };
    if (orgId) where.organizationId = orgId;
    const row = await this.prisma.topic.findFirst({ where, include: { aliases: true } });
    return row ? this.mapToDomain(row) : null;
  }

  async findBySlug(slug: string, orgId: string): Promise<Topic | null> {
    const row = await this.prisma.topic.findFirst({
      where: { slug, organizationId: orgId },
      include: { aliases: true },
    });
    return row ? this.mapToDomain(row) : null;
  }

  async create(topic: Topic): Promise<Topic> {
    const created = await this.prisma.topic.create({
      data: {
        id: topic.id,
        organizationId: topic.organizationId,
        slug: topic.slug,
        name: topic.name,
        description: topic.description,
        parentId: topic.parentId,
        aliases: {
          create: (topic.aliases || []).map((alias) => ({ alias })),
        },
      },
      include: { aliases: true },
    });
    return this.mapToDomain(created);
  }

  async update(topic: Topic): Promise<Topic> {
    const updated = await this.prisma.topic.update({
      where: { id: topic.id },
      data: {
        name: topic.name,
        description: topic.description,
        parentId: topic.parentId,
      },
      include: { aliases: true },
    });
    return this.mapToDomain(updated);
  }

  async list(orgId: string): Promise<Topic[]> {
    const rows = await this.prisma.topic.findMany({
      where: { organizationId: orgId },
      include: { aliases: true },
      orderBy: { name: 'asc' },
    });
    return rows.map((r: any) => this.mapToDomain(r));
  }

  async search(query: string, orgId: string): Promise<Topic[]> {
    const rows = await this.prisma.topic.findMany({
      where: {
        organizationId: orgId,
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { slug: { contains: query, mode: 'insensitive' } },
        ],
      },
      include: { aliases: true },
    });
    return rows.map((r: any) => this.mapToDomain(r));
  }

  private mapToDomain(row: any): Topic {
    return {
      id: row.id,
      organizationId: row.organizationId,
      slug: row.slug,
      name: row.name,
      description: row.description,
      parentId: row.parentId,
      aliases: row.aliases ? row.aliases.map((a: any) => a.alias) : [],
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }
}
