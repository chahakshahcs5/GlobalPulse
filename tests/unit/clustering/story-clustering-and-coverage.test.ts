import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { FastifyInstance } from 'fastify';
import { buildServer } from '../../../apps/api/src/server';
import { db } from '@ai-news/database';
import { AuthService } from '@ai-news/auth';
import { ClusteringService } from '@ai-news/stories';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerClusteringTools } from '../../../apps/mcp-server/src/tools/clustering.tools';

describe('Story Clustering & Full Coverage (F4)', () => {
  let app: FastifyInstance;
  const testOrgId = 'org_default';

  let editorToken: string;
  let readerToken: string;

  beforeEach(async () => {
    db.clear();
    app = buildServer({ logger: false });
    await app.ready();

    editorToken = AuthService.generateToken({
      id: 'usr_editor_bob',
      organizationId: testOrgId,
      role: 'editor',
      clientType: 'human_web',
      scopes: ['news:read', 'news:write', 'news:publish'],
    });

    readerToken = AuthService.generateToken({
      id: 'usr_reader_alice',
      organizationId: testOrgId,
      role: 'reader',
      clientType: 'human_web',
      scopes: ['news:read'],
    });

    const now = new Date().toISOString();
    const oneHourAgo = new Date(Date.now() - 3600 * 1000).toISOString();
    const twoHoursAgo = new Date(Date.now() - 7200 * 1000).toISOString();

    // Seed 3 related stories covering the same global space exploration event
    await db.stories.create({
      id: 'sty_lead_artemis',
      organizationId: testOrgId,
      slug: 'artemis-3-crewed-lunar-landing-confirmed',
      title: 'NASA Confirms Crewed Lunar Landing Schedule for Artemis III',
      summary: 'Space agency finalizes astronaut landing target near the Moon South Pole.',
      status: 'PUBLISHED',
      articleType: 'science',
      authorId: 'usr_sarah_chen',
      createdByClient: 'gemini',
      createdVia: 'mcp',
      currentVersionNumber: 1,
      topicIds: ['space-exploration', 'lunar-mission'],
      entityIds: ['ent_nasa', 'ent_artemis'],
      sourceIds: [],
      blocks: [],
      publishedAt: now,
      createdAt: now,
      updatedAt: now,
      wordCount: 450,
      readingTimeMinutes: 3,
    });

    await db.stories.create({
      id: 'sty_related_esa',
      organizationId: testOrgId,
      slug: 'esa-provides-service-module-artemis',
      title: 'European Space Agency Delivers Orion Service Module for Artemis',
      summary: 'ESA engineering teams complete critical propulsion payload handover in Bremen.',
      status: 'PUBLISHED',
      articleType: 'technology',
      authorId: 'usr_editor_bob',
      createdByClient: 'claude',
      createdVia: 'api',
      currentVersionNumber: 1,
      topicIds: ['space-exploration', 'aerospace'],
      entityIds: ['ent_esa', 'ent_artemis'],
      sourceIds: [],
      blocks: [],
      publishedAt: oneHourAgo,
      createdAt: oneHourAgo,
      updatedAt: oneHourAgo,
      wordCount: 380,
      readingTimeMinutes: 2,
    });

    await db.stories.create({
      id: 'sty_related_budget',
      organizationId: testOrgId,
      slug: 'congress-allocates-deep-space-budget',
      title: 'Congressional Committee Approves Deep Space Artemis Funding',
      summary: 'Lawmakers approve bipartisan budget appropriation for lunar infrastructure.',
      status: 'PUBLISHED',
      articleType: 'politics',
      authorId: 'usr_staff_writer',
      createdByClient: 'human_web',
      createdVia: 'admin',
      currentVersionNumber: 1,
      topicIds: ['space-exploration', 'fiscal-policy'],
      entityIds: ['ent_congress', 'ent_artemis'],
      sourceIds: [],
      blocks: [],
      publishedAt: twoHoursAgo,
      createdAt: twoHoursAgo,
      updatedAt: twoHoursAgo,
      wordCount: 500,
      readingTimeMinutes: 3,
    });

    // Unrelated story
    await db.stories.create({
      id: 'sty_unrelated_sports',
      organizationId: testOrgId,
      slug: 'wimbledon-finals-set',
      title: 'Wimbledon Men Championship Final Lineup Confirmed',
      summary: 'Top seeds advance to Centre Court showdown.',
      status: 'PUBLISHED',
      articleType: 'sports',
      authorId: 'usr_staff_writer',
      createdByClient: 'human_web',
      createdVia: 'admin',
      currentVersionNumber: 1,
      topicIds: ['tennis'],
      entityIds: ['ent_wimbledon'],
      sourceIds: [],
      blocks: [],
      publishedAt: now,
      createdAt: now,
      updatedAt: now,
      wordCount: 300,
      readingTimeMinutes: 2,
    });
  });

  afterEach(async () => {
    await app.close();
    db.clear();
  });

  describe('F4: ClusteringService Core Logic', () => {
    it('automatically builds cluster with multi-source perspectives and chronological timeline', async () => {
      const clusteringService = new ClusteringService(db);
      const coverage = await clusteringService.getFullCoverage('sty_lead_artemis', testOrgId);

      expect(coverage).toBeDefined();
      expect(coverage.storyId).toBe('sty_lead_artemis');
      expect(coverage.clusterId).toBeDefined();
      expect(coverage.title).toContain('Artemis III');

      // Should find both related stories (ESA and Congress) sharing Artemis entity and Space Exploration topic
      expect(coverage.relatedStories.length).toBe(2);
      expect(coverage.relatedStories.map((s) => s.id)).toContain('sty_related_esa');
      expect(coverage.relatedStories.map((s) => s.id)).toContain('sty_related_budget');
      expect(coverage.relatedStories.map((s) => s.id)).not.toContain('sty_unrelated_sports');

      // Perspectives should cover lead + related stories
      expect(coverage.perspectives.length).toBe(3);
      expect(coverage.perspectives[0].storyId).toBe('sty_lead_artemis');
      expect(coverage.perspectives[0].publisher).toBe('Gemini Wire');

      // Timeline must be chronologically ordered (oldest to newest)
      expect(coverage.timeline.length).toBe(3);
      const times = coverage.timeline.map((t) => new Date(t.date).getTime());
      expect(times[0]).toBeLessThanOrEqual(times[1]);
      expect(times[1]).toBeLessThanOrEqual(times[2]);
    });

    it('persists cluster and reuses existing cluster on subsequent calls', async () => {
      const clusteringService = new ClusteringService(db);
      const first = await clusteringService.getFullCoverage('sty_lead_artemis', testOrgId);
      const second = await clusteringService.getFullCoverage('sty_lead_artemis', testOrgId);

      expect(first.clusterId).toBe(second.clusterId);

      const allClusters = await clusteringService.listClusters(testOrgId);
      expect(allClusters.length).toBeGreaterThanOrEqual(1);
      expect(allClusters[0].id).toBe(first.clusterId);
    });
  });

  describe('F4: REST API Endpoints', () => {
    it('returns full coverage via GET /api/stories/:id/full-coverage', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/stories/sty_lead_artemis/full-coverage',
        headers: { authorization: `Bearer ${readerToken}` },
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.storyId).toBe('sty_lead_artemis');
      expect(body.perspectives.length).toBe(3);
      expect(body.timeline.length).toBe(3);
    });

    it('supports listing clusters via GET /api/clusters', async () => {
      // Trigger cluster creation
      const clusteringService = new ClusteringService(db);
      await clusteringService.getFullCoverage('sty_lead_artemis', testOrgId);

      const res = await app.inject({
        method: 'GET',
        url: '/api/clusters?limit=10',
        headers: { authorization: `Bearer ${readerToken}` },
      });

      expect(res.statusCode).toBe(200);
      const clusters = JSON.parse(res.body);
      expect(Array.isArray(clusters)).toBe(true);
      expect(clusters.length).toBeGreaterThanOrEqual(1);
      expect(clusters[0].leadStoryId).toBe('sty_lead_artemis');
    });

    it('allows editors to create custom cluster via POST /api/clusters', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/clusters',
        headers: { authorization: `Bearer ${editorToken}` },
        payload: {
          title: 'Custom Curated Artemis Coverage',
          leadStoryId: 'sty_lead_artemis',
          storyIds: ['sty_lead_artemis', 'sty_related_esa'],
          topic: 'space-exploration',
          category: 'science',
        },
      });

      expect(res.statusCode).toBe(201);
      const cluster = JSON.parse(res.body);
      expect(cluster.id).toBeDefined();
      expect(cluster.title).toBe('Custom Curated Artemis Coverage');
      expect(cluster.leadStoryId).toBe('sty_lead_artemis');
    });
  });

  describe('F4: MCP Tools for AI Agents', () => {
    it('executes get_full_coverage and list_story_clusters via MCP', async () => {
      const server = new McpServer({
        name: 'test-clustering-mcp',
        version: '1.0.0',
      });

      const principal = {
        id: 'usr_mcp_ai',
        organizationId: testOrgId,
        role: 'ai_agent' as const,
        clientType: 'gemini' as const,
        scopes: ['news:read', 'news:write'] as Array<'news:read' | 'news:write'>,
      };

      registerClusteringTools(server, db, () => principal);

      const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
      const client = new Client({ name: 'mcp-test-client', version: '1.0.0' }, { capabilities: {} });

      await server.connect(serverTransport);
      await client.connect(clientTransport);

      try {
        // 1. Call get_full_coverage
        const covResult = await client.callTool({
          name: 'get_full_coverage',
          arguments: { storyId: 'sty_lead_artemis' },
        });

        const covData = JSON.parse((covResult as any).content[0].text);
        expect(covData.storyId).toBe('sty_lead_artemis');
        expect(covData.perspectivesCount).toBe(3);
        expect(covData.timelineCount).toBe(3);

        // 2. Call list_story_clusters
        const listResult = await client.callTool({
          name: 'list_story_clusters',
          arguments: { limit: 5 },
        });

        const listData = JSON.parse((listResult as any).content[0].text);
        expect(listData.total).toBeGreaterThanOrEqual(1);
        expect(listData.clusters[0].leadStoryId).toBe('sty_lead_artemis');

        // 3. Call create_story_cluster
        const createResult = await client.callTool({
          name: 'create_story_cluster',
          arguments: {
            title: 'AI Synthesized Space Mega-Cluster',
            leadStoryId: 'sty_lead_artemis',
            storyIds: ['sty_related_esa', 'sty_related_budget'],
          },
        });

        const createData = JSON.parse((createResult as any).content[0].text);
        expect(createData.success).toBe(true);
        expect(createData.cluster.title).toBe('AI Synthesized Space Mega-Cluster');
      } finally {
        await client.close();
        await server.close();
      }
    });
  });
});
