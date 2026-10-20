import type { KnowledgeEdge } from '@ai-news/schemas';

export interface GraphEdgeFilter {
  fromType?: string;
  fromId?: string;
  toType?: string;
  toId?: string;
  relation?: string;
  limit?: number;
}

export interface IKnowledgeGraphRepository {
  /**
   * Idempotent upsert keyed by organization + from + relation + to. Repeated
   * ingestion of the same relationship updates weight/metadata instead of
   * creating parallel edges.
   */
  upsertEdge(edge: KnowledgeEdge): Promise<KnowledgeEdge>;
  findEdgeById(id: string, orgId: string): Promise<KnowledgeEdge | null>;
  listEdges(orgId: string, filter?: GraphEdgeFilter): Promise<KnowledgeEdge[]>;
  deleteEdge(id: string, orgId: string): Promise<boolean>;
  deleteForNode(orgId: string, nodeType: string, nodeId: string): Promise<number>;
}
