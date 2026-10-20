import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { FastifyInstance } from 'fastify';
import { buildServer } from '../../../apps/api/src/server';
import { AuthService } from '@ai-news/auth';

interface GraphQLResponse<T> {
  data?: T;
  errors?: Array<{ message: string }>;
}

describe('GraphQL Story Intelligence Integration Tests', () => {
  let app: FastifyInstance;
  let authHeaders: Record<string, string>;
  let storyId: string;

  async function gql<T>(
    query: string,
    variables?: Record<string, unknown>
  ): Promise<GraphQLResponse<T>> {
    const res = await app.inject({
      method: 'POST',
      url: '/graphql',
      headers: authHeaders,
      payload: { query, variables },
    });
    expect(res.statusCode).toBe(200);
    return JSON.parse(res.body) as GraphQLResponse<T>;
  }

  beforeAll(async () => {
    app = buildServer();
    await app.ready();

    const token = AuthService.generateToken({
      id: 'usr_editor_gql_intel',
      organizationId: 'org_default',
      role: 'editor',
      clientType: 'human_web',
      scopes: ['news:read', 'news:write', 'news:publish', 'news:media'],
    });
    authHeaders = {
      'Content-Type': 'application/json',
      authorization: `Bearer ${token}`,
    };

    const created = await gql<{ createStory: { id: string } }>(
      `mutation Create($input: CreateStoryInput!) {
        createStory(input: $input) { id title status }
      }`,
      {
        input: {
          title: 'GraphQL intelligence story',
          summary: 'Story created through GraphQL for intelligence coverage.',
          articleType: 'analysis',
        },
      }
    );
    expect(created.errors).toBeUndefined();
    storyId = created.data!.createStory.id;
  });

  afterAll(async () => {
    await app.close();
  });

  it('creates a claim and exposes it through the intelligence query', async () => {
    const claimRes = await gql<{ createClaim: { id: string; status: string } }>(
      `mutation Claim($storyId: String!, $input: CreateClaimInput!) {
        createClaim(storyId: $storyId, input: $input) { id status storyId }
      }`,
      { storyId, input: { text: 'The programme was extended by 12 months.' } }
    );

    expect(claimRes.errors).toBeUndefined();
    expect(claimRes.data!.createClaim.status).toBe('UNVERIFIED');

    const intelligence = await gql<{
      getStoryIntelligence: {
        storyId: string;
        claims: Array<{ id: string; evidence: unknown[] }>;
        metrics: { claimCount: number };
        whatChanged: { currentVersionNumber: number };
      };
    }>(
      `query Intel($storyId: String!) {
        getStoryIntelligence(storyId: $storyId) {
          storyId
          claims { id evidence { id } }
          metrics { claimCount evidenceCount }
          whatChanged { currentVersionNumber }
        }
      }`,
      { storyId }
    );

    expect(intelligence.errors).toBeUndefined();
    expect(intelligence.data!.getStoryIntelligence.storyId).toBe(storyId);
    expect(intelligence.data!.getStoryIntelligence.claims).toHaveLength(1);
    expect(intelligence.data!.getStoryIntelligence.metrics.claimCount).toBe(1);
  });

  it('rejects a supported claim without a source', async () => {
    const res = await gql<{ createClaim: { id: string } }>(
      `mutation Claim($storyId: String!, $input: CreateClaimInput!) {
        createClaim(storyId: $storyId, input: $input) { id }
      }`,
      { storyId, input: { text: 'Unsupported claim.', status: 'SUPPORTED' } }
    );

    expect(res.errors).toBeDefined();
    expect(res.errors?.[0].message.toLowerCase()).toContain('source');
  });

  it('adds evidence, a timeline event and a perspective', async () => {
    const claims = await gql<{ getStoryClaims: Array<{ id: string }> }>(
      `query Claims($storyId: String!) { getStoryClaims(storyId: $storyId) { id } }`,
      { storyId }
    );
    const claimId = claims.data!.getStoryClaims[0].id;

    const evidence = await gql<{ addEvidence: { id: string; stance: string } }>(
      `mutation Evidence($storyId: String!, $input: CreateEvidenceInput!) {
        addEvidence(storyId: $storyId, input: $input) { id stance }
      }`,
      {
        storyId,
        input: { claimId, type: 'DOCUMENT', title: 'Programme document', stance: 'SUPPORTS' },
      }
    );
    expect(evidence.errors).toBeUndefined();
    expect(evidence.data!.addEvidence.stance).toBe('SUPPORTS');

    const timeline = await gql<{ addTimelineEvent: { id: string; eventType: string } }>(
      `mutation Timeline($storyId: String!, $input: CreateTimelineEventInput!) {
        addTimelineEvent(storyId: $storyId, input: $input) { id eventType }
      }`,
      {
        storyId,
        input: {
          title: 'Programme extended',
          description: 'The ministry confirmed a 12-month extension.',
          eventType: 'OFFICIAL_STATEMENT',
        },
      }
    );
    expect(timeline.errors).toBeUndefined();
    expect(timeline.data!.addTimelineEvent.eventType).toBe('OFFICIAL_STATEMENT');

    const perspective = await gql<{ addPerspective: { id: string; label: string } }>(
      `mutation Perspective($storyId: String!, $input: CreatePerspectiveInput!) {
        addPerspective(storyId: $storyId, input: $input) { id label }
      }`,
      {
        storyId,
        input: {
          label: 'Ministry spokesperson',
          summary: 'Confirmed the extension.',
          stance: 'NEUTRAL',
        },
      }
    );
    expect(perspective.errors).toBeUndefined();
    expect(perspective.data!.addPerspective.label).toBe('Ministry spokesperson');
  });

  it('exposes the knowledge graph through GraphQL', async () => {
    const edge = await gql<{ addKnowledgeEdge: { id: string; relation: string } }>(
      `mutation Edge($input: CreateKnowledgeEdgeInput!) {
        addKnowledgeEdge(input: $input) { id relation }
      }`,
      {
        input: {
          fromType: 'STORY',
          fromId: storyId,
          relation: 'mentions',
          toType: 'ENTITY',
          toId: 'ent_gql',
        },
      }
    );
    expect(edge.errors).toBeUndefined();
    expect(edge.data!.addKnowledgeEdge.relation).toBe('mentions');

    const traversal = await gql<{
      getGraphNeighborhood: { nodes: unknown[]; edges: unknown[] };
    }>(
      `query Graph($nodeType: GraphNodeType!, $nodeId: String!) {
        getGraphNeighborhood(nodeType: $nodeType, nodeId: $nodeId, depth: 1) {
          nodes { type id }
          edges { id relation }
        }
      }`,
      { nodeType: 'STORY', nodeId: storyId }
    );
    expect(traversal.errors).toBeUndefined();
    expect(traversal.data!.getGraphNeighborhood.edges.length).toBeGreaterThanOrEqual(1);
  });

  it('creates and evaluates alert rules through GraphQL', async () => {
    const rule = await gql<{ createAlertRule: { id: string; name: string } }>(
      `mutation Rule($input: CreateAlertRuleInput!) {
        createAlertRule(input: $input) { id name }
      }`,
      {
        input: {
          name: 'GraphQL keyword rule',
          conditions: { keywords: ['graphql'] },
          channels: ['in_app'],
          cooldownMinutes: 0,
        },
      }
    );
    expect(rule.errors).toBeUndefined();

    const evaluation = await gql<{
      evaluateAlerts: { evaluatedRules: number; triggers: unknown[] };
    }>(
      `mutation Evaluate($resourceType: AlertResourceType!, $resourceId: String!) {
        evaluateAlerts(resourceType: $resourceType, resourceId: $resourceId) {
          evaluatedRules
          triggers { id matchedConditions }
        }
      }`,
      { resourceType: 'STORY', resourceId: storyId }
    );
    expect(evaluation.errors).toBeUndefined();
    expect(evaluation.data!.evaluateAlerts.evaluatedRules).toBeGreaterThanOrEqual(1);
  });

  it('serves the block catalog through GraphQL', async () => {
    const catalog = await gql<{
      getBlockCatalog: { count: number; blocks: Array<{ type: string }> };
    }>(`query { getBlockCatalog }`);
    expect(catalog.errors).toBeUndefined();
    expect(catalog.data!.getBlockCatalog.count).toBeGreaterThanOrEqual(41);
    expect(catalog.data!.getBlockCatalog.blocks.map((block) => block.type)).toContain('evidence');
  });

  it('requires authentication for intelligence mutations', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/graphql',
      headers: { 'Content-Type': 'application/json' },
      payload: {
        query: `mutation Claim($storyId: String!, $input: CreateClaimInput!) {
          createClaim(storyId: $storyId, input: $input) { id }
        }`,
        variables: { storyId, input: { text: 'Anonymous claim.' } },
      },
    });

    const body = JSON.parse(res.body) as GraphQLResponse<unknown>;
    expect(body.errors).toBeDefined();
    expect(body.errors?.[0].message).toMatch(/Authentication required|UNAUTHENTICATED/i);
  });
});
