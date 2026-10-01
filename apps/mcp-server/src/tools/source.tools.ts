import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { DatabaseService } from '@ai-news/database';
import { SourceService } from '@ai-news/sources';
import { AuthService, type AuthenticatedPrincipal } from '@ai-news/auth';
import { SourceTypeSchema } from '@ai-news/schemas';
import { mcpJsonResponse } from './tool-helpers';

export function registerSourceTools(
  server: McpServer,
  db: DatabaseService,
  getPrincipal: () => AuthenticatedPrincipal
) {
  const sourceService = new SourceService(db);

  server.tool(
    'create_source',
    '[WRITE] Register an external publication, article, document, or dataset URL in the source registry.',
    {
      url: z.string().url().describe('The direct URL of the external source'),
      title: z.string().min(1).describe('The article or document title'),
      publisher: z
        .string()
        .min(1)
        .describe('The publisher or news organization (e.g. "Reuters", "Bloomberg", "The Hindu")'),
      publisherId: z
        .string()
        .optional()
        .describe('Optional parent publisher ID (e.g. "pub_the_hindu")'),
      domain: z.string().optional().describe('Optional domain name (e.g. "thehindu.com")'),
      author: z.string().optional().describe('Author or reporter name'),
      publishedAt: z.string().optional().describe('Publication date ISO string'),
      sourceType: SourceTypeSchema.default('NEWS_ARTICLE').describe('Type of source'),
      permissibleExcerpt: z
        .string()
        .max(1000)
        .optional()
        .describe('Short permissible factual quote or excerpt'),
    },
    async (params) => {
      const principal = getPrincipal();
      AuthService.requireScope(principal, 'news:sources');

      const source = await sourceService.createSource(params, principal.organizationId);
      return mcpJsonResponse({
        message: 'Source registered.',
        sourceId: source.id,
        publisher: source.publisher,
        publisherId: source.publisherId,
        domain: source.domain,
        url: source.url,
      });
    }
  );

  server.tool(
    'explore_sources',
    '[READ-ONLY] Explore verified news publishers, outlets, and publications with logos, categories, and follower statistics.',
    {
      category: z
        .string()
        .optional()
        .describe(
          'Filter by category: general, technology, business, science, politics, world, official'
        ),
      query: z.string().optional().describe('Search publishers by name or domain'),
      limit: z.number().int().positive().max(100).default(50).describe('Max publishers to return'),
    },
    async ({ category, query, limit }) => {
      const principal = getPrincipal();
      AuthService.requireScope(principal, 'news:read');

      let publishers;
      if (query) {
        publishers = await sourceService.searchPublishers(query, principal.organizationId);
      } else {
        publishers = await sourceService.listPublishers(principal.organizationId, category, limit);
      }

      return mcpJsonResponse({
        count: publishers.length,
        publishers,
      });
    }
  );

  server.tool(
    'get_publisher_profile',
    '[READ-ONLY] Retrieve full profile for a news publisher/source (e.g. The Hindu), including all registered cited article URLs and all platform stories citing it.',
    {
      slugOrId: z
        .string()
        .min(1)
        .describe('The publisher slug (e.g. "the-hindu") or ID (e.g. "pub_the_hindu")'),
    },
    async ({ slugOrId }) => {
      const principal = getPrincipal();
      AuthService.requireScope(principal, 'news:read');

      const profile = await sourceService.getPublisherProfile(
        slugOrId,
        principal.organizationId,
        principal.id
      );

      return mcpJsonResponse(profile);
    }
  );

  server.tool(
    'create_publisher',
    '[WRITE] Register a new news publication or outlet with its brand identity, domain, and logo.',
    {
      name: z.string().min(1).describe('Publication name (e.g. "The Hindu", "TechCrunch")'),
      domain: z.string().min(1).describe('Primary domain (e.g. "thehindu.com")'),
      slug: z.string().optional().describe('Optional URL slug (e.g. "the-hindu")'),
      logoUrl: z.string().optional().describe('Logo or brand mark URL'),
      description: z.string().optional().describe('Editorial description of the publication'),
      category: z.string().default('general').describe('Category / beat'),
      country: z.string().optional().describe('Country of origin'),
      language: z.string().default('en').describe('Primary language'),
      websiteUrl: z.string().url().optional().describe('Homepage URL'),
      biasRating: z.string().optional().describe('Media bias rating (e.g. "Center")'),
      credibilityScore: z
        .number()
        .min(0)
        .max(100)
        .optional()
        .describe('Credibility rating (0-100)'),
    },
    async (params) => {
      const principal = getPrincipal();
      AuthService.requireScope(principal, 'news:sources');

      const publisher = await sourceService.createPublisher(params, principal.organizationId);
      return mcpJsonResponse({
        message: 'Publisher registered successfully.',
        publisher,
      });
    }
  );

  server.tool(
    'follow_source',
    '[WRITE] Follow a news source publisher (e.g. The Hindu, Reuters) to prioritize its coverage in feeds.',
    {
      sourceIdOrSlug: z.string().min(1).describe('The publisher ID or slug to follow'),
    },
    async ({ sourceIdOrSlug }) => {
      const principal = getPrincipal();
      AuthService.requireScope(principal, 'news:read');

      let pub = await db.publishers.findById(sourceIdOrSlug, principal.organizationId);
      if (!pub) {
        pub = await db.publishers.findBySlug(sourceIdOrSlug, principal.organizationId);
      }
      const targetId = pub ? pub.id : sourceIdOrSlug;

      const record = await db.users.followTarget(principal.id, 'source', targetId);
      if (pub) {
        pub.followerCount = (pub.followerCount || 0) + 1;
        await db.publishers.update(pub);
      }

      return mcpJsonResponse({
        message: `Successfully followed source "${pub?.name || sourceIdOrSlug}".`,
        follow: record,
      });
    }
  );

  server.tool(
    'unfollow_source',
    '[WRITE] Unfollow a news source publisher.',
    {
      sourceIdOrSlug: z.string().min(1).describe('The publisher ID or slug to unfollow'),
    },
    async ({ sourceIdOrSlug }) => {
      const principal = getPrincipal();
      AuthService.requireScope(principal, 'news:read');

      let pub = await db.publishers.findById(sourceIdOrSlug, principal.organizationId);
      if (!pub) {
        pub = await db.publishers.findBySlug(sourceIdOrSlug, principal.organizationId);
      }
      const targetId = pub ? pub.id : sourceIdOrSlug;

      const success = await db.users.unfollowTarget(principal.id, 'source', targetId);
      if (success && pub && pub.followerCount > 0) {
        pub.followerCount -= 1;
        await db.publishers.update(pub);
      }

      return mcpJsonResponse({
        success,
        message: success
          ? `Successfully unfollowed source "${pub?.name || sourceIdOrSlug}".`
          : `Was not following source "${pub?.name || sourceIdOrSlug}".`,
      });
    }
  );

  server.tool(
    'list_followed_sources',
    '[READ-ONLY] Retrieve all news source publications followed by the active user or agent.',
    {},
    async () => {
      const principal = getPrincipal();
      AuthService.requireScope(principal, 'news:read');

      const followRecords = await db.users.listFollowing(principal.id, 'source');
      const followedPublishers = await Promise.all(
        followRecords.map(async (r) => {
          let pub = await db.publishers.findById(r.targetId, principal.organizationId);
          if (!pub) {
            pub = await db.publishers.findBySlug(r.targetId, principal.organizationId);
          }
          return pub || { id: r.targetId, name: r.targetId };
        })
      );

      return mcpJsonResponse({
        count: followedPublishers.length,
        sources: followedPublishers,
      });
    }
  );

  server.tool(
    'update_source',
    '[WRITE] Update metadata or permissible excerpt for a registered external source.',
    {
      sourceId: z.string().min(1).describe('Source ID to update'),
      title: z.string().optional().describe('Updated title'),
      publisher: z.string().optional().describe('Updated publisher'),
      author: z.string().optional().describe('Updated author name'),
      permissibleExcerpt: z.string().max(1000).optional().describe('Updated excerpt'),
    },
    async ({ sourceId, ...updates }) => {
      const principal = getPrincipal();
      AuthService.requireScope(principal, 'news:sources');

      const source = await db.sources.findById(sourceId, principal.organizationId);
      if (!source) {
        throw new Error(`Source "${sourceId}" not found`);
      }

      const updated = await db.sources.update({
        ...source,
        title: updates.title ?? source.title,
        publisher: updates.publisher ?? source.publisher,
        author: updates.author !== undefined ? updates.author : source.author,
        permissibleExcerpt: updates.permissibleExcerpt ?? source.permissibleExcerpt,
        updatedAt: new Date().toISOString(),
      });

      return mcpJsonResponse({
        message: 'Source updated successfully.',
        sourceId: updated.id,
        updated,
      });
    }
  );

  server.tool(
    'attach_source',
    '[WRITE] Attach a registered source to a story.',
    {
      storyId: z.string().min(1).describe('Story ID'),
      sourceId: z.string().min(1).describe('Source ID from create_source or search_sources'),
    },
    async ({ storyId, sourceId }) => {
      const principal = getPrincipal();
      AuthService.requireScope(principal, 'news:sources');

      await sourceService.attachSourceToStory(storyId, sourceId, principal.organizationId);
      return mcpJsonResponse({ message: 'Source attached to story.', storyId, sourceId });
    }
  );

  server.tool(
    'detach_source',
    '[WRITE] Detach a source reference from a story.',
    {
      storyId: z.string().min(1).describe('Story ID'),
      sourceId: z.string().min(1).describe('Source ID to detach'),
    },
    async ({ storyId, sourceId }) => {
      const principal = getPrincipal();
      AuthService.requireScope(principal, 'news:sources');

      const story = await db.stories.findById(storyId, principal.organizationId);
      if (!story) {
        throw new Error(`Story "${storyId}" not found`);
      }

      story.sourceIds = story.sourceIds.filter((id) => id !== sourceId);
      await db.stories.update(story);

      return mcpJsonResponse({ message: 'Source detached from story.', storyId, sourceId });
    }
  );

  server.tool(
    'attach_citation',
    '[WRITE] Attach a granular factual claim citation linking a story claim to a specific source.',
    {
      storyId: z.string().min(1).describe('Story ID'),
      sourceId: z.string().min(1).describe('Source ID'),
      claimText: z.string().min(1).describe('The specific factual statement or number being cited'),
      blockId: z.string().optional().describe('Optional block ID where this claim appears'),
      confidenceScore: z
        .number()
        .min(0)
        .max(1)
        .optional()
        .describe('Confidence rating from 0.0 to 1.0'),
    },
    async (params) => {
      const principal = getPrincipal();
      AuthService.requireScope(principal, 'news:sources');

      const citation = await sourceService.createCitation({
        ...params,
        orgId: principal.organizationId,
      });

      return mcpJsonResponse({
        message: 'Citation attached.',
        citationId: citation.id,
        claimText: citation.claimText,
      });
    }
  );

  server.tool(
    'get_story_sources',
    '[READ-ONLY] Retrieve all sources and claim citations attached to a story.',
    {
      storyId: z.string().min(1).describe('Story ID'),
    },
    async ({ storyId }) => {
      const principal = getPrincipal();
      AuthService.requireScope(principal, 'news:read');

      const story = await db.stories.findById(storyId, principal.organizationId);
      if (!story) {
        throw new Error(`Story ${storyId} not found`);
      }

      const sources = await Promise.all(
        story.sourceIds.map((id) => db.sources.findById(id, principal.organizationId))
      );
      const citations = await sourceService.getStoryCitations(storyId);

      return mcpJsonResponse({
        storyId,
        sources: sources.filter(Boolean),
        citations,
      });
    }
  );
}
