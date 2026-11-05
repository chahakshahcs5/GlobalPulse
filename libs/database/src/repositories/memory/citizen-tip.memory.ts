import type { CitizenTip } from '@ai-news/schemas';
import type {
  CitizenTipFilter,
  ICitizenTipRepository,
} from '../../interfaces/citizen-tip.repository';

export class MemoryCitizenTipRepository implements ICitizenTipRepository {
  private tips = new Map<string, CitizenTip>();

  async create(tip: CitizenTip): Promise<CitizenTip> {
    if (this.tips.has(tip.id)) {
      throw new Error(`CitizenTip with id ${tip.id} already exists`);
    }
    this.tips.set(tip.id, { ...tip });
    return { ...tip };
  }

  async findById(id: string, orgId?: string): Promise<CitizenTip | null> {
    const tip = this.tips.get(id);
    if (!tip) return null;
    if (orgId && tip.organizationId !== orgId) return null;
    return { ...tip };
  }

  async findByChecksum(checksum: string, orgId?: string): Promise<CitizenTip | null> {
    for (const tip of this.tips.values()) {
      if (tip.verificationChecksum !== checksum) continue;
      if (orgId && tip.organizationId !== orgId) continue;
      return { ...tip };
    }
    return null;
  }

  async list(orgId: string, filter?: CitizenTipFilter): Promise<CitizenTip[]> {
    const list = Array.from(this.tips.values()).filter((tip) => {
      if (tip.organizationId !== orgId) return false;
      if (filter?.status && tip.status !== filter.status) return false;
      if (filter?.urgency && tip.urgency !== filter.urgency) return false;
      if (filter?.category && tip.category.toLowerCase() !== filter.category.toLowerCase()) {
        return false;
      }
      return true;
    });
    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return list.slice(0, filter?.limit || 50).map((tip) => ({ ...tip }));
  }

  async update(tip: CitizenTip): Promise<CitizenTip> {
    if (!this.tips.has(tip.id)) {
      throw new Error(`CitizenTip with id ${tip.id} does not exist`);
    }
    this.tips.set(tip.id, { ...tip });
    return { ...tip };
  }

  snapshot(): Map<string, CitizenTip> {
    return new Map(this.tips);
  }

  restore(snapshot: Map<string, CitizenTip>): void {
    this.tips = new Map(snapshot);
  }

  clear(): void {
    this.tips.clear();
  }
}
