import type {
  BlockVariantRecord,
  IBlockVariantRepository,
} from '../../interfaces/block-variant.repository';

interface PrismaBlockVariantRow {
  id: string;
  blockType: string;
  label: string;
  description?: string | null;
  data: unknown;
  shared: boolean;
  organizationId?: string | null;
  createdBy?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export class PrismaBlockVariantRepository implements IBlockVariantRepository {
  constructor(private readonly prismaGetter: () => Record<string, unknown>) {}

  private get prisma(): Record<string, unknown> {
    return this.prismaGetter();
  }

  private get variantClient():
    | {
        findMany: (args: {
          where?: Record<string, unknown>;
          orderBy?: Record<string, unknown> | Record<string, unknown>[];
        }) => Promise<PrismaBlockVariantRow[]>;
        findFirst: (args: {
          where: Record<string, unknown>;
        }) => Promise<PrismaBlockVariantRow | null>;
        create: (args: { data: Record<string, unknown> }) => Promise<PrismaBlockVariantRow>;
        update: (args: {
          where: Record<string, unknown>;
          data: Record<string, unknown>;
        }) => Promise<PrismaBlockVariantRow>;
        delete: (args: { where: Record<string, unknown> }) => Promise<PrismaBlockVariantRow>;
      }
    | undefined {
    return (this.prisma as Record<string, unknown>)?.blockVariant as typeof this.variantClient;
  }

  private mapVariant(row: PrismaBlockVariantRow): BlockVariantRecord {
    const data =
      row.data && typeof row.data === 'object' && !Array.isArray(row.data)
        ? (row.data as Record<string, unknown>)
        : {};

    return {
      id: row.id,
      blockType: row.blockType,
      label: row.label,
      description: row.description ?? undefined,
      data,
      shared: row.shared ?? true,
      organizationId: row.organizationId ?? undefined,
      createdBy: row.createdBy ?? undefined,
      createdAt:
        row.createdAt instanceof Date ? row.createdAt.toISOString() : String(row.createdAt ?? ''),
      updatedAt:
        row.updatedAt instanceof Date ? row.updatedAt.toISOString() : String(row.updatedAt ?? ''),
    };
  }

  /**
   * The variants an organisation may see.
   *
   * A shared variant belongs to everybody; a private one belongs to the
   * organisation that made it.
   */
  private visibleWhere(organizationId?: string): Record<string, unknown> {
    if (!organizationId) return {};
    return {
      OR: [{ shared: true }, { organizationId }],
    };
  }

  async list(blockType?: string, organizationId?: string): Promise<BlockVariantRecord[]> {
    if (!this.variantClient) return [];
    try {
      const rows = await this.variantClient.findMany({
        where: {
          ...(blockType ? { blockType } : {}),
          ...this.visibleWhere(organizationId),
        },
        orderBy: [{ blockType: 'asc' }, { label: 'asc' }],
      });
      return rows.map((row) => this.mapVariant(row));
    } catch {
      return [];
    }
  }

  async findById(id: string, organizationId?: string): Promise<BlockVariantRecord | null> {
    if (!this.variantClient) return null;
    try {
      const row = await this.variantClient.findFirst({
        where: { id, ...this.visibleWhere(organizationId) },
      });
      return row ? this.mapVariant(row) : null;
    } catch {
      return null;
    }
  }

  async create(variant: BlockVariantRecord): Promise<BlockVariantRecord> {
    if (!this.variantClient) return { ...variant, data: { ...variant.data } };
    try {
      const row = await this.variantClient.create({
        data: {
          id: variant.id,
          blockType: variant.blockType,
          label: variant.label,
          description: variant.description ?? null,
          data: variant.data,
          shared: variant.shared,
          organizationId: variant.organizationId ?? null,
          createdBy: variant.createdBy ?? null,
          createdAt: new Date(variant.createdAt),
          updatedAt: new Date(variant.updatedAt),
        },
      });
      return this.mapVariant(row);
    } catch {
      return { ...variant, data: { ...variant.data } };
    }
  }

  async update(variant: BlockVariantRecord): Promise<BlockVariantRecord> {
    if (!this.variantClient) return { ...variant, data: { ...variant.data } };
    try {
      const row = await this.variantClient.update({
        where: { id: variant.id },
        data: {
          label: variant.label,
          description: variant.description ?? null,
          data: variant.data,
          shared: variant.shared,
          updatedAt: new Date(variant.updatedAt),
        },
      });
      return this.mapVariant(row);
    } catch {
      return { ...variant, data: { ...variant.data } };
    }
  }

  async delete(id: string, organizationId?: string): Promise<boolean> {
    if (!this.variantClient) return false;
    try {
      const existing = await this.variantClient.findFirst({
        where: { id, ...this.visibleWhere(organizationId) },
      });
      if (!existing) return false;
      await this.variantClient.delete({ where: { id } });
      return true;
    } catch {
      return false;
    }
  }
}
