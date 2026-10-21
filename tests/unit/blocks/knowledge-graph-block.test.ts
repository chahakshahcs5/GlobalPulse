import { describe, it, expect } from 'vitest';
import {
  KnowledgeGraphBlockSchema,
  StoryBlockSchema,
  getBlockDefinition,
  listBlockTypes,
} from '@ai-news/schemas';
import { KnowledgeGraphRenderer } from '@ai-news/media';
import { extractTextContent } from '@ai-news/content';

const base = { id: 'blk_kg_test', sortOrder: 0 };

const validData = {
  title: 'Who is connected to whom',
  description: 'The entities behind the investigation.',
  nodes: [
    { id: 'n1', label: 'Northwind Energy', type: 'company' },
    { id: 'n2', label: 'Ada Okafor', type: 'person' },
    { id: 'n3', label: 'Ministry of Energy', type: 'organization' },
    { id: 'n4', label: 'The Ledger', type: 'source' },
  ],
  edges: [
    { id: 'e1', from: 'n2', to: 'n1', relation: 'directs' },
    { id: 'e2', from: 'n3', to: 'n1', relation: 'regulates' },
    { id: 'e3', from: 'n4', to: 'n1', relation: 'reported on' },
  ],
  focusNodeId: 'n1',
  methodology: 'Relationships come from the platform knowledge graph.',
};

describe('Knowledge graph block', () => {
  it('validates typed nodes and named relationships', () => {
    const block = KnowledgeGraphBlockSchema.parse({
      ...base,
      blockType: 'knowledge_graph',
      data: validData,
    });

    expect(block.data.nodes).toHaveLength(4);
    expect(block.data.edges).toHaveLength(3);
    expect(block.data.nodes[0].type).toBe('company');
  });

  it('is part of the story block union', () => {
    const parsed = StoryBlockSchema.parse({
      ...base,
      blockType: 'knowledge_graph',
      data: validData,
    });
    expect(parsed.blockType).toBe('knowledge_graph');
  });

  it('rejects a node without a type', () => {
    expect(() =>
      KnowledgeGraphBlockSchema.parse({
        ...base,
        blockType: 'knowledge_graph',
        data: {
          ...validData,
          nodes: [{ id: 'n1', label: 'No type' }],
        },
      })
    ).toThrow();
  });

  it('rejects a block with no nodes', () => {
    expect(() =>
      KnowledgeGraphBlockSchema.parse({
        ...base,
        blockType: 'knowledge_graph',
        data: { ...validData, nodes: [] },
      })
    ).toThrow();
  });

  it('is registered as a context block', () => {
    expect(listBlockTypes()).toContain('knowledge_graph');
    const definition = getBlockDefinition('knowledge_graph');
    expect(definition?.category).toBe('context');
  });

  describe('layout', () => {
    it('centres the focus node and rings its relationships', () => {
      const positioned = KnowledgeGraphRenderer.layout(validData as never, 400, 280, 200);

      const focus = positioned.find((n) => n.id === 'n1');
      expect(focus?.ring).toBe(0);
      expect(focus?.x).toBe(400);
      expect(focus?.y).toBe(280);

      // The three directly related nodes are one ring out.
      for (const id of ['n2', 'n3', 'n4']) {
        expect(positioned.find((n) => n.id === id)?.ring).toBe(1);
      }
    });

    it('falls back to the most connected node when no focus is given', () => {
      const positioned = KnowledgeGraphRenderer.layout(
        { ...validData, focusNodeId: undefined } as never,
        400,
        280,
        200
      );
      // n1 has three relationships; the others have one each.
      expect(positioned.find((n) => n.ring === 0)?.id).toBe('n1');
    });

    it('keeps a node that is not reachable from the focus', () => {
      const positioned = KnowledgeGraphRenderer.layout(
        {
          ...validData,
          nodes: [...validData.nodes, { id: 'n5', label: 'Stray', type: 'person' }],
        } as never,
        400,
        280,
        200
      );
      // A node with no relationships must still appear, not vanish.
      expect(positioned.find((n) => n.id === 'n5')).toBeDefined();
    });

    it('is deterministic — the same graph always lays out the same way', () => {
      const first = KnowledgeGraphRenderer.layout(validData as never, 400, 280, 200);
      const second = KnowledgeGraphRenderer.layout(validData as never, 400, 280, 200);
      expect(first).toEqual(second);
    });
  });

  describe('renderer', () => {
    it('draws a node per entity and an edge per relationship', () => {
      const svg = KnowledgeGraphRenderer.renderToSvg(validData as never, {
        width: 800,
        height: 560,
        theme: 'light',
      });

      expect(svg).toContain('<svg');
      expect(svg).toContain('Who is connected to whom');
      // Four nodes plus the focus halo.
      expect((svg.match(/<circle/g) ?? []).length).toBeGreaterThanOrEqual(5);
      // Three edges.
      expect((svg.match(/<line/g) ?? []).length).toBe(3);
    });

    it('labels the relationships', () => {
      const svg = KnowledgeGraphRenderer.renderToSvg(validData as never, { theme: 'light' });
      expect(svg).toContain('directs');
      expect(svg).toContain('regulates');
    });

    it('skips an edge that points at a node that is not present', () => {
      const svg = KnowledgeGraphRenderer.renderToSvg(
        {
          ...validData,
          edges: [...validData.edges, { id: 'e4', from: 'n1', to: 'ghost', relation: 'links' }],
        } as never,
        { theme: 'light' }
      );
      expect((svg.match(/<line/g) ?? []).length).toBe(3);
    });

    it('escapes node labels', () => {
      const svg = KnowledgeGraphRenderer.renderToSvg(
        {
          ...validData,
          nodes: [{ id: 'n1', label: '<script>alert(1)</script>', type: 'person' }],
          edges: [],
        } as never,
        { theme: 'light' }
      );
      expect(svg).not.toContain('<script>');
      expect(svg).toContain('&lt;script&gt;');
    });
  });

  it('contributes its text to the extracted article body', () => {
    const text = extractTextContent([
      { ...base, blockType: 'knowledge_graph', data: validData } as never,
    ]);

    expect(text).toContain('Who is connected to whom');
    expect(text).toContain('Northwind Energy');
    expect(text).toContain('The Ledger');
  });
});
