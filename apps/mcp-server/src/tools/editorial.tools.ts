import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { DatabaseService } from '@ai-news/database';
import { AuthService, type AuthenticatedPrincipal } from '@ai-news/auth';
import { CollaborationService } from '@ai-news/stories';
import { StoryStatusSchema } from '@ai-news/schemas';
import { mcpJsonResponse, mcpErrorResponse } from './tool-helpers';

export function registerEditorialTools(
  server: McpServer,
  db: DatabaseService,
  getPrincipal: () => AuthenticatedPrincipal
) {
  const collaborationService = new CollaborationService(db);

  server.tool(
    'acquire_story_lock',
    'Acquire an exclusive editing lease lock (5-minute TTL) on a story to prevent concurrent collision.',
    {
      storyId: z.string().min(1).describe('The target story ID to lock'),
      ttlSeconds: z.number().int().positive().max(1800).default(300).optional().describe('Lease lock duration in seconds (default 300)'),
    },
    async ({ storyId, ttlSeconds }) => {
      try {
        const principal = getPrincipal();
        AuthService.requireScope(principal, 'news:write');

        const result = await collaborationService.acquireLock(
          storyId,
          {
            id: principal.id,
            name: principal.id,
            role: principal.role,
            clientType: principal.clientType,
          },
          ttlSeconds || 300,
          principal.organizationId
        );

        return mcpJsonResponse(result);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        return mcpErrorResponse(`Failed to acquire lock: ${msg}`);
      }
    }
  );

  server.tool(
    'release_story_lock',
    'Release editing lease lock on a story.',
    {
      storyId: z.string().min(1).describe('The target story ID to unlock'),
    },
    async ({ storyId }) => {
      try {
        const principal = getPrincipal();
        AuthService.requireScope(principal, 'news:write');

        const success = await collaborationService.releaseLock(storyId, principal.id);
        return mcpJsonResponse({ success });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        return mcpErrorResponse(`Failed to release lock: ${msg}`);
      }
    }
  );

  server.tool(
    'get_story_presence',
    '[READ-ONLY] Retrieve active users and collaborators currently viewing or editing a story.',
    {
      storyId: z.string().min(1).describe('The target story ID'),
    },
    async ({ storyId }) => {
      try {
        const principal = getPrincipal();
        AuthService.requireScope(principal, 'news:read');

        collaborationService.pingPresence(storyId, { id: principal.id, name: principal.id });
        const presence = await collaborationService.getPresence(storyId);
        return mcpJsonResponse(presence);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        return mcpErrorResponse(`Failed to get presence: ${msg}`);
      }
    }
  );

  server.tool(
    'get_editorial_kanban',
    '[READ-ONLY] Retrieve newsroom workflow Kanban board partitioned by story status (DRAFT, IN_REVIEW, SCHEDULED, PUBLISHED, ARCHIVED).',
    {},
    async () => {
      try {
        const principal = getPrincipal();
        AuthService.requireScope(principal, 'news:read');

        const board = await collaborationService.getKanbanBoard(principal.organizationId);
        return mcpJsonResponse({
          totalCount: board.totalCount,
          counts: {
            draft: board.columns.DRAFT.length,
            inReview: board.columns.IN_REVIEW.length,
            scheduled: board.columns.SCHEDULED.length,
            published: board.columns.PUBLISHED.length,
            archived: board.columns.ARCHIVED.length,
          },
          columns: board.columns,
        });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        return mcpErrorResponse(`Failed to get kanban board: ${msg}`);
      }
    }
  );

  server.tool(
    'get_editorial_calendar',
    '[READ-ONLY] Retrieve chronological schedule of scheduled and published stories for calendar visualization.',
    {},
    async () => {
      try {
        const principal = getPrincipal();
        AuthService.requireScope(principal, 'news:read');

        const calendar = await collaborationService.getCalendarSchedule(principal.organizationId);
        return mcpJsonResponse(calendar);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        return mcpErrorResponse(`Failed to get editorial calendar: ${msg}`);
      }
    }
  );

  server.tool(
    'transition_story_status',
    'Transition a story to a new workflow status (DRAFT, IN_REVIEW, SCHEDULED, PUBLISHED, ARCHIVED).',
    {
      storyId: z.string().min(1).describe('The target story ID'),
      status: StoryStatusSchema.describe('Target workflow status'),
      scheduledPublishAt: z.string().optional().describe('ISO timestamp required if target status is SCHEDULED'),
    },
    async ({ storyId, status, scheduledPublishAt }) => {
      try {
        const principal = getPrincipal();
        AuthService.requireScope(principal, 'news:write');

        const updated = await collaborationService.transitionStoryStatus(
          storyId,
          status,
          principal.organizationId,
          scheduledPublishAt
        );

        return mcpJsonResponse({
          success: true,
          storyId: updated.id,
          status: updated.status,
          scheduledPublishAt: updated.scheduledPublishAt,
          publishedAt: updated.publishedAt,
        });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        return mcpErrorResponse(`Failed to transition story status: ${msg}`);
      }
    }
  );
}
