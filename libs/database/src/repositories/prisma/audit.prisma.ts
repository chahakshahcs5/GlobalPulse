import type { AuditLog } from '@ai-news/schemas';
import type { IAuditRepository, AuditFilter } from '../../interfaces/audit.repository';

interface PrismaAuditLogRow {
  id: string;
  organizationId: string;
  userId: string;
  clientType: string;
  action: string;
  resourceType: string;
  resourceId?: string | null;
  payloadSummary?: unknown;
  requestId?: string | null;
  status: string;
  durationMs?: number | null;
  errorMessage?: string | null;
  createdAt?: Date;
  timestamp?: Date;
}

export class PrismaAuditRepository implements IAuditRepository {
  constructor(private readonly prismaGetter: () => Record<string, unknown>) {}

  private get prisma(): Record<string, unknown> {
    return this.prismaGetter();
  }

  private get auditClient(): {
    create: (args: { data: Record<string, unknown> }) => Promise<PrismaAuditLogRow>;
    findMany: (args: {
      where: Record<string, unknown>;
      take?: number;
      orderBy?: Record<string, unknown>;
    }) => Promise<PrismaAuditLogRow[]>;
    findUnique: (args: { where: Record<string, unknown> }) => Promise<PrismaAuditLogRow | null>;
  } {
    return this.prisma.auditLog as {
      create: (args: { data: Record<string, unknown> }) => Promise<PrismaAuditLogRow>;
      findMany: (args: {
        where: Record<string, unknown>;
        take?: number;
        orderBy?: Record<string, unknown>;
      }) => Promise<PrismaAuditLogRow[]>;
      findUnique: (args: { where: Record<string, unknown> }) => Promise<PrismaAuditLogRow | null>;
    };
  }

  async log(entry: AuditLog): Promise<void> {
    await this.auditClient.create({
      data: {
        id: entry.id,
        organizationId: entry.organizationId,
        userId: entry.userId,
        clientType: entry.clientType,
        action: entry.action,
        resourceType: entry.resourceType,
        resourceId: entry.resourceId,
        payloadSummary: entry.payloadSummary,
        requestId: entry.requestId,
        status: entry.status,
        durationMs: entry.durationMs,
        errorMessage: entry.errorMessage,
        timestamp: new Date(entry.timestamp),
      },
    });
  }

  async query(orgId: string, filter?: AuditFilter): Promise<AuditLog[]> {
    const where: Record<string, unknown> = { organizationId: orgId };

    if (filter) {
      if (filter.clientType) where.clientType = filter.clientType;
      if (filter.action) where.action = filter.action;
      if (filter.userId) where.userId = filter.userId;
      if (filter.status) where.status = filter.status;
      if (filter.fromDate || filter.toDate) {
        const timeFilter: Record<string, Date> = {};
        if (filter.fromDate) timeFilter.gte = new Date(filter.fromDate);
        if (filter.toDate) timeFilter.lte = new Date(filter.toDate);
        where.timestamp = timeFilter;
      }
    }

    const rows = await this.auditClient.findMany({
      where,
      take: filter?.limit || 100,
      orderBy: { timestamp: 'desc' },
    });

    return rows.map((r) => this.mapToDomain(r));
  }

  async findById(id: string): Promise<AuditLog | null> {
    const r = await this.auditClient.findUnique({ where: { id } });
    if (!r) return null;
    return this.mapToDomain(r);
  }

  private mapToDomain(r: PrismaAuditLogRow): AuditLog {
    const date = r.timestamp || r.createdAt || new Date();
    return {
      id: r.id,
      organizationId: r.organizationId,
      userId: r.userId,
      clientType: r.clientType as AuditLog['clientType'],
      action: r.action,
      resourceType: r.resourceType,
      resourceId: r.resourceId || undefined,
      payloadSummary: (r.payloadSummary as Record<string, unknown>) || undefined,
      requestId: r.requestId || undefined,
      status: r.status as AuditLog['status'],
      durationMs: r.durationMs ?? undefined,
      errorMessage: r.errorMessage || undefined,
      timestamp: date.toISOString(),
    };
  }
}
