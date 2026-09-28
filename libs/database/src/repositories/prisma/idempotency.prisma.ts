import type { IdempotencyRecord } from '@ai-news/schemas';
import type { IIdempotencyRepository } from '../../interfaces/idempotency.repository';

interface PrismaIdempotencyRow {
  id: string;
  organizationId: string;
  key: string;
  action: string;
  responseJson: unknown;
  createdAt: Date;
}

export class PrismaIdempotencyRepository implements IIdempotencyRepository {
  constructor(private readonly prismaGetter: () => Record<string, unknown>) {}

  private get prisma(): Record<string, unknown> {
    return this.prismaGetter();
  }

  private get idempotencyClient(): {
    findUnique: (args: { where: Record<string, unknown> }) => Promise<PrismaIdempotencyRow | null>;
    upsert: (args: { where: Record<string, unknown>; create: Record<string, unknown>; update: Record<string, unknown> }) => Promise<PrismaIdempotencyRow>;
    deleteMany: (args: { where: Record<string, unknown> }) => Promise<{ count: number }>;
  } {
    return this.prisma.idempotencyRecord as {
      findUnique: (args: { where: Record<string, unknown> }) => Promise<PrismaIdempotencyRow | null>;
      upsert: (args: { where: Record<string, unknown>; create: Record<string, unknown>; update: Record<string, unknown> }) => Promise<PrismaIdempotencyRow>;
      deleteMany: (args: { where: Record<string, unknown> }) => Promise<{ count: number }>;
    };
  }

  async get(key: string, orgId: string): Promise<IdempotencyRecord | null> {
    const row = await this.idempotencyClient.findUnique({
      where: {
        organizationId_key: {
          organizationId: orgId,
          key,
        },
      },
    });
    if (!row) return null;
    return {
      id: row.id,
      organizationId: row.organizationId,
      key: row.key,
      action: row.action,
      responseJson: row.responseJson,
      createdAt: row.createdAt.toISOString(),
    };
  }

  async save(record: IdempotencyRecord, _ttlSeconds?: number): Promise<void> {
    await this.idempotencyClient.upsert({
      where: {
        organizationId_key: {
          organizationId: record.organizationId,
          key: record.key,
        },
      },
      create: {
        id: record.id,
        organizationId: record.organizationId,
        key: record.key,
        action: record.action,
        responseJson: record.responseJson,
      },
      update: {
        responseJson: record.responseJson,
      },
    });
  }

  async delete(key: string, orgId: string): Promise<boolean> {
    const res = await this.idempotencyClient.deleteMany({
      where: { key, organizationId: orgId },
    });
    return res.count > 0;
  }

  async pruneExpired(): Promise<number> {
    // In database Prisma mode, idempotency records older than 24 hours can be cleaned up
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
    try {
      const res = await this.idempotencyClient.deleteMany({
        where: {
          createdAt: {
            lt: cutoff,
          },
        },
      });
      return res.count;
    } catch {
      return 0;
    }
  }
}
