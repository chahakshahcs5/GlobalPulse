import type { Source, Citation, Claim } from '@ai-news/schemas';
import type { ISourceRepository } from '../../interfaces/source.repository';

export class PrismaSourceRepository implements ISourceRepository {
  constructor(private readonly prismaGetter: () => any) {}

  private get prisma() {
    return this.prismaGetter();
  }

  async findById(id: string, orgId?: string): Promise<Source | null> {
    const where: any = { id };
    if (orgId) where.organizationId = orgId;
    const row = await this.prisma.source.findFirst({ where });
    return row ? this.mapToDomain(row) : null;
  }

  async findByUrl(url: string, orgId: string): Promise<Source | null> {
    const row = await this.prisma.source.findFirst({
      where: { url, organizationId: orgId },
    });
    return row ? this.mapToDomain(row) : null;
  }

  async create(source: Source): Promise<Source> {
    const created = await this.prisma.source.create({
      data: {
        id: source.id,
        organizationId: source.organizationId,
        url: source.url,
        canonicalUrl: source.canonicalUrl,
        title: source.title,
        publisher: source.publisher,
        author: source.author,
        publishedAt: source.publishedAt ? new Date(source.publishedAt) : null,
        retrievedAt: new Date(source.retrievedAt),
        language: source.language || 'en',
        sourceType: source.sourceType as any,
        licenseMetadata: source.licenseMetadata,
        permissibleExcerpt: source.permissibleExcerpt,
      },
    });
    return this.mapToDomain(created);
  }

  async update(source: Source): Promise<Source> {
    const updated = await this.prisma.source.update({
      where: { id: source.id },
      data: {
        title: source.title,
        publisher: source.publisher,
        author: source.author,
        sourceType: source.sourceType as any,
        permissibleExcerpt: source.permissibleExcerpt,
      },
    });
    return this.mapToDomain(updated);
  }

  async list(orgId: string, limit: number = 50): Promise<Source[]> {
    const rows = await this.prisma.source.findMany({
      where: { organizationId: orgId },
      take: limit,
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((r: any) => this.mapToDomain(r));
  }

  async search(query: string, orgId: string): Promise<Source[]> {
    const rows = await this.prisma.source.findMany({
      where: {
        organizationId: orgId,
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { publisher: { contains: query, mode: 'insensitive' } },
          { url: { contains: query, mode: 'insensitive' } },
        ],
      },
    });
    return rows.map((r: any) => this.mapToDomain(r));
  }

  async createCitation(citation: Citation): Promise<Citation> {
    const created = await this.prisma.citation.create({
      data: {
        id: citation.id,
        storyId: citation.storyId,
        sourceId: citation.sourceId,
        claim: citation.claim,
        confidenceScore: citation.confidenceScore,
      },
    });
    return {
      id: created.id,
      storyId: created.storyId,
      sourceId: created.sourceId,
      claim: created.claim,
      confidenceScore: created.confidenceScore,
      createdAt: created.createdAt.toISOString(),
    };
  }

  async getCitationsForStory(storyId: string): Promise<Citation[]> {
    const rows = await this.prisma.citation.findMany({
      where: { storyId },
    });
    return rows.map((r: any) => ({
      id: r.id,
      storyId: r.storyId,
      sourceId: r.sourceId,
      claim: r.claim,
      confidenceScore: r.confidenceScore,
      createdAt: r.createdAt.toISOString(),
    }));
  }

  async createClaim(claim: Claim): Promise<Claim> {
    const created = await this.prisma.claim.create({
      data: {
        id: claim.id,
        sourceId: claim.sourceId,
        statement: claim.statement,
        verificationStatus: claim.verificationStatus,
      },
    });
    return {
      id: created.id,
      sourceId: created.sourceId,
      statement: created.statement,
      verificationStatus: created.verificationStatus,
      createdAt: created.createdAt.toISOString(),
    };
  }

  async getClaimsForSource(sourceId: string): Promise<Claim[]> {
    const rows = await this.prisma.claim.findMany({
      where: { sourceId },
    });
    return rows.map((r: any) => ({
      id: r.id,
      sourceId: r.sourceId,
      statement: r.statement,
      verificationStatus: r.verificationStatus,
      createdAt: r.createdAt.toISOString(),
    }));
  }

  private mapToDomain(row: any): Source {
    return {
      id: row.id,
      organizationId: row.organizationId,
      url: row.url,
      canonicalUrl: row.canonicalUrl,
      title: row.title,
      publisher: row.publisher,
      author: row.author,
      publishedAt: row.publishedAt ? row.publishedAt.toISOString() : undefined,
      retrievedAt: row.retrievedAt.toISOString(),
      language: row.language,
      sourceType: row.sourceType,
      licenseMetadata: row.licenseMetadata,
      permissibleExcerpt: row.permissibleExcerpt,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }
}
