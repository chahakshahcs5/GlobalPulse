import type { AIStoryProvenance } from '@ai-news/schemas';
import type { IProvenanceRepository } from '../../interfaces/provenance.repository';

export class MemoryProvenanceRepository implements IProvenanceRepository {
  private records = new Map<string, AIStoryProvenance>(); // storyId -> provenance

  async saveProvenance(provenance: AIStoryProvenance): Promise<AIStoryProvenance> {
    this.records.set(provenance.storyId, { ...provenance });
    return { ...provenance };
  }

  async getProvenance(storyId: string): Promise<AIStoryProvenance | null> {
    const item = this.records.get(storyId);
    return item ? { ...item } : null;
  }

  snapshot(): Map<string, AIStoryProvenance> {
    return new Map(this.records);
  }

  restore(snapshot: Map<string, AIStoryProvenance>): void {
    this.records = new Map(snapshot);
  }

  clear(): void {
    this.records.clear();
  }
}
