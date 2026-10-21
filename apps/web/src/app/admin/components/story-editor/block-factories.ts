import { StoryBlockSchema, type StoryBlock } from '@ai-news/schemas';

/**
 * The composer's blocks.
 *
 * A story is a list of blocks, and the composer edits that list directly.
 * There is no private arrangement of a few fields that the story is rebuilt
 * from on save — that is how a story loses the blocks it had, and why
 * opening somebody else's story in the composer used to show an empty
 * article.
 */

export interface BlockValidationIssue {
  blockId: string;
  blockType: string;
  message: string;
}

/**
 * Number the blocks in the order they read.
 *
 * The order in the list is the order in the story, and the platform keeps
 * them numbered that way.
 */
export function renumberBlocks(blocks: StoryBlock[]): StoryBlock[] {
  return blocks.map((block, order) => ({ ...block, sortOrder: order }));
}

/**
 * Check the composer's blocks against the platform schema.
 *
 * The composer and the platform share one schema, so a block that fails
 * here would also fail on publish. Catching it here means the editor finds
 * out while they are still looking at it.
 */
export function validateStoryBlocks(blocks: StoryBlock[]): BlockValidationIssue[] {
  const issues: BlockValidationIssue[] = [];

  for (const block of blocks) {
    const result = StoryBlockSchema.safeParse(block);
    if (result.success) continue;
    for (const issue of result.error.issues) {
      issues.push({
        blockId: block.id,
        blockType: block.blockType,
        message: `${issue.path.join('.') || 'block'} ${issue.message}`,
      });
    }
  }

  return issues;
}
