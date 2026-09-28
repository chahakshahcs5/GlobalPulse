import type { Source, Citation, Claim } from '@ai-news/schemas';

export interface ISourceRepository {
  findById(id: string, orgId?: string): Promise<Source | null>;
  findByUrl(url: string, orgId: string): Promise<Source | null>;
  create(source: Source): Promise<Source>;
  update(source: Source): Promise<Source>;
  list(orgId: string, limit?: number): Promise<Source[]>;
  search(query: string, orgId: string): Promise<Source[]>;

  // Citations & Claims
  createCitation(citation: Citation): Promise<Citation>;
  getCitationsForStory(storyId: string, orgId?: string): Promise<Citation[]>;
  createClaim(claim: Claim): Promise<Claim>;
  getClaimsForSource(sourceId: string, orgId?: string): Promise<Claim[]>;
}
