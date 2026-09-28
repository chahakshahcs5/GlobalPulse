import type { StoryCluster } from '@ai-news/schemas';
import type { IClusterRepository } from '../../interfaces/cluster.repository';
import { MemoryClusterRepository } from '../memory/cluster.memory';

interface PrismaClusterRow {
  id: string;
  organizationId: string;
  title: string;
  summary?: string | null;
  leadStoryId: string;
  storyIds: string[] | string;
  topic?: string | null;
  category?: string | null;
  perspectives: any;
  timeline: any;
  createdAt: Date;
  updatedAt: Date;
}

export class PrismaClusterRepository implements IClusterRepository {
  private fallbackMemory = new MemoryClusterRepository();

  constructor(private readonly prismaGetter: () => Record<string, unknown>) {}

  private get prisma(): Record<string, unknown> {
    return this.prismaGetter();
  }

  private get clusterClient(): {
    create: (args: { data: Record<string, unknown> }) => Promise<PrismaClusterRow>;
    update: (args: { where: Record<string, unknown>; data: Record<string, unknown> }) => Promise<PrismaClusterRow>;
    findUnique: (args: { where: Record<string, unknown> }) => Promise<PrismaClusterRow | null>;
    findFirst: (args: { where: Record<string, unknown> }) => Promise<PrismaClusterRow | null>;
    findMany: (args: { where?: Record<string, unknown>; take?: number; orderBy?: Record<string, unknown> }) => Promise<PrismaClusterRow[]>;
    delete: (args: { where: Record<string, unknown> }) => Promise<unknown>;
  } | undefined {
    return (this.prisma as any).storyCluster;
  }

  private mapToCluster(row: PrismaClusterRow): StoryCluster {
    let storyIds: string[] = [];
    if (Array.isArray(row.storyIds)) {
      storyIds = row.storyIds;
    } else if (typeof row.storyIds === 'string') {
      try {
        storyIds = JSON.parse(row.storyIds);
      } catch {
        storyIds = [];
      }
    }

    let perspectives: any[] = [];
    if (Array.isArray(row.perspectives)) {
      perspectives = row.perspectives;
    } else if (typeof row.perspectives === 'string') {
      try {
        perspectives = JSON.parse(row.perspectives);
      } catch {
        perspectives = [];
      }
    }

    let timeline: any[] = [];
    if (Array.isArray(row.timeline)) {
      timeline = row.timeline;
    } else if (typeof row.timeline === 'string') {
      try {
        timeline = JSON.parse(row.timeline);
      } catch {
        timeline = [];
      }
    }

    return {
      id: row.id,
      organizationId: row.organizationId,
      title: row.title,
      summary: row.summary || undefined,
      leadStoryId: row.leadStoryId,
      storyIds,
      topic: row.topic || undefined,
      category: row.category || undefined,
      perspectives,
      timeline,
      createdAt: row.createdAt instanceof Date ? row.createdAt.toISOString() : String(row.createdAt),
      updatedAt: row.updatedAt instanceof Date ? row.updatedAt.toISOString() : String(row.updatedAt),
    };
  }

  async getById(id: string, orgId?: string): Promise<StoryCluster | null> {
    if (!this.clusterClient) {
      return this.fallbackMemory.getById(id, orgId);
    }
    try {
      const where: Record<string, unknown> = { id };
      if (orgId) where.organizationId = orgId;
      const row = await this.clusterClient.findFirst({ where });
      return row ? this.mapToCluster(row) : null;
    } catch {
      return this.fallbackMemory.getById(id, orgId);
    }
  }

  async findByStoryId(storyId: string, orgId?: string): Promise<StoryCluster | null> {
    if (!this.clusterClient) {
      return this.fallbackMemory.findByStoryId(storyId, orgId);
    }
    try {
      const all = await this.list(orgId, 200);
      return all.find((c) => c.leadStoryId === storyId || c.storyIds.includes(storyId)) || null;
    } catch {
      return this.fallbackMemory.findByStoryId(storyId, orgId);
    }
  }

  async create(cluster: StoryCluster): Promise<StoryCluster> {
    if (!this.clusterClient) {
      return this.fallbackMemory.create(cluster);
    }
    try {
      const row = await this.clusterClient.create({
        data: {
          id: cluster.id,
          organizationId: cluster.organizationId,
          title: cluster.title,
          summary: cluster.summary,
          leadStoryId: cluster.leadStoryId,
          storyIds: cluster.storyIds,
          topic: cluster.topic,
          category: cluster.category,
          perspectives: cluster.perspectives,
          timeline: cluster.timeline,
          createdAt: new Date(cluster.createdAt),
          updatedAt: new Date(cluster.updatedAt),
        },
      });
      return this.mapToCluster(row);
    } catch {
      return this.fallbackMemory.create(cluster);
    }
  }

  async update(cluster: StoryCluster): Promise<StoryCluster> {
    if (!this.clusterClient) {
      return this.fallbackMemory.update(cluster);
    }
    try {
      const row = await this.clusterClient.update({
        where: { id: cluster.id },
        data: {
          title: cluster.title,
          summary: cluster.summary,
          leadStoryId: cluster.leadStoryId,
          storyIds: cluster.storyIds,
          topic: cluster.topic,
          category: cluster.category,
          perspectives: cluster.perspectives,
          timeline: cluster.timeline,
          updatedAt: new Date(cluster.updatedAt),
        },
      });
      return this.mapToCluster(row);
    } catch {
      return this.fallbackMemory.update(cluster);
    }
  }

  async list(orgId?: string, limit = 50): Promise<StoryCluster[]> {
    if (!this.clusterClient) {
      return this.fallbackMemory.list(orgId, limit);
    }
    try {
      const where: Record<string, unknown> = {};
      if (orgId) where.organizationId = orgId;
      const rows = await this.clusterClient.findMany({
        where,
        take: limit,
        orderBy: { updatedAt: 'desc' },
      });
      return rows.map((r) => this.mapToCluster(r));
    } catch {
      return this.fallbackMemory.list(orgId, limit);
    }
  }

  async delete(id: string, orgId?: string): Promise<boolean> {
    if (!this.clusterClient) {
      return this.fallbackMemory.delete(id, orgId);
    }
    try {
      await this.clusterClient.delete({ where: { id } });
      return true;
    } catch {
      return this.fallbackMemory.delete(id, orgId);
    }
  }
}
