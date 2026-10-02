import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { DatabaseService } from '@ai-news/database';
import { AuthService, type AuthenticatedPrincipal } from '@ai-news/auth';
import type { NavTab } from '@ai-news/schemas';
import { mcpJsonResponse, mcpErrorResponse } from './tool-helpers';

export function registerNavigationTools(
  server: McpServer,
  db: DatabaseService,
  getPrincipal: () => AuthenticatedPrincipal
) {
  server.tool(
    'list_nav_tabs',
    '[READ-ONLY] Retrieve all navigation tabs displayed across the top header of the news platform.',
    {
      activeOnly: z
        .boolean()
        .optional()
        .default(true)
        .describe('Filter to only active navigation tabs'),
    },
    async ({ activeOnly }) => {
      try {
        const principal = getPrincipal();
        AuthService.requireScope(principal, 'news:read');

        const tabs = await db.navTabs.list(activeOnly);
        return mcpJsonResponse({
          total: tabs.length,
          tabs,
        });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        return mcpErrorResponse(`Failed to list nav tabs: ${msg}`);
      }
    }
  );

  server.tool(
    'get_nav_tab',
    '[READ-ONLY] Retrieve details of a specific navigation tab by its ID.',
    {
      tabId: z.string().min(1).describe('The navigation tab ID (e.g. "top", "for-you")'),
    },
    async ({ tabId }) => {
      try {
        const principal = getPrincipal();
        AuthService.requireScope(principal, 'news:read');

        const tab = await db.navTabs.findById(tabId);
        if (!tab) {
          return mcpErrorResponse(`Navigation tab "${tabId}" not found`);
        }
        return mcpJsonResponse(tab);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        return mcpErrorResponse(`Failed to get nav tab: ${msg}`);
      }
    }
  );

  server.tool(
    'create_nav_tab',
    '[WRITE] Create or register a new navigation tab in the platform header.',
    {
      tabId: z.string().min(1).describe('Unique tab ID (e.g. "climate")'),
      name: z.string().min(1).describe('Display name (e.g. "Climate Dispatch")'),
      href: z.string().min(1).describe('Relative or absolute route (e.g. "/category/science")'),
      sortOrder: z.number().int().default(10).describe('Ordering weight in header bar'),
      active: z.boolean().default(true).describe('Whether visible in the navigation bar'),
      icon: z.string().optional().describe('Icon identifier (e.g. "Sparkles", "Flame", "Globe")'),
    },
    async (params) => {
      try {
        const principal = getPrincipal();
        AuthService.requireScope(principal, 'news:write');

        const tab: NavTab = {
          tabId: params.tabId,
          name: params.name,
          href: params.href,
          sortOrder: params.sortOrder,
          active: params.active,
          icon: params.icon,
        };

        const created = await db.navTabs.create(tab);
        return mcpJsonResponse({
          message: `Navigation tab "${created.name}" created successfully.`,
          tab: created,
        });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        return mcpErrorResponse(`Failed to create nav tab: ${msg}`);
      }
    }
  );

  server.tool(
    'update_nav_tab',
    '[WRITE] Update properties of an existing navigation tab.',
    {
      tabId: z.string().min(1).describe('The navigation tab ID to update'),
      name: z.string().optional().describe('Updated display name'),
      href: z.string().optional().describe('Updated route href'),
      sortOrder: z.number().int().optional().describe('Updated ordering weight'),
      active: z.boolean().optional().describe('Updated active state'),
      icon: z.string().optional().describe('Updated icon name'),
    },
    async ({ tabId, ...updates }) => {
      try {
        const principal = getPrincipal();
        AuthService.requireScope(principal, 'news:write');

        const existing = await db.navTabs.findById(tabId);
        if (!existing) {
          return mcpErrorResponse(`Navigation tab "${tabId}" not found`);
        }

        const updated: NavTab = {
          ...existing,
          name: updates.name ?? existing.name,
          href: updates.href ?? existing.href,
          sortOrder: updates.sortOrder ?? existing.sortOrder,
          active: updates.active ?? existing.active,
          icon: updates.icon !== undefined ? updates.icon : existing.icon,
        };

        const result = await db.navTabs.update(updated);
        return mcpJsonResponse({
          message: `Navigation tab "${result.name}" updated successfully.`,
          tab: result,
        });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        return mcpErrorResponse(`Failed to update nav tab: ${msg}`);
      }
    }
  );

  server.tool(
    'delete_nav_tab',
    '[WRITE] Delete a navigation tab from the header bar.',
    {
      tabId: z.string().min(1).describe('The navigation tab ID to delete'),
    },
    async ({ tabId }) => {
      try {
        const principal = getPrincipal();
        AuthService.requireScope(principal, 'news:write');

        const success = await db.navTabs.delete(tabId);
        return mcpJsonResponse({
          success,
          message: success
            ? `Navigation tab "${tabId}" deleted.`
            : `Navigation tab "${tabId}" not found.`,
        });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        return mcpErrorResponse(`Failed to delete nav tab: ${msg}`);
      }
    }
  );
}
