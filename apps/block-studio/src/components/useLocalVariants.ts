'use client';

import { useCallback, useEffect, useState } from 'react';
import type { StudioVariant } from '@ai-news/block-studio';

const STORAGE_KEY = 'block_studio_local_variants';

type StoredVariants = Record<string, StudioVariant[]>;

function read(): StoredVariants {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as StoredVariants) : {};
  } catch {
    return {};
  }
}

function write(variants: StoredVariants): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(variants));
  } catch {
    // Private mode, or the quota is full. The variant simply is not kept.
  }
}

/**
 * Variants the editor saved on their own machine.
 *
 * The shipped samples live in the repository; these live in the browser, so
 * an editor can keep a variant they are working on without it becoming
 * everyone's default.
 */
export function useLocalVariants() {
  const [variants, setVariants] = useState<StoredVariants>({});

  useEffect(() => {
    setVariants(read());
  }, []);

  const saveVariant = useCallback((blockType: string, variant: StudioVariant) => {
    setVariants((current) => {
      const forType = current[blockType] ?? [];
      const withoutSameId = forType.filter((existing) => existing.id !== variant.id);
      const next = { ...current, [blockType]: [...withoutSameId, variant] };
      write(next);
      return next;
    });
  }, []);

  const removeVariant = useCallback((blockType: string, variantId: string) => {
    setVariants((current) => {
      const next = {
        ...current,
        [blockType]: (current[blockType] ?? []).filter((variant) => variant.id !== variantId),
      };
      write(next);
      return next;
    });
  }, []);

  return { variants, saveVariant, removeVariant };
}
