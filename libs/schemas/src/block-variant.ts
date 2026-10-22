import { z } from 'zod';
import { getBlockDefinition } from './block-registry';

/**
 * A saved variant of a block type.
 *
 * A variant is a named, ready-made payload — the way a chart has a "line"
 * variant and a "stacked bar" variant. The samples that ship with the
 * studio are the same idea, but they live in the repository: adding a
 * shared treatment was a code change and a deploy.
 *
 * A variant lives on the server so that it can be shared. A newsroom that
 * has agreed on how its charts should read can keep that agreement in one
 * place, and the studio and the composer both read the same list.
 */
export interface BlockVariant {
  id: string;
  /** The block type this variant is a treatment of. */
  blockType: string;
  label: string;
  description?: string;
  /** The block's content. */
  data: Record<string, unknown>;
  /** Whether the variant is offered to everyone in the organisation. */
  shared: boolean;
  organizationId?: string;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

export const BlockVariantInputSchema = z.object({
  blockType: z.string().min(1),
  label: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  data: z.record(z.unknown()).default({}),
  shared: z.boolean().default(true),
});
export type BlockVariantInput = z.infer<typeof BlockVariantInputSchema>;

export const BlockVariantUpdateSchema = z.object({
  label: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional(),
  data: z.record(z.unknown()).optional(),
  shared: z.boolean().optional(),
});
export type BlockVariantUpdate = z.infer<typeof BlockVariantUpdateSchema>;

export interface VariantPayloadIssue {
  path: string;
  message: string;
}

/**
 * Check a variant's payload against the block type it is a variant of.
 *
 * A variant that does not validate would preview a block the platform would
 * reject, and would teach an editor the wrong thing. So a variant is
 * checked against the very schema the platform stores — the same one the
 * studio's form is generated from.
 */
export function validateVariantPayload(
  blockType: string,
  data: unknown
): { ok: boolean; issues: VariantPayloadIssue[] } {
  const definition = getBlockDefinition(blockType);
  if (!definition) {
    return { ok: false, issues: [{ path: '', message: `Unknown block type "${blockType}".` }] };
  }

  const result = definition.schema.safeParse({
    id: 'variant_preview',
    blockType,
    sortOrder: 0,
    data,
  });

  if (result.success) return { ok: true, issues: [] };

  return {
    ok: false,
    issues: result.error.issues.map((issue) => ({
      path: issue.path.map((segment) => String(segment)).join('.'),
      message: issue.message,
    })),
  };
}
