import type {
  Story,
  StoryVersion,
  StoryBlock,
  SearchStoriesInput,
  FindSimilarStoriesInput,
  StorySearchResultItem,
} from '@ai-news/schemas';
import type { PaginatedResult } from '@ai-news/shared';
import type { IStoryRepository, StoryFilter } from '../../interfaces/story.repository';

interface PrismaStoryBlockRow {
  id: string;
  storyId: string;
  blockType: string;
  sortOrder: number;
  data: unknown;
  metadata?: unknown;
  citationIds: string[];
}

interface PrismaStoryRow {
  id: string;
  organizationId: string;
  slug: string;
  title: string;
  summary: string;
  status: string;
  articleType: string;
  authorId: string;
  createdByClient: string;
  createdVia: string;
  currentVersionNumber: number;
  heroImageUrl?: string | null;
  publishedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  blocks?: PrismaStoryBlockRow[];
  topics?: Array<{ topicId: string }>;
  entities?: Array<{ entityId: string }>;
  sources?: Array<{ sourceId: string }>;
}

interface PrismaVersionRow {
  id: string;
  storyId: string;
  versionNumber: number;
  title: string;
  summary: string;
  blocksJson: unknown;
  changeSummary?: string | null;
  authorId: string;
  clientType: string;
  createdAt: Date;
}

export class PrismaStoryRepository implements IStoryRepository {
  constructor(private readonly prismaGetter: () => Record<string, unknown>) {}

  private get prisma(): Record<string, unknown> {
    return this.prismaGetter();
  }

  private get storyClient(): {
    findFirst: (args: { where: Record<string, unknown>; include?: Record<string, unknown> }) => Promise<PrismaStoryRow | null>;
    findMany: (args: { where: Record<string, unknown>; take?: number; orderBy?: Record<string, unknown>; include?: Record<string, unknown> }) => Promise<PrismaStoryRow[]>;
    create: (args: { data: Record<string, unknown> }) => Promise<PrismaStoryRow>;
    update: (args: { where: Record<string, unknown>; data: Record<string, unknown> }) => Promise<PrismaStoryRow>;
    delete: (args: { where: Record<string, unknown> }) => Promise<PrismaStoryRow>;
    count: (args: { where: Record<string, unknown> }) => Promise<number>;
  } {
    return this.prisma.story as {
      findFirst: (args: { where: Record<string, unknown>; include?: Record<string, unknown> }) => Promise<PrismaStoryRow | null>;
      findMany: (args: { where: Record<string, unknown>; take?: number; orderBy?: Record<string, unknown>; include?: Record<string, unknown> }) => Promise<PrismaStoryRow[]>;
      create: (args: { data: Record<string, unknown> }) => Promise<PrismaStoryRow>;
      update: (args: { where: Record<string, unknown>; data: Record<string, unknown> }) => Promise<PrismaStoryRow>;
      delete: (args: { where: Record<string, unknown> }) => Promise<PrismaStoryRow>;
      count: (args: { where: Record<string, unknown> }) => Promise<number>;
    };
  }

  private get versionClient(): {
    create: (args: { data: Record<string, unknown> }) => Promise<PrismaVersionRow>;
    findMany: (args: { where: Record<string, unknown>; orderBy?: Record<string, unknown> }) => Promise<PrismaVersionRow[]>;
    findFirst: (args: { where: Record<string, unknown> }) => Promise<PrismaVersionRow | null>;
  } {
    return this.prisma.storyVersion as {
      create: (args: { data: Record<string, unknown> }) => Promise<PrismaVersionRow>;
      findMany: (args: { where: Record<string, unknown>; orderBy?: Record<string, unknown> }) => Promise<PrismaVersionRow[]>;
      findFirst: (args: { where: Record<string, unknown> }) => Promise<PrismaVersionRow | null>;
    };
  }

  private get blockClient(): {
    deleteMany: (args: { where: Record<string, unknown> }) => Promise<{ count: number }>;
    createMany: (args: { data: Array<Record<string, unknown>> }) => Promise<{ count: number }>;
    findMany: (args: { where: Record<string, unknown>; orderBy?: Record<string, unknown> }) => Promise<PrismaStoryBlockRow[]>;
  } {
    return this.prisma.storyBlock as {
      deleteMany: (args: { where: Record<string, unknown> }) => Promise<{ count: number }>;
      createMany: (args: { data: Array<Record<string, unknown>> }) => Promise<{ count: number }>;
      findMany: (args: { where: Record<string, unknown>; orderBy?: Record<string, unknown> }) => Promise<PrismaStoryBlockRow[]>;
    };
  }

