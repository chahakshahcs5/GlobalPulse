import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { FastifyInstance } from 'fastify';
import { db } from '@ai-news/database';
import { AuthService, type AuthenticatedPrincipal } from '@ai-news/auth';
import { StoryIntelligenceService } from '@ai-news/stories';
import { registerSearchTools } from '../../apps/mcp-server/src/tools/search.tools';
import { registerStoryTools } from '../../apps/mcp-server/src/tools/story.tools';
import { registerBlockTools } from '../../apps/mcp-server/src/tools/block.tools';
import { registerSourceTools } from '../../apps/mcp-server/src/tools/source.tools';
import { registerTaxonomyTools } from '../../apps/mcp-server/src/tools/taxonomy.tools';
import { registerIntelligenceTools } from '../../apps/mcp-server/src/tools/intelligence.tools';
import { buildServer } from '../../apps/api/src/server';
import { OfflineStorageService } from '../../apps/mobile/src/services/storage';

/**
 * Definition of success (§61): an external AI agent researches and assembles
 * an explainer, a human editor reviews, corrects, approves and publishes it.
 *
 * The agent and the editor talk to the *same* MCP server and the *same*
 * database, and the published result is verified through the REST API and the
 * mobile offline cache — one structured story, four surfaces.
 */

const ORG = 'org_e2e_quake';

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

