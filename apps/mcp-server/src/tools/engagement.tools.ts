import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { DatabaseService } from '@ai-news/database';
import { EngagementService, NewsletterService, CollectionService } from '@ai-news/stories';
import { generateOpenGraphMeta, generateSocialShareLinks } from '@ai-news/shared';
import { AuthService, type AuthenticatedPrincipal } from '@ai-news/auth';
import { mcpJsonResponse, mcpErrorResponse } from './tool-helpers';

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

  server.tool(
    'record_reading_progress',
    '[ENGAGEMENT] Track reader scroll progress or mark an article as completed/read.',
    {
      storyId: z.string().min(1).describe('The ID of the story'),
      percentage: z.number().min(0).max(100).describe('Reading completion percentage (0-100)'),
      completed: z.boolean().optional().describe('Whether reader reached end of story'),
    },
    async ({ storyId, percentage, completed }) => {
      const principal = getPrincipal();
      AuthService.requireScope(principal, 'news:read');

      const progress = await engagementService.saveReadingProgress(storyId, percentage, {
        userId: principal.id,
        organizationId: principal.organizationId,
        completed,
      });

      return mcpJsonResponse({
        message: 'Reading progress recorded successfully.',
        progress,
      });
    }
  );

  server.tool(
    'get_reading_history',
    '[READ-ONLY] Retrieve recently read articles and completion percentages for the current user.',
    {
      limit: z.number().int().positive().max(100).default(20).describe('Max history items to retrieve'),
    },
    async ({ limit }) => {
      const principal = getPrincipal();
      AuthService.requireScope(principal, 'news:read');

      const history = await engagementService.listReadingHistory(principal.id, limit);
      return mcpJsonResponse({
        userId: principal.id,
        totalItems: history.length,
        history,
      });
    }
  );

  const newsletterService = new NewsletterService(db);
  const collectionService = new CollectionService(db);

  // --- F14: Newsletter System ---

  server.tool(
    'subscribe_newsletter',
    '[ENGAGEMENT] Subscribe an email to automated daily or weekly news digests.',
    {
      email: z.string().email().describe('Reader email address'),
      frequency: z.enum(['daily', 'weekly']).default('daily').describe('Digest delivery frequency'),
      categories: z.array(z.string()).default([]).describe('Optional category topics of interest'),
    },
    async ({ email, frequency, categories }) => {
      try {
        const sub = await newsletterService.subscribe(email, frequency, categories);
        return mcpJsonResponse({
          message: `Successfully subscribed ${email} to ${frequency} newsletter digest.`,
          subscription: sub,
        });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        return mcpErrorResponse(`Newsletter subscription failed: ${msg}`);
      }
    }
  );

  server.tool(
    'curate_newsletter_digest',
    '[EDITORIAL / AI] Aggregate top published stories and generate a curated newsletter digest.',
    {
      frequency: z.enum(['daily', 'weekly']).default('daily').describe('Digest frequency type'),
      category: z.string().optional().describe('Filter by topic category (e.g. Technology, Politics)'),
      targetDate: z.string().optional().describe('Target date string (YYYY-MM-DD), defaults to today'),
    },
    async ({ frequency, category, targetDate }) => {
      try {
        const principal = getPrincipal();
        AuthService.requireScope(principal, 'news:write');

        const digest = await newsletterService.generateDigest(
          frequency,
          category,
          targetDate,
          principal.organizationId
        );

        return mcpJsonResponse({
          message: `Newsletter digest generated with ${digest.stories.length} stories.`,
          digest,
        });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        return mcpErrorResponse(`Failed to generate digest: ${msg}`);
      }
    }
  );

  // --- F15: Social Sharing & OpenGraph Meta ---

  server.tool(
    'generate_social_share_meta',
    '[READ-ONLY] Generate complete OpenGraph, Twitter Card meta tags, and direct share URLs for a story.',
    {
      storyId: z.string().min(1).describe('Target story ID'),
      baseUrl: z.string().optional().describe('Base domain URL (default: https://news.globalpulse.com)'),
    },
    async ({ storyId, baseUrl = 'https://news.globalpulse.com' }) => {
      try {
        const principal = getPrincipal();
        AuthService.requireScope(principal, 'news:read');

        const story = await db.stories.findById(storyId, principal.organizationId);
        if (!story) {
          return mcpErrorResponse(`Story with ID ${storyId} not found.`);
        }

        const shareCount = await db.engagement.getShareCount(storyId);
        const meta = generateOpenGraphMeta({ story, baseUrl });
        const shareUrls = generateSocialShareLinks(meta.url, story.title, story.summary);

        return mcpJsonResponse({
          storyId,
          shareCount,
          meta,
          shareUrls,
        });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        return mcpErrorResponse(`Failed to generate social share metadata: ${msg}`);
      }
    }
  );

  // --- F16: Reading Lists & Named Collections ---

  server.tool(
    'curate_collection',
    '[EDITORIAL / AI] Create or curate a named reading list or thematic story collection.',
    {
      name: z.string().min(1).describe('Name of the collection (e.g. "AI Revolution 2026")'),
      description: z.string().optional().describe('Editorial description or theme explainer'),
      storyIds: z.array(z.string()).default([]).describe('List of story IDs included in the collection'),
      isPublic: z.boolean().default(true).describe('Whether the collection is publicly visible'),
    },
    async ({ name, description, storyIds, isPublic }) => {
      try {
        const principal = getPrincipal();
        AuthService.requireScope(principal, 'news:write');

        const collection = await collectionService.createCollection(
          principal.id,
          { name, description, storyIds, isPublic },
          principal.id
        );

        return mcpJsonResponse({
          message: `Collection "${collection.name}" created successfully.`,
          collection,
        });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        return mcpErrorResponse(`Failed to create collection: ${msg}`);
      }
    }
  );

  server.tool(
    'add_story_to_collection',
    '[EDITORIAL / AI] Append a story to an existing reading list collection.',
    {
      collectionId: z.string().min(1).describe('Target collection ID'),
      storyId: z.string().min(1).describe('Story ID to add'),
    },
    async ({ collectionId, storyId }) => {
      try {
        const principal = getPrincipal();
        AuthService.requireScope(principal, 'news:write');

        const updated = await collectionService.addStory(collectionId, storyId);
        return mcpJsonResponse({
          message: `Story ${storyId} added to collection ${collectionId}.`,
          collection: updated,
        });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        return mcpErrorResponse(`Failed to add story to collection: ${msg}`);
      }
    }
  );
}
