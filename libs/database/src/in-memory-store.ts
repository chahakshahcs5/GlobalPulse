import type {
  Story,
  StoryVersion,
  StoryBlock,
  Event,
  Topic,
  Entity,
  Source,
  Citation,
  Claim,
  AuditLog,
  IdempotencyRecord,
  SearchStoriesInput,
  StorySearchResultItem,
  FindSimilarStoriesInput,
} from '@ai-news/schemas';
import { type PaginatedResult, encodeCursor, decodeCursor } from '@ai-news/shared';
import type {
  IStoryRepository,
  StoryFilter,
  PaginatedStories,

  IEventRepository,
  ITopicRepository,
  IEntityRepository,
  ISourceRepository,
  IIdempotencyRepository,
  IAuditRepository,
  AuditFilter,
} from './interfaces/index';

function computeTextSimilarity(s1: string, s2: string): number {
  const set1 = new Set(s1.toLowerCase().split(/\s+/).filter(w => w.length > 2));
  const set2 = new Set(s2.toLowerCase().split(/\s+/).filter(w => w.length > 2));
  if (set1.size === 0 || set2.size === 0) return 0;
  let intersection = 0;
  for (const word of set1) {
    if (set2.has(word)) intersection++;
  }
  return intersection / Math.max(set1.size, set2.size);
}

export class InMemoryStoryRepository implements IStoryRepository {
  private stories = new Map<string, Story>();
  private versions = new Map<string, StoryVersion[]>(); // storyId -> versions
  private blocks = new Map<string, StoryBlock[]>(); // storyId -> blocks

  async findById(id: string, orgId?: string): Promise<Story | null> {
    const story = this.stories.get(id);
    if (!story) return null;
    if (orgId && story.organizationId !== orgId) return null;
    const currentBlocks = this.blocks.get(id) || [];
    return { ...story, blocks: currentBlocks };
  }

  async findBySlug(slug: string, orgId: string): Promise<Story | null> {
    for (const story of this.stories.values()) {
      if (story.slug === slug && story.organizationId === orgId) {
        const currentBlocks = this.blocks.get(story.id) || [];
        return { ...story, blocks: currentBlocks };
      }
    }
    return null;
  }

  async create(story: Story): Promise<Story> {
    const existing = this.stories.get(story.id);
    if (existing) {
      throw new Error(`Story with id ${story.id} already exists`);
    }
    this.stories.set(story.id, { ...story });
    if (story.blocks && story.blocks.length > 0) {
      this.blocks.set(story.id, [...story.blocks]);
    } else {
      this.blocks.set(story.id, []);
    }
    return { ...story };
  }

  async update(story: Story): Promise<Story> {
    if (!this.stories.has(story.id)) {
      throw new Error(`Story with id ${story.id} does not exist`);
    }
    this.stories.set(story.id, { ...story });
    if (story.blocks) {
      this.blocks.set(story.id, [...story.blocks]);
    }
    return { ...story };
  }

  async delete(id: string, orgId: string): Promise<boolean> {
    const story = this.stories.get(id);
    if (!story || story.organizationId !== orgId) return false;
    this.stories.delete(id);
    this.versions.delete(id);
    this.blocks.delete(id);
    return true;
  }

