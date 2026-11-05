import type { CitizenTip } from '@ai-news/schemas';
import type {
  CitizenTipFilter,
  ICitizenTipRepository,
} from '../../interfaces/citizen-tip.repository';

interface PrismaCitizenTipRow {
  id: string;
  organizationId: string;
  headline: string;
  details: string;
  category: string;
  urgency: string;
  anonymityMode: string;
  verificationChecksum: string;
  contactAlias?: string | null;
  attachments: unknown;
  status: string;
  editorialNotes?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export class PrismaCitizenTipRepository implements ICitizenTipRepository {
  constructor(private readonly prismaGetter: () => Record<string, unknown>) {}

  private get prisma(): Record<string, unknown> {
    return this.prismaGetter();
  }

  private get tipClient(): {
    create: (args: { data: Record<string, unknown> }) => Promise<PrismaCitizenTipRow>;
    findFirst: (args: { where: Record<string, unknown> }) => Promise<PrismaCitizenTipRow | null>;
    findMany: (args: {
      where: Record<string, unknown>;
      orderBy?: Record<string, unknown>;
      take?: number;
    }) => Promise<PrismaCitizenTipRow[]>;
    update: (args: {
      where: Record<string, unknown>;
      data: Record<string, unknown>;
    }) => Promise<PrismaCitizenTipRow>;
  } {
    return this.prisma.citizenTip as {
      create: (args: { data: Record<string, unknown> }) => Promise<PrismaCitizenTipRow>;
      findFirst: (args: { where: Record<string, unknown> }) => Promise<PrismaCitizenTipRow | null>;
      findMany: (args: {
        where: Record<string, unknown>;
        orderBy?: Record<string, unknown>;
        take?: number;
      }) => Promise<PrismaCitizenTipRow[]>;
      update: (args: {
        where: Record<string, unknown>;
        data: Record<string, unknown>;
      }) => Promise<PrismaCitizenTipRow>;
    };
  }

  async create(tip: CitizenTip): Promise<CitizenTip> {
    const row = await this.tipClient.create({
      data: {
        id: tip.id,
        organizationId: tip.organizationId,
        headline: tip.headline,
        details: tip.details,
        category: tip.category,
        urgency: tip.urgency,
        anonymityMode: tip.anonymityMode,
        verificationChecksum: tip.verificationChecksum,
        contactAlias: tip.contactAlias,
        attachments: tip.attachments ?? [],
        status: tip.status,
        editorialNotes: tip.editorialNotes,
        createdAt: new Date(tip.createdAt),
        updatedAt: new Date(tip.updatedAt),
      },
    });
    return this.mapToDomain(row);
  }

  async findById(id: string, orgId?: string): Promise<CitizenTip | null> {
    const where: Record<string, unknown> = { id };
    if (orgId) where.organizationId = orgId;
    const row = await this.tipClient.findFirst({ where });
    return row ? this.mapToDomain(row) : null;
  }

  async findByChecksum(checksum: string, orgId?: string): Promise<CitizenTip | null> {
    const where: Record<string, unknown> = { verificationChecksum: checksum };
    if (orgId) where.organizationId = orgId;
    const row = await this.tipClient.findFirst({ where });
    return row ? this.mapToDomain(row) : null;
  }

  async list(orgId: string, filter?: CitizenTipFilter): Promise<CitizenTip[]> {
    const where: Record<string, unknown> = { organizationId: orgId };
    if (filter?.status) where.status = filter.status;
    if (filter?.urgency) where.urgency = filter.urgency;
    if (filter?.category) where.category = filter.category;
    const rows = await this.tipClient.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: filter?.limit || 50,
    });
    return rows.map((row) => this.mapToDomain(row));
  }

  async update(tip: CitizenTip): Promise<CitizenTip> {
    const row = await this.tipClient.update({
      where: { id: tip.id },
      data: {
        status: tip.status,
        editorialNotes: tip.editorialNotes,
        updatedAt: new Date(tip.updatedAt),
      },
    });
    return this.mapToDomain(row);
  }

  snapshot(): Map<string, CitizenTip> {
    return new Map();
  }

  restore(_snapshot: Map<string, CitizenTip>): void {
    // Prisma is the source of truth; snapshots are only used by the memory engine.
  }

  clear(): void {
    // No destructive truncation in the Prisma path.
  }

  private mapToDomain(row: PrismaCitizenTipRow): CitizenTip {
    return {
      id: row.id,
      organizationId: row.organizationId,
      headline: row.headline,
      details: row.details,
      category: row.category,
      urgency: row.urgency as CitizenTip['urgency'],
      anonymityMode: row.anonymityMode as CitizenTip['anonymityMode'],
      verificationChecksum: row.verificationChecksum,
      contactAlias: row.contactAlias || undefined,
      attachments: Array.isArray(row.attachments)
        ? (row.attachments as CitizenTip['attachments'])
        : [],
      status: row.status as CitizenTip['status'],
      editorialNotes: row.editorialNotes || undefined,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }
}
