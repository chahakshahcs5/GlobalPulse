import type { IdempotencyRecord } from '@ai-news/schemas';
import type { IIdempotencyRepository } from '../../interfaces/idempotency.repository';

export class PrismaIdempotencyRepository implements IIdempotencyRepository {
  constructor(private readonly prismaGetter: () => any) {}

  private get prisma() {
    return this.prismaGetter();
  }

  async get(key: string, orgId: string): Promise<IdempotencyRecord | null> {
    const row = await this.prisma.idempotencyRecord.findUnique({
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
      expiresAt: row.expiresAt ? row.expiresAt.toISOString() : undefined,
    };
  }

  async save(record: IdempotencyRecord): Promise<void> {
    await this.prisma.idempotencyRecord.upsert({
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
        responseJson: record.responseJson as any,
        expiresAt: record.expiresAt ? new Date(record.expiresAt) : null,
      },
      update: {
        responseJson: record.responseJson as any,
      },
    });
  }

  async delete(key: string, orgId: string): Promise<boolean> {
    const res = await this.prisma.idempotencyRecord.deleteMany({
      where: { key, organizationId: orgId },
    });
    return res.count > 0;
  }
}
