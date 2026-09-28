import type { Source, CreateSourceInput, Citation, Claim } from '@ai-news/schemas';
import { CreateSourceInputSchema } from '@ai-news/schemas';
import type { DatabaseService } from '@ai-news/database';
import { NotFoundError, generateId } from '@ai-news/shared';

export class SourceService {
  constructor(private readonly db: DatabaseService) {}

  async createSource(input: CreateSourceInput, orgId: string): Promise<Source> {
    const validated = CreateSourceInputSchema.parse(input);

    // Normalize URL
    const normalizedUrl = new URL(validated.url).toString();
    const existing = await this.db.sources.findByUrl(normalizedUrl, orgId);
    if (existing) {
      return existing;
    }

    const id = generateId('src');
    const now = new Date().toISOString();

    const source: Source = {
      id,
      organizationId: orgId,
      url: normalizedUrl,
      canonicalUrl: validated.canonicalUrl,
      title: validated.title,
      publisher: validated.publisher,
      author: validated.author,
      publishedAt: validated.publishedAt,
      retrievedAt: now,
      language: validated.language || 'en',
      sourceType: validated.sourceType || 'NEWS_ARTICLE',
      licenseMetadata: validated.licenseMetadata,
      permissibleExcerpt: validated.permissibleExcerpt,
      createdAt: now,
      updatedAt: now,
    };

    return this.db.sources.create(source);
  }

  async getSource(id: string, orgId?: string): Promise<Source> {
    const source = await this.db.sources.findById(id, orgId);
    if (!source) {
      throw new NotFoundError('Source', id);
    }
    return source;
  }

  async attachSourceToStory(storyId: string, sourceId: string, orgId: string): Promise<void> {
    const story = await this.db.stories.findById(storyId, orgId);
    if (!story) {
      throw new NotFoundError('Story', storyId);
    }
    const source = await this.db.sources.findById(sourceId, orgId);
    if (!source) {
      throw new NotFoundError('Source', sourceId);
    }

    if (!story.sourceIds.includes(sourceId)) {
      story.sourceIds.push(sourceId);
      story.updatedAt = new Date().toISOString();
      await this.db.stories.update(story);
    }
  }

  async createCitation(params: {
    storyId: string;
    sourceId: string;
    claimText: string;
    blockId?: string;
    confidenceScore?: number;
    orgId: string;
  }): Promise<Citation> {
    const citation: Citation = {
      id: generateId('cit'),
      organizationId: params.orgId,
      storyId: params.storyId,
      sourceId: params.sourceId,
      blockId: params.blockId,
      claimText: params.claimText,
      confidenceScore: params.confidenceScore,
      createdAt: new Date().toISOString(),
    };
    return this.db.sources.createCitation(citation);
  }

  async getStoryCitations(storyId: string): Promise<Citation[]> {
    return this.db.sources.getCitationsForStory(storyId);
  }

  async listSources(orgId: string, limit = 50): Promise<Source[]> {
    return this.db.sources.list(orgId, limit);
  }

  async searchSources(query: string, orgId: string): Promise<Source[]> {
    return this.db.sources.search(query, orgId);
  }

  async listCitationsForSource(sourceId: string): Promise<Citation[]> {
    return this.db.sources.getCitationsForStory(sourceId);
  }

  async listClaimsForSource(sourceId: string): Promise<Claim[]> {
    return this.db.sources.getClaimsForSource(sourceId);
  }
}
