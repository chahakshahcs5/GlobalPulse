import type { KnowledgeEdge } from '@ai-news/schemas';
import type {
  IKnowledgeGraphRepository,
  GraphEdgeFilter,
} from '../../interfaces/knowledge-graph.repository';
import { MemoryKnowledgeGraphRepository } from '../memory/knowledge-graph.memory';

type Row = Record<string, unknown>;

function iso(value: unknown): string {
  return value instanceof Date ? value.toISOString() : String(value);
}

interface ModelClient {
  findMany: (args?: Record<string, unknown>) => Promise<Row[]>;
  findFirst: (args: Record<string, unknown>) => Promise<Row | null>;
  create: (args: { data: Record<string, unknown> }) => Promise<Row>;
  update: (args: { where: Record<string, unknown>; data: Record<string, unknown> }) => Promise<Row>;
  deleteMany: (args: { where: Record<string, unknown> }) => Promise<{ count: number }>;
}

export class PrismaKnowledgeGraphRepository implements IKnowledgeGraphRepository {
  private readonly fallback = new MemoryKnowledgeGraphRepository();

  constructor(private readonly prismaGetter: () => Record<string, unknown>) {}

  private get prisma(): Record<string, unknown> {
    return this.prismaGetter();
  }

  private client(): ModelClient | undefined {
    return this.prisma.knowledgeEdge as ModelClient | undefined;
  }

  private mapEdge(row: Row): KnowledgeEdge {
    return {
      id: String(row.id),
      organizationId: String(row.organizationId),
      fromType: String(row.fromType) as KnowledgeEdge['fromType'],
      fromId: String(row.fromId),
      relation: String(row.relation) as KnowledgeEdge['relation'],
      toType: String(row.toType) as KnowledgeEdge['toType'],
      toId: String(row.toId),
      weight: Number(row.weight ?? 1),
      metadata: (row.metadata as Record<string, unknown> | null) ?? undefined,
      createdAt: iso(row.createdAt),
    };
  }

  async upsertEdge(edge: KnowledgeEdge): Promise<KnowledgeEdge> {
    const client = this.client();
    if (!client) return this.fallback.upsertEdge(edge);
    try {
      const existing = await client.findFirst({
        where: {
          organizationId: edge.organizationId,
          fromType: edge.fromType,
          fromId: edge.fromId,
          relation: edge.relation,
          toType: edge.toType,
          toId: edge.toId,
        },
      });
      if (existing) {
        const row = await client.update({
          where: { id: existing.id },
          data: { weight: edge.weight, metadata: edge.metadata ?? null },
        });
        return this.mapEdge(row);
      }
      const row = await client.create({ data: { ...edge } });
      return this.mapEdge(row);
    } catch {
      return this.fallback.upsertEdge(edge);
    }
  }

  async findEdgeById(id: string, orgId: string): Promise<KnowledgeEdge | null> {
    const client = this.client();
    if (!client) return this.fallback.findEdgeById(id, orgId);
    try {
      const row = await client.findFirst({ where: { id, organizationId: orgId } });
      return row ? this.mapEdge(row) : null;
    } catch {
      return this.fallback.findEdgeById(id, orgId);
    }
  }

  async listEdges(orgId: string, filter?: GraphEdgeFilter): Promise<KnowledgeEdge[]> {
    const client = this.client();
    if (!client) return this.fallback.listEdges(orgId, filter);
    try {
      const where: Record<string, unknown> = { organizationId: orgId };
      if (filter?.fromType) where.fromType = filter.fromType;
      if (filter?.fromId) where.fromId = filter.fromId;
      if (filter?.toType) where.toType = filter.toType;
      if (filter?.toId) where.toId = filter.toId;
      if (filter?.relation) where.relation = filter.relation;
      const rows = await client.findMany({
        where,
        orderBy: { createdAt: 'asc' },
        take: filter?.limit,
      });
      return rows.map((r) => this.mapEdge(r));
    } catch {
      return this.fallback.listEdges(orgId, filter);
    }
  }

  async deleteEdge(id: string, orgId: string): Promise<boolean> {
    const client = this.client();
    if (!client) return this.fallback.deleteEdge(id, orgId);
    try {
      const result = await client.deleteMany({ where: { id, organizationId: orgId } });
      return result.count > 0;
    } catch {
      return this.fallback.deleteEdge(id, orgId);
    }
  }

  async deleteForNode(orgId: string, nodeType: string, nodeId: string): Promise<number> {
    const client = this.client();
    if (!client) return this.fallback.deleteForNode(orgId, nodeType, nodeId);
    try {
      const outgoing = await client.deleteMany({
        where: { organizationId: orgId, fromType: nodeType, fromId: nodeId },
      });
      const incoming = await client.deleteMany({
        where: { organizationId: orgId, toType: nodeType, toId: nodeId },
      });
      return outgoing.count + incoming.count;
    } catch {
      return this.fallback.deleteForNode(orgId, nodeType, nodeId);
    }
  }
}
