import type {
  Source,
  CreateSourceInput,
  Citation,
  Claim,
  Publisher,
  CreatePublisherInput,
  PublisherProfile,
  PublisherStoryRef,
} from '@ai-news/schemas';
import { CreateSourceInputSchema, CreatePublisherInputSchema } from '@ai-news/schemas';
import type { DatabaseService } from '@ai-news/database';
import { NotFoundError, generateId, slugify } from '@ai-news/shared';

export function extractDomain(url: string): string {
  try {
    const u = new URL(url);
    return u.hostname.replace(/^www\./, '').toLowerCase();
  } catch {
    return url
      .replace(/^https?:\/\//, '')
      .replace(/^www\./, '')
      .split('/')[0]
      .toLowerCase();
  }
}

export class SourceService {
  constructor(private readonly db: DatabaseService) {}

  // ---------------------------------------------------------------------------
  // Publisher / News Outlet Management (Google News Model)
  // ---------------------------------------------------------------------------

  async createPublisher(input: CreatePublisherInput, orgId: string): Promise<Publisher> {
    const validated = CreatePublisherInputSchema.parse(input);
    const domain = validated.domain
      .toLowerCase()
      .replace(/^https?:\/\//, '')
      .replace(/^www\./, '')
      .split('/')[0];
    const slug = validated.slug || slugify(validated.name);

    // Check if publisher already exists by domain or slug
    const existingByDomain = await this.db.publishers.findByDomain(domain, orgId);
    if (existingByDomain) return existingByDomain;

    const existingBySlug = await this.db.publishers.findBySlug(slug, orgId);
    if (existingBySlug) return existingBySlug;

    const id = generateId('pub');
    const now = new Date().toISOString();

    const publisher: Publisher = {
      id,
      organizationId: orgId,
      name: validated.name,
      slug,
      domain,
      logoUrl: validated.logoUrl,
      description: validated.description,
      category: validated.category || 'general',
      country: validated.country,
      language: validated.language || 'en',
      websiteUrl: validated.websiteUrl || `https://${domain}`,
      biasRating: validated.biasRating,
      credibilityScore: validated.credibilityScore,
      isVerified: validated.isVerified ?? true,
      followerCount: 0,
      createdAt: now,
      updatedAt: now,
    };

    return this.db.publishers.create(publisher);
  }

  async getPublisher(id: string, orgId?: string): Promise<Publisher> {
    const publisher = await this.db.publishers.findById(id, orgId);
    if (!publisher) {
      throw new NotFoundError('Publisher', id);
    }
    return publisher;
  }

  async getPublisherBySlug(slug: string, orgId: string): Promise<Publisher> {
    const publisher = await this.db.publishers.findBySlug(slug, orgId);
    if (!publisher) {
      throw new NotFoundError('Publisher slug', slug);
    }
    return publisher;
  }

  async listPublishers(orgId: string, category?: string, limit = 100): Promise<Publisher[]> {
    return this.db.publishers.list(orgId, category, limit);
  }

  async searchPublishers(query: string, orgId: string): Promise<Publisher[]> {
    return this.db.publishers.search(query, orgId);
  }

  async updatePublisher(
    id: string,
    updates: Partial<CreatePublisherInput>,
    orgId: string
  ): Promise<Publisher> {
    const publisher = await this.getPublisher(id, orgId);
    const updated: Publisher = {
      ...publisher,
      name: updates.name ?? publisher.name,
      domain: updates.domain ?? publisher.domain,
      slug: updates.slug ?? publisher.slug,
      logoUrl: updates.logoUrl !== undefined ? updates.logoUrl : publisher.logoUrl,
      description: updates.description !== undefined ? updates.description : publisher.description,
      category: updates.category ?? publisher.category,
      country: updates.country !== undefined ? updates.country : publisher.country,
      language: updates.language ?? publisher.language,
      websiteUrl: updates.websiteUrl !== undefined ? updates.websiteUrl : publisher.websiteUrl,
      biasRating: updates.biasRating !== undefined ? updates.biasRating : publisher.biasRating,
      credibilityScore:
        updates.credibilityScore !== undefined
          ? updates.credibilityScore
          : publisher.credibilityScore,
      isVerified: updates.isVerified !== undefined ? updates.isVerified : publisher.isVerified,
      updatedAt: new Date().toISOString(),
    };
    return this.db.publishers.update(updated);
  }

  /**
   * Get complete publisher profile: metadata, all cited articles (news1, news2...),
   * and all stories on GlobalPulse citing this publisher.
   */
  async getPublisherProfile(
    slugOrId: string,
    orgId: string,
    userId?: string
  ): Promise<PublisherProfile> {
    let publisher = await this.db.publishers.findBySlug(slugOrId, orgId);
    if (!publisher) {
      publisher = await this.db.publishers.findById(slugOrId, orgId);
    }
    if (!publisher) {
      throw new NotFoundError('Publisher', slugOrId);
    }

    // 1. Find all cited articles belonging to this publisher
    const citedArticles = await this.listArticlesForPublisher(publisher.id, orgId);

    // 2. Find all stories citing any of these articles or this publisher
    const citedArticleIds = new Set(citedArticles.map((a) => a.id));
    const allStories = await this.db.stories.list({ limit: 200 }, orgId);
    const referencingStories: PublisherStoryRef[] = [];

    for (const story of allStories) {
      const hasCitation = story.sourceIds.some((sId) => citedArticleIds.has(sId));
      if (hasCitation) {
        referencingStories.push({
          id: story.id,
          slug: story.slug,
          title: story.title,
          summary: story.summary,
          publishedAt: story.publishedAt,
          articleType: story.articleType,
          heroImageUrl: story.heroImageUrl,
        });
      }
    }

    // 3. Check following status
    let isFollowing = false;
    if (userId) {
      isFollowing = await this.db.users.isFollowing(userId, 'source', publisher.id);
    }

    return {
      publisher,
      citedArticles,
      referencingStories,
      followerCount: publisher.followerCount,
      isFollowing,
    };
  }

  async listArticlesForPublisher(publisherId: string, orgId?: string): Promise<Source[]> {
    const directSources = await this.db.sources.listByPublisher(publisherId, orgId);
    if (directSources.length > 0) return directSources;

    // Fallback: match by publisher name or domain
    const publisher = await this.db.publishers.findById(publisherId, orgId);
    if (!publisher) return [];

    const all = await this.db.sources.list(orgId || publisher.organizationId, 500);
    return all.filter(
      (s) =>
        s.publisherId === publisherId ||
        s.publisher.toLowerCase() === publisher.name.toLowerCase() ||
        (s.domain && s.domain === publisher.domain) ||
        (s.url && extractDomain(s.url) === publisher.domain)
    );
  }

  // ---------------------------------------------------------------------------
  // Cited Source Articles (news1, news2, documents, datasets)
  // ---------------------------------------------------------------------------

  async createSource(input: CreateSourceInput, orgId: string): Promise<Source> {
    const validated = CreateSourceInputSchema.parse(input);

    // Normalize URL
    const normalizedUrl = new URL(validated.url).toString();
    const existing = await this.db.sources.findByUrl(normalizedUrl, orgId);
    if (existing) {
      return existing;
    }

    const domain = validated.domain || extractDomain(normalizedUrl);
    let publisherId = validated.publisherId;

    // Auto-resolve or auto-create parent Publisher
    if (!publisherId) {
      const existingPubByDomain = await this.db.publishers.findByDomain(domain, orgId);
      if (existingPubByDomain) {
        publisherId = existingPubByDomain.id;
      } else {
        const existingPubBySlug = await this.db.publishers.findBySlug(
          slugify(validated.publisher),
          orgId
        );
        if (existingPubBySlug) {
          publisherId = existingPubBySlug.id;
        } else {
          // Auto-create publisher
          const pub = await this.createPublisher(
            {
              name: validated.publisher,
              domain,
              slug: slugify(validated.publisher || domain.split('.')[0]),
              language: validated.language || 'en',
              websiteUrl: `https://${domain}`,
              category: 'general',
              isVerified: true,
            },
            orgId
          );
          publisherId = pub.id;
        }
      }
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
      publisherId,
      domain,
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

  async getStoryCitations(storyId: string, orgId?: string): Promise<Citation[]> {
    return this.db.sources.getCitationsForStory(storyId, orgId);
  }

  async listSources(orgId: string, limit = 50): Promise<Source[]> {
    return this.db.sources.list(orgId, limit);
  }

  async searchSources(query: string, orgId: string): Promise<Source[]> {
    return this.db.sources.search(query, orgId);
  }

  async listCitationsForSource(sourceId: string, orgId?: string): Promise<Citation[]> {
    return this.db.sources.getCitationsForStory(sourceId, orgId);
  }

  async listClaimsForSource(sourceId: string, orgId?: string): Promise<Claim[]> {
    return this.db.sources.getClaimsForSource(sourceId, orgId);
  }
}
