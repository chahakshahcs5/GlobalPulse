import type {
  KnowledgeEdge,
  GraphTraversal,
  GraphNode,
  GraphQueryInput,
  CreateKnowledgeEdgeInput,
  Story,
} from '@ai-news/schemas';
import { CreateKnowledgeEdgeInputSchema, GraphQueryInputSchema } from '@ai-news/schemas';
import type { DatabaseService } from '@ai-news/database';
import { generateId } from '@ai-news/shared';
import type { IntelligenceContext } from './intelligence.service';

function nodeKey(type: string, id: string): string {
  return `${type}:${id}`;
}

/**
 * Generic, provider-neutral knowledge graph over existing newsroom objects.
 * Edges are stored as explicit typed relationships so external AI agents can
 * traverse from a story to its entities, sources, claims, evidence, and events.
 */
export class KnowledgeGraphService {
  constructor(private readonly db: DatabaseService) {}

  async addEdge(input: CreateKnowledgeEdgeInput, ctx: IntelligenceContext): Promise<KnowledgeEdge> {
    const validated = CreateKnowledgeEdgeInputSchema.parse(input);
    const edge: KnowledgeEdge = {
      id: generateId('kge'),
      organizationId: ctx.organizationId,
      fromType: validated.fromType,
      fromId: validated.fromId,
      relation: validated.relation,
      toType: validated.toType,
      toId: validated.toId,
      weight: validated.weight,
      metadata: validated.metadata,
      createdAt: new Date().toISOString(),
    };
    const saved = await this.db.knowledgeGraph.upsertEdge(edge);
    await this.audit(ctx, 'add_knowledge_edge', saved.id, {
      from: `${saved.fromType}:${saved.fromId}`,
      relation: saved.relation,
      to: `${saved.toType}:${saved.toId}`,
    });
    return saved;
  }

  async listEdges(
    orgId: string,
    filter?: {
      fromType?: string;
      fromId?: string;
      toType?: string;
      toId?: string;
      relation?: string;
      limit?: number;
    }
  ): Promise<KnowledgeEdge[]> {
    return this.db.knowledgeGraph.listEdges(orgId, filter);
  }

  async deleteEdge(id: string, ctx: IntelligenceContext): Promise<void> {
    const edge = await this.db.knowledgeGraph.findEdgeById(id, ctx.organizationId);
    if (!edge) return;
    await this.db.knowledgeGraph.deleteEdge(id, ctx.organizationId);
    await this.audit(ctx, 'delete_knowledge_edge', id, { relation: edge.relation });
  }

  async getNeighborhood(
    nodeType: GraphNode['type'],
    nodeId: string,
    orgId: string,
    depth = 1,
    limit = 100
  ): Promise<GraphTraversal> {
    const safeDepth = Math.max(0, Math.min(5, depth));
    const safeLimit = Math.max(1, Math.min(500, limit));
    const root: GraphNode = { type: nodeType, id: nodeId };

    const allEdges = await this.db.knowledgeGraph.listEdges(orgId, {
      limit: Math.max(safeLimit * 4, 200),
    });

    const nodes = new Map<string, GraphNode>([[nodeKey(root.type, root.id), root]]);
    const collected: KnowledgeEdge[] = [];
    const seenEdges = new Set<string>();
    let frontier = [root];
    let truncated = false;

    for (let level = 0; level < safeDepth; level++) {
      const next: GraphNode[] = [];
      for (const node of frontier) {
        for (const edge of allEdges) {
          const touchesFrom = edge.fromType === node.type && edge.fromId === node.id;
          const touchesTo = edge.toType === node.type && edge.toId === node.id;
          if (!touchesFrom && !touchesTo) continue;
          if (seenEdges.has(edge.id)) continue;
          seenEdges.add(edge.id);
          collected.push(edge);

          const other: GraphNode = touchesFrom
            ? { type: edge.toType, id: edge.toId }
            : { type: edge.fromType, id: edge.fromId };
          const key = nodeKey(other.type, other.id);
          if (!nodes.has(key)) {
            if (nodes.size >= safeLimit) {
              truncated = true;
            } else {
              nodes.set(key, other);
              next.push(other);
            }
          }
        }
      }
      frontier = next;
      if (frontier.length === 0) break;
    }

    return {
      root,
      depth: safeDepth,
      nodes: Array.from(nodes.values()),
      edges: collected,
      truncated,
    };
  }