  async listPaginated(filterOrOrgId?: StoryFilter | string, maybeOrgId?: string): Promise<PaginatedStories> {
    const filter = typeof filterOrOrgId === 'object' ? filterOrOrgId : undefined;
    const orgId = typeof filterOrOrgId === 'string' ? filterOrOrgId : maybeOrgId;

    let result = Array.from(this.stories.values()).map((s) => ({
      ...s,
      blocks: this.blocks.get(s.id) || s.blocks || [],
    }));

    if (orgId) {
      result = result.filter((s) => s.organizationId === orgId);
    }
    if (filter?.status) {
      result = result.filter((s) => s.status === filter.status);
    }
    if (filter?.articleType) {
      result = result.filter((s) => s.articleType === filter.articleType);
    }
    if (filter?.topicId) {
      result = result.filter((s) => s.topicIds?.includes(filter.topicId!));
    }
    if (filter?.entityId) {
      result = result.filter((s) => s.entityIds?.includes(filter.entityId!));
    }
    if (filter?.sourceId) {
      result = result.filter((s) => s.sourceIds?.includes(filter.sourceId!));
    }
    if (filter?.fromDate) {
      const fromTime = new Date(filter.fromDate).getTime();
      result = result.filter((s) => new Date(s.publishedAt || s.createdAt).getTime() >= fromTime);
    }
    if (filter?.toDate) {
      const toTime = new Date(filter.toDate).getTime();
      result = result.filter((s) => new Date(s.publishedAt || s.createdAt).getTime() <= toTime);
    }
    if (filter?.query) {
      const q = filter.query.toLowerCase();
      result = result.filter(
        (s) => s.title.toLowerCase().includes(q) || s.summary.toLowerCase().includes(q)
      );
    }

    result.sort((a, b) => {
      const dateA = new Date(a.publishedAt || a.updatedAt).getTime();
      const dateB = new Date(b.publishedAt || b.updatedAt).getTime();
      if (dateB !== dateA) return dateB - dateA;
      return b.id.localeCompare(a.id);
    });

    const total = result.length;
    const limit = Math.max(1, Math.min(filter?.limit ?? 50, 100));

    let startIndex = 0;
    if (filter?.cursor) {
      const decoded = decodeCursor(filter.cursor);
      if (decoded) {
        const cursorIdx = result.findIndex((s) => s.id === decoded.id);
        if (cursorIdx !== -1) {
          startIndex = cursorIdx + 1;
        } else if (decoded.updatedAt) {
          const cursorTime = new Date(decoded.updatedAt).getTime();
          startIndex = result.findIndex((s) => {
            const itemTime = new Date(s.publishedAt || s.updatedAt).getTime();
            return itemTime < cursorTime || (itemTime === cursorTime && s.id.localeCompare(decoded.id) < 0);
          });
          if (startIndex === -1) startIndex = result.length;
        }
      }
    } else if (filter?.offset && filter.offset > 0) {
      startIndex = filter.offset;
    }

    const pageSlice = result.slice(startIndex, startIndex + limit);
    const hasMore = startIndex + pageSlice.length < total;
    const lastItem = pageSlice[pageSlice.length - 1];
    const nextCursor = hasMore && lastItem ? encodeCursor({ updatedAt: lastItem.updatedAt, id: lastItem.id }) : undefined;

    return {
      items: pageSlice,
      total,
      limit,
      offset: filter?.offset,
      cursor: filter?.cursor,
      nextCursor,
      hasMore,
    };
  }

  async list(filterOrOrgId?: StoryFilter | string, maybeOrgId?: string): Promise<Story[]> {
    const paginated = await this.listPaginated(filterOrOrgId, maybeOrgId);
    return paginated.items;
  }


  async createVersion(version: StoryVersion): Promise<StoryVersion> {
    const list = this.versions.get(version.storyId) || [];
    list.push(version);
    this.versions.set(version.storyId, list);
    return version;
  }

  async getVersion(storyId: string, versionNumber: number): Promise<StoryVersion | null> {
    const list = this.versions.get(storyId) || [];
    const found = list.find((v) => v.versionNumber === versionNumber);
    return found ? { ...found } : null;
  }

  async getVersions(storyId: string): Promise<StoryVersion[]> {
    const list = this.versions.get(storyId) || [];
    return [...list].sort((a, b) => b.versionNumber - a.versionNumber);
  }

  async getBlocks(storyId: string): Promise<StoryBlock[]> {
    return [...(this.blocks.get(storyId) || [])].sort((a, b) => a.sortOrder - b.sortOrder);
  }

  async saveBlocks(storyId: string, blocks: StoryBlock[]): Promise<void> {
    const sorted = [...blocks].sort((a, b) => a.sortOrder - b.sortOrder);
    this.blocks.set(storyId, sorted);
    const story = this.stories.get(storyId);
    if (story) {
      story.blocks = sorted;
      story.updatedAt = new Date().toISOString();
      this.stories.set(storyId, story);
    }
  }

