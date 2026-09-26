import type { StoryBlock, WhatChangedBlock } from '@ai-news/schemas';
import { generateId } from '@ai-news/shared';

export interface DiffItem {
  changeType: 'added' | 'updated' | 'corrected' | 'retracted';
  description: string;
  affectedSection?: string;
}

export class WhatChangedDiffService {
  /**
   * Computes a structured WhatChangedBlock by diffing old blocks against new blocks.
   */
  static computeDiff(
    previousVersionNumber: number,
    oldBlocks: StoryBlock[],
    newBlocks: StoryBlock[]
  ): WhatChangedBlock {
    const items: DiffItem[] = [];
    const oldBlockMap = new Map<string, StoryBlock>();
    for (const b of oldBlocks) {
      oldBlockMap.set(b.id, b);
    }

    const newBlockMap = new Map<string, StoryBlock>();
    for (const b of newBlocks) {
      newBlockMap.set(b.id, b);
    }

    // Check for added or modified blocks
    for (const newBlock of newBlocks) {
      const oldBlock = oldBlockMap.get(newBlock.id);
      if (!oldBlock) {
        items.push({
          changeType: 'added',
          description: `Added new ${newBlock.blockType} section.`,
          affectedSection: newBlock.blockType,
        });
      } else {
        const oldJson = JSON.stringify(oldBlock.data);
        const newJson = JSON.stringify(newBlock.data);
        if (oldJson !== newJson) {
          items.push({
            changeType: 'updated',
            description: `Updated content in ${newBlock.blockType} section.`,
            affectedSection: newBlock.blockType,
          });
        }
      }
    }

    // Check for removed blocks
    for (const oldBlock of oldBlocks) {
      if (!newBlockMap.has(oldBlock.id)) {
        items.push({
          changeType: 'retracted',
          description: `Removed previous ${oldBlock.blockType} section.`,
          affectedSection: oldBlock.blockType,
        });
      }
    }

    if (items.length === 0) {
      items.push({
        changeType: 'updated',
        description: 'Minor formatting and editorial refinements.',
      });
    }

    return {
      id: generateId('blk_wc'),
      blockType: 'what_changed',
      sortOrder: 0,
      data: {
        previousVersionNumber,
        updatedAt: new Date().toISOString(),
        items,
      },
    };
  }
}
