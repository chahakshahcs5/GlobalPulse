import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { DatabaseService } from '@ai-news/database';
import type { AuthenticatedPrincipal } from '@ai-news/auth';
import { registerSearchTools } from '../../../apps/mcp-server/src/tools/search.tools.js';
import { registerStoryTools } from '../../../apps/mcp-server/src/tools/story.tools.js';
import { registerBlockTools } from '../../../apps/mcp-server/src/tools/block.tools.js';
import { registerMediaTools } from '../../../apps/mcp-server/src/tools/media.tools.js';
import { registerSourceTools } from '../../../apps/mcp-server/src/tools/source.tools.js';
import { registerTaxonomyTools } from '../../../apps/mcp-server/src/tools/taxonomy.tools.js';
import { registerJobTools } from '../../../apps/mcp-server/src/tools/job.tools.js';
import { registerEngagementTools } from '../../../apps/mcp-server/src/tools/engagement.tools.js';
import { registerUserTools } from '../../../apps/mcp-server/src/tools/user.tools.js';
import { registerAnalyticsTools } from '../../../apps/mcp-server/src/tools/analytics.tools.js';
import { registerWeatherTools } from '../../../apps/mcp-server/src/tools/weather.tools.js';
import { registerResources } from '../../../apps/mcp-server/src/resources/index.js';
import { registerPrompts } from '../../../apps/mcp-server/src/prompts/index.js';
import { createMcpApp, mcpPrincipalStore } from '../../../apps/mcp-server/src/server.js';
import http from 'http';
import type { AddressInfo } from 'net';

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

