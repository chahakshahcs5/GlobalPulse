import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { DatabaseService } from '@ai-news/database';
import { AuthService, type AuthenticatedPrincipal } from '@ai-news/auth';
import { FactCheckService } from '@ai-news/stories';
import { mcpJsonResponse, mcpErrorResponse } from './tool-helpers';

export function registerFactCheckTools(
  server: McpServer,
  db: DatabaseService,
  getPrincipal: () => AuthenticatedPrincipal
) {
  const factCheckService = new FactCheckService(db);

  server.tool(
    'evaluate_story_credibility',
    '[READ-ONLY] Assess journalistic credibility and factual integrity score (0-100) for a story based on sources, citations, quotes, and claim checks.',
    {
      storyId: z.string().min(1).describe('Story ID to evaluate'),
    },
    async ({ storyId }) => {
      try {
        const principal = getPrincipal();
        AuthService.requireScope(principal, 'news:read');

        const assessment = await factCheckService.evaluateStoryCredibility(
          storyId,
          principal.organizationId
        );

        return mcpJsonResponse(assessment);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        return mcpErrorResponse(`Failed to evaluate credibility: ${msg}`);
      }
    }
  );

  server.tool(
    'check_content_duplication',
    'Pre-publication verification: evaluate title and draft content against the newsroom database to detect duplicate coverage or plagiarism.',
    {
      title: z.string().min(1).describe('Proposed story headline'),
      content: z.string().min(1).describe('Proposed story body text or article draft'),
      storyIdToExclude: z
        .string()
        .optional()
        .describe('Story ID to exclude from self-comparison when updating an existing article'),
      threshold: z
        .number()
        .min(0)
        .max(100)
        .default(75)
        .optional()
        .describe('Similarity percentage threshold (default 75%)'),
    },
    async ({ title, content, storyIdToExclude, threshold }) => {
      try {
        const principal = getPrincipal();
        AuthService.requireScope(principal, 'news:read');

        const result = await factCheckService.checkDuplication(
          {
            title,
            content,
            storyIdToExclude,
            threshold,
          },
          principal.organizationId
        );

        return mcpJsonResponse(result);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        return mcpErrorResponse(`Failed to check duplication: ${msg}`);
      }
    }
  );

  server.tool(
    'list_fact_checks',
    '[READ-ONLY] Retrieve verified fact-check claims and debunkings from the newsroom verification desk.',
    {},
    async () => {
      try {
        const principal = getPrincipal();
        AuthService.requireScope(principal, 'news:read');

        const factChecks = factCheckService.listFactChecks();
        return mcpJsonResponse({
          total: factChecks.length,
          factChecks,
        });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        return mcpErrorResponse(`Failed to list fact checks: ${msg}`);
      }
    }
  );
}
