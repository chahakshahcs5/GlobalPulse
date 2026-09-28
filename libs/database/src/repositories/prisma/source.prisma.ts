import type { Source, Citation, Claim } from '@ai-news/schemas';
import type { ISourceRepository } from '../../interfaces/source.repository';

interface PrismaSourceRow {
  id: string;
  organizationId: string;
  url: string;
  canonicalUrl?: string | null;
  title: string;
  publisher: string;
  author?: string | null;
  publishedAt?: Date | null;
  retrievedAt: Date;
  language: string;
  sourceType: string;
  licenseMetadata?: string | null;
  permissibleExcerpt?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface PrismaCitationRow {
  id: string;
  organizationId: string;
  storyId: string;
  blockId?: string | null;
  sourceId: string;
  claimText: string;
  confidenceScore?: number | null;
  createdAt: Date;
}

interface PrismaClaimRow {
  id: string;
  organizationId: string;
  claimText: string;
  sourceIds: string[];
  verifiedStatus: string;
  editorialNotes?: string | null;
  createdAt: Date;
}

export class PrismaSourceRepository implements ISourceRepository {
  constructor(private readonly prismaGetter: () => Record<string, unknown>) {}

  private get prisma(): Record<string, unknown> {
    return this.prismaGetter();
  }

  private get sourceClient(): {
    findFirst: (args: { where: Record<string, unknown> }) => Promise<PrismaSourceRow | null>;
    create: (args: { data: Record<string, unknown> }) => Promise<PrismaSourceRow>;
    update: (args: {
      where: Record<string, unknown>;
      data: Record<string, unknown>;
    }) => Promise<PrismaSourceRow>;
    findMany: (args: {
      where: Record<string, unknown>;
      take?: number;
      orderBy?: Record<string, unknown>;
    }) => Promise<PrismaSourceRow[]>;
  } {
    return this.prisma.source as {
      findFirst: (args: { where: Record<string, unknown> }) => Promise<PrismaSourceRow | null>;
      create: (args: { data: Record<string, unknown> }) => Promise<PrismaSourceRow>;
      update: (args: {
        where: Record<string, unknown>;
        data: Record<string, unknown>;
      }) => Promise<PrismaSourceRow>;
      findMany: (args: {
        where: Record<string, unknown>;
        take?: number;
        orderBy?: Record<string, unknown>;
      }) => Promise<PrismaSourceRow[]>;
    };
  }

  private get citationClient(): {
    create: (args: { data: Record<string, unknown> }) => Promise<PrismaCitationRow>;
    findMany: (args: { where: Record<string, unknown> }) => Promise<PrismaCitationRow[]>;
  } {
    return this.prisma.citation as {
      create: (args: { data: Record<string, unknown> }) => Promise<PrismaCitationRow>;
      findMany: (args: { where: Record<string, unknown> }) => Promise<PrismaCitationRow[]>;
    };
  }

  private get claimClient(): {
    create: (args: { data: Record<string, unknown> }) => Promise<PrismaClaimRow>;
    findMany: (args: { where: Record<string, unknown> }) => Promise<PrismaClaimRow[]>;
  } {
    return (this.prisma.claim || this.prisma.citation) as {
      create: (args: { data: Record<string, unknown> }) => Promise<PrismaClaimRow>;
      findMany: (args: { where: Record<string, unknown> }) => Promise<PrismaClaimRow[]>;
    };
  }

  async findById(id: string, orgId?: string): Promise<Source | null> {
    const where: Record<string, unknown> = { id };
    if (orgId) where.organizationId = orgId;
    const row = await this.sourceClient.findFirst({ where });
    return row ? this.mapToDomain(row) : null;
  }

  async findByUrl(url: string, orgId: string): Promise<Source | null> {
    const row = await this.sourceClient.findFirst({
      where: { url, organizationId: orgId },
    });
    return row ? this.mapToDomain(row) : null;
  }

  async create(source: Source): Promise<Source> {
    const created = await this.sourceClient.create({
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
        sourceType: source.sourceType,
        licenseMetadata: source.licenseMetadata,
        permissibleExcerpt: source.permissibleExcerpt,
      },
    });
    return this.mapToDomain(created);
  }

