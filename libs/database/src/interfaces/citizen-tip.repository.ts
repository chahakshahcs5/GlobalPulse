import type { CitizenTip } from '@ai-news/schemas';

export interface CitizenTipFilter {
  status?: string;
  urgency?: string;
  category?: string;
  limit?: number;
}

export interface ICitizenTipRepository {
  create(tip: CitizenTip): Promise<CitizenTip>;
  findById(id: string, orgId?: string): Promise<CitizenTip | null>;
  findByChecksum(checksum: string, orgId?: string): Promise<CitizenTip | null>;
  list(orgId: string, filter?: CitizenTipFilter): Promise<CitizenTip[]>;
  update(tip: CitizenTip): Promise<CitizenTip>;
  snapshot(): Map<string, CitizenTip>;
  restore(snapshot: Map<string, CitizenTip>): void;
  clear(): void;
}
