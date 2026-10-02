import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { EngagementService } from '@ai-news/stories';
import { StoryReactionTypeSchema } from '@ai-news/schemas';
import { AuthService, type AuthenticatedPrincipal } from '@ai-news/auth';
import { mcpJsonResponse, mcpErrorResponse } from '../tool-helpers';

export function registerReactionBookmarkTools(
  server: McpServer,
  engagementService: EngagementService,
  getPrincipal: () => AuthenticatedPrincipal
) {
  server.tool(
    'get_story_reactions',
    '[READ-ONLY] Fetch aggregate reader reaction counts (like, insightful, important, heart) for a story.',
    {
      storyId: z.string().min(1).describe('The ID of the story'),
    },
    async ({ storyId }) => {
      const principal = getPrincipal();
      AuthService.requireScope(principal, 'news:read');

      const reactions = await engagementService.getReactions(storyId, principal.id);
      return mcpJsonResponse(reactions);
    }
  );

  server.tool(
    'toggle_story_reaction',
    '[WRITE] Add or remove an emoji reaction (like, insightful, important, heart) on a news story.',
    {
      storyId: z.string().min(1).describe('The story ID'),
      reactionType: StoryReactionTypeSchema.describe(
        'Reaction type: like, insightful, important, or heart'
      ),
    },
    async ({ storyId, reactionType }) => {
      try {
        const principal = getPrincipal();
        AuthService.requireScope(principal, 'news:read');

        const result = await engagementService.toggleReaction(storyId, reactionType, {
          userId: principal.id,
          organizationId: principal.organizationId,
        });

        return mcpJsonResponse({
          storyId,
          reactionType,
          active: result.active,
          summary: result.summary,
        });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        return mcpErrorResponse(`Failed to toggle reaction: ${msg}`);
      }
    }
  );

  server.tool(
    'toggle_story_bookmark',
    '[WRITE] Save or unsave an article to user reading bookmarks.',
    {
      storyId: z.string().min(1).describe('The story ID to bookmark or un-bookmark'),
    },
    async ({ storyId }) => {
      try {
        const principal = getPrincipal();
        AuthService.requireScope(principal, 'news:read');

        const result = await engagementService.toggleBookmark(storyId, {
          userId: principal.id,
          organizationId: principal.organizationId,
        });

        return mcpJsonResponse({
          storyId,
          bookmarked: result.bookmarked,
          message: result.bookmarked
            ? 'Story saved to bookmarks.'
            : 'Story removed from bookmarks.',
        });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        return mcpErrorResponse(`Failed to toggle bookmark: ${msg}`);
      }
    }
  );

  server.tool(
    'list_story_bookmarks',
    '[READ-ONLY] Retrieve all bookmarked stories saved by the current user.',
    {},
    async () => {
      try {
        const principal = getPrincipal();
        AuthService.requireScope(principal, 'news:read');

        const bookmarks = await engagementService.listBookmarks(
          principal.id,
          principal.organizationId
        );
        return mcpJsonResponse({
          userId: principal.id,
          total: bookmarks.length,
          bookmarks,
        });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        return mcpErrorResponse(`Failed to list bookmarks: ${msg}`);
      }
    }
  );

  server.tool(
    'record_reading_progress',
    '[ENGAGEMENT] Track reader scroll progress or mark an article as completed/read.',
    {
      storyId: z.string().min(1).describe('The ID of the story'),
      percentage: z.number().min(0).max(100).describe('Reading completion percentage (0-100)'),
      completed: z.boolean().optional().describe('Whether reader reached end of story'),
    },
    async ({ storyId, percentage, completed }) => {
      const principal = getPrincipal();
      AuthService.requireScope(principal, 'news:read');

      const progress = await engagementService.saveReadingProgress(storyId, percentage, {
        userId: principal.id,
        organizationId: principal.organizationId,
        completed,
      });

      return mcpJsonResponse({
        message: 'Reading progress recorded successfully.',
        progress,
      });
    }
  );

  server.tool(
    'get_reading_progress',
    '[READ-ONLY] Retrieve reading completion percentage for a story.',
    {
      storyId: z.string().min(1).describe('The ID of the story'),
    },
    async ({ storyId }) => {
      try {
        const principal = getPrincipal();
        AuthService.requireScope(principal, 'news:read');

        const progress = await engagementService.getReadingProgress(storyId, principal.id);
        return mcpJsonResponse(progress || { storyId, percentage: 0, completed: false });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        return mcpErrorResponse(`Failed to get reading progress: ${msg}`);
      }
    }
  );

  server.tool(
    'get_reading_history',
    '[READ-ONLY] Retrieve recently read articles and completion percentages for the current user.',
    {
      limit: z
        .number()
        .int()
        .positive()
        .max(100)
        .default(20)
        .describe('Max history items to retrieve'),
    },
    async ({ limit }) => {
      const principal = getPrincipal();
      AuthService.requireScope(principal, 'news:read');

      const history = await engagementService.listReadingHistory(principal.id, limit);
      return mcpJsonResponse({
        userId: principal.id,
        totalItems: history.length,
        history,
      });
    }
  );
}
