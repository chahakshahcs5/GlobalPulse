import type {
  Story,
  StoryVersion,
  StoryBlock,
  SearchStoriesInput,
  FindSimilarStoriesInput,
  StorySearchResultItem,
} from '@ai-news/schemas';
import { type PaginatedResult, encodeCursor, decodeCursor } from '@ai-news/shared';
import type {
  IStoryRepository,
  StoryFilter,
  PaginatedStories,
} from '../../interfaces/story.repository';

/**
 * The order the stories come back in.
 *
 * Every order ends with the id, so the order is total: two stories
 * edited at the same instant still have a fixed order, and a page never
 * shows the same story twice or skips one.
 */
function storyOrderBy(sort?: string): unknown[] {
  switch (sort) {
    case 'updated_asc':
      return [{ updatedAt: 'asc' }, { id: 'asc' }];
    case 'created_desc':
      return [{ createdAt: 'desc' }, { id: 'desc' }];
    case 'created_asc':
      return [{ createdAt: 'asc' }, { id: 'asc' }];
    case 'title_asc':
      return [{ title: 'asc' }, { id: 'asc' }];
    case 'title_desc':
      return [{ title: 'desc' }, { id: 'desc' }];
    case 'status_asc':
      return [{ status: 'asc' }, { updatedAt: 'desc' }, { id: 'desc' }];
    case 'updated_desc':
    default:
      return [{ updatedAt: 'desc' }, { id: 'desc' }];
  }
}

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
  currentVersionId?: string | null;
  heroImageUrl?: string | null;
  isSubscriberOnly?: boolean;
  scheduledPublishAt?: Date | null;
  wordCount?: number | null;
  readingTimeMinutes?: number | null;
  publishedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  blocks?: PrismaStoryBlockRow[];
  topicIds: string[];
  entityIds: string[];
  sourceIds: string[];
  categories?: string[];
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
    findFirst: (args: {
      where: Record<string, unknown>;
      include?: Record<string, unknown>;
    }) => Promise<PrismaStoryRow | null>;
    findMany: (args: {
      where: Record<string, unknown>;
      take?: number;
      skip?: number;
      cursor?: Record<string, unknown>;
      orderBy?: unknown;
      include?: Record<string, unknown>;
    }) => Promise<PrismaStoryRow[]>;
    create: (args: { data: Record<string, unknown> }) => Promise<PrismaStoryRow>;
    update: (args: {
      where: Record<string, unknown>;
      data: Record<string, unknown>;
    }) => Promise<PrismaStoryRow>;
    delete: (args: { where: Record<string, unknown> }) => Promise<PrismaStoryRow>;
    count: (args: { where: Record<string, unknown> }) => Promise<number>;
  } {
    return this.prisma.story as {
      findFirst: (args: {
        where: Record<string, unknown>;
        include?: Record<string, unknown>;
      }) => Promise<PrismaStoryRow | null>;
      findMany: (args: {
        where: Record<string, unknown>;
        take?: number;
        skip?: number;
        cursor?: Record<string, unknown>;
        orderBy?: unknown;
        include?: Record<string, unknown>;
      }) => Promise<PrismaStoryRow[]>;
      create: (args: { data: Record<string, unknown> }) => Promise<PrismaStoryRow>;
      update: (args: {
        where: Record<string, unknown>;
        data: Record<string, unknown>;
      }) => Promise<PrismaStoryRow>;
      delete: (args: { where: Record<string, unknown> }) => Promise<PrismaStoryRow>;
      count: (args: { where: Record<string, unknown> }) => Promise<number>;
    };
  }

  private get versionClient(): {
    create: (args: { data: Record<string, unknown> }) => Promise<PrismaVersionRow>;
    findMany: (args: {
      where: Record<string, unknown>;
      orderBy?: Record<string, unknown>;
    }) => Promise<PrismaVersionRow[]>;
    findFirst: (args: { where: Record<string, unknown> }) => Promise<PrismaVersionRow | null>;
    count: (args: { where: Record<string, unknown> }) => Promise<number>;
  } {
    return this.prisma.storyVersion as {
      create: (args: { data: Record<string, unknown> }) => Promise<PrismaVersionRow>;
      findMany: (args: {
        where: Record<string, unknown>;
        orderBy?: Record<string, unknown>;
      }) => Promise<PrismaVersionRow[]>;
      findFirst: (args: { where: Record<string, unknown> }) => Promise<PrismaVersionRow | null>;
      count: (args: { where: Record<string, unknown> }) => Promise<number>;
    };
  }

  private get blockClient(): {
    deleteMany: (args: { where: Record<string, unknown> }) => Promise<{ count: number }>;
    createMany: (args: { data: Array<Record<string, unknown>> }) => Promise<{ count: number }>;
    findMany: (args: {
      where: Record<string, unknown>;
      orderBy?: Record<string, unknown>;
    }) => Promise<PrismaStoryBlockRow[]>;
  } {
    return this.prisma.storyBlock as {
      deleteMany: (args: { where: Record<string, unknown> }) => Promise<{ count: number }>;
      createMany: (args: { data: Array<Record<string, unknown>> }) => Promise<{ count: number }>;
      findMany: (args: {
        where: Record<string, unknown>;
        orderBy?: Record<string, unknown>;
      }) => Promise<PrismaStoryBlockRow[]>;
    };
  }

  async findById(id: string, orgId?: string): Promise<Story | null> {
    const where: Record<string, unknown> = { id };
    if (orgId) where.organizationId = orgId;

    const row = await this.storyClient.findFirst({
      where,
      include: {
        blocks: { orderBy: { sortOrder: 'asc' } },
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
        topicIds: story.topicIds || [],
        entityIds: story.entityIds || [],
        sourceIds: story.sourceIds || [],
        categories: story.categories || [],
        currentVersionNumber: story.currentVersionNumber || 1,
        heroImageUrl: story.heroImageUrl,
        isSubscriberOnly: story.isSubscriberOnly ?? false,
        scheduledPublishAt: story.scheduledPublishAt ? new Date(story.scheduledPublishAt) : null,
        wordCount: story.wordCount ?? null,
        readingTimeMinutes: story.readingTimeMinutes ?? null,
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
        topicIds: story.topicIds || [],
        entityIds: story.entityIds || [],
        sourceIds: story.sourceIds || [],
        categories: story.categories || [],
        currentVersionNumber: story.currentVersionNumber,
        // The story has to record which version is current, not just how
        // many there are. Without this the id is lost on every commit.
        currentVersionId: story.currentVersionId ?? null,
        heroImageUrl: story.heroImageUrl,
        isSubscriberOnly: story.isSubscriberOnly ?? false,
        scheduledPublishAt: story.scheduledPublishAt ? new Date(story.scheduledPublishAt) : null,
        wordCount: story.wordCount ?? null,
        readingTimeMinutes: story.readingTimeMinutes ?? null,
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

  async listPaginated(filter?: StoryFilter, orgId?: string): Promise<PaginatedStories> {
    const where: Record<string, unknown> = {};
    if (orgId) where.organizationId = orgId;
    if (filter?.status) where.status = filter.status;
    if (filter?.articleType) where.articleType = filter.articleType;
    if (filter?.topicId) {
      where.topicIds = { has: filter.topicId };
    }
    if (filter?.entityId) {
      where.entityIds = { has: filter.entityId };
    }
    if (filter?.sourceId) {
      where.sourceIds = { has: filter.sourceId };
    }
    if (filter?.query) {
      where.OR = [
        { title: { contains: filter.query, mode: 'insensitive' } },
        { summary: { contains: filter.query, mode: 'insensitive' } },
      ];
    }
    if (filter?.fromDate || filter?.toDate) {
      const dateFilter: Record<string, unknown> = {};
      if (filter.fromDate) dateFilter.gte = new Date(filter.fromDate);
      if (filter.toDate) dateFilter.lte = new Date(filter.toDate);
      where.createdAt = dateFilter;
    }

    const limit = Math.max(1, Math.min(filter?.limit ?? 50, 100));
    const total = await this.storyClient.count({ where });

    const findManyArgs: {
      where: Record<string, unknown>;
      take: number;
      skip?: number;
      cursor?: Record<string, unknown>;
      orderBy: unknown;
      include: Record<string, unknown>;
    } = {
      where,
      take: limit + 1,
      orderBy: storyOrderBy(filter?.sort),
      include: {
        blocks: { orderBy: { sortOrder: 'asc' } },
      },
    };

    if (filter?.cursor) {
      const decoded = decodeCursor(filter.cursor);
      if (decoded && decoded.id) {
        findManyArgs.cursor = { id: decoded.id };
        findManyArgs.skip = 1;
      }
    } else if (filter?.offset && filter.offset > 0) {
      findManyArgs.skip = filter.offset;
    }

    const rows = await this.storyClient.findMany(findManyArgs);
    const hasMore = rows.length > limit;
    const pageRows = hasMore ? rows.slice(0, limit) : rows;
    const items = pageRows.map((r) => this.mapToDomain(r));
    const lastItem = items[items.length - 1];
    const nextCursor =
      hasMore && lastItem
        ? encodeCursor({ updatedAt: lastItem.updatedAt, id: lastItem.id })
        : undefined;

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

  async list(filter?: StoryFilter, orgId?: string): Promise<Story[]> {
    const paginated = await this.listPaginated(filter, orgId);
    return paginated.items;
  }

  /**
   * How many stories there are, and how many in each state.
   *
   * Counted by the database rather than by counting a list, because a list
   * is a page and the newsroom is not a page.
   */
  async countByStatus(orgId?: string): Promise<Record<string, number>> {
    const where: Record<string, unknown> = {};
    if (orgId) where.organizationId = orgId;

    const statuses = ['DRAFT', 'PUBLISHED', 'IN_REVIEW', 'SCHEDULED', 'ARCHIVED'];

    const counts: Record<string, number> = {};
    for (const status of statuses) {
      counts[status] = await this.storyClient.count({ where: { ...where, status } });
    }
    return counts;
  }

  /**
   * How many versions these stories have, between them.
   *
   * One query for the lot.
   */
  async countVersions(storyIds: string[]): Promise<number> {
    if (storyIds.length === 0) return 0;
    return this.versionClient.count({ where: { storyId: { in: storyIds } } });
  }

  async saveBlocks(storyId: string, blocks: StoryBlock[]): Promise<void> {
    const prismaClient = this.prisma as {
      $transaction?: (fn: (tx: Record<string, unknown>) => Promise<void>) => Promise<void>;
    };

    if (typeof prismaClient.$transaction === 'function') {
      await prismaClient.$transaction(async (tx) => {
        const blockClient = tx.storyBlock as typeof this.blockClient;
        await blockClient.deleteMany({ where: { storyId } });
        if (blocks.length > 0) {
          await blockClient.createMany({
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
      });
    } else {
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
      blocks: created.blocksJson as unknown as StoryBlock[],
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
      blocks: r.blocksJson as unknown as StoryBlock[],
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
      blocks: row.blocksJson as unknown as StoryBlock[],
      authorId: row.authorId,
      clientType: row.clientType as StoryVersion['clientType'],
      createdAt: row.createdAt.toISOString(),
    };
  }

  async linkTopic(storyId: string, topicId: string): Promise<void> {
    const relationClient = this.prisma.storyTopic as {
      upsert: (args: {
        where: Record<string, unknown>;
        create: Record<string, unknown>;
        update: Record<string, unknown>;
      }) => Promise<unknown>;
    };
    await relationClient.upsert({
      where: { storyId_topicId: { storyId, topicId } },
      create: { storyId, topicId },
      update: {},
    });
  }

  async linkEntity(storyId: string, entityId: string): Promise<void> {
    const relationClient = this.prisma.storyEntity as {
      upsert: (args: {
        where: Record<string, unknown>;
        create: Record<string, unknown>;
        update: Record<string, unknown>;
      }) => Promise<unknown>;
    };
    await relationClient.upsert({
      where: { storyId_entityId: { storyId, entityId } },
      create: { storyId, entityId },
      update: {},
    });
  }

  async linkSource(storyId: string, sourceId: string): Promise<void> {
    const relationClient = this.prisma.storySource as {
      upsert: (args: {
        where: Record<string, unknown>;
        create: Record<string, unknown>;
        update: Record<string, unknown>;
      }) => Promise<unknown>;
    };
    await relationClient.upsert({
      where: { storyId_sourceId: { storyId, sourceId } },
      create: { storyId, sourceId },
      update: {},
    });
  }

  async search(
    params: SearchStoriesInput,
    orgId?: string
  ): Promise<PaginatedResult<StorySearchResultItem>> {
    const where: Record<string, unknown> = {};
    if (orgId) where.organizationId = orgId;
    if (params.status) where.status = params.status;
    if (params.articleType) where.articleType = params.articleType;
    if (params.topicId) {
      where.topicIds = { has: params.topicId };
    }
    if (params.entityId) {
      where.entityIds = { has: params.entityId };
    }
    if (params.sourceId) {
      where.sourceIds = { has: params.sourceId };
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
      topicIds: s.topicIds,
      entityIds: s.entityIds,
      sourceCount: s.sourceIds.length,
    }));

    return {
      items,
      total,
      hasMore: items.length < total,
    };
  }

  async findSimilar(
    params: FindSimilarStoriesInput,
    orgId: string
  ): Promise<StorySearchResultItem[]> {
    const rows = await this.storyClient.findMany({
      where: { organizationId: orgId },
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
      topicIds: story.topicIds,
      entityIds: story.entityIds,
      sourceCount: story.sourceIds.length,
      similarityScore: score,
    }));
  }

  private computeTextSimilarity(s1: string, s2: string): number {
    const set1 = new Set(
      s1
        .toLowerCase()
        .split(/\s+/)
        .filter((w) => w.length > 2)
    );
    const set2 = new Set(
      s2
        .toLowerCase()
        .split(/\s+/)
        .filter((w) => w.length > 2)
    );
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
      currentVersionId: row.currentVersionId ?? undefined,
      heroImageUrl: row.heroImageUrl || undefined,
      isSubscriberOnly: row.isSubscriberOnly ?? false,
      scheduledPublishAt: row.scheduledPublishAt ? row.scheduledPublishAt.toISOString() : undefined,
      wordCount: row.wordCount ?? undefined,
      readingTimeMinutes: row.readingTimeMinutes ?? undefined,
      publishedAt: row.publishedAt ? row.publishedAt.toISOString() : undefined,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
      topicIds: row.topicIds,
      entityIds: row.entityIds,
      sourceIds: row.sourceIds,
      categories: row.categories || [],
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
