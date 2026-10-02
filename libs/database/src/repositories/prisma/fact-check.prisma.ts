import type { FactCheckClaim, FactCheckRating } from '@ai-news/schemas';
import type { IFactCheckRepository, FactCheckFilter } from '../../interfaces/fact-check.repository';
import { MemoryFactCheckRepository } from '../memory/fact-check.memory';

interface PrismaFactCheckRow {
  id: string;
  claim: string;
  claimant: string;
  rating: string;
  summary: string;
  checker: string;
  sources: string[];
  checkedAt: Date | string;
}

export class PrismaFactCheckRepository implements IFactCheckRepository {
  private fallbackMemory = new MemoryFactCheckRepository();

  constructor(private readonly prismaGetter: () => Record<string, unknown>) {}

  private get prisma(): Record<string, unknown> {
    return this.prismaGetter();
  }

  private get factCheckClient():
    | {
        findMany: (args?: {
          where?: Record<string, unknown>;
          orderBy?: Record<string, unknown>;
          take?: number;
        }) => Promise<PrismaFactCheckRow[]>;
        findUnique: (args: {
          where: Record<string, unknown>;
        }) => Promise<PrismaFactCheckRow | null>;
        create: (args: { data: Record<string, unknown> }) => Promise<PrismaFactCheckRow>;
        delete: (args: { where: Record<string, unknown> }) => Promise<unknown>;
      }
    | undefined {
    return (this.prisma as Record<string, unknown>).factCheck as typeof this.factCheckClient;
  }

  private mapToDomain(row: PrismaFactCheckRow): FactCheckClaim {
    return {
      id: row.id,
      claim: row.claim,
      claimant: row.claimant,
      rating: row.rating as FactCheckRating,
      summary: row.summary,
      checker: row.checker,
      sources: Array.isArray(row.sources) ? row.sources : [],
      checkedAt:
        row.checkedAt instanceof Date ? row.checkedAt.toISOString() : String(row.checkedAt),
    };
  }

  async list(filter?: FactCheckFilter): Promise<FactCheckClaim[]> {
    if (!this.factCheckClient) {
      return this.fallbackMemory.list(filter);
    }
    try {
      const where: Record<string, unknown> = {};
      if (filter?.rating) {
        where.rating = filter.rating;
      }
      const rows = await this.factCheckClient.findMany({
        where,
        orderBy: { checkedAt: 'desc' },
        take: filter?.limit,
      });
      return rows.map((r) => this.mapToDomain(r));
    } catch {
      return this.fallbackMemory.list(filter);
    }
  }

  async findById(id: string): Promise<FactCheckClaim | null> {
    if (!this.factCheckClient) {
      return this.fallbackMemory.findById(id);
    }
    try {
      const row = await this.factCheckClient.findUnique({ where: { id } });
      return row ? this.mapToDomain(row) : null;
    } catch {
      return this.fallbackMemory.findById(id);
    }
  }

  async create(claim: FactCheckClaim): Promise<FactCheckClaim> {
    if (!this.factCheckClient) {
      return this.fallbackMemory.create(claim);
    }
    try {
      const created = await this.factCheckClient.create({
        data: {
          id: claim.id,
          claim: claim.claim,
          claimant: claim.claimant,
          rating: claim.rating,
          summary: claim.summary,
          checker: claim.checker,
          sources: claim.sources || [],
          checkedAt: claim.checkedAt ? new Date(claim.checkedAt) : new Date(),
        },
      });
      return this.mapToDomain(created);
    } catch {
      return this.fallbackMemory.create(claim);
    }
  }

  async delete(id: string): Promise<boolean> {
    if (!this.factCheckClient) {
      return this.fallbackMemory.delete(id);
    }
    try {
      await this.factCheckClient.delete({ where: { id } });
      return true;
    } catch {
      return this.fallbackMemory.delete(id);
    }
  }
}