  async search(params: SearchStoriesInput, orgId?: string): Promise<PaginatedResult<StorySearchResultItem>> {
    const all = Array.from(this.stories.values()).filter((s) => (orgId ? s.organizationId === orgId : true));
    let filtered = all;

    if (params.status) {
      filtered = filtered.filter((s) => s.status === params.status);
    }
    if (params.articleType) {
      filtered = filtered.filter((s) => s.articleType === params.articleType);
    }
    if (params.topicId) {
      filtered = filtered.filter((s) => (s.topicIds || []).includes(params.topicId!));
    }
    if (params.entityId) {
      filtered = filtered.filter((s) => (s.entityIds || []).includes(params.entityId!));
    }
    if (params.sourceId) {
      filtered = filtered.filter((s) => (s.sourceIds || []).includes(params.sourceId!));
    }
    if (params.query) {
      const q = params.query.toLowerCase();
      filtered = filtered.filter(
        (s) =>
          s.title.toLowerCase().includes(q) ||
          s.summary.toLowerCase().includes(q) ||
          s.slug.toLowerCase().includes(q)
      );
    }

    // Sort by updatedAt descending
    filtered.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

    const limit = params.limit || 20;
    const items: StorySearchResultItem[] = filtered.slice(0, limit).map((s) => ({
      storyId: s.id,
      title: s.title,
      summary: s.summary,
      status: s.status,
      articleType: s.articleType,
      currentVersionNumber: s.currentVersionNumber,
      publishedAt: s.publishedAt,
      updatedAt: s.updatedAt,
      topicIds: s.topicIds || [],
      entityIds: s.entityIds || [],
      sourceCount: (s.sourceIds || []).length,
    }));

    return {
      items,
      totalCount: filtered.length,
      total: filtered.length,
      hasMore: items.length < filtered.length,
    };
  }

  async findSimilar(params: FindSimilarStoriesInput, orgId: string): Promise<StorySearchResultItem[]> {
    const all = Array.from(this.stories.values()).filter((s) => s.organizationId === orgId);
    const scored: Array<{ story: Story; score: number }> = [];

    const targetText = `${params.title} ${params.summary || ''}`;
    const threshold = params.threshold ?? 0.7;
    for (const story of all) {
      const storyText = `${story.title} ${story.summary}`;
      const score = computeTextSimilarity(targetText, storyText);
      if (score >= threshold) {
        scored.push({ story, score });
      }
    }

    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, params.limit || 5).map(({ story, score }) => ({
      storyId: story.id,
      title: story.title,
      summary: story.summary,
      status: story.status,
      articleType: story.articleType,
      currentVersionNumber: story.currentVersionNumber,
      publishedAt: story.publishedAt,
      updatedAt: story.updatedAt,
      topicIds: story.topicIds,
      entityIds: story.entityIds,
      sourceCount: story.sourceIds.length,
      similarityScore: score,
    }));
  }

  async linkTopic(storyId: string, topicId: string): Promise<void> {
    const story = this.stories.get(storyId);
    if (story && !story.topicIds.includes(topicId)) {
      story.topicIds.push(topicId);
    }
  }

  async linkEntity(storyId: string, entityId: string): Promise<void> {
    const story = this.stories.get(storyId);
    if (story && !story.entityIds.includes(entityId)) {
      story.entityIds.push(entityId);
    }
  }

  async linkSource(storyId: string, sourceId: string): Promise<void> {
    const story = this.stories.get(storyId);
    if (story && !story.sourceIds.includes(sourceId)) {
      story.sourceIds.push(sourceId);
    }
  }
}

export class InMemoryEventRepository implements IEventRepository {
  private events = new Map<string, Event>();

  async findById(id: string, orgId?: string): Promise<Event | null> {
    const event = this.events.get(id);
    if (!event) return null;
    if (orgId && event.organizationId !== orgId) return null;
    return { ...event };
  }