  async findById(id: string, orgId?: string): Promise<Story | null> {
    const where: Record<string, unknown> = { id };
    if (orgId) where.organizationId = orgId;

    const row = await this.storyClient.findFirst({
      where,
      include: {
        blocks: { orderBy: { sortOrder: 'asc' } },
        topics: true,
        entities: true,
        sources: true,
      },
    });

    if (!row) return null;
    return this.mapToDomain(row);
  }

  async findBySlug(slug: string, orgId?: string): Promise<Story | null> {
    const where: Record<string, unknown> = { slug };
    if (orgId) where.organizationId = orgId;

    const row = await this.storyClient.findFirst({
      where,
      include: {
        blocks: { orderBy: { sortOrder: 'asc' } },
        topics: true,
        entities: true,
        sources: true,
      },
    });

    if (!row) return null;
    return this.mapToDomain(row);
  }

  async create(story: Story): Promise<Story> {
    const created = await this.storyClient.create({
      data: {
        id: story.id,
        organizationId: story.organizationId,
        slug: story.slug,
        title: story.title,
        summary: story.summary,
        status: story.status,
        articleType: story.articleType,
        authorId: story.authorId,
        createdByClient: story.createdByClient,
        createdVia: story.createdVia || 'api',
        currentVersionNumber: story.currentVersionNumber || 1,
        heroImageUrl: story.heroImageUrl,
        publishedAt: story.publishedAt ? new Date(story.publishedAt) : null,
        blocks: {
          create: (story.blocks || []).map((b, idx) => ({
            id: b.id,
            blockType: b.blockType,
            sortOrder: b.sortOrder ?? idx,
            data: b.data,
          })),
        },
      },
    });

    return (await this.findById(created.id, story.organizationId))!;
  }

  async update(story: Story): Promise<Story> {
    await this.storyClient.update({
      where: { id: story.id },
      data: {
        title: story.title,
        summary: story.summary,
        status: story.status,
        articleType: story.articleType,
        currentVersionNumber: story.currentVersionNumber,
        heroImageUrl: story.heroImageUrl,
        publishedAt: story.publishedAt ? new Date(story.publishedAt) : null,
      },
    });

    if (story.blocks) {
      await this.saveBlocks(story.id, story.blocks);
    }

    return (await this.findById(story.id, story.organizationId))!;
  }

  async delete(id: string, orgId?: string): Promise<boolean> {
    const where: Record<string, unknown> = { id };
    if (orgId) where.organizationId = orgId;
    try {
      await this.storyClient.delete({ where });
      return true;
    } catch {
      return false;
    }
  }

  async list(filter?: StoryFilter, orgId?: string): Promise<Story[]> {
    const where: Record<string, unknown> = {};
    if (orgId) where.organizationId = orgId;
    if (filter?.status) where.status = filter.status;
    if (filter?.articleType) where.articleType = filter.articleType;
    if (filter?.topicId) {
      where.topics = { some: { topicId: filter.topicId } };
    }
    if (filter?.entityId) {
      where.entities = { some: { entityId: filter.entityId } };
    }
    if (filter?.sourceId) {
      where.sources = { some: { sourceId: filter.sourceId } };
    }
    if (filter?.query) {
      where.OR = [
        { title: { contains: filter.query, mode: 'insensitive' } },
        { summary: { contains: filter.query, mode: 'insensitive' } },
      ];
    }

    const rows = await this.storyClient.findMany({
      where,
      take: filter?.limit || 50,
      orderBy: { updatedAt: 'desc' },
      include: {
        blocks: { orderBy: { sortOrder: 'asc' } },
        topics: true,
        entities: true,
        sources: true,
      },
    });

    return rows.map((r) => this.mapToDomain(r));
  }

