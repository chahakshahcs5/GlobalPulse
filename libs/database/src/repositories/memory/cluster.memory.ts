import type { StoryCluster } from '@ai-news/schemas';
import type { IClusterRepository } from '../../interfaces/cluster.repository';

export class MemoryClusterRepository implements IClusterRepository {
  private clusters = new Map<string, StoryCluster>();

  async getById(id: string, orgId?: string): Promise<StoryCluster | null> {
    const cluster = this.clusters.get(id);
    if (!cluster) return null;
    if (orgId && cluster.organizationId !== orgId) return null;
    return {
      ...cluster,
      storyIds: [...(cluster.storyIds || [])],
      perspectives: [...(cluster.perspectives || [])],
      timeline: [...(cluster.timeline || [])],
    };
  }

  async findByStoryId(storyId: string, orgId?: string): Promise<StoryCluster | null> {
    for (const cluster of this.clusters.values()) {
      if (orgId && cluster.organizationId !== orgId) continue;
      if (cluster.leadStoryId === storyId || (cluster.storyIds || []).includes(storyId)) {
        return {
          ...cluster,
          storyIds: [...(cluster.storyIds || [])],
          perspectives: [...(cluster.perspectives || [])],
          timeline: [...(cluster.timeline || [])],
        };
      }
    }
    return null;
  }

  async create(cluster: StoryCluster): Promise<StoryCluster> {
    if (this.clusters.has(cluster.id)) {
      throw new Error(`Cluster with id ${cluster.id} already exists`);
    }
    const cloned: StoryCluster = {
      ...cluster,
      storyIds: [...(cluster.storyIds || [])],
      perspectives: [...(cluster.perspectives || [])],
      timeline: [...(cluster.timeline || [])],
    };
    this.clusters.set(cluster.id, cloned);
    return { ...cloned };
  }

  async update(cluster: StoryCluster): Promise<StoryCluster> {
    if (!this.clusters.has(cluster.id)) {
      throw new Error(`Cluster with id ${cluster.id} does not exist`);
    }
    const cloned: StoryCluster = {
      ...cluster,
      storyIds: [...(cluster.storyIds || [])],
      perspectives: [...(cluster.perspectives || [])],
      timeline: [...(cluster.timeline || [])],
    };
    this.clusters.set(cluster.id, cloned);
    return { ...cloned };
  }

  async list(orgId?: string, limit = 50): Promise<StoryCluster[]> {
    let items = Array.from(this.clusters.values());
    if (orgId) {
      items = items.filter((c) => c.organizationId === orgId);
    }
    items.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    return items.slice(0, limit).map((c) => ({
      ...c,
      storyIds: [...(c.storyIds || [])],
      perspectives: [...(c.perspectives || [])],
      timeline: [...(c.timeline || [])],
    }));
  }

  async delete(id: string, orgId?: string): Promise<boolean> {
    const cluster = this.clusters.get(id);
    if (!cluster) return false;
    if (orgId && cluster.organizationId !== orgId) return false;
    return this.clusters.delete(id);
  }

  snapshot(): Map<string, StoryCluster> {
    return new Map(this.clusters);
  }

  restore(snapshot: Map<string, StoryCluster>): void {
    this.clusters = new Map(snapshot);
  }

  clear(): void {
    this.clusters.clear();
  }
}