  async findBySlug(slug: string, orgId: string): Promise<Event | null> {
    for (const event of this.events.values()) {
      if (event.slug === slug && event.organizationId === orgId) {
        return { ...event };
      }
    }
    return null;
  }

  async create(event: Event): Promise<Event> {
    this.events.set(event.id, { ...event });
    return { ...event };
  }

  async update(event: Event): Promise<Event> {
    this.events.set(event.id, { ...event });
    return { ...event };
  }

  async list(orgId: string, limit = 50): Promise<Event[]> {
    return Array.from(this.events.values())
      .filter((e) => e.organizationId === orgId)
      .slice(0, limit);
  }

  async search(query: string, orgId: string): Promise<Event[]> {
    const q = query.toLowerCase();
    return Array.from(this.events.values()).filter(
      (e) =>
        e.organizationId === orgId &&
        (e.title.toLowerCase().includes(q) || e.summary.toLowerCase().includes(q))
    );
  }
}

export class InMemoryTopicRepository implements ITopicRepository {
  private topics = new Map<string, Topic>();

  async findById(id: string, orgId?: string): Promise<Topic | null> {
    const topic = this.topics.get(id);
    if (!topic) return null;
    if (orgId && topic.organizationId !== orgId) return null;
    return { ...topic };
  }

  async findBySlug(slug: string, orgId: string): Promise<Topic | null> {
    for (const t of this.topics.values()) {
      if (t.slug === slug && t.organizationId === orgId) return { ...t };
      if (t.aliases.includes(slug) && t.organizationId === orgId) return { ...t };
    }
    return null;
  }

  async create(topic: Topic): Promise<Topic> {
    this.topics.set(topic.id, { ...topic });
    return { ...topic };
  }

  async update(topic: Topic): Promise<Topic> {
    this.topics.set(topic.id, { ...topic });
    return { ...topic };
  }

  async list(orgId: string): Promise<Topic[]> {
    return Array.from(this.topics.values()).filter((t) => t.organizationId === orgId);
  }

  async search(query: string, orgId: string): Promise<Topic[]> {
    const q = query.toLowerCase();
    return Array.from(this.topics.values()).filter(
      (t) =>
        t.organizationId === orgId &&
        (t.name.toLowerCase().includes(q) ||
          t.slug.toLowerCase().includes(q) ||
          t.aliases.some((a) => a.toLowerCase().includes(q)))
    );
  }
}

export class InMemoryEntityRepository implements IEntityRepository {
  private entities = new Map<string, Entity>();

  async findById(id: string, orgId?: string): Promise<Entity | null> {
    const entity = this.entities.get(id);
    if (!entity) return null;
    if (orgId && entity.organizationId !== orgId) return null;
    return { ...entity };
  }

  async findBySlug(slug: string, orgId: string): Promise<Entity | null> {
    for (const e of this.entities.values()) {
      if (e.slug === slug && e.organizationId === orgId) return { ...e };
      if (e.aliases.includes(slug) && e.organizationId === orgId) return { ...e };
    }
    return null;
  }

  async create(entity: Entity): Promise<Entity> {
    this.entities.set(entity.id, { ...entity });
    return { ...entity };
  }

  async update(entity: Entity): Promise<Entity> {
    this.entities.set(entity.id, { ...entity });
    return { ...entity };
  }

  async list(orgId: string): Promise<Entity[]> {
    return Array.from(this.entities.values()).filter((e) => e.organizationId === orgId);
  }

  async search(query: string, orgId: string): Promise<Entity[]> {
    const q = query.toLowerCase();
    return Array.from(this.entities.values()).filter(
      (e) =>
        e.organizationId === orgId &&
        (e.name.toLowerCase().includes(q) ||
          e.slug.toLowerCase().includes(q) ||
          e.aliases.some((a) => a.toLowerCase().includes(q)))
    );
  }
}

export class InMemorySourceRepository implements ISourceRepository {
  private sources = new Map<string, Source>();
  private citations = new Map<string, Citation[]>(); // storyId -> citations
  private claims = new Map<string, Claim[]>(); // sourceId -> claims

