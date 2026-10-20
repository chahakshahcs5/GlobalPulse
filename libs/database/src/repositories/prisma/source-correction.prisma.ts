import type { SourceCorrection } from '@ai-news/schemas';
import type {
  ISourceCorrectionRepository,
  SourceCorrectionFilter,
} from '../../interfaces/source-correction.repository';
import { MemorySourceCorrectionRepository } from '../memory/source-correction.memory';

type Row = Record<string, unknown>;

function iso(value: unknown): string {
  return value instanceof Date ? value.toISOString() : String(value);
}

interface ModelClient {
  findMany: (args?: Record<string, unknown>) => Promise<Row[]>;
  findFirst: (args: Record<string, unknown>) => Promise<Row | null>;
  create: (args: { data: Record<string, unknown> }) => Promise<Row>;
  deleteMany: (args: { where: Record<string, unknown> }) => Promise<{ count: number }>;
}

export class PrismaSourceCorrectionRepository implements ISourceCorrectionRepository {
  private readonly fallback = new MemorySourceCorrectionRepository();

  constructor(private readonly prismaGetter: () => Record<string, unknown>) {}

  private get prisma(): Record<string, unknown> {
    return this.prismaGetter();
  }

  private client(): ModelClient | undefined {
    return this.prisma.sourceCorrection as ModelClient | undefined;
  }

  private mapCorrection(row: Row): SourceCorrection {
    return {
      id: String(row.id),
      organizationId: String(row.organizationId),
      publisherId: (row.publisherId as string | null) ?? undefined,
      sourceId: (row.sourceId as string | null) ?? undefined,
      storyId: (row.storyId as string | null) ?? undefined,
      type: String(row.type) as SourceCorrection['type'],
      description: String(row.description),
      issuedAt: iso(row.issuedAt),
      url: (row.url as string | null) ?? undefined,
      recordedBy: String(row.recordedBy),
      createdAt: iso(row.createdAt),
    };
  }

  async list(orgId: string, filter?: SourceCorrectionFilter): Promise<SourceCorrection[]> {
    const client = this.client();
    if (!client) return this.fallback.list(orgId, filter);
    try {
      const where: Record<string, unknown> = { organizationId: orgId };
      if (filter?.publisherId) where.publisherId = filter.publisherId;
      if (filter?.sourceId) where.sourceId = filter.sourceId;
      if (filter?.storyId) where.storyId = filter.storyId;
      const rows = await client.findMany({
        where,
        orderBy: { issuedAt: 'desc' },
        take: filter?.limit,
      });
      return rows.map((r) => this.mapCorrection(r));
    } catch {
      return this.fallback.list(orgId, filter);
    }
  }

  async findById(id: string, orgId: string): Promise<SourceCorrection | null> {
    const client = this.client();
    if (!client) return this.fallback.findById(id, orgId);
    try {
      const row = await client.findFirst({ where: { id, organizationId: orgId } });
      return row ? this.mapCorrection(row) : null;
    } catch {
      return this.fallback.findById(id, orgId);
    }
  }

  async create(correction: SourceCorrection): Promise<SourceCorrection> {
    const client = this.client();
    if (!client) return this.fallback.create(correction);
    try {
      const row = await client.create({
        data: {
          ...correction,
          issuedAt: new Date(correction.issuedAt),
          createdAt: new Date(correction.createdAt),
        },
      });
      return this.mapCorrection(row);
    } catch {
      return this.fallback.create(correction);
    }
  }

  async delete(id: string, orgId: string): Promise<boolean> {
    const client = this.client();
    if (!client) return this.fallback.delete(id, orgId);
    try {
      const result = await client.deleteMany({ where: { id, organizationId: orgId } });
      return result.count > 0;
    } catch {
      return this.fallback.delete(id, orgId);
    }
  }
}
