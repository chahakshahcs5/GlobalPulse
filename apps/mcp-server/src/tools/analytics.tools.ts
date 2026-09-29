import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { DatabaseService } from '@ai-news/database';
import type { AuthenticatedPrincipal } from '@ai-news/auth';
import { AuthService } from '@ai-news/auth';
import { AnalyticsService, PersonalizationService } from '@ai-news/stories';
import { successResponse, errorResponse } from './tool-helpers';

export function registerAnalyticsTools(
  server: McpServer,
  database: DatabaseService,
  getPrincipal: () => AuthenticatedPrincipal
): void {
  const analyticsService = new AnalyticsService(database);
  const personalizationService = new PersonalizationService(database);

  // 1. get_story_analytics
  server.tool(
    'get_story_analytics',
    'Get real-time reader performance metrics, view counts, and virality score for a story.',
    {
      story_id: z.string().describe('Unique ID of the story (e.g. sty_xyz)'),
    },
    async (args) => {
      try {
        const principal = getPrincipal();
        AuthService.requireScope(principal, 'news:read');

        const analytics = await analyticsService.getStoryAnalytics(
          args.story_id,
          principal.organizationId
        );
        return successResponse(analytics);
      } catch (err: unknown) {
        return errorResponse(err instanceof Error ? err.message : String(err));
      }
    }
  );

  // 2. get_trending_stories
  server.tool(
    'get_trending_stories',
    'List top trending stories ranked by virality velocity and reader engagement score.',
    {
      limit: z
        .number()
        .int()
        .min(1)
        .max(50)
        .default(10)
        .describe('Maximum number of trending stories to return'),
    },
    async (args) => {
      try {
        const principal = getPrincipal();
        AuthService.requireScope(principal, 'news:read');

        const trending = await analyticsService.getTrendingStories(
          args.limit,
          principal.organizationId
        );
        return successResponse({ count: trending.length, trending });
      } catch (err: unknown) {
        return errorResponse(err instanceof Error ? err.message : String(err));
      }
    }
  );

  // 3. get_newsroom_metrics
  server.tool(
    'get_newsroom_metrics',
    'Get high-level editorial metrics: total stories, published, review queue, comments, and active categories.',
    {},
    async () => {
      try {
        const principal = getPrincipal();
        AuthService.requireScope(principal, 'news:read');

        const metrics = await analyticsService.getNewsroomMetrics(principal.organizationId);
        return successResponse(metrics);
      } catch (err: unknown) {
        return errorResponse(err instanceof Error ? err.message : String(err));
      }
    }
  );

  // 4. get_reader_consumption_profile
  server.tool(
    'get_reader_consumption_profile',
    '[READ-ONLY] Retrieve reader analytics profile including category distribution, topic balance, reading minutes, and diversity score.',
    {
      userId: z
        .string()
        .optional()
        .describe('Optional user ID (defaults to active caller principal)'),
    },
    async ({ userId }) => {
      try {
        const principal = getPrincipal();
        AuthService.requireScope(principal, 'news:read');

        const targetUserId = userId || principal.id;
        const profile = await personalizationService.getReaderConsumptionProfile(
          targetUserId,
          principal.organizationId
        );
        return successResponse(profile);
      } catch (err: unknown) {
        return errorResponse(err instanceof Error ? err.message : String(err));
      }
    }
  );
}
