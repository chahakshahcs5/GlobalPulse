import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { DatabaseService } from '@ai-news/database';
import type { AuthenticatedPrincipal } from '@ai-news/auth';
import { registerIntelligenceTools } from '../../../apps/mcp-server/src/tools/intelligence.tools.js';
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

describe('MCP Intelligence Tools (claims, evidence, graph, alerts, ingestion)', () => {
  let db: DatabaseService;
  let server: McpServer;
  let client: Client;
  let clientTransport: InMemoryTransport;
  let serverTransport: InMemoryTransport;
  let activePrincipal: AuthenticatedPrincipal;
  let storyId: string;

  beforeAll(async () => {
    db = new DatabaseService();
    activePrincipal = {
      id: 'usr_mcp_intel',
      organizationId: 'org_mcp_intel',
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
      ],
    };

    const stories = new StoryService(db);
    const story = await stories.createStory(
      {
        title: 'MCP intelligence story',
        summary: 'Story used to exercise the MCP intelligence tools.',
        articleType: 'breaking_news',
      },
      {
        organizationId: activePrincipal.organizationId,
        authorId: activePrincipal.id,
        clientType: activePrincipal.clientType,
        createdVia: 'mcp',
      }
    );
    storyId = story.id;

    server = new McpServer({ name: 'mcp-intelligence-test', version: '1.0.0' });
    const getPrincipal = () => activePrincipal;
    registerIntelligenceTools(server, db, getPrincipal);

    [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
    client = new Client(
      { name: 'intelligence-test-client', version: '1.0.0' },
      { capabilities: {} }
    );
    await server.connect(serverTransport);
    await client.connect(clientTransport);
  });

  afterAll(async () => {
    await client.close();
    await server.close();
  });

  it('registers the intelligence tool surface', async () => {
    const toolsResult = await client.listTools();
    const toolNames = toolsResult.tools.map((t: { name: string }) => t.name);

    expect(toolNames).toContain('get_story_intelligence');
    expect(toolNames).toContain('get_story_what_changed');
    expect(toolNames).toContain('list_story_claims');
    expect(toolNames).toContain('create_story_claim');
    expect(toolNames).toContain('update_claim_status');
    expect(toolNames).toContain('add_claim_evidence');
    expect(toolNames).toContain('get_story_timeline');
    expect(toolNames).toContain('add_timeline_event');
    expect(toolNames).toContain('list_editorial_perspectives');
    expect(toolNames).toContain('add_editorial_perspective');
    expect(toolNames).toContain('add_knowledge_edge');
    expect(toolNames).toContain('query_knowledge_graph');
    expect(toolNames).toContain('get_graph_neighborhood');
    expect(toolNames).toContain('create_alert_rule');
    expect(toolNames).toContain('list_alert_rules');
    expect(toolNames).toContain('evaluate_alerts');
    expect(toolNames).toContain('create_ingestion_feed');
    expect(toolNames).toContain('ingest_feed');
    expect(toolNames).toContain('promote_ingestion_item');
    expect(toolNames).toContain('detect_breaking_news');
    expect(toolNames).toContain('get_publisher_intelligence');
    expect(toolNames).toContain('record_source_correction');
    expect(toolNames).toContain('get_block_catalog');
  });

  it('creates a claim through MCP and reads it back in the intelligence payload', async () => {
    const created = parseJson<{ id: string; status: string }>(
      await client.callTool({
        name: 'create_story_claim',
        arguments: {
          storyId,
          text: 'The committee voted 7-2 to hold rates.',
        },
      })
    );

    expect(created.id).toMatch(/^clm_/);
    expect(created.status).toBe('UNVERIFIED');

    const intelligence = parseJson<{ claims: unknown[]; metrics: { claimCount: number } }>(
      await client.callTool({
        name: 'get_story_intelligence',
        arguments: { storyId },
      })
    );

    expect(intelligence.claims).toHaveLength(1);
    expect(intelligence.metrics.claimCount).toBe(1);
  });

  it('enforces the evidence requirement through MCP', async () => {
    const result = await client.callTool({
      name: 'create_story_claim',
      arguments: {
        storyId,
        text: 'Rates were cut immediately.',
        status: 'SUPPORTED',
      },
    });

    const text = getText(result);
    expect(text).toContain('Failed to create claim');
    expect(text.toLowerCase()).toContain('source');
  });

  it('attaches evidence and a timeline event', async () => {
    const claims = parseJson<Array<{ id: string }>>(
      await client.callTool({ name: 'list_story_claims', arguments: { storyId } })
    );
    const claimId = claims[0].id;

    const evidence = parseJson<{ id: string; stance: string }>(
      await client.callTool({
        name: 'add_claim_evidence',
        arguments: {
          storyId,
          claimId,
          type: 'DOCUMENT',
          title: 'Committee statement',
          stance: 'SUPPORTS',
        },
      })
    );
    expect(evidence.id).toMatch(/^evd_/);
    expect(evidence.stance).toBe('SUPPORTS');

    await client.callTool({
      name: 'add_timeline_event',
      arguments: {
        storyId,
        title: 'Statement published',
        description: 'The committee published its decision.',
        eventType: 'OFFICIAL_STATEMENT',
      },
    });

    const timeline = parseJson<unknown[]>(
      await client.callTool({ name: 'get_story_timeline', arguments: { storyId } })
    );
    expect(timeline).toHaveLength(1);
  });

  it('builds and queries the knowledge graph through MCP', async () => {
    await client.callTool({
      name: 'add_knowledge_edge',
      arguments: {
        fromType: 'STORY',
        fromId: storyId,
        relation: 'mentions',
        toType: 'ENTITY',
        toId: 'ent_mcp',
      },
    });

    const traversal = parseJson<{ nodes: unknown[]; edges: unknown[] }>(
      await client.callTool({
        name: 'get_graph_neighborhood',
        arguments: { nodeType: 'STORY', nodeId: storyId, depth: 1 },
      })
    );
    expect(traversal.edges.length).toBeGreaterThanOrEqual(1);
  });

  it('creates an alert rule and evaluates it against a story', async () => {
    await client.callTool({
      name: 'create_alert_rule',
      arguments: {
        name: 'MCP keyword rule',
        conditions: { keywords: ['intelligence'] },
        cooldownMinutes: 0,
      },
    });

    const rules = parseJson<unknown[]>(
      await client.callTool({ name: 'list_alert_rules', arguments: {} })
    );
    expect(rules.length).toBeGreaterThanOrEqual(1);

    const evaluation = parseJson<{ triggers: unknown[]; evaluatedRules: number }>(
      await client.callTool({
        name: 'evaluate_alerts',
        arguments: { resourceType: 'STORY', resourceId: storyId },
      })
    );
    expect(evaluation.evaluatedRules).toBeGreaterThanOrEqual(1);
    expect(evaluation.triggers).toHaveLength(1);
  });

  it('rejects unsafe ingestion feed URLs through MCP', async () => {
    const result = await client.callTool({
      name: 'create_ingestion_feed',
      arguments: { name: 'Loopback', url: 'http://127.0.0.1:9000/feed.xml' },
    });

    expect(getText(result)).toContain('Failed to create ingestion feed');
  });

  it('serves the block catalog for authoring agents', async () => {
    const catalog = parseJson<{ count: number; blocks: Array<{ type: string }> }>(
      await client.callTool({ name: 'get_block_catalog', arguments: {} })
    );

    expect(catalog.count).toBeGreaterThanOrEqual(41);
    expect(catalog.blocks.map((block) => block.type)).toContain('evidence');
  });

  it('serves the evidence chain and the event map', async () => {
    const source = await db.sources.create({
      id: 'src_mcp_chain',
      organizationId: activePrincipal.organizationId,
      url: 'https://example.org/chain',
      title: 'Chain source',
      publisher: 'Publisher',
      retrievedAt: new Date().toISOString(),
      language: 'en',
      sourceType: 'NEWS_ARTICLE',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const claim = parseJson<{ id: string }>(
      await client.callTool({
        name: 'create_story_claim',
        arguments: {
          storyId,
          text: 'A chained claim.',
          sourceIds: [source.id],
        },
      })
    );

    const chainRaw = await client.callTool({
      name: 'get_claim_evidence',
      arguments: { claimId: claim.id },
    });
    expect(getText(chainRaw)).not.toContain('Failed to');

    const chain = parseJson<{ claim: { id: string }; evidence: unknown[] }>(
      await client.callTool({
        name: 'get_claim_evidence',
        arguments: { claimId: claim.id },
      })
    );
    expect(chain.claim.id).toBe(claim.id);

    const sourceClaims = parseJson<{ count: number }>(
      await client.callTool({
        name: 'get_source_claims',
        arguments: { sourceId: source.id },
      })
    );
    expect(sourceClaims.count).toBe(1);

    const map = parseJson<{ count: number; points: Array<{ id: string }> }>(
      await client.callTool({
        name: 'get_event_map',
        arguments: { categories: ['markets'] },
      })
    );
    expect(map.count).toBeGreaterThanOrEqual(0);
    expect(Array.isArray(map.points)).toBe(true);
  });
});
