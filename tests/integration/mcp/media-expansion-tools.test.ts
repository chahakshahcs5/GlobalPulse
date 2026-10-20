import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { DatabaseService } from '@ai-news/database';
import type { AuthenticatedPrincipal } from '@ai-news/auth';
import { registerBlockTools } from '../../../apps/mcp-server/src/tools/block.tools.js';
import { StoryService } from '@ai-news/stories';

function getText(result: unknown): string {
  if (
    result &&
    typeof result === 'object' &&
    'content' in result &&
    Array.isArray((result as { content: unknown }).content)
  ) {
    const content = (result as { content: Array<{ type?: string; text?: string }> }).content;
    return content[0]?.text || '';
  }
  return '';
}

function parseJson<T = Record<string, unknown>>(result: unknown): T {
  return JSON.parse(getText(result));
}

describe('MCP media expansion tools', () => {
  let db: DatabaseService;
  let server: McpServer;
  let client: Client;
  let clientTransport: InMemoryTransport;
  let serverTransport: InMemoryTransport;
  let storyId: string;

  beforeAll(async () => {
    db = new DatabaseService();
    const principal: AuthenticatedPrincipal = {
      id: 'usr_mcp_media',
      organizationId: 'org_mcp_media',
      role: 'ai_agent',
      clientType: 'gemini_spark',
      scopes: ['news:read', 'news:write', 'news:publish'],
    };

    const stories = new StoryService(db);
    const story = await stories.createStory(
      {
        title: 'Media expansion story',
        summary: 'Story used to verify the media expansion MCP tools.',
      },
      {
        organizationId: principal.organizationId,
        authorId: principal.id,
        clientType: principal.clientType,
        createdVia: 'mcp',
      }
    );
    storyId = story.id;

    server = new McpServer({ name: 'mcp-media-expansion-test', version: '1.0.0' });
    registerBlockTools(server, db, () => principal);

    [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
    client = new Client({ name: 'media-client', version: '1.0.0' }, { capabilities: {} });
    await server.connect(serverTransport);
    await client.connect(clientTransport);
  });

  afterAll(async () => {
    await client.close();
    await server.close();
  });

  it('exposes the media expansion tools', async () => {
    const tools = await client.listTools();
    const names = tools.tools.map((tool: { name: string }) => tool.name);

    expect(names).toContain('add_video_gallery_block');
    expect(names).toContain('add_podcast_block');
    expect(names).toContain('add_waveform_block');
    expect(names).toContain('add_transcript_block');
    expect(names).toContain('add_dataset_block');
  });

  it('adds a podcast block through MCP', async () => {
    const result = parseJson<{ blockId: string; sortOrder: number }>(
      await client.callTool({
        name: 'add_podcast_block',
        arguments: {
          storyId,
          title: 'The Daily Briefing',
          episodes: [
            {
              showTitle: 'The Daily Briefing',
              episodeTitle: 'Rate decision special',
              episodeNumber: 42,
              audioUrl: 'https://media.example.com/ep42.mp3',
              durationSeconds: 1800,
            },
          ],
        },
      })
    );

    expect(result.blockId).toBeTruthy();

    const story = await db.stories.findById(storyId, 'org_mcp_media');
    const podcast = story?.blocks.find((block) => block.blockType === 'podcast');
    expect(podcast).toBeDefined();
    expect((podcast!.data as { episodes: unknown[] }).episodes).toHaveLength(1);
  });

  it('adds a transcript block and a dataset block through MCP', async () => {
    await client.callTool({
      name: 'add_transcript_block',
      arguments: {
        storyId,
        title: 'Interview transcript',
        mediaType: 'video',
        mediaUrl: 'https://media.example.com/interview.mp4',
        segments: [{ startSeconds: 0, text: 'We are live.' }],
      },
    });

    await client.callTool({
      name: 'add_dataset_block',
      arguments: {
        storyId,
        title: 'Global GDP series',
        downloadUrl: 'https://data.example.com/gdp.csv',
        columns: [{ key: 'year', label: 'Year', type: 'number' }],
        previewRows: [{ year: 2025 }],
      },
    });

    const story = await db.stories.findById(storyId, 'org_mcp_media');
    const types = story?.blocks.map((block) => block.blockType) ?? [];
    expect(types).toContain('transcript');
    expect(types).toContain('dataset');
  });

  it('rejects a transcript without segments', async () => {
    const result = await client.callTool({
      name: 'add_transcript_block',
      arguments: { storyId, segments: [] },
    });
    // The MCP SDK validates arguments against the tool schema before the
    // handler runs, so this fails as a protocol-level input error.
    expect(getText(result)).toMatch(/validation error|at least 1 element/i);
  });
});
