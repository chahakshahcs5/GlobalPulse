import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { DatabaseService } from '@ai-news/database';
import type { AuthenticatedPrincipal } from '@ai-news/auth';
import { AuthService } from '@ai-news/auth';
import { NotificationService, type StoryContext } from '@ai-news/stories';
import { successResponse, errorResponse } from './tool-helpers';

export function registerNotificationTools(
  server: McpServer,
  database: DatabaseService,
  getPrincipal: () => AuthenticatedPrincipal
): void {
  const notificationService = new NotificationService(database);

  // 1. broadcast_breaking_news
  server.tool(
    'broadcast_breaking_news',
    'Broadcast an urgent breaking news banner alert across the entire news platform and SSE streams.',
    {
      story_id: z.string().describe('ID of the breaking news story'),
      headline: z.string().describe('Brief, high-impact headline for the breaking alert'),
      urgency: z.enum(['info', 'warning', 'urgent']).default('urgent').describe('Alert urgency level'),
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

        const alert = await notificationService.broadcastBreakingNews(
          args.story_id,
          args.headline,
          args.urgency,
          ctx
        );

        return successResponse({
          alert_id: alert.id,
          story_id: alert.storyId,
          headline: alert.message,
          severity: alert.severity,
          created_at: alert.createdAt,
          message: 'Breaking news successfully broadcast to all active subscribers.',
        });
      } catch (err: unknown) {
        return errorResponse(err instanceof Error ? err.message : String(err));
      }
    }
  );

  // 2. send_editorial_alert
  server.tool(
    'send_editorial_alert',
    'Send an internal newsroom alert or fact-checking notification to the editorial team.',
    {
      title: z.string().describe('Alert title or subject'),
      message: z.string().describe('Detailed alert content or fact-checking notes'),
      story_id: z.string().optional().describe('Optional related story ID'),
      severity: z.enum(['info', 'warning', 'urgent']).default('warning').describe('Severity level'),
      target_role: z.string().optional().describe('Target recipient role (e.g. editor, journalist)'),
    },
    async (args) => {
      try {
        const principal = getPrincipal();
        AuthService.requireScope(principal, 'news:write');

        const ctx: StoryContext = {
          organizationId: principal.organizationId,
          authorId: principal.id,
          clientType: principal.clientType,
          createdVia: 'mcp',
        };

        const alert = await notificationService.sendEditorialAlert(
          {
            title: args.title,
            message: args.message,
            storyId: args.story_id,
            severity: args.severity,
            targetRole: args.target_role,
          },
          ctx
        );

        return successResponse({
          alert_id: alert.id,
          title: alert.title,
          type: alert.type,
          severity: alert.severity,
          message: 'Editorial alert posted to newsroom channel.',
        });
      } catch (err: unknown) {
        return errorResponse(err instanceof Error ? err.message : String(err));
      }
    }
  );

  // 3. list_editorial_notifications
  server.tool(
    'list_editorial_notifications',
    'List recent breaking news alerts, fact-check flags, and newsroom notifications.',
    {
      limit: z.number().int().min(1).max(100).default(20).describe('Max notifications to retrieve'),
    },
    async (args) => {
      try {
        const principal = getPrincipal();
        AuthService.requireScope(principal, 'news:read');

        const notifications = await notificationService.listNotifications(principal.organizationId, args.limit);
        return successResponse({ count: notifications.length, notifications });
      } catch (err: unknown) {
        return errorResponse(err instanceof Error ? err.message : String(err));
      }
    }
  );
}
