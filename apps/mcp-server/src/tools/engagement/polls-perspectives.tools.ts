import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { PerspectivesService, EngagementService } from '@ai-news/stories';
import { AuthService, type AuthenticatedPrincipal } from '@ai-news/auth';
import { mcpJsonResponse, mcpErrorResponse } from '../tool-helpers';

export function registerPollPerspectiveTools(
  server: McpServer,
  perspectivesService: PerspectivesService,
  engagementService: EngagementService,
  getPrincipal: () => AuthenticatedPrincipal
) {
  // Poll engagement
  server.tool(
    'cast_poll_vote',
    '[INTERACTIVE READER ENGAGEMENT] Cast a reader vote on a story poll block. A reader may change their vote; the previous choice is replaced rather than counted twice.',
    {
      storyId: z.string().min(1).describe('Target story ID'),
      blockId: z.string().min(1).describe('Block ID of the poll'),
      optionId: z.string().min(1).describe('Option ID being chosen (e.g. "opt_1")'),
    },
    async ({ storyId, blockId, optionId }) => {
      try {
        const principal = getPrincipal();
        AuthService.requireScope(principal, 'news:read');

        const tally = await engagementService.castPollVote(storyId, blockId, optionId, {
          userId: principal.id,
          organizationId: principal.organizationId,
        });

        return mcpJsonResponse({
          message: 'Vote successfully recorded.',
          poll: {
            pollId: tally.pollId,
            question: tally.question,
            totalVotes: tally.totalVotes,
            options: tally.options.map((o) => ({
              ...o,
              percentage: o.percentage.toFixed(1),
            })),
          },
        });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        return mcpErrorResponse(`Failed to cast vote: ${msg}`);
      }
    }
  );

  server.tool(
    'get_poll_results',
    '[READ-ONLY] Retrieve aggregated vote counts and percentage breakdown for a poll block.',
    {
      storyId: z.string().min(1).describe('Target story ID'),
      blockId: z.string().min(1).describe('Block ID of the poll'),
    },
    async ({ storyId, blockId }) => {
      try {
        const principal = getPrincipal();
        AuthService.requireScope(principal, 'news:read');

        const tally = await engagementService.getPollTally(
          storyId,
          blockId,
          principal.id,
          principal.organizationId
        );

        return mcpJsonResponse({
          pollId: tally.pollId,
          question: tally.question,
          totalVotes: tally.totalVotes,
          closed: tally.closed,
          options: tally.options.map((o) => ({
            ...o,
            percentage: o.percentage.toFixed(1),
          })),
        });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        return mcpErrorResponse(`Failed to get poll results: ${msg}`);
      }
    }
  );

  // 17. submit_story_perspective
  server.tool(
    'submit_story_perspective',
    '[COMMUNITY JOURNALISM] Submit a structured reader or expert perspective on a story, classifying stance (in_favor, dissenting, analytical, or question) with optional highlighted passage quote.',
    {
      storyId: z.string().min(1).describe('Target story ID'),
      stance: z
        .enum(['in_favor', 'dissenting', 'analytical', 'question'])
        .describe('Stance classification'),
      argument: z.string().min(1).max(3000).describe('Structured argument or perspective'),
      targetParagraphQuote: z
        .string()
        .optional()
        .describe('Exact sentence or claim from the article being annotated'),
      evidenceUrl: z
        .string()
        .url()
        .optional()
        .describe('External supporting documentation or data source'),
      authorName: z.string().optional().describe('DisplayName or alias'),
    },
    async ({ storyId, stance, argument, targetParagraphQuote, evidenceUrl, authorName }) => {
      try {
        const principal = getPrincipal();
        AuthService.requireScope(principal, 'news:write');

        const perspective = await perspectivesService.submitPerspective(
          storyId,
          { stance, argument, targetParagraphQuote, evidenceUrl, authorName },
          { id: principal.id, name: principal.id, role: 'reader' },
          principal.organizationId
        );

        return mcpJsonResponse({
          message: 'Story perspective submitted successfully.',
          perspective,
        });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        return mcpErrorResponse(`Failed to submit perspective: ${msg}`);
      }
    }
  );

  // 18. list_story_perspectives
  server.tool(
    'list_story_perspectives',
    '[READ-ONLY] Retrieve moderated reader and expert perspectives for a story, optionally filtered by stance or status.',
    {
      storyId: z
        .string()
        .min(1)
        .describe('Story ID (or "*" for global perspectives across all coverage)'),
      stance: z
        .enum(['in_favor', 'dissenting', 'analytical', 'question'])
        .optional()
        .describe('Filter by stance'),
      status: z
        .enum(['pending_moderation', 'approved', 'rejected'])
        .optional()
        .default('approved')
        .describe('Filter by moderation status'),
      limit: z.number().int().min(1).max(100).default(20),
    },
    async ({ storyId, stance, status, limit }) => {
      try {
        const principal = getPrincipal();
        AuthService.requireScope(principal, 'news:read');

        const list = await perspectivesService.listPerspectives(storyId, {
          stance,
          status,
          limit,
        });

        return mcpJsonResponse({
          storyId,
          count: list.length,
          perspectives: list,
        });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        return mcpErrorResponse(`Failed to list perspectives: ${msg}`);
      }
    }
  );

  // 19. moderate_story_perspective
  server.tool(
    'moderate_story_perspective',
    '[MODERATION] Approve, reject, or flag a submitted community perspective.',
    {
      perspectiveId: z.string().min(1).describe('Target perspective ID'),
      status: z
        .enum(['approved', 'rejected', 'pending_moderation'])
        .describe('New moderation status'),
      reason: z.string().optional().describe('Editorial reasoning'),
    },
    async ({ perspectiveId, status, reason }) => {
      try {
        const principal = getPrincipal();
        AuthService.requireScope(principal, 'news:publish');

        const updated = await perspectivesService.moderatePerspective(
          perspectiveId,
          status,
          reason
        );
        return mcpJsonResponse({
          message: `Perspective "${perspectiveId}" moderation updated to ${status}.`,
          perspective: updated,
        });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        return mcpErrorResponse(`Failed to moderate perspective: ${msg}`);
      }
    }
  );

  // 20. upvote_story_perspective
  server.tool(
    'upvote_story_perspective',
    '[ENGAGEMENT] Upvote a community perspective to increase its visibility in consensus rankings.',
    {
      perspectiveId: z.string().min(1).describe('Target perspective ID'),
    },
    async ({ perspectiveId }) => {
      try {
        const principal = getPrincipal();
        AuthService.requireScope(principal, 'news:write');

        const updated = await perspectivesService.upvotePerspective(perspectiveId);
        return mcpJsonResponse({
          message: 'Perspective upvoted.',
          perspectiveId,
          upvotes: updated.upvotes,
        });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        return mcpErrorResponse(`Failed to upvote perspective: ${msg}`);
      }
    }
  );
}
