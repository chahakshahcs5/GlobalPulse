import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { DatabaseService } from '@ai-news/database';
import { StoryService } from '@ai-news/stories';
import { AuthService, type AuthenticatedPrincipal } from '@ai-news/auth';
import { StoryBlockSchema } from '@ai-news/schemas';

export function registerBlockTools(
  server: McpServer,
  db: DatabaseService,
  getPrincipal: () => AuthenticatedPrincipal
) {
  const storyService = new StoryService(db);

  server.tool(
    'add_story_block',
    'Add a new structured block (e.g. heading, paragraph, chart, map, timeline, table, quote, statistic, what_changed) to a story.',
    {
      storyId: z.string().min(1).describe('Target story ID'),
      block: StoryBlockSchema.describe('Structured block object adhering to the StoryBlock specification'),
    },
    async ({ storyId, block }) => {
      const principal = getPrincipal();
      AuthService.requireScope(principal, 'news:write');

      const added = await storyService.addBlock(storyId, block, {
        organizationId: principal.organizationId,
        authorId: principal.id,
        clientType: principal.clientType,
        createdVia: 'mcp',
      });

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              { message: `Block of type "${added.blockType}" added.`, blockId: added.id, sortOrder: added.sortOrder },
              null,
              2
            ),
          },
        ],
      };
    }
  );

  server.tool(
    'update_story_block',
    'Update an existing block inside a story.',
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

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({ message: `Block "${blockId}" updated.`, block: updated }, null, 2),
          },
        ],
      };
    }
  );

  server.tool(
    'remove_story_block',
    'Remove a block from a story and re-index remaining blocks.',
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

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({ message: removed ? 'Block removed.' : 'Block not found.', success: removed }),
          },
        ],
      };
    }
  );

  server.tool(
    'reorder_story_blocks',
    'Reorder the visual sequence of blocks in a story by supplying the ordered list of block IDs.',
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

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({ message: 'Blocks reordered successfully.', count: blocks.length }),
          },
        ],
      };
    }
  );
}
