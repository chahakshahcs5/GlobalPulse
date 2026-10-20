import type { KnowledgeEdge } from '@ai-news/schemas';
import type {
  IKnowledgeGraphRepository,
  GraphEdgeFilter,
} from '../../interfaces/knowledge-graph.repository';

function cloneEdge(edge: KnowledgeEdge): KnowledgeEdge {
  return {
    ...edge,
    metadata: edge.metadata ? { ...edge.metadata } : undefined,
  };
}

export class MemoryKnowledgeGraphRepository implements IKnowledgeGraphRepository {
  private edges = new Map<string, KnowledgeEdge>();

  async upsertEdge(edge: KnowledgeEdge): Promise<KnowledgeEdge> {
    const existing = Array.from(this.edges.values()).find(
      (e) =>
        e.organizationId === edge.organizationId &&
        e.fromType === edge.fromType &&
        e.fromId === edge.fromId &&
        e.relation === edge.relation &&
        e.toType === edge.toType &&
        e.toId === edge.toId
    );
    if (existing) {
      const merged: KnowledgeEdge = {
        ...existing,
        weight: edge.weight,
        metadata: edge.metadata ?? existing.metadata,
      };
      this.edges.set(merged.id, merged);
      return cloneEdge(merged);
    }
    if (this.edges.has(edge.id)) {
      throw new Error(`Knowledge edge with id ${edge.id} already exists`);
    }
    const stored = cloneEdge(edge);
    this.edges.set(stored.id, stored);
    return cloneEdge(stored);
  }

  async findEdgeById(id: string, orgId: string): Promise<KnowledgeEdge | null> {
    const edge = this.edges.get(id);
    return edge && edge.organizationId === orgId ? cloneEdge(edge) : null;
  }

  async listEdges(orgId: string, filter?: GraphEdgeFilter): Promise<KnowledgeEdge[]> {
    return Array.from(this.edges.values())
      .filter(
        (e) =>
          e.organizationId === orgId &&
          (filter?.fromType === undefined || e.fromType === filter.fromType) &&
          (filter?.fromId === undefined || e.fromId === filter.fromId) &&
          (filter?.toType === undefined || e.toType === filter.toType) &&
          (filter?.toId === undefined || e.toId === filter.toId) &&
          (filter?.relation === undefined || e.relation === filter.relation)
      )
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
      .slice(0, filter?.limit ?? Number.MAX_SAFE_INTEGER)
      .map(cloneEdge);
  }

  async deleteEdge(id: string, orgId: string): Promise<boolean> {
    const existing = this.edges.get(id);
    if (!existing || existing.organizationId !== orgId) return false;
    this.edges.delete(id);
    return true;
  }

  async deleteForNode(orgId: string, nodeType: string, nodeId: string): Promise<number> {
    let removed = 0;
    for (const [id, edge] of this.edges) {
      if (
        edge.organizationId === orgId &&
        ((edge.fromType === nodeType && edge.fromId === nodeId) ||
          (edge.toType === nodeType && edge.toId === nodeId))
      ) {
        this.edges.delete(id);
        removed++;
      }
    }
    return removed;
  }

  snapshot(): Map<string, KnowledgeEdge> {
    return new Map(this.edges);
  }

  restore(snapshot: Map<string, KnowledgeEdge>): void {
    this.edges = new Map(snapshot);
  }

  clear(): void {
    this.edges.clear();
  }
}
