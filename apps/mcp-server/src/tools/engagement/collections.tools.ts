import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { CollectionService } from '@ai-news/stories';
import { AuthService, type AuthenticatedPrincipal } from '@ai-news/auth';
import { mcpJsonResponse, mcpErrorResponse } from '../tool-helpers';

export function registerCollectionTools(
  server: McpServer,
  collectionService: CollectionService,
  getPrincipal: () => AuthenticatedPrincipal
) {
  // --- F16: Reading Lists & Named Collections ---

  server.tool(
    'curate_collection',
    '[EDITORIAL / AI] Create or curate a named reading list or thematic story collection.',
    {
      name: z.string().min(1).describe('Name of the collection (e.g. "AI Revolution 2026")'),
      description: z.string().optional().describe('Editorial description or theme explainer'),
      storyIds: z
        .array(z.string())
        .default([])
        .describe('List of story IDs included in the collection'),
      isPublic: z.boolean().default(true).describe('Whether the collection is publicly visible'),
    },
    async ({ name, description, storyIds, isPublic }) => {
      try {
        const principal = getPrincipal();
        AuthService.requireScope(principal, 'news:write');

        const collection = await collectionService.createCollection(
          principal.id,
          { name, description, storyIds, isPublic },
          principal.id
        );

        return mcpJsonResponse({
          message: `Collection "${collection.name}" created successfully.`,
          collection,
        });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        return mcpErrorResponse(`Failed to create collection: ${msg}`);
      }
    }
  );

  server.tool(
    'add_story_to_collection',
    '[EDITORIAL / AI] Append a story to an existing reading list collection.',
    {
      collectionId: z.string().min(1).describe('Target collection ID'),
      storyId: z.string().min(1).describe('Story ID to add'),
    },
    async ({ collectionId, storyId }) => {
      try {
        const principal = getPrincipal();
        AuthService.requireScope(principal, 'news:write');

        const updated = await collectionService.addStory(collectionId, storyId);
        return mcpJsonResponse({
          message: `Story ${storyId} added to collection ${collectionId}.`,
          collection: updated,
        });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        return mcpErrorResponse(`Failed to add story to collection: ${msg}`);
      }
    }
  );

  server.tool(
    'get_collection',
    '[READ-ONLY] Retrieve a reading list or themed collection by ID or URL slug with full populated stories.',
    {
      idOrSlug: z.string().min(1).describe('Collection unique ID or URL slug'),
    },
    async ({ idOrSlug }) => {
      try {
        const principal = getPrincipal();
        AuthService.requireScope(principal, 'news:read');

        let col = await collectionService.getCollectionWithStories(
          idOrSlug,
          principal.organizationId
        );
        if (!col) {
          col = await collectionService.getCollectionBySlug(idOrSlug, principal.organizationId);
        }

        if (!col) {
          return mcpErrorResponse(`Collection "${idOrSlug}" not found`);
        }
        return mcpJsonResponse(col);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        return mcpErrorResponse(`Failed to get collection: ${msg}`);
      }
    }
  );

  server.tool(
    'list_collections',
    '[READ-ONLY] List public or user-curated reading lists and thematic story collections.',
    {
      onlyMine: z
        .boolean()
        .optional()
        .default(false)
        .describe('Filter to only collections curated by current user'),
      limit: z
        .number()
        .int()
        .positive()
        .max(100)
        .default(20)
        .describe('Max collections to retrieve'),
    },
    async ({ onlyMine, limit }) => {
      try {
        const principal = getPrincipal();
        AuthService.requireScope(principal, 'news:read');

        const collections = onlyMine
          ? await collectionService.listUserCollections(principal.id)
          : await collectionService.listPublicCollections(limit);

        return mcpJsonResponse({
          total: collections.length,
          collections,
        });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        return mcpErrorResponse(`Failed to list collections: ${msg}`);
      }
    }
  );

  server.tool(
    'remove_story_from_collection',
    '[WRITE] Remove an article from a curated reading list collection.',
    {
      collectionId: z.string().min(1).describe('Target collection ID'),
      storyId: z.string().min(1).describe('Story ID to remove'),
    },
    async ({ collectionId, storyId }) => {
      try {
        const principal = getPrincipal();
        AuthService.requireScope(principal, 'news:write');

        const updated = await collectionService.removeStory(collectionId, storyId);
        return mcpJsonResponse({
          message: `Story ${storyId} removed from collection ${collectionId}.`,
          collection: updated,
        });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        return mcpErrorResponse(`Failed to remove story from collection: ${msg}`);
      }
    }
  );

  server.tool(
    'delete_collection',
    '[WRITE] Delete a reading list or themed collection.',
    {
      collectionId: z.string().min(1).describe('Collection ID to delete'),
    },
    async ({ collectionId }) => {
      try {
        const principal = getPrincipal();
        AuthService.requireScope(principal, 'news:write');

        const success = await collectionService.deleteCollection(collectionId);
        return mcpJsonResponse({
          success,
          message: success
            ? `Collection "${collectionId}" deleted.`
            : `Collection "${collectionId}" not found.`,
        });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        return mcpErrorResponse(`Failed to delete collection: ${msg}`);
      }
    }
  );
}
