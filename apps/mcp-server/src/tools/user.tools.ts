import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { DatabaseService } from '@ai-news/database';
import type { AuthenticatedPrincipal } from '@ai-news/auth';
import { AuthService } from '@ai-news/auth';
import { UserService, type StoryContext } from '@ai-news/stories';
import { successResponse, errorResponse } from './tool-helpers';

export function registerUserTools(
  server: McpServer,
  database: DatabaseService,
  getPrincipal: () => AuthenticatedPrincipal
): void {
  const userService = new UserService(database);

  // 1. list_newsroom_users
  server.tool(
    'list_newsroom_users',
    'List all newsroom staff, journalists, and active AI agents with their roles and status.',
    {},
    async () => {
      try {
        const principal = getPrincipal();
        AuthService.requireScope(principal, 'news:read');

        const users = await userService.listUsers(principal.organizationId);
        return successResponse({ count: users.length, users });
      } catch (err: unknown) {
        return errorResponse(err instanceof Error ? err.message : String(err));
      }
    }
  );

  // 2. assign_user_role
  server.tool(
    'assign_user_role',
    'Assign or modify the newsroom role of a user (admin, editor, journalist, reader, ai_agent).',
    {
      user_id: z.string().describe('ID of the user to modify'),
      role: z.enum(['admin', 'editor', 'journalist', 'reader', 'ai_agent']).describe('New role to assign'),
    },
    async (args) => {
      try {
        const principal = getPrincipal();
        AuthService.requireRole(principal, 'admin');
        AuthService.requireScope(principal, 'news:admin');

        const ctx: StoryContext = {
          organizationId: principal.organizationId,
          authorId: principal.id,
          clientType: principal.clientType,
          createdVia: 'mcp',
        };

        const updated = await userService.assignRole(args.user_id, args.role, ctx);
        return successResponse({
          user_id: updated.id,
          name: updated.name,
          email: updated.email,
          new_role: updated.role,
          message: `User role successfully updated to "${updated.role}".`,
        });
      } catch (err: unknown) {
        return errorResponse(err instanceof Error ? err.message : String(err));
      }
    }
  );

  // 3. invite_newsroom_user
  server.tool(
    'invite_newsroom_user',
    'Invite a new journalist, editor, or register an external AI agent account into the newsroom.',
    {
      name: z.string().describe('Full name or Agent identifier'),
      email: z.string().email().describe('Staff or service email address'),
      role: z.enum(['admin', 'editor', 'journalist', 'reader', 'ai_agent']).default('journalist').describe('Role'),
      bio: z.string().optional().describe('Staff bio or AI agent capability description'),
    },
    async (args) => {
      try {
        const principal = getPrincipal();
        AuthService.requireRole(principal, 'admin', 'editor', 'ai_agent');

        const ctx: StoryContext = {
          organizationId: principal.organizationId,
          authorId: principal.id,
          clientType: principal.clientType,
          createdVia: 'mcp',
        };

        const invited = await userService.inviteUser(
          {
            name: args.name,
            email: args.email,
            role: args.role,
            clientType: args.role === 'ai_agent' ? 'custom_mcp' : 'human_web',
            bio: args.bio,
          },
          ctx
        );

        return successResponse({
          user_id: invited.id,
          name: invited.name,
          email: invited.email,
          role: invited.role,
          status: invited.status,
          message: 'Newsroom member successfully invited.',
        });
      } catch (err: unknown) {
        return errorResponse(err instanceof Error ? err.message : String(err));
      }
    }
  );
}