describe('Remote MCP Server & Protocol Integration Tests (Priority 3)', () => {
  let db: DatabaseService;
  let server: McpServer;
  let client: Client;
  let clientTransport: InMemoryTransport;
  let serverTransport: InMemoryTransport;
  let activePrincipal: AuthenticatedPrincipal;

  beforeAll(async () => {
    db = new DatabaseService();
    activePrincipal = {
      id: 'usr_gemini_spark_01',
      organizationId: 'org_mcp_test',
      role: 'ai_agent',
      clientType: 'gemini_spark',
      scopes: [
        'news:read',
        'news:search',
        'news:write',
        'news:publish',
        'news:media',
        'news:sources',
        'news:topics',
        'news:admin',
      ],
    };

    server = new McpServer({
      name: 'ai-news-platform-mcp-test',
      version: '1.0.0',
    });

    const getPrincipal = () => mcpPrincipalStore.getStore() || activePrincipal;

    registerSearchTools(server, db, getPrincipal);
    registerStoryTools(server, db, getPrincipal);
    registerBlockTools(server, db, getPrincipal);
    registerMediaTools(server, db, getPrincipal);
    registerSourceTools(server, db, getPrincipal);
    registerTaxonomyTools(server, db, getPrincipal);
    registerJobTools(server, db, getPrincipal);
    registerEngagementTools(server, db, getPrincipal);
    registerUserTools(server, db, getPrincipal);
    registerAnalyticsTools(server, db, getPrincipal);
    registerWeatherTools(server, getPrincipal);
    registerResources(server, db, getPrincipal);
    registerPrompts(server);

    [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();

    client = new Client({ name: 'gemini-spark-client', version: '1.0.0' }, { capabilities: {} });

    await server.connect(serverTransport);
    await client.connect(clientTransport);
  });

  afterAll(async () => {
    await client.close();
    await server.close();
  });

  it('discovers all registered MCP tools including Section 38 block and taxonomy tools', async () => {
    const toolsResult = await client.listTools();
    const toolNames = toolsResult.tools.map((t: { name: string }) => t.name);

    // Search tools
    expect(toolNames).toContain('search_stories');
    expect(toolNames).toContain('find_similar_stories');
    expect(toolNames).toContain('find_similar_events');
    expect(toolNames).toContain('search_events');
    expect(toolNames).toContain('search_topics');
    expect(toolNames).toContain('search_entities');
    expect(toolNames).toContain('search_sources');

    // Retrieval tools
    expect(toolNames).toContain('get_story');
    expect(toolNames).toContain('get_story_version');
    expect(toolNames).toContain('get_story_versions');
    expect(toolNames).toContain('get_story_sources');
    expect(toolNames).toContain('get_event');
    expect(toolNames).toContain('get_topic');
    expect(toolNames).toContain('get_entity');
    expect(toolNames).toContain('get_media');

    // Story tools
    expect(toolNames).toContain('create_story');
    expect(toolNames).toContain('update_story');
    expect(toolNames).toContain('create_story_version');
    expect(toolNames).toContain('publish_story');
    expect(toolNames).toContain('unpublish_story');
    expect(toolNames).toContain('archive_story');
    expect(toolNames).toContain('delete_story');
    expect(toolNames).toContain('submit_for_review');
    expect(toolNames).toContain('review_story');
    expect(toolNames).toContain('list_review_queue');

    // Engagement & Moderation tools
    expect(toolNames).toContain('get_story_comments');
    expect(toolNames).toContain('moderate_comment');
    expect(toolNames).toContain('get_story_reactions');

    // Content Block tools (§38)
    expect(toolNames).toContain('add_story_block');
    expect(toolNames).toContain('add_text_block');
    expect(toolNames).toContain('add_heading_block');
    expect(toolNames).toContain('add_summary_block');
    expect(toolNames).toContain('add_quote_block');
    expect(toolNames).toContain('add_image_block');
    expect(toolNames).toContain('add_gallery_block');
    expect(toolNames).toContain('add_chart_block');
    expect(toolNames).toContain('add_map_block');
    expect(toolNames).toContain('add_timeline_block');
    expect(toolNames).toContain('add_diagram_block');
    expect(toolNames).toContain('add_video_block');
    expect(toolNames).toContain('add_audio_block');
    expect(toolNames).toContain('add_slide_deck_block');
    expect(toolNames).toContain('add_table_block');
    expect(toolNames).toContain('add_statistic_block');
    expect(toolNames).toContain('add_comparison_block');
    expect(toolNames).toContain('add_callout_block');
    expect(toolNames).toContain('add_citation_block');
    expect(toolNames).toContain('add_source_block');
    expect(toolNames).toContain('add_related_stories_block');
    expect(toolNames).toContain('add_image_diff_block');
    expect(toolNames).toContain('add_live_ticker_block');
    expect(toolNames).toContain('update_live_ticker_block');
    expect(toolNames).toContain('add_poll_block');
    expect(toolNames).toContain('cast_poll_vote');
    expect(toolNames).toContain('get_poll_results');

    // Media tools
    expect(toolNames).toContain('create_chart');
    expect(toolNames).toContain('create_map');
    expect(toolNames).toContain('create_timeline');
    expect(toolNames).toContain('create_diagram');
    expect(toolNames).toContain('upload_media');
    expect(toolNames).toContain('create_media_variant');
    expect(toolNames).toContain('attach_media');
    expect(toolNames).toContain('remove_media');

    // Source tools
    expect(toolNames).toContain('create_source');
    expect(toolNames).toContain('update_source');
    expect(toolNames).toContain('attach_source');
    expect(toolNames).toContain('detach_source');
    expect(toolNames).toContain('attach_citation');

    // Taxonomy tools
    expect(toolNames).toContain('create_topic');
    expect(toolNames).toContain('update_topic');
    expect(toolNames).toContain('link_story_to_topic');
    expect(toolNames).toContain('create_event');
    expect(toolNames).toContain('update_event');
    expect(toolNames).toContain('link_story_to_event');
    expect(toolNames).toContain('create_entity');
    expect(toolNames).toContain('update_entity');
    expect(toolNames).toContain('link_story_to_entity');

    // Job tools
    expect(toolNames).toContain('create_job');
    expect(toolNames).toContain('get_job');
    expect(toolNames).toContain('cancel_job');
    expect(toolNames).toContain('list_jobs');
  });

  it('discovers registered MCP prompts and resources', async () => {
    const promptsResult = await client.listPrompts();
    const promptNames = promptsResult.prompts.map((p: { name: string }) => p.name);
    expect(promptNames).toContain('story-creation');
    expect(promptNames).toContain('story-update');
    expect(promptNames).toContain('topic-briefing');

    const resourcesResult = await client.listResources();
    expect(resourcesResult).toBeDefined();
  });

  it('executes individual Section 38 specialized block tools', async () => {
    // 1. Create a story
    const createCall = await client.callTool({
      name: 'create_story',
      arguments: {
        title: 'DeepSpace Mission Discovers Biosignatures on Europa',
        summary: 'Subsurface spectroscopy reveals hydrothermal vents.',
        articleType: 'science',
      },
    });
    const { storyId } = parseJson<{ storyId: string }>(createCall);

    // 2. Call add_heading_block
    const hCall = await client.callTool({
      name: 'add_heading_block',
      arguments: {
        storyId,
        text: 'Hydrothermal Ocean Key Findings',
        level: 2,
        subtext: 'Mass spectrometer orbital passes confirm methane and organic salts.',
      },
    });
    expect(getText(hCall)).toContain('heading');

    // 3. Call add_chart_block
    const chartCall = await client.callTool({
      name: 'add_chart_block',
      arguments: {
        storyId,
        chartType: 'bar',
        title: 'Atmospheric Concentration (ppm)',
        xAxis: { key: 'compound', label: 'Compound' },
        yAxis: { label: 'PPM' },
        series: [{ name: 'Concentration', key: 'ppm' }],
        values: [
          { compound: 'Methane', ppm: 140 },
          { compound: 'Carbon Dioxide', ppm: 320 },
        ],
      },
    });
    expect(getText(chartCall)).toContain('chart');

    // 4. Call add_timeline_block
    const tlCall = await client.callTool({
      name: 'add_timeline_block',
      arguments: {
        storyId,
        title: 'Mission Flight Path Milestones',
        items: [
          { date: '2026-04-12', headline: 'Orbital Insertion', body: 'Enters 100km polar orbit' },
          {
            date: '2026-09-20',
            headline: 'Plume Flythrough',
            body: 'Ion trap captures vapor samples',
          },
        ],
      },
    });
    expect(getText(tlCall)).toContain('timeline');

    // 5. Verify story has the appended blocks
    const getStory = await client.callTool({
      name: 'get_story',
      arguments: { storyId },
    });
    const story = parseJson<{ blocks: unknown[] }>(getStory);
    expect(story.blocks.length).toBe(3);

    // 6. Verify LLM token optimization: get_story with includeBlocks: false strips blocks
    const getStoryCompact = await client.callTool({
      name: 'get_story',
      arguments: { storyId, includeBlocks: false },
    });
    const compactStory = parseJson<{ blocks?: unknown[]; blockCount: number }>(getStoryCompact);
    expect(compactStory.blocks).toBeUndefined();
    expect(compactStory.blockCount).toBe(3);

    // 7. Verify list_stories token optimization options
    const listRes = await client.callTool({
      name: 'list_stories',
      arguments: { includeBlocks: true },
    });
    const listData = parseJson<{
      stories: Array<{ id: string; blocks?: unknown[]; summary?: string }>;
    }>(listRes);
    const target = listData.stories.find((s) => s.id === storyId);
    expect(target?.blocks).toBeDefined();
    expect(target?.summary).toBeDefined();
  });

  it('executes media, source, and taxonomy update/link tools', async () => {
    // 1. Upload media & create variant
    const uploadCall = await client.callTool({
      name: 'upload_media',
      arguments: {
        mediaType: 'image',
        title: 'Europa Ice Plumes',
        url: 'https://images.platform/europa-plumes.jpg',
        metadata: { sensor: 'HR-VIS', resolution: '4K' },
      },
    });
    const { mediaId } = parseJson<{ mediaId: string }>(uploadCall);
    expect(mediaId).toBeDefined();

    const variantCall = await client.callTool({
      name: 'create_media_variant',
      arguments: {
        mediaId,
        format: 'webp',
        width: 1200,
        height: 675,
        url: 'https://images.platform/europa-plumes-1200.webp',
      },
    });
    expect(getText(variantCall)).toContain('Media variant registered');

    const getMediaCall = await client.callTool({
      name: 'get_media',
      arguments: { mediaId },
    });
    const media = parseJson<{ variants: unknown[] }>(getMediaCall);
    expect(media.variants.length).toBe(1);

    // 2. Register, update, and detach source
    const srcCall = await client.callTool({
      name: 'create_source',
      arguments: {
        url: 'https://nature.example.com/europa-findings-2026',
        title: 'Spectroscopic Confirmation of Europa Plumes',
        publisher: 'Nature Astronomy',
      },
    });
    const { sourceId } = parseJson<{ sourceId: string }>(srcCall);

    const updateSrc = await client.callTool({
      name: 'update_source',
      arguments: {
        sourceId,
        author: 'Dr. Elena Rostova',
        permissibleExcerpt:
          'Vapor composition reveals organic signatures consistent with hydrothermal activity.',
      },
    });
    expect(getText(updateSrc)).toContain('Source updated successfully');

    // 3. Create topic, update topic, and link
    const topicCall = await client.callTool({
      name: 'create_topic',
      arguments: { name: 'Astrobiology', description: 'Search for life beyond Earth' },
    });
    const { topic } = parseJson<{ topic: { id: string } }>(topicCall);

    const updateTopic = await client.callTool({
      name: 'update_topic',
      arguments: { topicId: topic.id, aliases: ['Exobiology', 'Planetary Habitability'] },
    });
    expect(getText(updateTopic)).toContain('Topic updated');

    // 4. Cancel job and list jobs
    const jobCall = await client.callTool({
      name: 'create_job',
      arguments: { jobType: 'media_transcode', payload: { mediaId } },
    });
    const { jobId } = parseJson<{ jobId: string }>(jobCall);

    const cancelCall = await client.callTool({
      name: 'cancel_job',
      arguments: { jobId, reason: 'Superceded by raw upload' },
    });
    expect(getText(cancelCall)).toContain('cancelled');

    const listJobs = await client.callTool({
      name: 'list_jobs',
      arguments: { limit: 10 },
    });
    const jobsResult = parseJson<{ jobs: unknown[] }>(listJobs);
    expect(jobsResult.jobs.length).toBeGreaterThanOrEqual(1);
  });

  it('guarantees concurrency safety across simultaneous requests with AsyncLocalStorage', async () => {
    const principalA: AuthenticatedPrincipal = {
      id: 'usr_agent_alpha',
      organizationId: 'org_alpha',
      role: 'ai_agent',
      clientType: 'chatgpt',
      scopes: ['news:read', 'news:write'],
    };

    const principalB: AuthenticatedPrincipal = {
      id: 'usr_agent_beta',
      organizationId: 'org_beta',
      role: 'ai_agent',
      clientType: 'gemini',
      scopes: ['news:read', 'news:write'],
    };

    // Run two asynchronous branches concurrently using mcpPrincipalStore
    const results = await Promise.all([
      mcpPrincipalStore.run(principalA, async () => {
        // Sleep briefly to simulate overlapping I/O
        await new Promise((r) => setTimeout(r, 20));
        return mcpPrincipalStore.getStore();
      }),
      mcpPrincipalStore.run(principalB, async () => {
        await new Promise((r) => setTimeout(r, 10));
        return mcpPrincipalStore.getStore();
      }),
    ]);

    expect(results[0]?.id).toBe('usr_agent_alpha');
    expect(results[0]?.organizationId).toBe('org_alpha');
    expect(results[1]?.id).toBe('usr_agent_beta');
    expect(results[1]?.organizationId).toBe('org_beta');
  });

  it('serves RFC 8414 Protected Resource metadata over HTTP', async () => {
    const app = createMcpApp(db);
    const testHttpServer = app.httpServer;

    await new Promise<void>((resolve) => testHttpServer.listen(0, resolve));
    const address = testHttpServer.address() as AddressInfo;
    const port = address.port;

    const res = await new Promise<{ statusCode: number; data: string }>((resolve, reject) => {
      http
        .get(`http://localhost:${port}/.well-known/oauth-protected-resource`, (res) => {
          let data = '';
          res.on('data', (c) => (data += c));
          res.on('end', () => resolve({ statusCode: res.statusCode || 200, data }));
        })
        .on('error', reject);
    });

    expect(res.statusCode).toBe(200);
    const meta = JSON.parse(res.data);
    expect(meta.scopes_supported).toContain('news:read');
    expect(meta.scopes_supported).toContain('news:publish');

    await new Promise<void>((resolve) => testHttpServer.close(() => resolve()));
  });

  it('supports concurrent independent Streamable HTTP sessions', async () => {
    const app = createMcpApp(db);
    const testHttpServer = app.httpServer;
    await new Promise<void>((resolve) => testHttpServer.listen(0, resolve));
    const address = testHttpServer.address() as AddressInfo;
    const endpoint = new URL(`http://localhost:${address.port}/mcp`);
    const clients: Client[] = [];

    try {
      const connectClient = async (name: string) => {
        const client = new Client({ name, version: '1.0.0' }, { capabilities: {} });
        clients.push(client);
        await client.connect(new StreamableHTTPClientTransport(endpoint));
        return client;
      };

      const [first, second] = await Promise.all([
        connectClient('external-client-a'),
        connectClient('external-client-b'),
      ]);
      const [firstTools, secondTools] = await Promise.all([first.listTools(), second.listTools()]);

      expect(firstTools.tools.map((tool) => tool.name)).toContain('create_story');
      expect(secondTools.tools.map((tool) => tool.name)).toContain('create_story');
      expect(firstTools.tools).toHaveLength(secondTools.tools.length);
    } finally {
      await Promise.all(clients.map((client) => client.close()));
      await new Promise<void>((resolve) => testHttpServer.close(() => resolve()));
    }
  });

  it('rejects unauthenticated MCP requests in production mode with 401', async () => {
    const prevEnv = process.env.NODE_ENV;
    try {
      (process.env as Record<string, string | undefined>).NODE_ENV = 'production';
      const app = createMcpApp(db);
      const testHttpServer = app.httpServer;

      await new Promise<void>((resolve) => testHttpServer.listen(0, resolve));
      const address = testHttpServer.address() as AddressInfo;
      const port = address.port;

      const res = await new Promise<{ statusCode: number; data: string }>((resolve, reject) => {
        const req = http.request(
          `http://localhost:${port}/mcp`,
          { method: 'POST', headers: { 'Content-Type': 'application/json' } },
          (res) => {
            let data = '';
            res.on('data', (c) => (data += c));
            res.on('end', () => resolve({ statusCode: res.statusCode || 200, data }));
          }
        );
        req.on('error', reject);
        req.write(JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/list' }));
        req.end();
      });

      expect(res.statusCode).toBe(401);
      const body = JSON.parse(res.data);
      expect(body.error).toBe('Unauthorized');
      expect(body.message).toContain('Authentication required');

      await new Promise<void>((resolve) => testHttpServer.close(() => resolve()));
    } finally {
      (process.env as Record<string, string | undefined>).NODE_ENV = prevEnv;
    }
  });

  it('ensures defaultPrincipal does not possess dangerous news:admin scope', () => {
    const app = createMcpApp(db);
    expect(app.currentPrincipal.scopes).not.toContain('news:admin');
    expect(app.currentPrincipal.role).toBe('ai_agent');
  });

  it('executes interactive media tools via MCP protocol (image_diff, live_ticker, poll, vote)', async () => {
    // 1. Create a story
    const storyRes = await client.callTool({
      name: 'create_story',
      arguments: {
        title: 'Interactive Media Test Story',
        summary: 'Testing Phase 1 interactive blocks via MCP.',
        articleType: 'technology',
      },
    });
    const { storyId } = parseJson<{ storyId: string }>(storyRes);
    expect(storyId).toBeDefined();

    // 2. Add image_diff block
    const diffRes = await client.callTool({
      name: 'add_image_diff_block',
      arguments: {
        storyId,
        beforeUrl: 'https://example.com/before.jpg',
        afterUrl: 'https://example.com/after.jpg',
        beforeLabel: 'Initial Concept',
        afterLabel: 'Final Prototype',
        caption: 'Design progression comparison',
      },
    });
    const diffBody = parseJson<{ message: string }>(diffRes);
    expect(diffBody.message).toContain('image_diff');

    // 3. Add live_ticker block
    const tickerRes = await client.callTool({
      name: 'add_live_ticker_block',
      arguments: {
        storyId,
        title: 'Semiconductor Index',
        items: [
          {
            symbol: 'SOX',
            label: 'PHLX Semiconductor',
            value: 4850.5,
            delta: 2.1,
            unit: 'pts',
            sparkline: [4790, 4810, 4850.5],
          },
        ],
      },
    });
    const tickerBody = parseJson<{ message: string; blockId: string }>(tickerRes);
    expect(tickerBody.message).toContain('live_ticker');
    const tickerBlockId = tickerBody.blockId;

    // 4. Update live_ticker block
    const tickUpdateRes = await client.callTool({
      name: 'update_live_ticker_block',
      arguments: {
        storyId,
        blockId: tickerBlockId,
        items: [
          {
            symbol: 'SOX',
            label: 'PHLX Semiconductor',
            value: 4890.0,
            delta: 2.9,
            unit: 'pts',
            sparkline: [4790, 4810, 4850.5, 4890.0],
          },
        ],
      },
    });
    const tickUpdateBody = parseJson<{
      message: string;
      block: { data: { items: Array<{ value: number }> } };
    }>(tickUpdateRes);
    expect(tickUpdateBody.block.data.items[0].value).toBe(4890.0);

    // 5. Add poll block
    const pollRes = await client.callTool({
      name: 'add_poll_block',
      arguments: {
        storyId,
        question: 'Will 2nm chips achieve mass yield in 2026?',
        options: ['Yes, on track', 'Delayed to 2027', 'Uncertain'],
      },
    });
    const pollBody = parseJson<{ message: string; blockId: string }>(pollRes);
    expect(pollBody.message).toContain('poll');
    const pollBlockId = pollBody.blockId;

    // 6. Cast vote on poll
    const voteRes = await client.callTool({
      name: 'cast_poll_vote',
      arguments: {
        storyId,
        blockId: pollBlockId,
        optionId: 'opt_1',
      },
    });
    const voteBody = parseJson<{ message: string; poll: { totalVotes: number } }>(voteRes);
    expect(voteBody.message).toBe('Vote successfully recorded.');
    expect(voteBody.poll.totalVotes).toBe(1);

    // 7. Get poll results
    const resultsRes = await client.callTool({
      name: 'get_poll_results',
      arguments: {
        storyId,
        blockId: pollBlockId,
      },
    });
    const resultsBody = parseJson<{
      totalVotes: number;
      options: Array<{ voteCount: number; percentage: string }>;
    }>(resultsRes);
    expect(resultsBody.totalVotes).toBe(1);
    expect(resultsBody.options[0].voteCount).toBe(1);
    expect(resultsBody.options[0].percentage).toBe('100.0');
  });

  it('supports hierarchical taxonomy, subcategories, special pop-up desks, and topic dossiers via MCP', async () => {
    // 1. List category hierarchy
    const hierarchyRes = await client.callTool({
      name: 'list_category_hierarchy',
      arguments: {},
    });
    const hierarchy = parseJson<{
      categories: Array<{ code: string; name: string; subCategories: Array<{ name: string }> }>;
    }>(hierarchyRes);
    expect(hierarchy.categories.length).toBeGreaterThanOrEqual(9);
    const techCat = hierarchy.categories.find((c) => c.code === 'technology');
    expect(techCat).toBeDefined();
    expect(techCat?.subCategories.some((s) => s.name === 'Artificial Intelligence')).toBe(true);

    // 2. Create subcategory under technology
    const subCatRes = await client.callTool({
      name: 'create_subcategory',
      arguments: {
        parentCode: 'technology',
        name: 'Neuromorphic Hardware',
      },
    });
    const subCatBody = parseJson<{ message: string; allSubCategories: string[] }>(subCatRes);
    expect(subCatBody.message).toBe('Subcategory registered.');
    expect(subCatBody.allSubCategories).toContain('Neuromorphic Hardware');

    // 2b. Query dynamic desks for category
    const getDesksRes = await client.callTool({
      name: 'get_category_desks',
      arguments: { categorySlug: 'technology' },
    });
    const desksBody = parseJson<{ categorySlug: string; desks: string[] }>(getDesksRes);
    expect(desksBody.desks).toContain('Neuromorphic Hardware');

    // 2c. Query realtime weather via Open-Meteo
    const weatherRes = await client.callTool({
      name: 'get_realtime_weather',
      arguments: { city: 'Tokyo' },
    });
    const weatherBody = parseJson<{
      location: { city: string; latitude: number; longitude: number };
      current: { temperatureCelsius: number; condition: string };
      source: string;
    }>(weatherRes);
    expect(weatherBody.location.city).toContain('Tokyo');
    expect(typeof weatherBody.current.temperatureCelsius).toBe('number');
    expect(weatherBody.source).toContain('Open-Meteo');

    // 3. Create story and assign categories
    const story = await db.stories.create({
      id: 'sty_tax_test',
      organizationId: 'org_mcp_test',
      slug: 'neuromorphic-spiking-silicon',
      title: 'Neuromorphic Silicon Demonstrates 100x Energy Efficiency',
      summary: 'Spiking neural network chips deployed in low-power space probes.',
      status: 'PUBLISHED',
      articleType: 'technology',
      topicIds: ['top_neuromorphic', 'top_energy'],
      entityIds: ['ent_cern'],
      sourceIds: [],
      categories: [],
      currentVersionNumber: 1,
      authorId: 'usr_gemini_spark_01',
      createdVia: 'api',
      createdByClient: 'gemini_spark',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      publishedAt: new Date().toISOString(),
      blocks: [],
    });

    const assignRes = await client.callTool({
      name: 'assign_story_categories',
      arguments: {
        storyId: story.id,
        categories: ['technology', 'Neuromorphic Hardware'],
      },
    });
    const assignBody = parseJson<{ message: string; categories: string[] }>(assignRes);
    expect(assignBody.categories).toContain('Neuromorphic Hardware');

    // 4. Create dynamic special pop-up desk
    const deskRes = await client.callTool({
      name: 'create_special_desk',
      arguments: {
        name: 'Quantum & Neuromorphic Summit',
        description: 'Continuous dispatches on unconventional computing paradigms.',
        themeColor: '#8b5cf6',
        liveTickerSymbol: 'SYNAPSE-100',
      },
    });
    const deskBody = parseJson<{
      message: string;
      desk: { id: string; slug: string; themeColor: string };
    }>(deskRes);
    expect(deskBody.message).toBe('Special desk launched.');
    expect(deskBody.desk.themeColor).toBe('#8b5cf6');

    // 5. List special desks
    const listDesksRes = await client.callTool({
      name: 'list_special_desks',
      arguments: { onlyActive: true },
    });
    const listDesksBody = parseJson<{ desks: Array<{ id: string; name: string }> }>(listDesksRes);
    expect(listDesksBody.desks.length).toBeGreaterThanOrEqual(1);

    // 6. Pin story to special desk
    const pinRes = await client.callTool({
      name: 'pin_story_to_special_desk',
      arguments: {
        deskId: deskBody.desk.id,
        storyId: story.id,
      },
    });
    const pinBody = parseJson<{ message: string; desk: { pinnedStoryIds: string[] } }>(pinRes);
    expect(pinBody.desk.pinnedStoryIds).toContain(story.id);

    // 7. Get topic dossier
    const dossierRes = await client.callTool({
      name: 'get_topic_dossier',
      arguments: {
        topicSlugOrId: 'neuromorphic-silicon',
      },
    });
    const dossierBody = parseJson<{
      topic: { name: string };
      storyCount: number;
      sentiment: { positive: number; neutral: number };
    }>(dossierRes);
    expect(dossierBody.topic.name).toBeDefined();
    expect(typeof dossierBody.storyCount).toBe('number');
    expect(typeof dossierBody.sentiment.neutral).toBe('number');

    // 8. Get topic knowledge graph
    const graphRes = await client.callTool({
      name: 'get_topic_knowledge_graph',
      arguments: {},
    });
    const graphBody = parseJson<{
      nodes: Array<{ id: string }>;
      edges: Array<{ source: string; target: string; weight: number }>;
    }>(graphRes);
    expect(Array.isArray(graphBody.nodes)).toBe(true);
    expect(Array.isArray(graphBody.edges)).toBe(true);
  });

  it('supports explainable personalization, algorithm tuning, reader profiles, and offline digest via MCP', async () => {
    // 1. Get default algorithm tuning
    const tuningRes = await client.callTool({
      name: 'get_algorithm_tuning',
      arguments: {},
    });
    const tuningBody = parseJson<{
      depthPreference: string;
      serendipityWeight: number;
      localVsGlobalWeight: number;
    }>(tuningRes);
    expect(tuningBody.depthPreference).toBeDefined();

    // 2. Update algorithm tuning
    const updateTuningRes = await client.callTool({
      name: 'update_algorithm_tuning',
      arguments: {
        depthPreference: 'deep_dive',
        serendipityWeight: 65,
        localVsGlobalWeight: 40,
        editorialStrictness: 85,
      },
    });
    const updateTuningBody = parseJson<{
      message: string;
      tuning: { depthPreference: string; serendipityWeight: number };
    }>(updateTuningRes);
    expect(updateTuningBody.message).toContain('updated');
    expect(updateTuningBody.tuning.depthPreference).toBe('deep_dive');
    expect(updateTuningBody.tuning.serendipityWeight).toBe(65);

    // 3. Get personalized feed with transparent attribution
    const feedRes = await client.callTool({
      name: 'get_personalized_feed',
      arguments: { limit: 5 },
    });
    const feedBody = parseJson<{
      total: number;
      stories: Array<{
        id: string;
        title: string;
        relevanceScore: number;
        rankingReasons: string[];
        attributionSignals: Array<{ type: string }>;
      }>;
    }>(feedRes);
    expect(Array.isArray(feedBody.stories)).toBe(true);
    if (feedBody.stories.length > 0) {
      expect(typeof feedBody.stories[0].relevanceScore).toBe('number');
      expect(Array.isArray(feedBody.stories[0].rankingReasons)).toBe(true);
      expect(Array.isArray(feedBody.stories[0].attributionSignals)).toBe(true);
    }

    // 4. Get reader consumption profile
    const profileRes = await client.callTool({
      name: 'get_reader_consumption_profile',
      arguments: {},
    });
    const profileBody = parseJson<{
      userId: string;
      totalReadingMinutes: number;
      diversityScore: number;
    }>(profileRes);
    expect(profileBody.userId).toBeDefined();
    expect(typeof profileBody.diversityScore).toBe('number');

    // 5. Export offline digest
    const digestRes = await client.callTool({
      name: 'export_offline_digest',
      arguments: { count: 3 },
    });
    const digestBody = parseJson<{
      digestId: string;
      title: string;
      totalStories: number;
      totalEstimatedReadingMinutes: number;
      stories: Array<{ id: string }>;
    }>(digestRes);
    expect(digestBody.digestId).toMatch(/^digest_/);
    expect(digestBody.title).toContain('Offline');
    expect(Array.isArray(digestBody.stories)).toBe(true);
  });
});
