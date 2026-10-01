import type { Source, Citation, Claim } from '@ai-news/schemas';
import type { ISourceRepository } from '../../interfaces/source.repository';

export class MemorySourceRepository implements ISourceRepository {
  private sources = new Map<string, Source>();
  private citations = new Map<string, Citation>();
  private claims = new Map<string, Claim>();

  async findById(id: string, orgId?: string): Promise<Source | null> {
    const source = this.sources.get(id);
    if (!source) return null;
    if (orgId && source.organizationId !== orgId) return null;
    return { ...source };
  }

  async findByUrl(url: string, orgId: string): Promise<Source | null> {
    for (const source of this.sources.values()) {
      if (source.url === url && source.organizationId === orgId) {
        return { ...source };
      }
    }
    return null;
  }

  async create(source: Source): Promise<Source> {
    if (this.sources.has(source.id)) {
      throw new Error(`Source with id ${source.id} already exists`);
    }
    this.sources.set(source.id, { ...source });
    return { ...source };
  }

  async update(source: Source): Promise<Source> {
    if (!this.sources.has(source.id)) {
      throw new Error(`Source with id ${source.id} does not exist`);
    }
    this.sources.set(source.id, { ...source });
    return { ...source };
  }

  async list(orgId: string, limit: number = 50): Promise<Source[]> {
    return Array.from(this.sources.values())
      .filter((s) => s.organizationId === orgId)
      .slice(0, limit);
  }

  async listByPublisher(publisherId: string, orgId?: string): Promise<Source[]> {
    return Array.from(this.sources.values()).filter(
      (s) => (!orgId || s.organizationId === orgId) && s.publisherId === publisherId
    );
  }

  async search(query: string, orgId: string): Promise<Source[]> {
    const q = query.toLowerCase();
    return Array.from(this.sources.values()).filter(
      (s) =>
        s.organizationId === orgId &&
        (s.title.toLowerCase().includes(q) ||
          s.publisher.toLowerCase().includes(q) ||
          s.url.toLowerCase().includes(q))
    );
  }

  async createCitation(citation: Citation): Promise<Citation> {
    this.citations.set(citation.id, { ...citation });
    return { ...citation };
  }

  async getCitationsForStory(storyId: string, orgId?: string): Promise<Citation[]> {
    return Array.from(this.citations.values()).filter(
      (c) => c.storyId === storyId && (!orgId || c.organizationId === orgId)
    );
  }

  async createClaim(claim: Claim): Promise<Claim> {
    this.claims.set(claim.id, { ...claim });
    return { ...claim };
  }

  async getClaimsForSource(sourceId: string, orgId?: string): Promise<Claim[]> {
    return Array.from(this.claims.values()).filter(
      (c) => c.sourceIds.includes(sourceId) && (!orgId || c.organizationId === orgId)
    );
  }

  snapshot(): {
    sources: Map<string, Source>;
    citations: Map<string, Citation>;
    claims: Map<string, Claim>;
  } {
    return {
      sources: new Map(this.sources),
      citations: new Map(this.citations),
      claims: new Map(this.claims),
    };
  }

  restore(snapshot: {
    sources: Map<string, Source>;
    citations: Map<string, Citation>;
    claims: Map<string, Claim>;
  }): void {
    this.sources = new Map(snapshot.sources);
    this.citations = new Map(snapshot.citations);
    this.claims = new Map(snapshot.claims);
  }

  clear(): void {
    this.sources.clear();
    this.citations.clear();
    this.claims.clear();
  }
}
