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
import { createMcpApp } from '../../../apps/mcp-server/src/server.js';
import http from 'http';

describe('Remote MCP Server & Protocol Integration Tests', () => {
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

    const getPrincipal = () => activePrincipal;

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

  it('discovers all registered MCP tools', async () => {
    const toolsResult = await client.listTools();
    const toolNames = toolsResult.tools.map((t) => t.name);

    expect(toolNames).toContain('search_stories');
    expect(toolNames).toContain('find_similar_stories');
    expect(toolNames).toContain('get_story');
    expect(toolNames).toContain('get_story_versions');
    expect(toolNames).toContain('create_story');
    expect(toolNames).toContain('update_story');
    expect(toolNames).toContain('create_story_version');
    expect(toolNames).toContain('publish_story');
    expect(toolNames).toContain('add_story_block');
    expect(toolNames).toContain('create_chart');
    expect(toolNames).toContain('create_map');
    expect(toolNames).toContain('create_timeline');
    expect(toolNames).toContain('create_source');
    expect(toolNames).toContain('attach_source');
    expect(toolNames).toContain('attach_citation');
    expect(toolNames).toContain('create_topic');
    expect(toolNames).toContain('create_event');
    expect(toolNames).toContain('create_job');
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

  it('executes full simulated AI agent workflow via MCP tools', async () => {
    // 1. External AI conducts research and first checks existing stories
    const searchCall = await client.callTool({
      name: 'search_stories',
      arguments: { query: 'BRICS 2026 Summit' },
    });
    const searchContent = JSON.parse((searchCall.content as any)[0].text);
    expect(searchContent.items.length).toBe(0); // None exists yet

    // 2. AI registers an external news source it researched
    const sourceCall = await client.callTool({
      name: 'create_source',
      arguments: {
        url: 'https://reuters.example.com/brics-summit-2026',
        title: 'BRICS Leaders Reach Trade Accord',
        publisher: 'Reuters',
        author: 'Global Bureau',
      },
    });
    const sourceContent = JSON.parse((sourceCall.content as any)[0].text);
    expect(sourceContent.sourceId).toMatch(/^src_/);
    const sourceId = sourceContent.sourceId;

    // 3. AI calls create_story with headline and summary
    const createCall = await client.callTool({
      name: 'create_story',
      arguments: {
        title: 'BRICS 2026 Summit Ratifies Landmark Trade Pact',
        summary: 'Member states finalize bilateral transaction mechanism.',
        articleType: 'breaking_news',
        sourceIds: [sourceId],
        idempotencyKey: 'spark:brics:2026-09-26',
      },
    });
    const createContent = JSON.parse((createCall.content as any)[0].text);
    expect(createContent.storyId).toMatch(/^sty_/);
    expect(createContent.status).toBe('DRAFT');
    const storyId = createContent.storyId;

    // 4. AI attaches a programmatic D3 chart block for economic volume
    const chartCall = await client.callTool({
      name: 'create_chart',
      arguments: {
        storyId,
        chartType: 'bar',
        title: 'Intra-Bloc Settlement Volume (Trillion USD)',
        xAxis: { key: 'year', label: 'Year', type: 'category' },
        yAxis: { label: 'Trillion USD' },
        series: [{ name: 'Volume', key: 'vol' }],
        values: [
          { year: '2024', vol: 0.8 },
          { year: '2025', vol: 1.2 },
          { year: '2026', vol: 2.1 },
        ],
        sourceAttribution: 'Central Bank Joint Bulletin',
      },
    });
    expect(chartCall.content).toBeDefined();

    // 5. AI attaches an interactive timeline block
    const timelineCall = await client.callTool({
      name: 'create_timeline',
      arguments: {
        storyId,
        title: 'Summit Chronology',
        items: [
          { date: '09:00 AM', headline: 'Ministerial Arrival', body: 'Delegates convene in New Delhi.' },
          { date: '14:30 PM', headline: 'Accord Signing', body: 'Trade agreement formally ratified.' },
        ],
      },
    });
    expect(timelineCall.content).toBeDefined();

    // 6. AI attaches a factual claim citation
    const citeCall = await client.callTool({
      name: 'attach_citation',
      arguments: {
        storyId,
        sourceId,
        claimText: 'Intra-bloc settlement reached 2.1 trillion USD in 2026',
        confidenceScore: 0.99,
      },
    });
    expect(citeCall.content).toBeDefined();

    // 7. AI invokes publish_story
    const publishCall = await client.callTool({
      name: 'publish_story',
      arguments: {
        storyId,
        idempotencyKey: 'pub_spark_01',
      },
    });
    const publishContent = JSON.parse((publishCall.content as any)[0].text);
    expect(publishContent.status).toBe('PUBLISHED');

    // 8. AI verifies the published story representation via get_story
    const getStoryCall = await client.callTool({
      name: 'get_story',
      arguments: { storyId },
    });
    const fullStory = JSON.parse((getStoryCall.content as any)[0].text);
    expect(fullStory.status).toBe('PUBLISHED');
    expect(fullStory.blocks.length).toBeGreaterThanOrEqual(2);
    expect(fullStory.sourceIds).toContain(sourceId);
  });

  it('guarantees idempotency on duplicate AI tool invocations', async () => {
    const key = 'spark:idemp:test-01';

    const res1 = await client.callTool({
      name: 'create_story',
      arguments: {
        title: 'Idempotency Validation Story',
        summary: 'Testing safe retry handling.',
        idempotencyKey: key,
      },
    });
    const content1 = JSON.parse((res1.content as any)[0].text);

    // Call again with same key
    const res2 = await client.callTool({
      name: 'create_story',
      arguments: {
        title: 'Idempotency Validation Story',
        summary: 'Testing safe retry handling.',
        idempotencyKey: key,
      },
    });
    const content2 = JSON.parse((res2.content as any)[0].text);

    expect(content1.storyId).toBe(content2.storyId);
  });

  it('enforces scope authorization and rejects unauthorized write attempts', async () => {
    // Switch to read-only agent identity
    activePrincipal = {
      id: 'usr_readonly_agent',
      organizationId: 'org_mcp_test',
      clientType: 'claude',
      scopes: ['news:read', 'news:search'], // Missing news:write
    };

    // Attempt to create a story without news:write scope
    const errorResult = await client.callTool({
      name: 'create_story',
      arguments: {
        title: 'Unauthorized Story Attempt',
        summary: 'Should fail due to missing scope.',
      },
    });

    expect(errorResult.isError).toBe(true);
    const errorText = (errorResult.content as any)[0].text;
    expect(errorText).toContain('Insufficient privileges. Required scope: "news:write"');

    // Reset principal
    activePrincipal.scopes.push('news:write', 'news:publish', 'news:admin');
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
