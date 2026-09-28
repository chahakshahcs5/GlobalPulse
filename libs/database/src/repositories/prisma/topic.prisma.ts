import type { Topic } from '@ai-news/schemas';
import type { ITopicRepository } from '../../interfaces/topic.repository';

interface PrismaTopicRow {
  id: string;
  organizationId: string;
  slug: string;
  name: string;
  description?: string | null;
  aliases: string[];
  parentTopicId?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export class PrismaTopicRepository implements ITopicRepository {
  constructor(private readonly prismaGetter: () => Record<string, unknown>) {}

  private get prisma(): Record<string, unknown> {
    return this.prismaGetter();
  }

  private get topicClient(): {
    findFirst: (args: { where: Record<string, unknown> }) => Promise<PrismaTopicRow | null>;
    create: (args: { data: Record<string, unknown> }) => Promise<PrismaTopicRow>;
    update: (args: {
      where: Record<string, unknown>;
      data: Record<string, unknown>;
    }) => Promise<PrismaTopicRow>;
    findMany: (args: {
      where: Record<string, unknown>;
      orderBy?: Record<string, unknown>;
    }) => Promise<PrismaTopicRow[]>;
  } {
    return this.prisma.topic as {
      findFirst: (args: { where: Record<string, unknown> }) => Promise<PrismaTopicRow | null>;
      create: (args: { data: Record<string, unknown> }) => Promise<PrismaTopicRow>;
      update: (args: {
        where: Record<string, unknown>;
        data: Record<string, unknown>;
      }) => Promise<PrismaTopicRow>;
      findMany: (args: {
        where: Record<string, unknown>;
        orderBy?: Record<string, unknown>;
      }) => Promise<PrismaTopicRow[]>;
    };
  }

  async findById(id: string, orgId?: string): Promise<Topic | null> {
    const where: Record<string, unknown> = { id };
    if (orgId) where.organizationId = orgId;
    const row = await this.topicClient.findFirst({ where });
    return row ? this.mapToDomain(row) : null;
  }

  async findBySlug(slug: string, orgId: string): Promise<Topic | null> {
    const row = await this.topicClient.findFirst({
      where: { slug, organizationId: orgId },
    });
    return row ? this.mapToDomain(row) : null;
  }

  async create(topic: Topic): Promise<Topic> {
    const created = await this.topicClient.create({
      data: {
        id: topic.id,
        organizationId: topic.organizationId,
        slug: topic.slug,
        name: topic.name,
        description: topic.description,
        parentTopicId: topic.parentTopicId,
        aliases: topic.aliases || [],
      },
    });
    return this.mapToDomain(created);
  }

  async update(topic: Topic): Promise<Topic> {
    const updated = await this.topicClient.update({
      where: { id: topic.id },
      data: {
        name: topic.name,
        description: topic.description,
        parentTopicId: topic.parentTopicId,
        aliases: topic.aliases || [],
      },
    });
    return this.mapToDomain(updated);
  }

  async list(orgId: string): Promise<Topic[]> {
    const rows = await this.topicClient.findMany({
      where: { organizationId: orgId },
      orderBy: { name: 'asc' },
    });
    return rows.map((r) => this.mapToDomain(r));
  }

  async search(query: string, orgId: string): Promise<Topic[]> {
    const rows = await this.topicClient.findMany({
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

  private mapToDomain(row: PrismaTopicRow): Topic {
    return {
      id: row.id,
      organizationId: row.organizationId,
      slug: row.slug,
      name: row.name,
      description: row.description || undefined,
      aliases: row.aliases || [],
      parentTopicId: row.parentTopicId || undefined,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }
}
