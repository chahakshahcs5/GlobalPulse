import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { DatabaseService } from '@ai-news/database';
import { AuthService, type AuthenticatedPrincipal } from '@ai-news/auth';
import { TemplateService } from '@ai-news/stories';
import { mcpJsonResponse, mcpErrorResponse } from './tool-helpers';

export function registerTemplateTools(
  server: McpServer,
  db: DatabaseService,
  getPrincipal: () => AuthenticatedPrincipal
) {
  const templateService = new TemplateService(db);

  server.tool(
    'list_content_templates',
    '[READ-ONLY] List pre-built enterprise newsroom content templates (Breaking News Alert, In-Depth Investigation, Editorial Opinion, Liveblog Event, Fact-Check Report).',
    {},
    async () => {
      try {
        const principal = getPrincipal();
        AuthService.requireScope(principal, 'news:read');

        const templates = templateService.listTemplates().map((t) => ({
          id: t.id,
          name: t.name,
          articleType: t.articleType,
          description: t.description,
          suggestedCategory: t.suggestedCategory,
          blockCount: t.defaultBlocks.length,
          promptGuidance: t.promptGuidance,
        }));

        return mcpJsonResponse({
          total: templates.length,
          templates,
        });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        return mcpErrorResponse(`Failed to list templates: ${msg}`);
      }
    }
  );

  server.tool(
    'get_content_template',
    '[READ-ONLY] Get full block blueprint and structural guidance for a specific content template.',
    {
      templateId: z
        .string()
        .min(1)
        .describe(
          'Template identifier (e.g. breaking_news_alert, investigative_deep_dive, fact_check_report)'
        ),
    },
    async ({ templateId }) => {
      try {
        const principal = getPrincipal();
        AuthService.requireScope(principal, 'news:read');

        const template = templateService.getTemplate(templateId);
        if (!template) {
          return mcpErrorResponse(`Content template '${templateId}' not found`);
        }

        return mcpJsonResponse({ template });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        return mcpErrorResponse(`Failed to get template: ${msg}`);
      }
    }
  );

  server.tool(
    'instantiate_story_from_template',
    'Scaffold and create a new draft story using a pre-configured newsroom content template.',
    {
      templateId: z
        .string()
        .min(1)
        .describe(
          'Template identifier (e.g. breaking_news_alert, investigative_deep_dive, editorial_opinion, liveblog_event, fact_check_report)'
        ),
      title: z.string().min(1).describe('Story title'),
      summary: z.string().min(1).describe('Executive summary'),
      topicIds: z.array(z.string()).default([]).describe('Associated topic identifiers'),
      entityIds: z.array(z.string()).default([]).describe('Associated entity identifiers'),
      heroImageUrl: z.string().url().optional().describe('Hero image URL'),
    },
    async ({ templateId, title, summary, topicIds, entityIds, heroImageUrl }) => {
      try {
        const principal = getPrincipal();
        AuthService.requireScope(principal, 'news:write');

        const story = await templateService.instantiateStory(
          {
            templateId,
            title,
            summary,
            topicIds,
            entityIds,
            heroImageUrl,
          },
          {
            organizationId: principal.organizationId,
            authorId: principal.id,
            clientType: principal.clientType,
            createdVia: 'mcp',
          }
        );

        return mcpJsonResponse({
          success: true,
          storyId: story.id,
          slug: story.slug,
          articleType: story.articleType,
          status: story.status,
          blockCount: story.blocks ? story.blocks.length : 0,
          wordCount: story.wordCount,
          readingTimeMinutes: story.readingTimeMinutes,
        });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        return mcpErrorResponse(`Failed to instantiate story from template: ${msg}`);
      }
    }
  );
}
