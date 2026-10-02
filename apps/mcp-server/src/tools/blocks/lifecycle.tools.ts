import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { StoryService } from '@ai-news/stories';
import { AuthService, type AuthenticatedPrincipal } from '@ai-news/auth';
import { StoryBlockSchema } from '@ai-news/schemas';
import { mcpJsonResponse } from '../tool-helpers';

export function registerBlockLifecycleTools(
  server: McpServer,
  storyService: StoryService,
  getPrincipal: () => AuthenticatedPrincipal
) {
  // 22. update_story_block
  server.tool(
    'update_story_block',
    '[WRITE] Update an existing block inside a story.',
    {
      storyId: z.string().min(1).describe('Target story ID'),
      blockId: z.string().min(1).describe('Block ID to update'),
      block: StoryBlockSchema.describe('Updated structured block payload'),
    },
    async ({ storyId, blockId, block }) => {
      const principal = getPrincipal();
      AuthService.requireScope(principal, 'news:write');

      const updated = await storyService.updateBlock(storyId, blockId, block, {
        organizationId: principal.organizationId,
        authorId: principal.id,
        clientType: principal.clientType,
        createdVia: 'mcp',
      });

      return mcpJsonResponse({ message: `Block "${blockId}" updated.`, block: updated });
    }
  );

  // 23. remove_story_block
  server.tool(
    'remove_story_block',
    '[WRITE] Remove a block from a story and re-index remaining blocks.',
    {
      storyId: z.string().min(1).describe('Target story ID'),
      blockId: z.string().min(1).describe('Block ID to delete'),
    },
    async ({ storyId, blockId }) => {
      const principal = getPrincipal();
      AuthService.requireScope(principal, 'news:write');

      const removed = await storyService.removeBlock(storyId, blockId, {
        organizationId: principal.organizationId,
        authorId: principal.id,
        clientType: principal.clientType,
        createdVia: 'mcp',
      });

      return mcpJsonResponse({
        message: removed ? 'Block removed.' : 'Block not found.',
        success: removed,
      });
    }
  );

  // 24. reorder_story_blocks
  server.tool(
    'reorder_story_blocks',
    '[WRITE] Reorder the visual sequence of blocks in a story by supplying the ordered list of block IDs.',
    {
      storyId: z.string().min(1).describe('Target story ID'),
      blockIdsInOrder: z.array(z.string()).min(1).describe('Ordered array of block IDs'),
    },
    async ({ storyId, blockIdsInOrder }) => {
      const principal = getPrincipal();
      AuthService.requireScope(principal, 'news:write');

      const blocks = await storyService.reorderBlocks(storyId, blockIdsInOrder, {
        organizationId: principal.organizationId,
        authorId: principal.id,
        clientType: principal.clientType,
        createdVia: 'mcp',
      });

      return mcpJsonResponse({ message: 'Blocks reordered successfully.', count: blocks.length });
    }
  );
}
