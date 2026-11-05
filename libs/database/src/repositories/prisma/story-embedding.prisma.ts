import type {
  IStoryEmbeddingRepository,
  StoryEmbeddingRecord,
} from '../../interfaces/story-embedding.repository';

interface PrismaStoryEmbeddingRow {
  id: string;
  organizationId: string;
  storyId: string;
  versionNumber: number;
  dimensions: number;
  embedding: unknown;
  tokens: string[];
  model: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export class PrismaStoryEmbeddingRepository implements IStoryEmbeddingRepository {
  constructor(private readonly prismaGetter: () => Record<string, unknown>) {}

  private get client():
    | {
        upsert: (args: {
          where: Record<string, unknown>;
          create: Record<string, unknown>;
          update: Record<string, unknown>;
        }) => Promise<PrismaStoryEmbeddingRow>;
        findFirst: (args: {
          where: Record<string, unknown>;
        }) => Promise<PrismaStoryEmbeddingRow | null>;
        findMany: (args: { where: Record<string, unknown> }) => Promise<PrismaStoryEmbeddingRow[]>;
        deleteMany: (args: { where: Record<string, unknown> }) => Promise<{ count: number }>;
      }
    | undefined {
    return (this.prismaGetter() as Record<string, unknown>).storyEmbedding as typeof this.client;
  }

  private map(row: PrismaStoryEmbeddingRow): StoryEmbeddingRecord {
    return {
      id: row.id,
      organizationId: row.organizationId,
      storyId: row.storyId,
      versionNumber: row.versionNumber,
      dimensions: row.dimensions,
      embedding: Array.isArray(row.embedding) ? (row.embedding as number[]) : [],
      tokens: row.tokens || [],
      model: row.model,
      createdAt:
        row.createdAt instanceof Date ? row.createdAt.toISOString() : String(row.createdAt),
      updatedAt:
        row.updatedAt instanceof Date ? row.updatedAt.toISOString() : String(row.updatedAt),
    };
  }

  async upsert(
    record: Omit<StoryEmbeddingRecord, 'id' | 'createdAt' | 'updatedAt'> & {
      id?: string;
      createdAt?: string;
      updatedAt?: string;
    }
  ): Promise<StoryEmbeddingRecord> {
    if (!this.client) throw new Error('Prisma StoryEmbedding client is unavailable');
    const now = new Date();
    const row = await this.client.upsert({
      where: {
        storyId_versionNumber: {
          storyId: record.storyId,
          versionNumber: record.versionNumber,
        },
      },
      create: {
        organizationId: record.organizationId,
        storyId: record.storyId,
        versionNumber: record.versionNumber,
        dimensions: record.dimensions,
        embedding: record.embedding,
        tokens: record.tokens,
        model: record.model,
        createdAt: record.createdAt ? new Date(record.createdAt) : now,
        updatedAt: now,
      },
      update: {
        dimensions: record.dimensions,
        embedding: record.embedding,
        tokens: record.tokens,
        model: record.model,
        updatedAt: now,
      },
    });
    return this.map(row);
  }

  async findByStoryVersion(
    storyId: string,
    versionNumber: number,
    orgId?: string
  ): Promise<StoryEmbeddingRecord | null> {
    if (!this.client) return null;
    const where: Record<string, unknown> = { storyId, versionNumber };
    if (orgId) where.organizationId = orgId;
    const row = await this.client.findFirst({ where });
    return row ? this.map(row) : null;
  }

  async listByOrganization(orgId: string): Promise<StoryEmbeddingRecord[]> {
    if (!this.client) return [];
    const rows = await this.client.findMany({ where: { organizationId: orgId } });
    return rows.map((row) => this.map(row));
  }

  async deleteByStory(storyId: string, orgId?: string): Promise<number> {
    if (!this.client) return 0;
    const where: Record<string, unknown> = { storyId };
    if (orgId) where.organizationId = orgId;
    const result = await this.client.deleteMany({ where });
    return result.count;
  }

  snapshot(): Map<string, StoryEmbeddingRecord> {
    return new Map();
  }

  restore(_snapshot: Map<string, StoryEmbeddingRecord>): void {
    // Prisma is the source of truth; snapshots are only used by the memory engine.
  }

  clear(): void {
    // No destructive truncation in the Prisma path.
  }
}
