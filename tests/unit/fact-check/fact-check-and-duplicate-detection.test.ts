import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { FastifyInstance } from 'fastify';
import { buildServer } from '../../../apps/api/src/server';
import { db } from '@ai-news/database';
import { AuthService } from '@ai-news/auth';
import { FactCheckService } from '@ai-news/stories';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerFactCheckTools } from '../../../apps/mcp-server/src/tools/fact-check.tools';

describe('Fact-Check Credibility Engine & Duplicate Detection (F12, F13)', () => {
  let app: FastifyInstance;
  const testOrgId = 'org_default';

  let editorToken: string;
  let readerToken: string;
  let highCredStoryId: string;
  let lowCredStoryId: string;

  beforeEach(async () => {
    db.clear();
    app = buildServer({ logger: false });
    await app.ready();

    editorToken = AuthService.generateToken({
      id: 'usr_editor_bob',
      organizationId: testOrgId,
      role: 'editor',
      clientType: 'human_web',
      scopes: ['news:read', 'news:write'],
    });

    readerToken = AuthService.generateToken({
      id: 'usr_reader_alice',
      organizationId: testOrgId,
      role: 'reader',
      clientType: 'human_web',
      scopes: ['news:read'],
    });

    const now = new Date().toISOString();

    // Story 1: High credibility (sources + quotes + verified claim)
    const story1 = await db.stories.create({
      id: 'sty_high_cred_cern',
      organizationId: testOrgId,
      slug: 'cern-quantum-entanglement-density',
      title: 'CERN Confirms Record Quantum Entanglement Density in Collisions',
      summary: 'Peer-reviewed collision metrics at the Large Hadron Collider establish new benchmarks.',
      status: 'PUBLISHED',
      articleType: 'science',
      authorId: 'usr_editor_bob',
      createdByClient: 'human_web',
      createdVia: 'admin',
      currentVersionNumber: 1,
      topicIds: ['physics', 'quantum'],
      entityIds: ['ent_cern'],
      sourceIds: ['src_nature_journal', 'src_cern_direct'],
      blocks: [
        {
          id: 'blk_q1',
          blockType: 'quote',
          sortOrder: 0,
          data: {
            quote: 'This measurement exceeds all prior quantum entanglement thresholds observed in hadron colliders.',
            attribution: 'Dr. Fabiola Gianotti',
            title: 'Director-General',
          },
        },
        {
          id: 'blk_c1',
          blockType: 'citation',
          sortOrder: 1,
          data: {
            claim: 'Nature Physics, Vol 22, pp. 104-118 (2026)',
            sourceIds: ['src_nature_journal'],
            quoteExcerpt: 'Record quantum entanglement density measured in 13 TeV hadron interactions.',
          },
        },
      ],
      publishedAt: now,
      createdAt: now,
      updatedAt: now,
      wordCount: 400,
      readingTimeMinutes: 2,
    });
    highCredStoryId = story1.id;

    // Story 2: Low credibility (no citations + repeats debunked solar cable claim)
    const story2 = await db.stories.create({
      id: 'sty_low_cred_solar',
      organizationId: testOrgId,
      slug: 'solar-storm-destroys-undersea-cables',
      title: 'Solar storms completely dismantled international undersea internet cables around the globe',
      summary: 'Unverified blog rumors claim major deep sea fiber networks have been destroyed by space weather.',
      status: 'PUBLISHED',
      articleType: 'technology',
      authorId: 'usr_anon',
      createdByClient: 'custom_mcp',
      createdVia: 'api',
      currentVersionNumber: 1,
      topicIds: ['space-weather'],
      entityIds: ['ent_solar'],
      sourceIds: [],
      blocks: [],
      publishedAt: now,
      createdAt: now,
      updatedAt: now,
      wordCount: 150,
      readingTimeMinutes: 1,
    });
    lowCredStoryId = story2.id;
  });

  afterEach(async () => {
    await app.close();
    db.clear();
  });

  describe('F12: Credibility Scoring Engine', () => {
    it('awards high credibility score to well-sourced stories with verified quotes and claims', async () => {
      const factCheckService = new FactCheckService(db);
      const assessment = await factCheckService.evaluateStoryCredibility(highCredStoryId, testOrgId);

      expect(assessment.storyId).toBe(highCredStoryId);
      expect(assessment.score).toBeGreaterThanOrEqual(75);
      expect(assessment.level).toBe('high');
      expect(assessment.factors.some((f) => f.factor.includes('Verified Sources'))).toBe(true);
      expect(assessment.factors.some((f) => f.factor.includes('Attributed Primary Quotes'))).toBe(true);
    });

    it('penalizes stories containing debunked claims and missing primary citations', async () => {
      const factCheckService = new FactCheckService(db);
      const assessment = await factCheckService.evaluateStoryCredibility(lowCredStoryId, testOrgId);

      expect(assessment.storyId).toBe(lowCredStoryId);
      expect(assessment.score).toBeLessThan(60);
      expect(assessment.level).toBe('low');
      expect(assessment.claims.length).toBeGreaterThanOrEqual(1);
      expect(assessment.claims[0].rating).toBe('FALSE');
      expect(assessment.factors.some((f) => f.impact < 0 && f.factor.includes('Debunked Claim'))).toBe(true);
    });
  });

  describe('F13: Content Duplicate & Plagiarism Detection', () => {
    it('detects near-identical plagiarism and issues reject recommendation', async () => {
      const factCheckService = new FactCheckService(db);

      // Submit identical content to Story 1
      const result = await factCheckService.checkDuplication(
        {
          title: 'CERN Confirms Record Quantum Entanglement Density in Collisions',
          content: 'Peer-reviewed collision metrics at the Large Hadron Collider establish new benchmarks for particle colliders and quantum physics.',
          threshold: 75,
        },
        testOrgId
      );

      expect(result.isDuplicate).toBe(true);
      expect(result.maxSimilarity).toBeGreaterThanOrEqual(75);
      expect(result.recommendation).toBe('reject');
      expect(result.matches.length).toBeGreaterThanOrEqual(1);
      expect(result.matches[0].storyId).toBe(highCredStoryId);
    });

    it('allows completely unique, novel story content', async () => {
      const factCheckService = new FactCheckService(db);

      const result = await factCheckService.checkDuplication(
        {
          title: 'Deep Sea Hydrothermal Vent Flora Produces Novel Antibiotic Compound',
          content: 'Marine microbiologists off the Galapagos rift uncover a completely unique peptide inhibiting antibiotic-resistant bacteria.',
          threshold: 75,
        },
        testOrgId
      );

      expect(result.isDuplicate).toBe(false);
      expect(result.maxSimilarity).toBeLessThan(35);
      expect(result.recommendation).toBe('allow');
    });
  });

  describe('REST API Endpoints: Fact-Check & Duplicate Detection', () => {
    it('lists verified fact checks via GET /api/fact-checks', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/fact-checks',
        headers: { authorization: `Bearer ${readerToken}` },
      });

      expect(res.statusCode).toBe(200);
      const checks = JSON.parse(res.body);
      expect(Array.isArray(checks)).toBe(true);
      expect(checks.length).toBeGreaterThanOrEqual(3);
      expect(checks[0].checker).toBeDefined();
    });

    it('retrieves story credibility via GET /api/stories/:id/credibility', async () => {
      const res = await app.inject({
        method: 'GET',
        url: `/api/stories/${highCredStoryId}/credibility`,
        headers: { authorization: `Bearer ${readerToken}` },
      });

      expect(res.statusCode).toBe(200);
      const assessment = JSON.parse(res.body);
      expect(assessment.storyId).toBe(highCredStoryId);
      expect(assessment.score).toBeGreaterThanOrEqual(75);
      expect(assessment.level).toBe('high');
    });

    it('checks duplication via POST /api/stories/check-duplication', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/stories/check-duplication',
        headers: { authorization: `Bearer ${editorToken}` },
        payload: {
          title: 'CERN Confirms Record Quantum Entanglement Density in Collisions',
          content: 'Peer-reviewed collision metrics at the Large Hadron Collider establish new benchmarks.',
        },
      });

      expect(res.statusCode).toBe(200);
      const check = JSON.parse(res.body);
      expect(check.isDuplicate).toBe(true);
      expect(check.recommendation).toBe('reject');
    });
  });

  describe('MCP Tools: Fact-Check & Duplicate Detection', () => {
    it('executes evaluate_story_credibility and check_content_duplication over MCP', async () => {
      const server = new McpServer({
        name: 'test-factcheck-mcp',
        version: '1.0.0',
      });

      const principal = {
        id: 'usr_ai_factchecker',
        organizationId: testOrgId,
        role: 'ai_agent' as const,
        clientType: 'gemini' as const,
        scopes: ['news:read', 'news:write'] as Array<'news:read' | 'news:write'>,
      };

      registerFactCheckTools(server, db, () => principal);

      const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
      const client = new Client({ name: 'mcp-test-client', version: '1.0.0' }, { capabilities: {} });

      await server.connect(serverTransport);
      await client.connect(clientTransport);

      try {
        // 1. evaluate_story_credibility
        const credRes = await client.callTool({
          name: 'evaluate_story_credibility',
          arguments: { storyId: highCredStoryId },
        });
        const credData = JSON.parse((credRes as any).content[0].text);
        expect(credData.score).toBeGreaterThanOrEqual(75);
        expect(credData.level).toBe('high');

        // 2. check_content_duplication
        const dupRes = await client.callTool({
          name: 'check_content_duplication',
          arguments: {
            title: 'CERN Confirms Record Quantum Entanglement Density in Collisions',
            content: 'Peer-reviewed collision metrics at the Large Hadron Collider establish new benchmarks.',
          },
        });
        const dupData = JSON.parse((dupRes as any).content[0].text);
        expect(dupData.isDuplicate).toBe(true);
        expect(dupData.recommendation).toBe('reject');

        // 3. list_fact_checks
        const fcRes = await client.callTool({
          name: 'list_fact_checks',
          arguments: {},
        });
        const fcData = JSON.parse((fcRes as any).content[0].text);
        expect(fcData.total).toBeGreaterThanOrEqual(3);
      } finally {
        await client.close();
        await server.close();
      }
    });
  });
});
