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
        .describe('The publisher or news organization (e.g. "Reuters", "Bloomberg")'),
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
        url: source.url,
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
