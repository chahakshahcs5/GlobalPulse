'use client';

import { useCallback, useEffect, useState } from 'react';
import type { StudioVariant } from '@ai-news/block-studio';
import {
  createBlockVariant,
  deleteBlockVariant,
  listBlockVariants,
  type BlockVariant,
} from '../lib/newsroom-api';

/**
 * The variants a newsroom keeps.
 *
 * They live on the server, so a treatment one editor agreed on is offered
 * to everybody: the studio and the newsroom composer read the same list.
 *
 * When the server cannot be reached — no session, no network, an API that
 * is down — the studio falls back to the variants kept in this browser and
 * says so, rather than pretending the newsroom's variants are empty.
 */

const STORAGE_KEY = 'block_studio_local_variants';

type StoredVariants = Record<string, StudioVariant[]>;

/** Where the variants on screen came from. */
export type VariantSource = 'server' | 'local';

function readLocal(): StoredVariants {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as StoredVariants) : {};
  } catch {
    return {};
  }
}

function writeLocal(variants: StoredVariants): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(variants));
  } catch {
    // Private mode, or the quota is full. The variant simply is not kept.
  }
}

/** The server's variants, grouped by the block type they belong to. */
function groupByBlockType(variants: BlockVariant[]): StoredVariants {
  const grouped: StoredVariants = {};

  for (const variant of variants) {
    const existing = grouped[variant.blockType] ?? [];
    existing.push({
      id: variant.id,
      label: variant.label,
      description: variant.description,
      data: variant.data,
    });
    grouped[variant.blockType] = existing;
  }

  return grouped;
}

/** Add a variant, replacing any variant with the same id. */
function addVariant(
  variants: StoredVariants,
  blockType: string,
  variant: StudioVariant
): StoredVariants {
  const forType = variants[blockType] ?? [];
  const withoutSameId = forType.filter((existing) => existing.id !== variant.id);
  return { ...variants, [blockType]: [...withoutSameId, variant] };
}

/** Remove a variant. */
function dropVariant(
  variants: StoredVariants,
  blockType: string,
  variantId: string
): StoredVariants {
  return {
    ...variants,
    [blockType]: (variants[blockType] ?? []).filter((variant) => variant.id !== variantId),
  };
}

export function useBlockVariants() {
  const [variants, setVariants] = useState<StoredVariants>({});
  const [source, setSource] = useState<VariantSource>('server');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const serverVariants = await listBlockVariants();
        if (cancelled) return;
        setVariants(groupByBlockType(serverVariants));
        setSource('server');
        setError(null);
      } catch {
        if (cancelled) return;
        // The newsroom could not be reached. The variants this browser kept
        // are better than nothing, and the studio says where they came from.
        setVariants(readLocal());
        setSource('local');
        setError(
          'The newsroom API could not be reached, so only the variants kept in this browser are shown.'
        );
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  /**
   * Save a variant, and say where it ended up.
   *
   * It goes to the newsroom so that everybody sees it. When the newsroom
   * cannot take it, it is kept in this browser instead, and the editor is
   * told that it did not become shared.
   */
  const saveVariant = useCallback(
    async (blockType: string, variant: StudioVariant): Promise<{ id: string; shared: boolean }> => {
      try {
        const saved = await createBlockVariant({
          blockType,
          label: variant.label,
          description: variant.description,
          data: variant.data,
        });

        setVariants((current) =>
          addVariant(current, blockType, {
            id: saved.id,
            label: saved.label,
            description: saved.description,
            data: saved.data,
          })
        );
        setSource('server');
        setError(null);

        return { id: saved.id, shared: true };
      } catch {
        const local = addVariant(readLocal(), blockType, variant);
        writeLocal(local);
        setVariants(local);
        setSource('local');
        setError(
          'The variant could not be saved to the newsroom, so it is only kept in this browser.'
        );

        return { id: variant.id, shared: false };
      }
    },
    []
  );

  const removeVariant = useCallback(async (blockType: string, variantId: string) => {
    try {
      await deleteBlockVariant(variantId);
      setVariants((current) => dropVariant(current, blockType, variantId));
      setSource('server');
      setError(null);
    } catch {
      const local = dropVariant(readLocal(), blockType, variantId);
      writeLocal(local);
      setVariants(local);
      setSource('local');
    }
  }, []);

  return { variants, saveVariant, removeVariant, source, error };
}
