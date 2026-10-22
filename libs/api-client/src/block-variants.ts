/**
 * API Client — Block Variants
 *
 * A variant is a named, ready-made payload for a block type. The studio
 * ships a set of them; a newsroom keeps its own on the server, so that
 * everybody editing a story is offered the same treatments.
 */
import { request } from './core';

export interface BlockVariant {
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

export interface BlockVariantInput {
  blockType: string;
  label: string;
  description?: string;
  data: Record<string, unknown>;
  shared?: boolean;
}

export type BlockVariantUpdate = Partial<Omit<BlockVariantInput, 'blockType'>>;

/** Every variant, or the variants of one block type. */
export async function listBlockVariants(blockType?: string): Promise<BlockVariant[]> {
  const query = blockType ? `?blockType=${encodeURIComponent(blockType)}` : '';
  return request<BlockVariant[]>(`/api/block-variants${query}`);
}

export async function getBlockVariant(id: string): Promise<BlockVariant> {
  return request<BlockVariant>(`/api/block-variants/${encodeURIComponent(id)}`);
}

export async function createBlockVariant(input: BlockVariantInput): Promise<BlockVariant> {
  return request<BlockVariant>('/api/block-variants', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function updateBlockVariant(
  id: string,
  update: BlockVariantUpdate
): Promise<BlockVariant> {
  return request<BlockVariant>(`/api/block-variants/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(update),
  });
}

export async function deleteBlockVariant(id: string): Promise<void> {
  await request<void>(`/api/block-variants/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
}