describe('E2E: AI agent earthquake explainer → human review → publish', () => {
  let server: McpServer;
  let client: Client;
  let clientTransport: InMemoryTransport;
  let serverTransport: InMemoryTransport;
  let api: FastifyInstance;

  /** The acting principal: the AI agent first, then the human editor. */
  let principal: AuthenticatedPrincipal;

  const agent: AuthenticatedPrincipal = {
    id: 'usr_e2e_agent',
    organizationId: ORG,
    role: 'ai_agent',
    clientType: 'claude',
    scopes: ['news:read', 'news:search', 'news:write', 'news:sources', 'news:topics'],
  };

  const editor: AuthenticatedPrincipal = {
    id: 'usr_e2e_editor',
    organizationId: ORG,
    role: 'editor',
    clientType: 'human_web',
    scopes: ['news:read', 'news:write', 'news:publish', 'news:sources', 'news:topics'],
  };

  let storyId = '';
  let eventId = '';
  let sourceId = '';
  let claimId = '';

  beforeAll(async () => {
    server = new McpServer({ name: 'globalpulse-e2e', version: '1.0.0' });
    const getPrincipal = () => principal;

    registerSearchTools(server, db, getPrincipal);
    registerStoryTools(server, db, getPrincipal);
    registerBlockTools(server, db, getPrincipal);
    registerSourceTools(server, db, getPrincipal);
    registerTaxonomyTools(server, db, getPrincipal);
    registerIntelligenceTools(server, db, getPrincipal);

    [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
    client = new Client({ name: 'e2e-agent', version: '1.0.0' }, { capabilities: {} });
    await server.connect(serverTransport);
    await client.connect(clientTransport);

    api = buildServer();
    await api.ready();

    principal = agent;
  });

  afterAll(async () => {
    await client.close();
    await server.close();
    await api.close();
  });

  it('AI agent: creates the event, the source, and the draft story', async () => {
    // 1. The agent registers the real-world event it will explain.
    const eventResult = parseJson<{ event: { id: string } }>(
      await client.callTool({
        name: 'create_event',
        arguments: {
          title: 'Magnitude 6.4 earthquake off the Northern Coast',
          summary: 'A strong shallow quake struck the coastline at 04:12 local time.',
          location: 'Northern Coast',
          coordinates: [139.7, 35.6],
        },
      })
    );
    eventId = eventResult.event.id;
    expect(eventId).toBeTruthy();

    // 2. The agent registers the authoritative source it will cite.
    const sourceResult = parseJson<{ sourceId: string }>(
      await client.callTool({
        name: 'create_source',
        arguments: {
          url: 'https://seismic.example.org/bulletin/2026-10-20',
          title: 'Seismic bulletin 2026-10-20',
          publisher: 'National Seismic Observatory',
          domain: 'seismic.example.org',
          sourceType: 'OFFICIAL_DOCUMENT',
        },
      })
    );
    sourceId = sourceResult.sourceId;
    expect(sourceId).toBeTruthy();

    // 3. The agent drafts the explainer.
    const storyResult = parseJson<{ storyId: string; message: string }>(
      await client.callTool({
        name: 'create_story',
        arguments: {
          title: 'Explainer: what the Northern Coast earthquake means',
          summary: 'A magnitude 6.4 quake struck the coast. Here is what is known.',
          articleType: 'explainer',
          eventId,
          sourceIds: [sourceId],
        },
      })
    );
    storyId = storyResult.storyId;
    expect(storyId).toBeTruthy();
  });

  it('AI agent: assembles summary, KPI, map, timeline and chart blocks', async () => {
    await client.callTool({
      name: 'add_summary_block',
      arguments: {
        storyId,
        headline: 'What we know so far',
        bulletPoints: [
          'Magnitude 6.4, depth 10 km.',
          'No tsunami warning issued.',
          'Shelter opened in three coastal towns.',
        ],
        sentiment: 'cautious',
      },
    });

    await client.callTool({
      name: 'add_statistic_block',
      arguments: {
        storyId,
        value: '6.4',
        label: 'Magnitude (Mw)',
        trend: 'down',
        trendValue: '1.1 vs. 2019',
        context: 'Recorded by the National Seismic Observatory',
      },
    });

    await client.callTool({
      name: 'add_map_block',
      arguments: {
        storyId,
        center: [139.7, 35.6],
        zoom: 6,
        style: 'light',
        markers: [{ coordinates: [139.7, 35.6], title: 'Epicentre', description: 'Offshore' }],
      },
    });

    await client.callTool({
      name: 'add_timeline_block',
      arguments: {
        storyId,
        title: 'How it unfolded',
        items: [
          {
            date: '2026-10-20T04:12:00.000Z',
            headline: 'Quake strikes the coast',
            body: 'Shaking lasted 40 seconds.',
            sourceIds: [sourceId],
          },
        ],
      },
    });

    await client.callTool({
      name: 'add_chart_block',
      arguments: {
        storyId,
        chartType: 'bar',
        title: 'Seismic energy released by depth band',
        xAxis: { key: 'depth', label: 'Depth band', type: 'category' },
        yAxis: { label: 'Relative energy', unit: '%' },
        series: [{ name: 'Energy', key: 'energy' }],
        values: [
          { depth: '0–20 km', energy: 82 },
          { depth: '20–50 km', energy: 14 },
          { depth: '50+ km', energy: 4 },
        ],
        sourceAttribution: 'National Seismic Observatory',
      },
    });

    const story = parseJson<{ blocks: Array<{ blockType: string }> }>(
      await client.callTool({ name: 'get_story', arguments: { storyId } })
    );
    const types = story.blocks.map((block) => block.blockType);

    expect(types).toContain('summary');
    expect(types).toContain('statistic');
    expect(types).toContain('map');
    expect(types).toContain('timeline');
    expect(types).toContain('chart');
  });

  it('AI agent: records a claim and attaches evidence for it', async () => {
    const claim = parseJson<{ id: string; status: string }>(
      await client.callTool({
        name: 'create_story_claim',
        arguments: {
          storyId,
          text: 'The earthquake had a magnitude of 6.4.',
          status: 'UNVERIFIED',
        },
      })
    );
    claimId = claim.id;
    expect(claim.status).toBe('UNVERIFIED');

    const evidence = parseJson<{ id: string; stance: string }>(
      await client.callTool({
        name: 'add_claim_evidence',
        arguments: {
          storyId,
          claimId,
          type: 'DOCUMENT',
          title: 'Seismic bulletin 2026-10-20',
          stance: 'SUPPORTS',
          url: 'https://seismic.example.org/bulletin/2026-10-20',
        },
      })
    );
    expect(evidence.stance).toBe('SUPPORTS');

    // With evidence attached, the claim can be verified.
    const updated = parseJson<{ status: string; confidence: number }>(
      await client.callTool({
        name: 'update_claim_status',
        arguments: {
          storyId,
          claimId,
          status: 'SUPPORTED',
          confidence: 0.9,
          confidenceMethodology: 'Official observatory bulletin',
        },
      })
    );
    expect(updated.status).toBe('SUPPORTED');
    expect(updated.confidence).toBe(0.9);
  });

  it('AI agent: cannot mark a claim supported without evidence', async () => {
    const claim = parseJson<{ id: string }>(
      await client.callTool({
        name: 'create_story_claim',
        arguments: {
          storyId,
          text: 'The harbour sustained damage worth 4.2 million.',
        },
      })
    );

    const result = await client.callTool({
      name: 'update_claim_status',
      arguments: { storyId, claimId: claim.id, status: 'SUPPORTED' },
    });

    const message = getText(result);
    expect(message).toContain('Failed to update claim status');
    expect(message.toLowerCase()).toContain('source');
  });

  it('AI agent: adds the timeline development and the citation, then submits for review', async () => {
    await client.callTool({
      name: 'add_timeline_event',
      arguments: {
        storyId,
        title: 'Aftershock recorded',
        description: 'A magnitude 4.1 aftershock was recorded 20 minutes later.',
        eventType: 'DEVELOPMENT',
        occurredAt: '2026-10-20T04:32:00.000Z',
      },
    });

    await client.callTool({
      name: 'add_citation_block',
      arguments: {
        storyId,
        claim: 'The earthquake had a magnitude of 6.4.',
        sourceIds: [sourceId],
        quoteExcerpt: 'A magnitude 6.4 earthquake occurred at 04:12 local time.',
      },
    });

    const submitted = parseJson<{ status: string }>(
      await client.callTool({ name: 'submit_for_review', arguments: { storyId } })
    );
    expect(submitted.status).toBe('IN_REVIEW');
  });

  it('AI agent: cannot publish — publication requires a human with publish scope', async () => {
    const result = await client.callTool({
      name: 'publish_story',
      arguments: { storyId },
    });

    const message = getText(result);
    expect(message).toMatch(/scope|forbidden|privilege/i);

    const story = await db.stories.findById(storyId, ORG);
    expect(story?.status).toBe('IN_REVIEW');
  });

  it('Human editor: reviews the queue, rejects with feedback, then corrects the story', async () => {
    principal = editor;

    const queue = parseJson<{ queueLength: number; stories: Array<{ id: string }> }>(
      await client.callTool({ name: 'list_review_queue', arguments: {} })
    );
    expect(queue.queueLength).toBeGreaterThanOrEqual(1);
    expect(queue.stories.map((story) => story.id)).toContain(storyId);

    const rejected = parseJson<{ status: string; feedback: string }>(
      await client.callTool({
        name: 'review_story',
        arguments: {
          storyId,
          action: 'reject',
          feedback: 'Please attribute the harbour damage figure or drop the claim.',
        },
      })
    );
    expect(rejected.status).toBe('DRAFT');
    expect(rejected.feedback).toContain('harbour damage figure');

    // The editor records the correction on the unsupported claim.
    const claims = parseJson<Array<{ id: string; text: string }>>(
      await client.callTool({ name: 'list_story_claims', arguments: { storyId } })
    );
    const unverified = claims.find((claim) => claim.text.includes('harbour sustained damage'));
    expect(unverified).toBeDefined();

    const corrected = parseJson<{ status: string; reviewNotes: string }>(
      await client.callTool({
        name: 'update_claim_status',
        arguments: {
          storyId,
          claimId: unverified!.id,
          status: 'UNSUPPORTED',
          reviewNotes: 'No source could be found for the harbour damage figure.',
        },
      })
    );
    expect(corrected.status).toBe('UNSUPPORTED');
    expect(corrected.reviewNotes).toContain('No source could be found');
  });

  it('Human editor: approves and publishes the story', async () => {
    await client.callTool({ name: 'submit_for_review', arguments: { storyId } });

    const approved = parseJson<{ status: string }>(
      await client.callTool({
        name: 'review_story',
        arguments: { storyId, action: 'approve', feedback: 'Verified. Ready to publish.' },
      })
    );
    expect(approved.status).toBe('PUBLISHED');

    const story = await db.stories.findById(storyId, ORG);
    expect(story?.status).toBe('PUBLISHED');
    expect(story?.publishedAt).toBeTruthy();
  });

  it('the same structured data is served by the REST API', async () => {
    const token = AuthService.generateToken({
      id: editor.id,
      organizationId: ORG,
      role: 'editor',
      clientType: 'human_web',
      scopes: ['news:read', 'news:write', 'news:publish'],
    });

    const res = await api.inject({
      method: 'GET',
      url: `/api/stories/${storyId}/intelligence`,
      headers: { authorization: `Bearer ${token}` },
    });

    expect(res.statusCode).toBe(200);
    const payload = JSON.parse(res.body);

    expect(payload.storyId).toBe(storyId);
    expect(payload.claims).toHaveLength(2);
    expect(
      payload.claims.find((claim: { status: string }) => claim.status === 'SUPPORTED')
    ).toBeDefined();
    expect(
      payload.claims.find((claim: { status: string }) => claim.status === 'UNSUPPORTED')
    ).toBeDefined();
    expect(payload.evidence.length).toBeGreaterThanOrEqual(1);
    expect(payload.timeline.length).toBeGreaterThanOrEqual(1);
    expect(payload.metrics.claimCount).toBe(2);
    expect(payload.metrics.evidenceCount).toBeGreaterThanOrEqual(1);
  });

  it('the published story is available to the mobile offline cache', async () => {
    const story = await db.stories.findById(storyId, ORG);
    expect(story).not.toBeNull();

    const storage = new OfflineStorageService();
    storage.saveStory({
      id: story!.id,
      slug: story!.slug,
      title: story!.title,
      summary: story!.summary,
      articleType: story!.articleType,
      currentVersionNumber: story!.currentVersionNumber,
      blocks: story!.blocks,
      savedAt: new Date().toISOString(),
      readStatus: false,
    });

    const cached = storage.getStory(storyId);
    expect(cached).toBeDefined();
    expect(cached?.title).toContain('Northern Coast earthquake');
    expect(cached?.blocks.length).toBeGreaterThanOrEqual(5);
  });

  it('every AI agent action is attributed in the audit trail', async () => {
    const entries = await db.audit.query(ORG, { limit: 200 });
    const agentActions = entries.filter((entry) => entry.userId === agent.id);
    const editorActions = entries.filter((entry) => entry.userId === editor.id);

    expect(agentActions.length).toBeGreaterThan(0);
    expect(editorActions.length).toBeGreaterThan(0);
    expect(agentActions.some((entry) => entry.action.includes('create_story'))).toBe(true);
    expect(editorActions.some((entry) => entry.action.includes('approve_story'))).toBe(true);

    // The agent's actions are tagged with its client type, so an operator can
    // always tell AI activity apart from human activity.
    expect(agentActions.every((entry) => entry.clientType === 'claude')).toBe(true);
  });

  it('the intelligence service and the API agree on the final claim states', async () => {
    const intelligence = new StoryIntelligenceService(db);
    const snapshot = await intelligence.getStoryIntelligence(storyId, ORG);

    expect(snapshot.claims.map((claim) => claim.status).sort()).toEqual([
      'SUPPORTED',
      'UNSUPPORTED',
    ]);
    const supported = snapshot.claims.find((claim) => claim.status === 'SUPPORTED');
    expect(supported?.evidence.length).toBeGreaterThanOrEqual(1);
    expect(supported?.confidenceMethodology).toBe('Official observatory bulletin');
  });
});
