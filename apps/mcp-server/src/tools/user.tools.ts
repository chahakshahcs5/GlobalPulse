import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { DatabaseService } from '@ai-news/database';
import type { AuthenticatedPrincipal } from '@ai-news/auth';
import { AuthService } from '@ai-news/auth';
import { DepthPreferenceSchema } from '@ai-news/schemas';
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
      role: z
        .enum(['admin', 'editor', 'journalist', 'reader', 'ai_agent'])
        .describe('New role to assign'),
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
      role: z
        .enum(['admin', 'editor', 'journalist', 'reader', 'ai_agent'])
        .default('journalist')
        .describe('Role'),
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

  // 4. follow_interest (F17)
  server.tool(
    'follow_interest',
    'Follow a news topic, cited entity, or journalist/author to personalize news delivery.',
    {
      target_type: z.enum(['topic', 'entity', 'author']).describe('Type of interest to follow'),
      target_id: z.string().min(1).describe('The unique ID or slug of the topic/entity/author'),
    },
    async (args) => {
      try {
        const principal = getPrincipal();
        AuthService.requireScope(principal, 'news:read');

        const record = await userService.followTarget(
          principal.id,
          args.target_type,
          args.target_id
        );
        return successResponse({
          message: `Successfully followed ${args.target_type} "${args.target_id}".`,
          follow: record,
        });
      } catch (err: unknown) {
        return errorResponse(err instanceof Error ? err.message : String(err));
      }
    }
  );

  // 5. unfollow_interest (F17)
  server.tool(
    'unfollow_interest',
    'Unfollow a previously followed topic, entity, or author.',
    {
      target_type: z.enum(['topic', 'entity', 'author']).describe('Type of interest to unfollow'),
      target_id: z.string().min(1).describe('The unique ID or slug'),
    },
    async (args) => {
      try {
        const principal = getPrincipal();
        AuthService.requireScope(principal, 'news:read');

        const removed = await userService.unfollowTarget(
          principal.id,
          args.target_type,
          args.target_id
        );
        return successResponse({
          success: removed,
          message: removed
            ? `Successfully unfollowed ${args.target_type} "${args.target_id}".`
            : `Was not following ${args.target_type} "${args.target_id}".`,
        });
      } catch (err: unknown) {
        return errorResponse(err instanceof Error ? err.message : String(err));
      }
    }
  );

  // 6. list_user_following (F17)
  server.tool(
    'list_user_following',
    'Retrieve all topics, entities, and authors followed by the active user/agent.',
    {
      target_type: z
        .enum(['topic', 'entity', 'author'])
        .optional()
        .describe('Filter by target type'),
    },
    async (args) => {
      try {
        const principal = getPrincipal();
        AuthService.requireScope(principal, 'news:read');

        const list = await userService.listFollowing(principal.id, args.target_type);
        return successResponse({
          count: list.length,
          following: list,
        });
      } catch (err: unknown) {
        return errorResponse(err instanceof Error ? err.message : String(err));
      }
    }
  );

  // 7. get_algorithm_tuning
  server.tool(
    'get_algorithm_tuning',
    '[READ-ONLY] Retrieve current recommendation algorithm parameters for the active user/agent.',
    {},
    async () => {
      try {
        const principal = getPrincipal();
        AuthService.requireScope(principal, 'news:read');

        const user = await database.users.findById(principal.id, principal.organizationId);
        const prefs = user?.preferences;
        return successResponse({
          depthPreference: prefs?.depthPreference || 'balanced',
          serendipityWeight: prefs?.serendipityWeight ?? 30,
          localVsGlobalWeight: prefs?.localVsGlobalWeight ?? 50,
          editorialStrictness: prefs?.editorialStrictness ?? 70,
        });
      } catch (err: unknown) {
        return errorResponse(err instanceof Error ? err.message : String(err));
      }
    }
  );

  // 8. update_algorithm_tuning
  server.tool(
    'update_algorithm_tuning',
    '[WRITE] Tune reader algorithm parameters (depth preference, serendipity, local vs global balance, and editorial strictness).',
    {
      depthPreference: DepthPreferenceSchema.optional().describe(
        'Reading depth preference: quick, balanced, or deep_dive'
      ),
      serendipityWeight: z
        .number()
        .min(0)
        .max(100)
        .optional()
        .describe('Serendipity weight (0-100) controlling out-of-bubble story discovery'),
      localVsGlobalWeight: z
        .number()
        .min(0)
        .max(100)
        .optional()
        .describe('Regional vs global story weighting (0-100)'),
      editorialStrictness: z
        .number()
        .min(0)
        .max(100)
        .optional()
        .describe('Editorial strictness threshold (0-100)'),
    },
    async (tuning) => {
      try {
        const principal = getPrincipal();
        AuthService.requireScope(principal, 'news:write');

        let user = await database.users.findById(principal.id, principal.organizationId);
        const now = new Date().toISOString();
        if (!user) {
          user = await database.users.create({
            id: principal.id,
            organizationId: principal.organizationId,
            name: principal.id,
            email: `${principal.id}@globalpulse.internal`,
            role: principal.role,
            clientType: principal.clientType,
            status: 'active',
            preferences: {
              categories: [],
              emailFrequency: 'daily',
              readingHistoryEnabled: true,
              theme: 'system',
              depthPreference: tuning.depthPreference || 'balanced',
              serendipityWeight: tuning.serendipityWeight ?? 30,
              localVsGlobalWeight: tuning.localVsGlobalWeight ?? 50,
              editorialStrictness: tuning.editorialStrictness ?? 70,
            },
            createdAt: now,
            updatedAt: now,
          });
        } else {
          const currentPrefs = user.preferences || {
            categories: [],
            emailFrequency: 'daily',
            readingHistoryEnabled: true,
            theme: 'system',
            depthPreference: 'balanced',
            serendipityWeight: 30,
            localVsGlobalWeight: 50,
            editorialStrictness: 70,
          };
          user = await database.users.update({
            ...user,
            preferences: {
              ...currentPrefs,
              ...(tuning.depthPreference !== undefined
                ? { depthPreference: tuning.depthPreference }
                : {}),
              ...(tuning.serendipityWeight !== undefined
                ? { serendipityWeight: tuning.serendipityWeight }
                : {}),
              ...(tuning.localVsGlobalWeight !== undefined
                ? { localVsGlobalWeight: tuning.localVsGlobalWeight }
                : {}),
              ...(tuning.editorialStrictness !== undefined
                ? { editorialStrictness: tuning.editorialStrictness }
                : {}),
            },
            updatedAt: now,
          });
        }

        return successResponse({
          message: 'Algorithm tuning successfully updated.',
          tuning: {
            depthPreference: user.preferences?.depthPreference || 'balanced',
            serendipityWeight: user.preferences?.serendipityWeight ?? 30,
            localVsGlobalWeight: user.preferences?.localVsGlobalWeight ?? 50,
            editorialStrictness: user.preferences?.editorialStrictness ?? 70,
          },
        });
      } catch (err: unknown) {
        return errorResponse(err instanceof Error ? err.message : String(err));
      }
    }
  );
}
