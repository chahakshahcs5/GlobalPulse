import type { DatabaseService } from '@ai-news/database';
import {
  validateVariantPayload,
  type BlockVariant,
  type BlockVariantInput,
  type BlockVariantUpdate,
} from '@ai-news/schemas';
import { ValidationError, generateId } from '@ai-news/shared';

export interface BlockVariantContext {
  organizationId?: string;
  authorId?: string;
}

/**
 * The variants a newsroom keeps.
 *
 * A variant is a named, ready-made payload for a block type — the way a
 * chart has a "line" variant and a "stacked bar" variant. The samples that
 * ship with the Block Studio are the same idea, but they live in the
 * repository, so adding a shared treatment was a code change and a deploy.
 *
 * Variants live on the server so they can be shared: a newsroom that has
 * agreed on how its charts read keeps that agreement in one place, and the
 * studio and the composer both read the same list.
 *
 * A variant's payload is checked against the block type's own schema
 * before it is stored. A variant that did not validate would preview a
 * block the platform would reject, and would teach an editor the wrong
 * thing.
 */
export class BlockVariantService {
  constructor(private readonly db: DatabaseService) {}

  async list(blockType?: string, ctx?: BlockVariantContext): Promise<BlockVariant[]> {
    const records = await this.db.blockVariants.list(blockType, ctx?.organizationId);
    return records.map((record) => this.toVariant(record));
  }

  async get(id: string, ctx?: BlockVariantContext): Promise<BlockVariant | null> {
    const record = await this.db.blockVariants.findById(id, ctx?.organizationId);
    return record ? this.toVariant(record) : null;
  }

  async create(input: BlockVariantInput, ctx?: BlockVariantContext): Promise<BlockVariant> {
    this.assertPayloadIsValid(input.blockType, input.data);

    const now = new Date().toISOString();
    const record = await this.db.blockVariants.create({
      id: generateId('var'),
      blockType: input.blockType,
      label: input.label,
      description: input.description,
      data: input.data ?? {},
      shared: input.shared ?? true,
      organizationId: ctx?.organizationId,
      createdBy: ctx?.authorId,
      createdAt: now,
      updatedAt: now,
    });

    return this.toVariant(record);
  }

  async update(
    id: string,
    update: BlockVariantUpdate,
    ctx?: BlockVariantContext
  ): Promise<BlockVariant | null> {
    const existing = await this.db.blockVariants.findById(id, ctx?.organizationId);
    if (!existing) return null;

    const data = update.data ?? existing.data;
    this.assertPayloadIsValid(existing.blockType, data);

    const record = await this.db.blockVariants.update({
      ...existing,
      label: update.label ?? existing.label,
      description: update.description ?? existing.description,
      data,
      shared: update.shared ?? existing.shared,
      updatedAt: new Date().toISOString(),
    });

    return this.toVariant(record);
  }

  async delete(id: string, ctx?: BlockVariantContext): Promise<boolean> {
    return this.db.blockVariants.delete(id, ctx?.organizationId);
  }

  /**
   * Refuse a payload the block type would reject.
   *
   * The same schema the platform stores, and the same one the studio's
   * form is generated from, so a variant can never preview a block that
   * the platform would refuse to publish.
   */
  private assertPayloadIsValid(blockType: string, data: unknown): void {
    const result = validateVariantPayload(blockType, data);
    if (result.ok) return;

    const detail = result.issues
      .map((issue) => `${issue.path || '(root)'}: ${issue.message}`)
      .join('; ');

    throw new ValidationError(`Invalid payload for a "${blockType}" variant — ${detail}`);
  }

  private toVariant(record: {
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
  }): BlockVariant {
    return {
      id: record.id,
      blockType: record.blockType,
      label: record.label,
      description: record.description,
      data: { ...record.data },
      shared: record.shared,
      organizationId: record.organizationId,
      createdBy: record.createdBy,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }
}
