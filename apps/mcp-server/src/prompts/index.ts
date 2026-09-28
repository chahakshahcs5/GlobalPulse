import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

export function registerPrompts(server: McpServer) {
  server.prompt(
    'story-creation',
    'Standard operating prompt for researching and drafting a new story via MCP tools.',
    {
      topic: z.string().describe('The subject or breaking event to cover'),
      articleType: z
        .string()
        .optional()
        .describe('Preferred article genre (e.g. breaking_news, analysis, explainer)'),
    },
    async ({ topic, articleType }) => {
      return {
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `You are the Newsroom Lead AI.
Task: Research the latest developments on "${topic}" and publish a structured news story.

Protocol:
1. Search existing coverage first by calling \`search_stories({ query: "${topic}" })\`.
2. If existing coverage already covers the event, DO NOT duplicate it. Instead, decide if an update is warranted.
3. If this is genuinely new coverage, call \`create_story\` with a compelling headline, executive summary, and articleType: "${articleType || 'developing_story'}".
4. Compose structured content blocks using \`add_story_block\` (paragraphs, numerical charts via \`create_chart\`, timelines via \`create_timeline\`, or maps via \`create_map\`).
5. Register and attach all supporting sources using \`create_source\` and \`attach_source\`.
6. Attach factual claim citations using \`attach_citation\`.
7. When ready and verified, invoke \`publish_story\`.`,
            },
          },
        ],
      };
    }
  );

  server.prompt(
    'story-update',
    'Standard operating prompt for checking developing events and issuing a version update with WhatChanged annotations.',
    {
      storyId: z.string().describe('The story ID to evaluate and update'),
      newDevelopment: z.string().describe('Summary of the incoming new information or statement'),
    },
    async ({ storyId, newDevelopment }) => {
      return {
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `You are updating story "${storyId}".
New development to evaluate: "${newDevelopment}".

Protocol:
1. Retrieve current story details using \`get_story({ storyId: "${storyId}" })\`.
2. Inspect the existing structured blocks and timeline.
3. Determine what has materially changed:
   - What facts or statistics must be updated?
   - What new sources or official quotes have emerged?
4. Call \`create_story_version\` with:
   - \`changeSummary\`: clear editorial explanation of the update.
   - Updated array of blocks (a WhatChangedBlock will be automatically generated and prepended if omitted).
5. Attach new sources via \`create_source\` and \`attach_source\`.
6. If the story was previously in draft, publish it with \`publish_story\`.`,
            },
          },
        ],
      };
    }
  );

  server.prompt(
    'topic-briefing',
    'Synthesizes a visual executive briefing for a specific topic across multiple stories.',
    {
      topic: z.string().describe('The topic name or beat'),
    },
    async ({ topic }) => {
      return {
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `Generate an executive visual briefing on topic: "${topic}".
1. Call \`search_stories({ query: "${topic}", status: "PUBLISHED" })\`.
2. Synthesize key macro trends, critical statistics, and milestones.
3. Create a comprehensive topic briefing story with a summary block, KPI statistics, and a timeline block.`,
            },
          },
        ],
      };
    }
  );
}
