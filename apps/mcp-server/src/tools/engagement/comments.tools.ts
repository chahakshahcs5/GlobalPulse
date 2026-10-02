import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { EngagementService } from '@ai-news/stories';
import { AuthService, type AuthenticatedPrincipal } from '@ai-news/auth';
import { mcpJsonResponse, mcpErrorResponse } from '../tool-helpers';

export function registerCommentTools(
  server: McpServer,
  engagementService: EngagementService,
  getPrincipal: () => AuthenticatedPrincipal
) {
  server.tool(
    'get_story_comments',
    '[READ-ONLY] Retrieve reader comments posted on a specific news story, optionally filtered by status.',
    {
      storyId: z.string().min(1).describe('The ID of the story (e.g. "sty_123")'),
      status: z
        .enum(['pending', 'approved', 'flagged', 'hidden'])
        .optional()
        .describe('Filter by moderation status'),
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
      reason: z
        .string()
        .optional()
        .describe('Reason for moderation decision (e.g. policy violation, hate speech)'),
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
    'post_story_comment',
    '[WRITE] Post a new reader or AI-agent comment/observation on a story.',
    {
      storyId: z.string().min(1).describe('The target story ID'),
      content: z.string().min(1).max(2000).describe('Comment body text'),
      authorName: z.string().optional().describe('Display author name'),
      parentId: z.string().optional().describe('Parent comment ID if replying'),
    },
    async ({ storyId, content, authorName, parentId }) => {
      try {
        const principal = getPrincipal();
        AuthService.requireScope(principal, 'news:write');

        const comment = await engagementService.createComment(
          storyId,
          { content, authorName, parentId },
          {
            organizationId: principal.organizationId,
            authorId: principal.id,
            authorName: authorName || principal.id,
            authorRole:
              principal.role === 'admin'
                ? 'editor'
                : (principal.role as
                    'reader' | 'subscriber' | 'journalist' | 'editor' | 'ai_agent'),
          }
        );

        return mcpJsonResponse({
          message: 'Comment posted successfully.',
          comment,
        });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        return mcpErrorResponse(`Failed to post comment: ${msg}`);
      }
    }
  );

  server.tool(
    'delete_story_comment',
    '[WRITE] Delete a comment from a story.',
    {
      commentId: z.string().min(1).describe('The comment ID to delete'),
    },
    async ({ commentId }) => {
      try {
        const principal = getPrincipal();
        AuthService.requireScope(principal, 'news:write');

        const success = await engagementService.deleteComment(commentId, principal.organizationId);
        return mcpJsonResponse({
          success,
          message: success
            ? `Comment "${commentId}" deleted.`
            : `Comment "${commentId}" not found.`,
        });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        return mcpErrorResponse(`Failed to delete comment: ${msg}`);
      }
    }
  );
}