  async saveBlocks(storyId: string, blocks: StoryBlock[]): Promise<void> {
    await this.blockClient.deleteMany({ where: { storyId } });
    if (blocks.length > 0) {
      await this.blockClient.createMany({
        data: blocks.map((b, idx) => ({
          id: b.id,
          storyId,
          blockType: b.blockType,
          sortOrder: b.sortOrder ?? idx,
          data: b.data,
          metadata: b.metadata || null,
          citationIds: b.citationIds || [],
        })),
      });
    }
  }

  async getBlocks(storyId: string): Promise<StoryBlock[]> {
    const rows = await this.blockClient.findMany({
      where: { storyId },
      orderBy: { sortOrder: 'asc' },
    });
    return rows.map((r) => ({
      id: r.id,
      blockType: r.blockType,
      sortOrder: r.sortOrder,
      data: r.data,
      metadata: (r.metadata as Record<string, unknown>) || undefined,
      citationIds: r.citationIds,
    })) as unknown as StoryBlock[];
  }

  async createVersion(version: StoryVersion): Promise<StoryVersion> {
    const created = await this.versionClient.create({
      data: {
        id: version.id,
        storyId: version.storyId,
        versionNumber: version.versionNumber,
        title: version.title,
        summary: version.summary,
        changeSummary: version.changeSummary,
        blocksJson: version.blocks,
        authorId: version.authorId,
        clientType: version.clientType,
      },
    });

    return {
      id: created.id,
      storyId: created.storyId,
      versionNumber: created.versionNumber,
      title: created.title,
      summary: created.summary,
      changeSummary: created.changeSummary || undefined,
      blocks: (created.blocksJson as unknown) as StoryBlock[],
      authorId: created.authorId,
      clientType: created.clientType as StoryVersion['clientType'],
      createdAt: created.createdAt.toISOString(),
    };
  }

  async getVersions(storyId: string): Promise<StoryVersion[]> {
    const rows = await this.versionClient.findMany({
      where: { storyId },
      orderBy: { versionNumber: 'desc' },
    });
    return rows.map((r) => ({
      id: r.id,
      storyId: r.storyId,
      versionNumber: r.versionNumber,
      title: r.title,
      summary: r.summary,
      changeSummary: r.changeSummary || undefined,
      blocks: (r.blocksJson as unknown) as StoryBlock[],
      authorId: r.authorId,
      clientType: r.clientType as StoryVersion['clientType'],
      createdAt: r.createdAt.toISOString(),
    }));
  }

  async getVersion(storyId: string, versionNumber: number): Promise<StoryVersion | null> {
    const row = await this.versionClient.findFirst({
      where: { storyId, versionNumber },
    });
    if (!row) return null;
    return {
      id: row.id,
      storyId: row.storyId,
      versionNumber: row.versionNumber,
      title: row.title,
      summary: row.summary,
      changeSummary: row.changeSummary || undefined,
      blocks: (row.blocksJson as unknown) as StoryBlock[],
      authorId: row.authorId,
      clientType: row.clientType as StoryVersion['clientType'],
      createdAt: row.createdAt.toISOString(),
    };
  }

  async linkTopic(storyId: string, topicId: string): Promise<void> {
    const relationClient = this.prisma.storyTopic as {
      upsert: (args: { where: Record<string, unknown>; create: Record<string, unknown>; update: Record<string, unknown> }) => Promise<unknown>;
    };
    await relationClient.upsert({
      where: { storyId_topicId: { storyId, topicId } },
      create: { storyId, topicId },
      update: {},
    });
  }

  async linkEntity(storyId: string, entityId: string): Promise<void> {
    const relationClient = this.prisma.storyEntity as {
      upsert: (args: { where: Record<string, unknown>; create: Record<string, unknown>; update: Record<string, unknown> }) => Promise<unknown>;
    };
    await relationClient.upsert({
      where: { storyId_entityId: { storyId, entityId } },
      create: { storyId, entityId },
      update: {},
    });
  }

  async linkSource(storyId: string, sourceId: string): Promise<void> {
    const relationClient = this.prisma.storySource as {
      upsert: (args: { where: Record<string, unknown>; create: Record<string, unknown>; update: Record<string, unknown> }) => Promise<unknown>;
    };
    await relationClient.upsert({
      where: { storyId_sourceId: { storyId, sourceId } },
      create: { storyId, sourceId },
      update: {},
    });
  }

