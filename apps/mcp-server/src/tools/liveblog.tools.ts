import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { DatabaseService } from '@ai-news/database';
import { AuthService, type AuthenticatedPrincipal } from '@ai-news/auth';
import { LiveblogService } from '@ai-news/stories';
import { mcpJsonResponse, mcpErrorResponse } from './tool-helpers';

export function registerLiveblogTools(
  server: McpServer,
  db: DatabaseService,
  getPrincipal: () => AuthenticatedPrincipal
) {
  const liveblogService = new LiveblogService(db);

  server.tool(
    'post_liveblog_entry',
    'Post an immediate live dispatch or key update to an active liveblog event story.',
    {
      storyId: z.string().min(1).describe('The target story ID'),
      headline: z
        .string()
        .min(1)
        .describe('Dispatch headline (e.g. Press Secretary takes the podium)'),
      content: z.string().min(1).describe('Dispatch body content or eyewitness observations'),
      isKeyEvent: z
        .boolean()
        .default(false)
        .describe('Whether this update represents a major breaking milestone'),
    },
    async ({ storyId, headline, content, isKeyEvent }) => {
      try {
        const principal = getPrincipal();
        AuthService.requireScope(principal, 'news:write');

        const entry = await liveblogService.addEntry(
          storyId,
          { headline, content, isKeyEvent },
          {
            id: principal.id,
            name: principal.id,
          },
          principal.organizationId
        );

        return mcpJsonResponse({
          success: true,
          entry,
        });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        return mcpErrorResponse(`Failed to post liveblog entry: ${msg}`);
      }
    }
  );

  server.tool(
    'list_liveblog_entries',
    '[READ-ONLY] Retrieve reverse-chronological real-time dispatches for an ongoing liveblog story.',
    {
      storyId: z.string().min(1).describe('The target story ID'),
      limit: z.number().int().positive().max(200).default(50).describe('Max entries to return'),
    },
    async ({ storyId, limit }) => {
      try {
        const principal = getPrincipal();
        AuthService.requireScope(principal, 'news:read');

        const entries = await liveblogService.listEntries(storyId, limit);
        return mcpJsonResponse({
          storyId,
          total: entries.length,
          entries,
        });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        return mcpErrorResponse(`Failed to list liveblog entries: ${msg}`);
      }
    }
  );

  server.tool(
    'delete_liveblog_entry',
    '[WRITE] Remove or retract an erroneous liveblog entry from an active live event coverage.',
    {
      entryId: z.string().min(1).describe('The liveblog entry ID (e.g. "lbe_123")'),
    },
    async ({ entryId }) => {
      try {
        const principal = getPrincipal();
        AuthService.requireScope(principal, 'news:write');

        const success = await liveblogService.deleteEntry(entryId);
        return mcpJsonResponse({
          success,
          message: success
            ? `Liveblog entry "${entryId}" deleted.`
            : `Liveblog entry "${entryId}" not found.`,
        });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        return mcpErrorResponse(`Failed to delete liveblog entry: ${msg}`);
      }
    }
  );
}
