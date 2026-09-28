import type { Story, StoryVersion, StoryBlock, SearchStoriesInput, FindSimilarStoriesInput, StorySearchResultItem } from '@ai-news/schemas';
import { type PaginatedResult, encodeCursor, decodeCursor } from '@ai-news/shared';
import type { IStoryRepository, StoryFilter, PaginatedStories } from '../../interfaces/story.repository';


export class MemoryStoryRepository implements IStoryRepository {
  private stories = new Map<string, Story>();
  private versions = new Map<string, StoryVersion[]>();
  private blocks = new Map<string, StoryBlock[]>();

  async findById(id: string, orgId?: string): Promise<Story | null> {
    const story = this.stories.get(id);
    if (!story) return null;
    if (orgId && story.organizationId !== orgId) return null;
    const currentBlocks = this.blocks.get(id) || [];
    return { ...story, blocks: currentBlocks };
  }

  async findBySlug(slug: string, orgId?: string): Promise<Story | null> {
    for (const story of this.stories.values()) {
      if (story.slug === slug && (!orgId || story.organizationId === orgId)) {
        const currentBlocks = this.blocks.get(story.id) || [];
        return { ...story, blocks: currentBlocks };
      }
    }
    return null;
  }

  async create(story: Story): Promise<Story> {
    if (this.stories.has(story.id)) {
      throw new Error(`Story with id ${story.id} already exists`);
    }
    this.stories.set(story.id, { ...story });
    this.blocks.set(story.id, story.blocks ? [...story.blocks] : []);
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

  async delete(id: string, orgId?: string): Promise<boolean> {
    const story = this.stories.get(id);
    if (!story) return false;
    if (orgId && story.organizationId !== orgId) return false;
    this.stories.delete(id);
    this.versions.delete(id);
    this.blocks.delete(id);
    return true;
  }

  async listPaginated(
    filterOrOrgId?: StoryFilter | string,
    maybeOrgIdOrFilter?: string | StoryFilter
  ): Promise<PaginatedStories> {
    let filter: StoryFilter | undefined;
    let orgId: string | undefined;

    if (typeof filterOrOrgId === 'string') {
      orgId = filterOrOrgId;
      if (typeof maybeOrgIdOrFilter === 'object' && maybeOrgIdOrFilter !== null) {
        filter = maybeOrgIdOrFilter as StoryFilter;
      }
    } else {
      filter = filterOrOrgId;
      if (typeof maybeOrgIdOrFilter === 'string') {
        orgId = maybeOrgIdOrFilter;
      }
    }

    let result = Array.from(this.stories.values());

    if (orgId) {
      result = result.filter((s) => s.organizationId === orgId);
    }

    if (filter) {
      if (filter.status) {
        result = result.filter((s) => s.status === filter.status);
      }
      if (filter.articleType) {
        result = result.filter((s) => s.articleType === filter.articleType);
      }
      if (filter.topicId) {
        result = result.filter((s) => s.topicIds.includes(filter.topicId!));
      }
      if (filter.entityId) {
        result = result.filter((s) => s.entityIds.includes(filter.entityId!));
      }
      if (filter.sourceId) {
        result = result.filter((s) => s.sourceIds.includes(filter.sourceId!));
      }
      if (filter.fromDate) {
        const fromTime = new Date(filter.fromDate).getTime();
        result = result.filter((s) => new Date(s.publishedAt || s.createdAt).getTime() >= fromTime);
      }
      if (filter.toDate) {
        const toTime = new Date(filter.toDate).getTime();
        result = result.filter((s) => new Date(s.publishedAt || s.createdAt).getTime() <= toTime);
      }
      if (filter.query) {
        const q = filter.query.toLowerCase();
        result = result.filter(
          (s) =>
            s.title.toLowerCase().includes(q) ||
            s.summary.toLowerCase().includes(q)
        );
      }
    }

    // Stable sort by publication date or updated date descending, then id descending
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

    const items = pageSlice.map((s) => ({
      ...s,
      blocks: this.blocks.get(s.id) || [],
    }));

    return {
      items,
      total,
      limit,
      offset: filter?.offset,
      cursor: filter?.cursor,
      nextCursor,
      hasMore,
    };
  }

  async list(filterOrOrgId?: StoryFilter | string, maybeOrgIdOrFilter?: string | StoryFilter): Promise<Story[]> {
    const paginated = await this.listPaginated(filterOrOrgId, maybeOrgIdOrFilter);
    return paginated.items;
  }


  async saveBlocks(storyId: string, blocks: StoryBlock[]): Promise<void> {
    this.blocks.set(storyId, [...blocks]);
    const story = this.stories.get(storyId);
    if (story) {
      story.blocks = [...blocks];
      story.updatedAt = new Date().toISOString();
    }
  }

  async getBlocks(storyId: string): Promise<StoryBlock[]> {
    return [...(this.blocks.get(storyId) || [])];
  }

  async createVersion(version: StoryVersion): Promise<StoryVersion> {
    const list = this.versions.get(version.storyId) || [];
    list.push(version);
    this.versions.set(version.storyId, list);
    return version;
  }

  async getVersions(storyId: string): Promise<StoryVersion[]> {
    return [...(this.versions.get(storyId) || [])].sort(
      (a, b) => b.versionNumber - a.versionNumber
    );
  }

  async getVersion(storyId: string, versionNumber: number): Promise<StoryVersion | null> {
    const list = this.versions.get(storyId) || [];
    return list.find((v) => v.versionNumber === versionNumber) || null;
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

  async search(params: SearchStoriesInput, orgId?: string): Promise<PaginatedResult<StorySearchResultItem>> {
    let filtered = Array.from(this.stories.values());
    if (orgId) {
      filtered = filtered.filter((s) => s.organizationId === orgId);
    }
    if (params.status) {
      filtered = filtered.filter((s) => s.status === params.status);
    }
    if (params.articleType) {
      filtered = filtered.filter((s) => s.articleType === params.articleType);
    }
    if (params.topicId) {
      const tid = params.topicId;
      filtered = filtered.filter((s) => s.topicIds.includes(tid));
    }
    if (params.entityId) {
      const eid = params.entityId;
      filtered = filtered.filter((s) => s.entityIds.includes(eid));
    }
    if (params.sourceId) {
      const sid = params.sourceId;
      filtered = filtered.filter((s) => s.sourceIds.includes(sid));
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

    filtered.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

    const limit = params.limit || 20;
    const items = filtered.slice(0, limit).map((s) => ({
      storyId: s.id,
      title: s.title,
      summary: s.summary,
      status: s.status,
      articleType: s.articleType,
      currentVersionNumber: s.currentVersionNumber,
      publishedAt: s.publishedAt,
      updatedAt: s.updatedAt,
      topicIds: s.topicIds,
      entityIds: s.entityIds,
      sourceCount: s.sourceIds.length,
    }));

    return {
      items,
      totalCount: filtered.length,
    };
  }

  async findSimilar(params: FindSimilarStoriesInput, orgId: string): Promise<StorySearchResultItem[]> {
    const all = Array.from(this.stories.values()).filter((s) => s.organizationId === orgId);
    const scored: Array<{ story: Story; score: number }> = [];

    const targetText = `${params.title} ${params.summary || ''}`;
    for (const story of all) {
      const storyText = `${story.title} ${story.summary}`;
      const score = this.computeTextSimilarity(targetText, storyText);
      if (score >= (params.threshold ?? 0.4)) {
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

  private computeTextSimilarity(s1: string, s2: string): number {
    const set1 = new Set(s1.toLowerCase().split(/\s+/).filter((w) => w.length > 2));
    const set2 = new Set(s2.toLowerCase().split(/\s+/).filter((w) => w.length > 2));
    if (set1.size === 0 || set2.size === 0) return 0;
    let intersection = 0;
    for (const word of set1) {
      if (set2.has(word)) intersection++;
    }
    return intersection / Math.max(set1.size, set2.size);
  }

  snapshot(): {
    stories: Map<string, Story>;
    versions: Map<string, StoryVersion[]>;
    blocks: Map<string, StoryBlock[]>;
  } {
    return {
      stories: new Map(Array.from(this.stories.entries()).map(([k, v]) => [k, { ...v }])),
      versions: new Map(Array.from(this.versions.entries()).map(([k, v]) => [k, v.map((item) => ({ ...item }))])),
      blocks: new Map(Array.from(this.blocks.entries()).map(([k, v]) => [k, v.map((item) => ({ ...item }))])),
    };
  }

  restore(snap: {
    stories: Map<string, Story>;
    versions: Map<string, StoryVersion[]>;
    blocks: Map<string, StoryBlock[]>;
  }): void {
    this.stories = new Map(Array.from(snap.stories.entries()).map(([k, v]) => [k, { ...v }]));
    this.versions = new Map(Array.from(snap.versions.entries()).map(([k, v]) => [k, v.map((item) => ({ ...item }))]));
    this.blocks = new Map(Array.from(snap.blocks.entries()).map(([k, v]) => [k, v.map((item) => ({ ...item }))]));
  }

  clear(): void {
    this.stories.clear();
    this.versions.clear();
    this.blocks.clear();
  }
}