  async query(input: GraphQueryInput, orgId: string): Promise<GraphTraversal | KnowledgeEdge[]> {
    const validated = GraphQueryInputSchema.parse(input);
    if (validated.nodeType && validated.nodeId) {
      return this.getNeighborhood(
        validated.nodeType,
        validated.nodeId,
        orgId,
        validated.depth,
        validated.limit
      );
    }
    const edges = await this.db.knowledgeGraph.listEdges(orgId, {
      relation: validated.relation,
      limit: validated.limit,
    });
    if (!validated.query) return edges;
    const q = validated.query.toLowerCase();
    return edges.filter(
      (e) =>
        e.fromId.toLowerCase().includes(q) ||
        e.toId.toLowerCase().includes(q) ||
        e.relation.toLowerCase().includes(q) ||
        JSON.stringify(e.metadata ?? {})
          .toLowerCase()
          .includes(q)
    );
  }

  /**
   * Materialize a story's existing explicit relationships as graph edges.
   * Idempotent: calling it repeatedly updates rather than duplicates edges.
   */
  async indexStory(story: Story, ctx: IntelligenceContext): Promise<KnowledgeEdge[]> {
    const edges: KnowledgeEdge[] = [];
    const now = new Date().toISOString();
    const add = async (
      toType: KnowledgeEdge['toType'],
      toId: string,
      relation: KnowledgeEdge['relation']
    ): Promise<void> => {
      const saved = await this.db.knowledgeGraph.upsertEdge({
        id: generateId('kge'),
        organizationId: ctx.organizationId,
        fromType: 'STORY',
        fromId: story.id,
        relation,
        toType,
        toId,
        weight: 1,
        createdAt: now,
      });
      edges.push(saved);
    };

    for (const topicId of new Set(story.topicIds)) {
      await add('TOPIC', topicId, 'part_of');
    }
    for (const entityId of new Set(story.entityIds)) {
      await add('ENTITY', entityId, 'mentions');
    }
    for (const sourceId of new Set(story.sourceIds)) {
      await add('SOURCE', sourceId, 'cites');
    }
    if (story.eventId) {
      await add('EVENT', story.eventId, 'related_to');
    }

    const claims = await this.db.storyIntelligence.listClaims(ctx.organizationId, story.id);
    for (const claim of claims) {
      await add('CLAIM', claim.id, 'has_claim');
      for (const evidence of await this.db.storyIntelligence.listEvidence(
        ctx.organizationId,
        story.id,
        claim.id
      )) {
        await this.db.knowledgeGraph.upsertEdge({
          id: generateId('kge'),
          organizationId: ctx.organizationId,
          fromType: 'CLAIM',
          fromId: claim.id,
          relation: evidence.stance === 'CONTRADICTS' ? 'contradicted_by' : 'supported_by',
          toType: 'EVIDENCE',
          toId: evidence.id,
          weight: evidence.strength ?? 1,
          createdAt: now,
        });
      }
    }

    await this.audit(ctx, 'index_story_graph', story.id, { edges: edges.length });
    return edges;
  }

  private async audit(
    ctx: IntelligenceContext,
    action: string,
    resourceId: string,
    payloadSummary?: Record<string, unknown>
  ): Promise<void> {
    try {
      await this.db.audit.log({
        id: generateId('aud'),
        organizationId: ctx.organizationId,
        userId: ctx.actorId,
        clientType: ctx.clientType,
        action: `${ctx.clientType}.${action}`,
        resourceType: 'knowledge_edge',
        resourceId,
        payloadSummary,
        requestId: ctx.requestId,
        status: 'SUCCESS',
        timestamp: new Date().toISOString(),
      });
    } catch {
      // non-blocking audit
    }
  }
}
