import { describe, it, expect, beforeEach } from 'vitest';
import { DatabaseService } from '@ai-news/database';
import { KnowledgeGraphService, StoryIntelligenceService, StoryService } from '@ai-news/stories';

const ORG = 'org_graph_test';
const OTHER_ORG = 'org_graph_other';

describe('Knowledge Graph Service', () => {
  let db: DatabaseService;
  let graph: KnowledgeGraphService;
  let stories: StoryService;
  let intelligence: StoryIntelligenceService;

  const ctx = {
    organizationId: ORG,
    actorId: 'usr_graph',
    clientType: 'custom_mcp' as const,
  };

  beforeEach(() => {
    db = new DatabaseService();
    graph = new KnowledgeGraphService(db);
    stories = new StoryService(db);
    intelligence = new StoryIntelligenceService(db);
  });

  it('creates a typed edge and reads it back', async () => {
    const edge = await graph.addEdge(
      {
        fromType: 'STORY',
        fromId: 'sty_1',
        relation: 'mentions',
        toType: 'ENTITY',
        toId: 'ent_1',
        weight: 0.9,
        metadata: { confidence: 0.9 },
      },
      ctx
    );

    expect(edge.id).toMatch(/^kge_/);
    expect(edge.organizationId).toBe(ORG);
    expect(edge.weight).toBe(0.9);

    const edges = await graph.listEdges(ORG, { fromType: 'STORY', fromId: 'sty_1' });
    expect(edges).toHaveLength(1);
    expect(edges[0].relation).toBe('mentions');
  });

  it('traverses the neighborhood of a node', async () => {
    await graph.addEdge(
      { fromType: 'STORY', fromId: 'sty_1', relation: 'mentions', toType: 'ENTITY', toId: 'ent_1' },
      ctx
    );
    await graph.addEdge(
      {
        fromType: 'ENTITY',
        fromId: 'ent_1',
        relation: 'works_for',
        toType: 'COMPANY',
        toId: 'cmp_1',
      },
      ctx
    );

    const traversal = await graph.getNeighborhood('STORY', 'sty_1', ORG, 2);
    expect(traversal.root.type).toBe('STORY');
    expect(traversal.depth).toBe(2);
    expect(traversal.nodes.length).toBeGreaterThanOrEqual(3);
    expect(traversal.edges.length).toBeGreaterThanOrEqual(2);
    expect(traversal.truncated).toBe(false);
  });

  it('bounds traversal depth and edge count', async () => {
    await graph.addEdge(
      { fromType: 'STORY', fromId: 'sty_1', relation: 'mentions', toType: 'ENTITY', toId: 'ent_1' },
      ctx
    );

    const traversal = await graph.getNeighborhood('STORY', 'sty_1', ORG, 0, 1);
    expect(traversal.depth).toBe(0);
    expect(traversal.edges).toHaveLength(0);
  });

  it('indexes a story into explicit relationships', async () => {
    const story = await stories.createStory(
      {
        title: 'Graph indexing story',
        summary: 'Story used to verify graph indexing.',
        topicIds: ['top_econ'],
        entityIds: ['ent_bank'],
        sourceIds: ['src_wire'],
      },
      {
        organizationId: ORG,
        authorId: 'usr_reporter',
        clientType: 'human_web',
        createdVia: 'api',
      }
    );

    const claim = await intelligence.createClaim(
      story.id,
      { text: 'A claim worth indexing.' },
      ctx
    );

    const edges = await graph.indexStory(story, ctx);
    expect(edges.length).toBeGreaterThanOrEqual(4);

    const relations = edges.map((edge) => edge.relation);
    expect(relations).toContain('part_of');
    expect(relations).toContain('mentions');
    expect(relations).toContain('cites');
    expect(relations).toContain('has_claim');

    // Indexing is idempotent: the same relationships are upserted, not duplicated.
    const again = await graph.indexStory(story, ctx);
    expect(again.length).toBe(edges.length);
    const all = await graph.listEdges(ORG);
    expect(all.length).toBe(edges.length);
    expect(all.some((edge) => edge.toId === claim.id)).toBe(true);
  });

  it('keeps edges tenant-isolated', async () => {
    await graph.addEdge(
      { fromType: 'STORY', fromId: 'sty_1', relation: 'mentions', toType: 'ENTITY', toId: 'ent_1' },
      ctx
    );

    expect(await graph.listEdges(OTHER_ORG)).toHaveLength(0);
    const traversal = await graph.getNeighborhood('STORY', 'sty_1', OTHER_ORG, 1);
    expect(traversal.edges).toHaveLength(0);
  });

  it('deletes an edge', async () => {
    const edge = await graph.addEdge(
      {
        fromType: 'STORY',
        fromId: 'sty_1',
        relation: 'related_to',
        toType: 'EVENT',
        toId: 'evt_1',
      },
      ctx
    );

    await graph.deleteEdge(edge.id, ctx);
    expect(await graph.listEdges(ORG)).toHaveLength(0);
  });
});
