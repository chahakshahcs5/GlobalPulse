import type {
  BlockVariantRecord,
  IBlockVariantRepository,
} from '../../interfaces/block-variant.repository';

/**
 * The variants kept in memory.
 *
 * Used when the platform runs without a database — in tests, and in a
 * development install that has not been set up yet. The behaviour is the
 * same as the database's, so a newsroom working in memory sees the same
 * variants it would see in production.
 */
export class MemoryBlockVariantRepository implements IBlockVariantRepository {
  private variants = new Map<string, BlockVariantRecord>();

  async list(blockType?: string, organizationId?: string): Promise<BlockVariantRecord[]> {
    return Array.from(this.variants.values())
      .filter((variant) => !blockType || variant.blockType === blockType)
      .filter((variant) => this.isVisibleTo(variant, organizationId))
      .map((variant) => ({ ...variant, data: { ...variant.data } }));
  }

  async findById(id: string, organizationId?: string): Promise<BlockVariantRecord | null> {
    const variant = this.variants.get(id);
    if (!variant) return null;
    if (!this.isVisibleTo(variant, organizationId)) return null;
    return { ...variant, data: { ...variant.data } };
  }

  async create(variant: BlockVariantRecord): Promise<BlockVariantRecord> {
    this.variants.set(variant.id, { ...variant, data: { ...variant.data } });
    return { ...variant, data: { ...variant.data } };
  }

  async update(variant: BlockVariantRecord): Promise<BlockVariantRecord> {
    const existing = this.variants.get(variant.id);
    if (!existing) return { ...variant, data: { ...variant.data } };
    const stored = { ...existing, ...variant, data: { ...variant.data } };
    this.variants.set(stored.id, stored);
    return { ...stored, data: { ...stored.data } };
  }

  async delete(id: string, organizationId?: string): Promise<boolean> {
    const variant = this.variants.get(id);
    if (!variant) return false;
    if (!this.isVisibleTo(variant, organizationId)) return false;
    return this.variants.delete(id);
  }

  /**
   * Whether a variant is offered to an organisation.
   *
   * A shared variant is offered to everybody; a private one only to the
   * organisation that made it.
   */
  private isVisibleTo(variant: BlockVariantRecord, organizationId?: string): boolean {
    if (variant.shared) return true;
    if (!organizationId) return true;
    return variant.organizationId === organizationId;
  }

  snapshot(): Map<string, BlockVariantRecord> {
    return new Map(this.variants);
  }

  restore(snapshot: Map<string, BlockVariantRecord>): void {
    this.variants = new Map(snapshot);
  }

  clear(): void {
    this.variants.clear();
  }
}
