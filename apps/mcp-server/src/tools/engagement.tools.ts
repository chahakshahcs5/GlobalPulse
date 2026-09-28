import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { DatabaseService } from '@ai-news/database';
import { EngagementService } from '@ai-news/stories';
import { AuthService, type AuthenticatedPrincipal } from '@ai-news/auth';
import { mcpJsonResponse } from './tool-helpers';

export function registerEngagementTools(
  server: McpServer,
  db: DatabaseService,
  getPrincipal: () => AuthenticatedPrincipal
) {
  const engagementService = new EngagementService(db);

  server.tool(
    'get_story_comments',
    '[READ-ONLY] Retrieve reader comments posted on a specific news story, optionally filtered by status.',
    {
      storyId: z.string().min(1).describe('The ID of the story (e.g. "sty_123")'),
      status: z.enum(['pending', 'approved', 'flagged', 'hidden']).optional().describe('Filter by moderation status'),
    },
    async ({ storyId, status }) => {
      const principal = getPrincipal();
      AuthService.requireScope(principal, 'news:read');

      const comments = await engagementService.getComments(
        storyId,
        status ? { status } : undefined,
        principal.organizationId
      );

      return mcpJsonResponse({
        storyId,
        count: comments.length,
        comments,
      });
    }
  );

  server.tool(
    'moderate_comment',
    '[CONTENT MODERATION] Update a comment status (approve, flag, or hide) with an audit reason.',
    {
      commentId: z.string().min(1).describe('The unique comment ID (e.g. "cmt_123")'),
      status: z.enum(['approved', 'flagged', 'hidden']).describe('New moderation status'),
      reason: z.string().optional().describe('Reason for moderation decision (e.g. policy violation, hate speech)'),
    },
    async ({ commentId, status, reason }) => {
      const principal = getPrincipal();
      AuthService.requireScope(principal, 'news:publish');

      const moderated = await engagementService.moderateComment(
        commentId,
        { status, reason },
        {
          moderatorId: principal.id,
          organizationId: principal.organizationId,
        }
      );

      return mcpJsonResponse({
        message: `Comment status updated to ${status}.`,
        comment: moderated,
      });
    }
  );

  server.tool(
    'get_story_reactions',
    '[READ-ONLY] Fetch aggregate reader reaction counts (like, insightful, important, heart) for a story.',
    {
      storyId: z.string().min(1).describe('The ID of the story'),
    },
    async ({ storyId }) => {
      const principal = getPrincipal();
      AuthService.requireScope(principal, 'news:read');

      const reactions = await engagementService.getReactions(storyId);
      return mcpJsonResponse(reactions);
    }
  );
}
