import type { AuditLog } from '@ai-news/schemas';
import type { IAuditRepository, AuditFilter } from '../../interfaces/audit.repository';

export class PrismaAuditRepository implements IAuditRepository {
  constructor(private readonly prismaGetter: () => any) {}

  private get prisma() {
    return this.prismaGetter();
  }

  async log(entry: AuditLog): Promise<void> {
    await this.prisma.auditLog.create({
      data: {
        id: entry.id,
        organizationId: entry.organizationId,
        userId: entry.userId,
        clientType: entry.clientType as any,
        action: entry.action,
        resourceType: entry.resourceType,
        resourceId: entry.resourceId,
        payloadSummary: entry.payloadSummary as any,
        requestId: entry.requestId,
        status: entry.status as any,
        durationMs: entry.durationMs,
        errorMessage: entry.errorMessage,
        createdAt: new Date(entry.timestamp),
      },
    });
  }

  async query(orgId: string, filter?: AuditFilter): Promise<AuditLog[]> {
    const where: any = { organizationId: orgId };

    if (filter) {
      if (filter.clientType) where.clientType = filter.clientType;
      if (filter.action) where.action = filter.action;
      if (filter.userId) where.userId = filter.userId;
      if (filter.status) where.status = filter.status;
      if (filter.fromDate || filter.toDate) {
        where.createdAt = {};
        if (filter.fromDate) where.createdAt.gte = new Date(filter.fromDate);
        if (filter.toDate) where.createdAt.lte = new Date(filter.toDate);
      }
    }

    const rows = await this.prisma.auditLog.findMany({
      where,
      take: filter?.limit || 100,
      orderBy: { createdAt: 'desc' },
    });

    return rows.map((r: any) => ({
      id: r.id,
      organizationId: r.organizationId,
      userId: r.userId,
      clientType: r.clientType,
      action: r.action,
      resourceType: r.resourceType,
      resourceId: r.resourceId,
      payloadSummary: r.payloadSummary,
      requestId: r.requestId,
      status: r.status,
      durationMs: r.durationMs,
      errorMessage: r.errorMessage,
      timestamp: r.createdAt.toISOString(),
    }));
  }

  async findById(id: string): Promise<AuditLog | null> {
    const r = await this.prisma.auditLog.findUnique({ where: { id } });
    if (!r) return null;
    return {
      id: r.id,
      organizationId: r.organizationId,
      userId: r.userId,
      clientType: r.clientType,
      action: r.action,
      resourceType: r.resourceType,
      resourceId: r.resourceId,
      payloadSummary: r.payloadSummary,
      requestId: r.requestId,
      status: r.status,
      durationMs: r.durationMs,
      errorMessage: r.errorMessage,
      timestamp: r.createdAt.toISOString(),
    };
  }
}