  async search(params: SearchStoriesInput, orgId?: string): Promise<PaginatedResult<StorySearchResultItem>> {
    const where: Record<string, unknown> = {};
    if (orgId) where.organizationId = orgId;
    if (params.status) where.status = params.status;
    if (params.articleType) where.articleType = params.articleType;
    if (params.topicId) {
      where.topics = { some: { topicId: params.topicId } };
    }
    if (params.entityId) {
      where.entities = { some: { entityId: params.entityId } };
    }
    if (params.sourceId) {
      where.sources = { some: { sourceId: params.sourceId } };
    }
    if (params.query) {
      where.OR = [
        { title: { contains: params.query, mode: 'insensitive' } },
        { summary: { contains: params.query, mode: 'insensitive' } },
        { slug: { contains: params.query, mode: 'insensitive' } },
      ];
    }

    const [rows, total] = await Promise.all([
      this.storyClient.findMany({
        where,
        take: params.limit || 20,
        orderBy: { updatedAt: 'desc' },
        include: {
          topics: true,
          entities: true,
          sources: true,
        },
      }),
      this.storyClient.count({ where }),
    ]);

    const items: StorySearchResultItem[] = rows.map((s) => ({
      storyId: s.id,
      title: s.title,
      summary: s.summary,
      status: s.status as StorySearchResultItem['status'],
      articleType: s.articleType as StorySearchResultItem['articleType'],
      currentVersionNumber: s.currentVersionNumber,
      publishedAt: s.publishedAt ? s.publishedAt.toISOString() : undefined,
      updatedAt: s.updatedAt.toISOString(),
      topicIds: s.topics ? s.topics.map((t) => t.topicId) : [],
      entityIds: s.entities ? s.entities.map((e) => e.entityId) : [],
      sourceCount: s.sources ? s.sources.length : 0,
    }));

    return {
      items,
      total,
      hasMore: items.length < total,
    };
  }

  async findSimilar(params: FindSimilarStoriesInput, orgId: string): Promise<StorySearchResultItem[]> {
    const rows = await this.storyClient.findMany({
      where: { organizationId: orgId },
      include: {
        topics: true,
        entities: true,
        sources: true,
      },
    });

    const targetText = `${params.title || ''} ${params.summary || ''}`;
    const scored: Array<{ story: PrismaStoryRow; score: number }> = [];

    for (const story of rows) {
      const storyText = `${story.title} ${story.summary || ''}`;
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
      status: story.status as StorySearchResultItem['status'],
      articleType: story.articleType as StorySearchResultItem['articleType'],
      currentVersionNumber: story.currentVersionNumber,
      publishedAt: story.publishedAt ? story.publishedAt.toISOString() : undefined,
      updatedAt: story.updatedAt.toISOString(),
      topicIds: story.topics ? story.topics.map((t) => t.topicId) : [],
      entityIds: story.entities ? story.entities.map((e) => e.entityId) : [],
      sourceCount: story.sources ? story.sources.length : 0,
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

  private mapToDomain(row: PrismaStoryRow): Story {
    return {
      id: row.id,
      organizationId: row.organizationId,
      slug: row.slug,
      title: row.title,
      summary: row.summary,
      status: row.status as Story['status'],
      articleType: row.articleType as Story['articleType'],
      authorId: row.authorId,
      createdByClient: row.createdByClient as Story['createdByClient'],
      createdVia: row.createdVia as Story['createdVia'],
      currentVersionNumber: row.currentVersionNumber,
      heroImageUrl: row.heroImageUrl || undefined,
      publishedAt: row.publishedAt ? row.publishedAt.toISOString() : undefined,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
      topicIds: row.topics ? row.topics.map((t) => t.topicId) : [],
      entityIds: row.entities ? row.entities.map((e) => e.entityId) : [],
      sourceIds: row.sources ? row.sources.map((s) => s.sourceId) : [],
      blocks: row.blocks
        ? (row.blocks.map((b) => ({
            id: b.id,
            blockType: b.blockType,
            sortOrder: b.sortOrder,
            data: b.data,
            citationIds: b.citationIds,
          })) as unknown as StoryBlock[])
        : [],
    };
  }
}
