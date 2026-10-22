/**
 * A saved variant of a block type, as it is stored.
 *
 * The shape is deliberately flat: a variant is a named payload, and nothing
 * else about it needs a table of its own.
 */
export interface BlockVariantRecord {
  id: string;
  blockType: string;
  label: string;
  description?: string;
  data: Record<string, unknown>;
  shared: boolean;
  organizationId?: string;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface IBlockVariantRepository {
  /**
   * Every variant, or the variants of one block type.
   *
   * A variant that is not shared belongs to the organisation that made it;
   * the ones everybody shares are offered to every organisation.
   */
  list(blockType?: string, organizationId?: string): Promise<BlockVariantRecord[]>;
  findById(id: string, organizationId?: string): Promise<BlockVariantRecord | null>;
  create(variant: BlockVariantRecord): Promise<BlockVariantRecord>;
  update(variant: BlockVariantRecord): Promise<BlockVariantRecord>;
  delete(id: string, organizationId?: string): Promise<boolean>;
}
