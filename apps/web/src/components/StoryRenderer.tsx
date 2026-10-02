'use client';

import React from 'react';
import type { StoryBlock } from '@ai-news/schemas';
import { BlockItem } from './story-blocks/BlockItem';

export interface StoryRendererProps {
  blocks: StoryBlock[];
  theme?: 'dark' | 'light';
  depth?: 'quick' | 'balanced' | 'deep_dive';
}

export const StoryRenderer: React.FC<StoryRendererProps> = ({
  blocks,
  theme = 'dark',
  depth = 'balanced',
}) => {
  if (!blocks || blocks.length === 0) {
    return (
      <div className="py-12 text-center text-slate-500 font-mono text-sm">
        No content blocks have been published for this revision.
      </div>
    );
  }

  // Sort all blocks by sortOrder first
  const sortedBlocks = [...blocks].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

  // Filter blocks based on selected reading depth
  let effectiveBlocks = sortedBlocks;
  if (depth === 'quick') {
    // In Quick mode: exactly 1 opening lead paragraph + summary/stats/charts/quotes/live tickers/polls/headings
    let paragraphCount = 0;
    effectiveBlocks = sortedBlocks.filter((b) => {
      if (b.blockType === 'paragraph') {
        paragraphCount++;
        return paragraphCount <= 1;
      }
      return (
        b.blockType === 'summary' ||
        b.blockType === 'statistic' ||
        b.blockType === 'quote' ||
        b.blockType === 'callout' ||
        b.blockType === 'chart' ||
        b.blockType === 'live_ticker' ||
        b.blockType === 'poll' ||
        b.blockType === 'heading'
      );
    });
    if (effectiveBlocks.length === 0) {
      effectiveBlocks = sortedBlocks.slice(0, 1);
    }
  } else if (depth === 'balanced') {
    // In Balanced mode: standard editorial flow (exclude deep dive technical diffs & document viewers)
    effectiveBlocks = sortedBlocks.filter(
      (b) => b.blockType !== 'document_viewer' && b.blockType !== 'what_changed'
    );
    if (effectiveBlocks.length === 0) effectiveBlocks = sortedBlocks;
  } else {
    // In Deep Dive mode: unabridged complete blocks including what_changed diffs and archival viewers
    effectiveBlocks = sortedBlocks;
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto my-8">
      {effectiveBlocks.map((block) => (
        <BlockItem key={block.id} block={block} theme={theme} />
      ))}
    </div>
  );
};

export default StoryRenderer;
export * from './story-blocks';