  async update(source: Source): Promise<Source> {
    const updated = await this.sourceClient.update({
      where: { id: source.id },
      data: {
        title: source.title,
        publisher: source.publisher,
        author: source.author,
        sourceType: source.sourceType,
        permissibleExcerpt: source.permissibleExcerpt,
      },
    });
    return this.mapToDomain(updated);
  }

  async list(orgId: string, limit: number = 50): Promise<Source[]> {
    const rows = await this.sourceClient.findMany({
      where: { organizationId: orgId },
      take: limit,
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((r) => this.mapToDomain(r));
  }

  async search(query: string, orgId: string): Promise<Source[]> {
    const rows = await this.sourceClient.findMany({
      where: {
        organizationId: orgId,
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { publisher: { contains: query, mode: 'insensitive' } },
          { url: { contains: query, mode: 'insensitive' } },
        ],
      },
    });
    return rows.map((r) => this.mapToDomain(r));
  }

  async createCitation(citation: Citation): Promise<Citation> {
    const created = await this.citationClient.create({
      data: {
        id: citation.id,
        organizationId: citation.organizationId,
        storyId: citation.storyId,
        blockId: citation.blockId,
        sourceId: citation.sourceId,
        claimText: citation.claimText,
        confidenceScore: citation.confidenceScore,
      },
    });
    return {
      id: created.id,
      organizationId: created.organizationId,
      storyId: created.storyId,
      blockId: created.blockId || undefined,
      sourceId: created.sourceId,
      claimText: created.claimText,
      confidenceScore: created.confidenceScore ?? undefined,
      createdAt: created.createdAt.toISOString(),
    };
  }

  async getCitationsForStory(storyId: string, orgId?: string): Promise<Citation[]> {
    const where: Record<string, unknown> = { storyId };
    if (orgId) {
      where.organizationId = orgId;
    }
    const rows = await this.citationClient.findMany({
      where,
    });
    return rows.map((r) => ({
      id: r.id,
      organizationId: r.organizationId,
      storyId: r.storyId,
      blockId: r.blockId || undefined,
      sourceId: r.sourceId,
      claimText: r.claimText,
      confidenceScore: r.confidenceScore ?? undefined,
      createdAt: r.createdAt.toISOString(),
    }));
  }

  async createClaim(claim: Claim): Promise<Claim> {
    const created = await this.claimClient.create({
      data: {
        id: claim.id,
        organizationId: claim.organizationId,
        sourceIds: claim.sourceIds,
        claimText: claim.claimText,
        verifiedStatus: claim.verifiedStatus,
        editorialNotes: claim.editorialNotes,
      },
    });
    return {
      id: created.id,
      organizationId: created.organizationId,
      sourceIds: created.sourceIds,
      claimText: created.claimText,
      verifiedStatus: created.verifiedStatus as Claim['verifiedStatus'],
      editorialNotes: created.editorialNotes || undefined,
      createdAt: created.createdAt.toISOString(),
    };
  }

  async getClaimsForSource(sourceId: string, orgId?: string): Promise<Claim[]> {
    const where: Record<string, unknown> = { sourceIds: { has: sourceId } };
    if (orgId) {
      where.organizationId = orgId;
    }
    const rows = await this.claimClient.findMany({
      where,
    });
    return rows.map((r) => ({
      id: r.id,
      organizationId: r.organizationId,
      sourceIds: r.sourceIds,
      claimText: r.claimText,
      verifiedStatus: r.verifiedStatus as Claim['verifiedStatus'],
      editorialNotes: r.editorialNotes || undefined,
      createdAt: r.createdAt.toISOString(),
    }));
  }

  private mapToDomain(row: PrismaSourceRow): Source {
    return {
      id: row.id,
      organizationId: row.organizationId,
      url: row.url,
      canonicalUrl: row.canonicalUrl || undefined,
      title: row.title,
      publisher: row.publisher,
      author: row.author || undefined,
      publishedAt: row.publishedAt ? row.publishedAt.toISOString() : undefined,
      retrievedAt: row.retrievedAt.toISOString(),
      language: row.language,
      sourceType: row.sourceType as Source['sourceType'],
      licenseMetadata: row.licenseMetadata || undefined,
      permissibleExcerpt: row.permissibleExcerpt || undefined,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }
}
