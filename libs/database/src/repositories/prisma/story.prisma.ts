import type { Story, StoryVersion, StoryBlock } from '@ai-news/schemas';
import type { IStoryRepository, StoryFilter } from '../../interfaces/story.repository';

export class PrismaStoryRepository implements IStoryRepository {
  constructor(private readonly prismaGetter: () => any) {}

  private get prisma() {
    return this.prismaGetter();
  }

  async findById(id: string, orgId?: string): Promise<Story | null> {
    const where: any = { id };
    if (orgId) where.organizationId = orgId;

    const row = await this.prisma.story.findFirst({
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
    const where: any = { slug };
    if (orgId) where.organizationId = orgId;

    const row = await this.prisma.story.findFirst({
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
    const created = await this.prisma.story.create({
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
            data: b.data as any,
          })),
        },
      },
      include: {
        blocks: { orderBy: { sortOrder: 'asc' } },
        topics: true,
        entities: true,
        sources: true,
      },
    });

    return this.mapToDomain(created);
  }

  async update(story: Story): Promise<Story> {
    const updated = await this.prisma.story.update({
      where: { id: story.id },
      data: {
        title: story.title,
        summary: story.summary,
        status: story.status as any,
        articleType: story.articleType as any,
        currentVersionNumber: story.currentVersionNumber,
        heroImageUrl: story.heroImageUrl,
        publishedAt: story.publishedAt ? new Date(story.publishedAt) : null,
      },
      include: {
        blocks: { orderBy: { sortOrder: 'asc' } },
        topics: true,
        entities: true,
        sources: true,
      },
    });

    return this.mapToDomain(updated);
  }

  async delete(id: string, orgId?: string): Promise<boolean> {
    const where: any = { id };
    if (orgId) where.organizationId = orgId;
    const res = await this.prisma.story.deleteMany({ where });
    return res.count > 0;
  }

  async list(filter?: StoryFilter, orgId?: string): Promise<Story[]> {
    const where: any = {};
    if (orgId) where.organizationId = orgId;

    if (filter) {
      if (filter.status) where.status = filter.status;
      if (filter.articleType) where.articleType = filter.articleType;
      if (filter.query) {
        where.OR = [
          { title: { contains: filter.query, mode: 'insensitive' } },
          { summary: { contains: filter.query, mode: 'insensitive' } },
        ];
      }
      if (filter.topicId) {
        where.topics = { some: { topicId: filter.topicId } };
      }
      if (filter.entityId) {
        where.entities = { some: { entityId: filter.entityId } };
      }
      if (filter.sourceId) {
        where.sources = { some: { sourceId: filter.sourceId } };
      }
    }

    const rows = await this.prisma.story.findMany({
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

    return rows.map((r: any) => this.mapToDomain(r));
  }

  async saveBlocks(storyId: string, blocks: StoryBlock[]): Promise<void> {
    await this.prisma.$transaction(async (tx: any) => {
      await tx.storyBlock.deleteMany({ where: { storyId } });
      await tx.storyBlock.createMany({
        data: blocks.map((b, idx) => ({
          id: b.id,
          storyId,
          blockType: b.blockType,
          sortOrder: b.sortOrder ?? idx,
          data: b.data as any,
        })),
      });
    });
  }

  async getBlocks(storyId: string): Promise<StoryBlock[]> {
    const rows = await this.prisma.storyBlock.findMany({
      where: { storyId },
      orderBy: { sortOrder: 'asc' },
    });
    return rows.map((r: any) => ({
      id: r.id,
      blockType: r.blockType,
      sortOrder: r.sortOrder,
      data: r.data,
    }));
  }

  async createVersion(version: StoryVersion): Promise<StoryVersion> {
    const created = await this.prisma.storyVersion.create({
      data: {
        id: version.id,
        storyId: version.storyId,
        versionNumber: version.versionNumber,
        title: version.title,
        summary: version.summary,
        changeSummary: version.changeSummary,
        blocksJson: version.blocksJson as any,
        createdBy: version.createdBy,
        clientType: version.clientType,
      },
    });

    return {
      id: created.id,
      storyId: created.storyId,
      versionNumber: created.versionNumber,
      title: created.title,
      summary: created.summary,
      changeSummary: created.changeSummary,
      blocksJson: created.blocksJson,
      createdBy: created.createdBy,
      clientType: created.clientType,
      createdAt: created.createdAt.toISOString(),
    };
  }

  async getVersions(storyId: string): Promise<StoryVersion[]> {
    const rows = await this.prisma.storyVersion.findMany({
      where: { storyId },
      orderBy: { versionNumber: 'desc' },
    });
    return rows.map((r: any) => ({
      id: r.id,
      storyId: r.storyId,
      versionNumber: r.versionNumber,
      title: r.title,
      summary: r.summary,
      changeSummary: r.changeSummary,
      blocksJson: r.blocksJson,
      createdBy: r.createdBy,
      clientType: r.clientType,
      createdAt: r.createdAt.toISOString(),
    }));
  }

  async getVersion(storyId: string, versionNumber: number): Promise<StoryVersion | null> {
    const row = await this.prisma.storyVersion.findFirst({
      where: { storyId, versionNumber },
    });
    if (!row) return null;
    return {
      id: row.id,
      storyId: row.storyId,
      versionNumber: row.versionNumber,
      title: row.title,
      summary: row.summary,
      changeSummary: row.changeSummary,
      blocksJson: row.blocksJson,
      createdBy: row.createdBy,
      clientType: row.clientType,
      createdAt: row.createdAt.toISOString(),
    };
  }

  async linkTopic(storyId: string, topicId: string): Promise<void> {
    await this.prisma.storyTopic.upsert({
      where: { storyId_topicId: { storyId, topicId } },
      create: { storyId, topicId },
      update: {},
    });
  }

  async linkEntity(storyId: string, entityId: string): Promise<void> {
    await this.prisma.storyEntity.upsert({
      where: { storyId_entityId: { storyId, entityId } },
      create: { storyId, entityId },
      update: {},
    });
  }

  async linkSource(storyId: string, sourceId: string): Promise<void> {
    await this.prisma.storySource.upsert({
      where: { storyId_sourceId: { storyId, sourceId } },
      create: { storyId, sourceId },
      update: {},
    });
  }

  async search(params: any, orgId?: string): Promise<{ items: any[]; totalCount: number }> {
    const where: any = {};
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

    const [rows, totalCount] = await Promise.all([
      this.prisma.story.findMany({
        where,
        take: params.limit || 20,
        orderBy: { updatedAt: 'desc' },
        include: {
          topics: true,
          entities: true,
          sources: true,
        },
      }),
      this.prisma.story.count({ where }),
    ]);

    const items = rows.map((s: any) => ({
      storyId: s.id,
      title: s.title,
      summary: s.summary,
      status: s.status,
      articleType: s.articleType,
      currentVersionNumber: s.currentVersionNumber,
      publishedAt: s.publishedAt ? s.publishedAt.toISOString() : undefined,
      updatedAt: s.updatedAt.toISOString(),
      topicIds: s.topics ? s.topics.map((t: any) => t.topicId) : [],
      entityIds: s.entities ? s.entities.map((e: any) => e.entityId) : [],
      sourceCount: s.sources ? s.sources.length : 0,
    }));

    return { items, totalCount };
  }

  async findSimilar(params: any, orgId: string): Promise<any[]> {
    const rows = await this.prisma.story.findMany({
      where: { organizationId: orgId },
      include: {
        topics: true,
        entities: true,
        sources: true,
      },
    });

    const targetText = `${params.title} ${params.summary || ''}`;
    const scored: Array<{ story: any; score: number }> = [];

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
      status: story.status,
      articleType: story.articleType,
      currentVersionNumber: story.currentVersionNumber,
      publishedAt: story.publishedAt ? story.publishedAt.toISOString() : undefined,
      updatedAt: story.updatedAt.toISOString(),
      topicIds: story.topics ? story.topics.map((t: any) => t.topicId) : [],
      entityIds: story.entities ? story.entities.map((e: any) => e.entityId) : [],
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

  private mapToDomain(row: any): Story {
    return {
      id: row.id,
      organizationId: row.organizationId,
      slug: row.slug,
      title: row.title,
      summary: row.summary,
      status: row.status,
      articleType: row.articleType,
      authorId: row.authorId,
      createdByClient: row.createdByClient,
      createdVia: row.createdVia,
      currentVersionNumber: row.currentVersionNumber,
      heroImageUrl: row.heroImageUrl,
      publishedAt: row.publishedAt ? row.publishedAt.toISOString() : undefined,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
      topicIds: row.topics ? row.topics.map((t: any) => t.topicId) : [],
      entityIds: row.entities ? row.entities.map((e: any) => e.entityId) : [],
      sourceIds: row.sources ? row.sources.map((s: any) => s.sourceId) : [],
      blocks: row.blocks
        ? row.blocks.map((b: any) => ({
            id: b.id,
            blockType: b.blockType,
            sortOrder: b.sortOrder,
            data: b.data,
          }))
        : [],
    };
  }
}
