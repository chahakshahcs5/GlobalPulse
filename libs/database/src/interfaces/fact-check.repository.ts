import type { FactCheckClaim, FactCheckRating } from '@ai-news/schemas';

export interface FactCheckFilter {
  rating?: FactCheckRating;
  limit?: number;
}

export interface IFactCheckRepository {
  list(filter?: FactCheckFilter): Promise<FactCheckClaim[]>;
  findById(id: string): Promise<FactCheckClaim | null>;
  create(claim: FactCheckClaim): Promise<FactCheckClaim>;
  delete(id: string): Promise<boolean>;
}
