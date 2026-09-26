import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { DatabaseService } from '@ai-news/database';
import { AuthService, type AuthenticatedPrincipal } from '@ai-news/auth';
import { registerSearchTools } from '../../../apps/mcp-server/src/tools/search.tools.js';
import { registerStoryTools } from '../../../apps/mcp-server/src/tools/story.tools.js';
import { registerBlockTools } from '../../../apps/mcp-server/src/tools/block.tools.js';
import { registerMediaTools } from '../../../apps/mcp-server/src/tools/media.tools.js';
import { registerSourceTools } from '../../../apps/mcp-server/src/tools/source.tools.js';
import { registerTaxonomyTools } from '../../../apps/mcp-server/src/tools/taxonomy.tools.js';
import { registerJobTools } from '../../../apps/mcp-server/src/tools/job.tools.js';
import { registerResources } from '../../../apps/mcp-server/src/resources/index.js';
import { registerPrompts } from '../../../apps/mcp-server/src/prompts/index.js';
import { createMcpApp, mcpPrincipalStore } from '../../../apps/mcp-server/src/server.js';
import http from 'http';

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
    const toolNames = toolsResult.tools.map((t) => t.name);

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
    const promptNames = promptsResult.prompts.map((p) => p.name);
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
    const { storyId } = JSON.parse((createCall.content as any)[0].text);

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
    expect((hCall.content as any)[0].text).toContain('heading');

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
    expect((chartCall.content as any)[0].text).toContain('chart');

    // 4. Call add_timeline_block
    const tlCall = await client.callTool({
      name: 'add_timeline_block',
      arguments: {
        storyId,
        title: 'Mission Flight Path Milestones',
        items: [
          { date: '2026-04-12', headline: 'Orbital Insertion', body: 'Enters 100km polar orbit' },
          { date: '2026-09-20', headline: 'Plume Flythrough', body: 'Ion trap captures vapor samples' },
        ],
      },
    });
    expect((tlCall.content as any)[0].text).toContain('timeline');

    // 5. Verify story has the appended blocks
    const getStory = await client.callTool({
      name: 'get_story',
      arguments: { storyId },
    });
    const story = JSON.parse((getStory.content as any)[0].text);
    expect(story.blocks.length).toBe(3);
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
    const { mediaId } = JSON.parse((uploadCall.content as any)[0].text);
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
    expect((variantCall.content as any)[0].text).toContain('Media variant registered');

    const getMediaCall = await client.callTool({
      name: 'get_media',
      arguments: { mediaId },
    });
    const media = JSON.parse((getMediaCall.content as any)[0].text);
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
    const { sourceId } = JSON.parse((srcCall.content as any)[0].text);

    const updateSrc = await client.callTool({
      name: 'update_source',
      arguments: {
        sourceId,
        author: 'Dr. Elena Rostova',
        permissibleExcerpt: 'Vapor composition reveals organic signatures consistent with hydrothermal activity.',
      },
    });
    expect((updateSrc.content as any)[0].text).toContain('Source updated successfully');

    // 3. Create topic, update topic, and link
    const topicCall = await client.callTool({
      name: 'create_topic',
      arguments: { name: 'Astrobiology', description: 'Search for life beyond Earth' },
    });
    const { topic } = JSON.parse((topicCall.content as any)[0].text);

    const updateTopic = await client.callTool({
      name: 'update_topic',
      arguments: { topicId: topic.id, aliases: ['Exobiology', 'Planetary Habitability'] },
    });
    expect((updateTopic.content as any)[0].text).toContain('Topic updated');

    // 4. Cancel job and list jobs
    const jobCall = await client.callTool({
      name: 'create_job',
      arguments: { jobType: 'media_transcode', payload: { mediaId } },
    });
    const { jobId } = JSON.parse((jobCall.content as any)[0].text);

    const cancelCall = await client.callTool({
      name: 'cancel_job',
      arguments: { jobId, reason: 'Superceded by raw upload' },
    });
    expect((cancelCall.content as any)[0].text).toContain('cancelled');

    const listJobs = await client.callTool({
      name: 'list_jobs',
      arguments: { limit: 10 },
    });
    const jobsResult = JSON.parse((listJobs.content as any)[0].text);
    expect(jobsResult.jobs.length).toBeGreaterThanOrEqual(1);
  });

  it('guarantees concurrency safety across simultaneous requests with AsyncLocalStorage', async () => {
    const principalA: AuthenticatedPrincipal = {
      id: 'usr_agent_alpha',
      organizationId: 'org_alpha',
      clientType: 'chatgpt',
      scopes: ['news:read', 'news:write'],
    };

    const principalB: AuthenticatedPrincipal = {
      id: 'usr_agent_beta',
      organizationId: 'org_beta',
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
    const address = testHttpServer.address() as any;
    const port = address.port;

    const res = await new Promise<{ statusCode: number; data: string }>((resolve, reject) => {
      http.get(`http://localhost:${port}/.well-known/oauth-protected-resource`, (res) => {
        let data = '';
        res.on('data', (c) => (data += c));
        res.on('end', () => resolve({ statusCode: res.statusCode || 200, data }));
      }).on('error', reject);
    });

    expect(res.statusCode).toBe(200);
    const meta = JSON.parse(res.data);
    expect(meta.scopes_supported).toContain('news:read');
    expect(meta.scopes_supported).toContain('news:publish');

    await new Promise<void>((resolve) => testHttpServer.close(() => resolve()));
  });
});
