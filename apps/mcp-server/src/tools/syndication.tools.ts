import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { DatabaseService } from '@ai-news/database';
import { AuthService, type AuthenticatedPrincipal } from '@ai-news/auth';
import { generateNewsArticleJsonLd } from '@ai-news/shared';
import { mcpJsonResponse, mcpErrorResponse } from './tool-helpers';

export function registerSyndicationTools(
  server: McpServer,
  db: DatabaseService,
  getPrincipal: () => AuthenticatedPrincipal
) {
  server.tool(
    'get_news_sitemap',
    '[READ-ONLY] Retrieve Google News sitemap records (articles published in the last 48 hours per Google News spec).',
    {
      limit: z.number().int().positive().max(250).default(50).describe('Max stories to inspect'),
    },
    async ({ limit }) => {
      const principal = getPrincipal();
      AuthService.requireScope(principal, 'news:read');

      const stories = await db.stories.list({ status: 'PUBLISHED', limit });
      const fortyEightHoursAgo = Date.now() - 48 * 60 * 60 * 1000;

      const recentStories = stories.filter((s) => {
        const pubTime = s.publishedAt
          ? new Date(s.publishedAt).getTime()
          : new Date(s.createdAt).getTime();
        return pubTime >= fortyEightHoursAgo;
      });

      const sitemapEntries = recentStories.map((s) => ({
        storyId: s.id,
        slug: s.slug,
        title: s.title,
        publicationDate: s.publishedAt || s.createdAt,
        language: 'en',
        keywords: s.topicIds || [],
        url: `https://globalpulse.news/stories/${s.slug}`,
      }));

      return mcpJsonResponse({
        totalEligible: sitemapEntries.length,
        timeframe: 'Last 48 Hours (Google News Specification)',
        entries: sitemapEntries,
      });
    }
  );

  server.tool(
    'get_story_structured_data',
    '[READ-ONLY] Generate Schema.org NewsArticle JSON-LD structured data for a specific story.',
    {
      storyId: z.string().min(1).describe('The story identifier or slug'),
    },
    async ({ storyId }) => {
      const principal = getPrincipal();
      AuthService.requireScope(principal, 'news:read');

      let story = await db.stories.findById(storyId);
      if (!story) {
        story = await db.stories.findBySlug(storyId, 'org_default');
      }

      if (!story) {
        return mcpErrorResponse(`Story ${storyId} not found`);
      }

      const structuredData = generateNewsArticleJsonLd({
        story,
        baseUrl: 'https://globalpulse.news',
        publisherName: 'GlobalPulse News',
        publisherLogoUrl: 'https://globalpulse.news/logo.png',
      });

      return mcpJsonResponse({
        storyId: story.id,
        schemaType: 'NewsArticle',
        structuredData,
      });
    }
  );

  server.tool(
    'get_syndication_feed',
    '[READ-ONLY] Query stories formatted for RSS 2.0 / Atom syndication with category or topic filtering.',
    {
      category: z
        .string()
        .optional()
        .describe('Article category to filter (e.g. technology, politics)'),
      topicId: z.string().optional().describe('Topic ID or slug to filter'),
      limit: z.number().int().positive().max(50).default(20).describe('Max items'),
    },
    async ({ category, topicId, limit }) => {
      const principal = getPrincipal();
      AuthService.requireScope(principal, 'news:read');

      const stories = await db.stories.list({
        status: 'PUBLISHED',
        articleType: category as any,
        topicId,
        limit,
      });

      const feedItems = stories.map((s) => ({
        title: s.title,
        link: `https://globalpulse.news/stories/${s.slug}`,
        description: s.summary,
        pubDate: s.publishedAt || s.createdAt,
        category: s.articleType,
        topics: s.topicIds || [],
        heroImageUrl: s.heroImageUrl,
        wordCount: s.wordCount,
        readingTimeMinutes: s.readingTimeMinutes,
      }));

      return mcpJsonResponse({
        feedTitle: 'GlobalPulse Syndication Feed',
        totalItems: feedItems.length,
        items: feedItems,
      });
    }
  );
}
