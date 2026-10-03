import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { DatabaseService } from '@ai-news/database';
import type { NewsletterService } from '@ai-news/stories';
import { generateOpenGraphMeta, generateSocialShareLinks } from '@ai-news/shared';
import { AuthService, type AuthenticatedPrincipal } from '@ai-news/auth';
import { mcpJsonResponse, mcpErrorResponse } from '../tool-helpers';

export function registerNewsletterSocialTools(
  server: McpServer,
  db: DatabaseService,
  newsletterService: NewsletterService,
  getPrincipal: () => AuthenticatedPrincipal
) {
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
      category: z
        .string()
        .optional()
        .describe('Filter by topic category (e.g. Technology, Politics)'),
      targetDate: z
        .string()
        .optional()
        .describe('Target date string (YYYY-MM-DD), defaults to today'),
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

  server.tool(
    'unsubscribe_newsletter',
    '[ENGAGEMENT] Unsubscribe an email address from newsletter briefings.',
    {
      email: z.string().email().describe('Reader email address to unsubscribe'),
    },
    async ({ email }) => {
      try {
        const success = await newsletterService.unsubscribe(email);
        return mcpJsonResponse({
          email,
          unsubscribed: success,
          message: success
            ? `Successfully unsubscribed ${email}.`
            : `Email ${email} was not actively subscribed.`,
        });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        return mcpErrorResponse(`Failed to unsubscribe: ${msg}`);
      }
    }
  );

  server.tool(
    'get_newsletter_subscription',
    '[READ-ONLY] Retrieve newsletter subscription status and preferences for an email.',
    {
      email: z.string().email().describe('Reader email address'),
    },
    async ({ email }) => {
      try {
        const sub = await newsletterService.getSubscription(email);
        if (!sub) {
          return mcpJsonResponse({
            email,
            isSubscribed: false,
            message: 'No active subscription found.',
          });
        }
        return mcpJsonResponse({ email, isSubscribed: true, subscription: sub });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        return mcpErrorResponse(`Failed to get subscription: ${msg}`);
      }
    }
  );

  server.tool(
    'list_newsletter_subscriptions',
    '[ADMIN / READ-ONLY] List active newsletter subscribers filtered by delivery frequency or category.',
    {
      frequency: z.enum(['daily', 'weekly']).optional().describe('Filter by frequency'),
      category: z.string().optional().describe('Filter by topic category'),
    },
    async ({ frequency, category }) => {
      try {
        const principal = getPrincipal();
        AuthService.requireRole(principal, 'admin', 'editor');
        AuthService.requireScope(principal, 'news:read');

        const subs = await db.newsletters.listActiveSubscriptions(frequency, category);
        return mcpJsonResponse({
          total: subs.length,
          subscriptions: subs,
        });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        return mcpErrorResponse(`Failed to list newsletter subscribers: ${msg}`);
      }
    }
  );

  server.tool(
    'get_latest_newsletter_digest',
    '[READ-ONLY] Retrieve the latest generated daily or weekly newsletter briefing.',
    {
      frequency: z.enum(['daily', 'weekly']).default('daily').describe('Digest frequency type'),
      category: z.string().optional().describe('Topic category filter if any'),
    },
    async ({ frequency, category }) => {
      try {
        const principal = getPrincipal();
        AuthService.requireScope(principal, 'news:read');

        const digest = await db.newsletters.getLatestDigest(frequency, category);
        if (!digest) {
          return mcpJsonResponse({ message: 'No newsletter digest found matching criteria.' });
        }
        return mcpJsonResponse(digest);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        return mcpErrorResponse(`Failed to get latest digest: ${msg}`);
      }
    }
  );

  // --- F15: Social Sharing & OpenGraph Meta ---

  server.tool(
    'generate_social_share_meta',
    '[READ-ONLY] Generate complete OpenGraph, Twitter Card meta tags, and direct share URLs for a story.',
    {
      storyId: z.string().min(1).describe('Target story ID'),
      baseUrl: z
        .string()
        .optional()
        .describe('Base domain URL (default: https://news.globalpulse.com)'),
    },
    async ({
      storyId,
      baseUrl = process.env.PUBLIC_SITE_URL || 'https://news.globalpulse.com',
    }) => {
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
}