  async findById(id: string, orgId?: string): Promise<Source | null> {
    const source = this.sources.get(id);
    if (!source) return null;
    if (orgId && source.organizationId !== orgId) return null;
    return { ...source };
  }

  async findByUrl(url: string, orgId: string): Promise<Source | null> {
    for (const s of this.sources.values()) {
      if (s.organizationId === orgId && (s.url === url || s.canonicalUrl === url)) {
        return { ...s };
      }
    }
    return null;
  }

  async create(source: Source): Promise<Source> {
    this.sources.set(source.id, { ...source });
    return { ...source };
  }

  async update(source: Source): Promise<Source> {
    this.sources.set(source.id, { ...source });
    return { ...source };
  }

  async list(orgId: string, limit = 50): Promise<Source[]> {
    return Array.from(this.sources.values())
      .filter((s) => s.organizationId === orgId)
      .slice(0, limit);
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
    const list = this.citations.get(citation.storyId) || [];
    list.push(citation);
    this.citations.set(citation.storyId, list);
    return citation;
  }

  async getCitationsForStory(storyId: string): Promise<Citation[]> {
    return [...(this.citations.get(storyId) || [])];
  }

  async createClaim(claim: Claim): Promise<Claim> {
    for (const srcId of claim.sourceIds) {
      const list = this.claims.get(srcId) || [];
      list.push(claim);
      this.claims.set(srcId, list);
    }
    return claim;
  }

  async getClaimsForSource(sourceId: string): Promise<Claim[]> {
    return [...(this.claims.get(sourceId) || [])];
  }
}

export class InMemoryIdempotencyRepository implements IIdempotencyRepository {
  private records = new Map<string, IdempotencyRecord>();

  private makeKey(orgId: string, key: string): string {
    return `${orgId}:${key}`;
  }

  async get(key: string, orgId: string): Promise<IdempotencyRecord | null> {
    const record = this.records.get(this.makeKey(orgId, key));
    return record ? { ...record } : null;
  }

  async save(record: IdempotencyRecord): Promise<void> {
    this.records.set(this.makeKey(record.organizationId, record.key), { ...record });
  }

  async delete(key: string, orgId: string): Promise<boolean> {
    return this.records.delete(this.makeKey(orgId, key));
  }

  async pruneExpired(now: Date = new Date()): Promise<number> {
    let pruned = 0;
    const nowIso = now.toISOString();
    for (const [k, r] of this.records.entries()) {
      if (r.expiresAt && r.expiresAt <= nowIso) {
        this.records.delete(k);
        pruned++;
      }
    }
    return pruned;
  }
}

export class InMemoryAuditRepository implements IAuditRepository {
  private logs: AuditLog[] = [];

  async log(entry: AuditLog): Promise<void> {
    this.logs.push({ ...entry });
  }

  async query(orgId: string, filter?: AuditFilter): Promise<AuditLog[]> {
    let result = this.logs.filter((l) => l.organizationId === orgId);

    if (filter) {
      if (filter.clientType) result = result.filter((l) => l.clientType === filter.clientType);
      if (filter.action) result = result.filter((l) => l.action === filter.action);
      if (filter.userId) result = result.filter((l) => l.userId === filter.userId);
      if (filter.status) result = result.filter((l) => l.status === filter.status);
      if (filter.fromDate) {
        const fromTime = new Date(filter.fromDate).getTime();
        result = result.filter((l) => new Date(l.timestamp).getTime() >= fromTime);
      }
      if (filter.toDate) {
        const toTime = new Date(filter.toDate).getTime();
        result = result.filter((l) => new Date(l.timestamp).getTime() <= toTime);
      }
    }

    result.reverse();
    const limit = filter?.limit || 100;
    return result.slice(0, limit);
  }

  async findById(id: string): Promise<AuditLog | null> {
    const entry = this.logs.find((l) => l.id === id);
    return entry ? { ...entry } : null;
  }
}
