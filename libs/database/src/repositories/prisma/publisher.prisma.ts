import type { Publisher } from '@ai-news/schemas';
import type { IPublisherRepository } from '../../interfaces/publisher.repository';

interface PrismaPublisherRow {
  id: string;
  organizationId: string;
  name: string;
  slug: string;
  domain: string;
  logoUrl?: string | null;
  description?: string | null;
  category: string;
  country?: string | null;
  language: string;
  websiteUrl?: string | null;
  biasRating?: string | null;
  credibilityScore?: number | null;
  isVerified: boolean;
  followerCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export class PrismaPublisherRepository implements IPublisherRepository {
  constructor(private readonly prismaGetter: () => Record<string, unknown>) {}

  private get prisma(): Record<string, unknown> {
    return this.prismaGetter();
  }

  private get publisherClient(): {
    findFirst: (args: { where: Record<string, unknown> }) => Promise<PrismaPublisherRow | null>;
    create: (args: { data: Record<string, unknown> }) => Promise<PrismaPublisherRow>;
    update: (args: {
      where: Record<string, unknown>;
      data: Record<string, unknown>;
    }) => Promise<PrismaPublisherRow>;
    findMany: (args: {
      where: Record<string, unknown>;
      orderBy?: Record<string, unknown>;
      take?: number;
    }) => Promise<PrismaPublisherRow[]>;
  } {
    return this.prisma.publisher as {
      findFirst: (args: { where: Record<string, unknown> }) => Promise<PrismaPublisherRow | null>;
      create: (args: { data: Record<string, unknown> }) => Promise<PrismaPublisherRow>;
      update: (args: {
        where: Record<string, unknown>;
        data: Record<string, unknown>;
      }) => Promise<PrismaPublisherRow>;
      findMany: (args: {
        where: Record<string, unknown>;
        orderBy?: Record<string, unknown>;
        take?: number;
      }) => Promise<PrismaPublisherRow[]>;
    };
  }

  async findById(id: string, orgId?: string): Promise<Publisher | null> {
    const where: Record<string, unknown> = { id };
    if (orgId) where.organizationId = orgId;
    const row = await this.publisherClient.findFirst({ where });
    return row ? this.mapToDomain(row) : null;
  }

  async findBySlug(slug: string, orgId: string): Promise<Publisher | null> {
    const row = await this.publisherClient.findFirst({
      where: { slug, organizationId: orgId },
    });
    return row ? this.mapToDomain(row) : null;
  }

  async findByDomain(domain: string, orgId: string): Promise<Publisher | null> {
    const normDomain = domain
      .toLowerCase()
      .replace(/^https?:\/\//, '')
      .replace(/^www\./, '')
      .split('/')[0];
    const row = await this.publisherClient.findFirst({
      where: { domain: normDomain, organizationId: orgId },
    });
    return row ? this.mapToDomain(row) : null;
  }

  async create(publisher: Publisher): Promise<Publisher> {
    const row = await this.publisherClient.create({
      data: {
        id: publisher.id,
        organizationId: publisher.organizationId,
        name: publisher.name,
        slug: publisher.slug,
        domain: publisher.domain,
        logoUrl: publisher.logoUrl,
        description: publisher.description,
        category: publisher.category || 'general',
        country: publisher.country,
        language: publisher.language || 'en',
        websiteUrl: publisher.websiteUrl,
        biasRating: publisher.biasRating,
        credibilityScore: publisher.credibilityScore,
        isVerified: publisher.isVerified ?? true,
        followerCount: publisher.followerCount || 0,
        createdAt: new Date(publisher.createdAt),
        updatedAt: new Date(publisher.updatedAt),
      },
    });
    return this.mapToDomain(row);
  }

  async update(publisher: Publisher): Promise<Publisher> {
    const row = await this.publisherClient.update({
      where: { id: publisher.id },
      data: {
        name: publisher.name,
        slug: publisher.slug,
        domain: publisher.domain,
        logoUrl: publisher.logoUrl,
        description: publisher.description,
        category: publisher.category,
        country: publisher.country,
        language: publisher.language,
        websiteUrl: publisher.websiteUrl,
        biasRating: publisher.biasRating,
        credibilityScore: publisher.credibilityScore,
        isVerified: publisher.isVerified,
        followerCount: publisher.followerCount,
        updatedAt: new Date(publisher.updatedAt),
      },
    });
    return this.mapToDomain(row);
  }

  async list(orgId: string, category?: string, limit = 100): Promise<Publisher[]> {
    const where: Record<string, unknown> = { organizationId: orgId };
    if (category && category !== 'all') {
      where.category = category;
    }
    const rows = await this.publisherClient.findMany({
      where,
      orderBy: { followerCount: 'desc' },
      take: limit,
    });
    return rows.map((r) => this.mapToDomain(r));
  }

  async search(query: string, orgId: string): Promise<Publisher[]> {
    const rows = await this.publisherClient.findMany({
      where: {
        organizationId: orgId,
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { domain: { contains: query, mode: 'insensitive' } },
          { slug: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
        ],
      },
      orderBy: { followerCount: 'desc' },
    });
    return rows.map((r) => this.mapToDomain(r));
  }

  private mapToDomain(row: PrismaPublisherRow): Publisher {
    return {
      id: row.id,
      organizationId: row.organizationId,
      name: row.name,
      slug: row.slug,
      domain: row.domain,
      logoUrl: row.logoUrl ?? undefined,
      description: row.description ?? undefined,
      category: row.category,
      country: row.country ?? undefined,
      language: row.language,
      websiteUrl: row.websiteUrl ?? undefined,
      biasRating: row.biasRating ?? undefined,
      credibilityScore: row.credibilityScore ?? undefined,
      isVerified: row.isVerified,
      followerCount: row.followerCount,
      createdAt:
        row.createdAt instanceof Date ? row.createdAt.toISOString() : String(row.createdAt),
      updatedAt:
        row.updatedAt instanceof Date ? row.updatedAt.toISOString() : String(row.updatedAt),
    };
  }
}
