import type { SourceCorrection } from '@ai-news/schemas';
import type {
  ISourceCorrectionRepository,
  SourceCorrectionFilter,
} from '../../interfaces/source-correction.repository';

function cloneCorrection(correction: SourceCorrection): SourceCorrection {
  return { ...correction };
}

export class MemorySourceCorrectionRepository implements ISourceCorrectionRepository {
  private corrections = new Map<string, SourceCorrection>();

  async list(orgId: string, filter?: SourceCorrectionFilter): Promise<SourceCorrection[]> {
    return Array.from(this.corrections.values())
      .filter(
        (c) =>
          c.organizationId === orgId &&
          (filter?.publisherId === undefined || c.publisherId === filter.publisherId) &&
          (filter?.sourceId === undefined || c.sourceId === filter.sourceId) &&
          (filter?.storyId === undefined || c.storyId === filter.storyId)
      )
      .sort((a, b) => b.issuedAt.localeCompare(a.issuedAt))
      .slice(0, filter?.limit ?? Number.MAX_SAFE_INTEGER)
      .map(cloneCorrection);
  }

  async findById(id: string, orgId: string): Promise<SourceCorrection | null> {
    const correction = this.corrections.get(id);
    return correction && correction.organizationId === orgId ? cloneCorrection(correction) : null;
  }

  async create(correction: SourceCorrection): Promise<SourceCorrection> {
    if (this.corrections.has(correction.id)) {
      throw new Error(`Source correction with id ${correction.id} already exists`);
    }
    const stored = cloneCorrection(correction);
    this.corrections.set(stored.id, stored);
    return cloneCorrection(stored);
  }

  async delete(id: string, orgId: string): Promise<boolean> {
    const existing = this.corrections.get(id);
    if (!existing || existing.organizationId !== orgId) return false;
    this.corrections.delete(id);
    return true;
  }

  snapshot(): Map<string, SourceCorrection> {
    return new Map(this.corrections);
  }

  restore(snapshot: Map<string, SourceCorrection>): void {
    this.corrections = new Map(snapshot);
  }

  clear(): void {
    this.corrections.clear();
  }
}
