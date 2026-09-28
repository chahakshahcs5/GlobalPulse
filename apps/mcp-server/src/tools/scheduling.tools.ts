import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { DatabaseService } from '@ai-news/database';
import type { AuthenticatedPrincipal } from '@ai-news/auth';
import { AuthService } from '@ai-news/auth';
import { SchedulingService, type StoryContext } from '@ai-news/stories';
import { successResponse, errorResponse } from './tool-helpers';

export function registerSchedulingTools(
  server: McpServer,
  database: DatabaseService,
  getPrincipal: () => AuthenticatedPrincipal
): void {
  const schedulingService = new SchedulingService(database);

  // 1. schedule_story_publish
  server.tool(
    'schedule_story_publish',
    'Schedule an approved story for automated publication at a future timestamp (embargo release).',
    {
      story_id: z.string().describe('ID of the story to schedule'),
      publish_at: z.string().describe('Target publication timestamp in ISO-8601 format (e.g. 2026-10-01T12:00:00Z)'),
    },
    async (args) => {
      try {
        const principal = getPrincipal();
        AuthService.requireRole(principal, 'admin', 'editor', 'ai_agent');
        AuthService.requireScope(principal, 'news:publish');

        const ctx: StoryContext = {
          organizationId: principal.organizationId,
          authorId: principal.id,
          clientType: principal.clientType,
          createdVia: 'mcp',
        };

        const scheduled = await schedulingService.scheduleStory(args.story_id, args.publish_at, ctx);
        return successResponse({
          story_id: scheduled.id,
          title: scheduled.title,
          status: scheduled.status,
          scheduled_publish_at: scheduled.scheduledPublishAt,
          message: 'Story successfully scheduled for automated publication.',
        });
      } catch (err: unknown) {
        return errorResponse(err instanceof Error ? err.message : String(err));
      }
    }
  );

  // 2. list_scheduled_stories
  server.tool(
    'list_scheduled_stories',
    'List all news stories scheduled for future release.',
    {},
    async () => {
      try {
        const principal = getPrincipal();
        AuthService.requireScope(principal, 'news:read');

        const stories = await schedulingService.listScheduledStories(principal.organizationId);
        return successResponse({
          count: stories.length,
          scheduled_stories: stories.map((s) => ({
            id: s.id,
            title: s.title,
            slug: s.slug,
            articleType: s.articleType,
            scheduledPublishAt: s.scheduledPublishAt,
          })),
        });
      } catch (err: unknown) {
        return errorResponse(err instanceof Error ? err.message : String(err));
      }
    }
  );

  // 3. publish_due_stories
  server.tool(
    'publish_due_stories',
    'Trigger publication sweep to immediately release any scheduled stories whose target time has arrived.',
    {},
    async () => {
      try {
        const principal = getPrincipal();
        AuthService.requireRole(principal, 'admin', 'editor', 'ai_agent');

        const published = await schedulingService.publishDueStories(principal.organizationId);
        return successResponse({
          published_count: published.length,
          published_stories: published.map((s) => ({ id: s.id, title: s.title, publishedAt: s.publishedAt })),
        });
      } catch (err: unknown) {
        return errorResponse(err instanceof Error ? err.message : String(err));
      }
    }
  );
}
