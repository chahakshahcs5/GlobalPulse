import type { IngestionFeed, IngestionItem } from '@ai-news/schemas';
import { IngestionSignalsSchema } from '@ai-news/schemas';
import type {
  IIngestionRepository,
  IngestionItemFilter,
} from '../../interfaces/ingestion.repository';
import { MemoryIngestionRepository } from '../memory/ingestion.memory';

type Row = Record<string, unknown>;

function iso(value: unknown): string {
  return value instanceof Date ? value.toISOString() : String(value);
}

function optionalIso(value: unknown): string | undefined {
  return value ? iso(value) : undefined;
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value) ? (value as string[]) : [];
}

interface ModelClient {
  findMany: (args?: Record<string, unknown>) => Promise<Row[]>;
  findFirst: (args: Record<string, unknown>) => Promise<Row | null>;
  create: (args: { data: Record<string, unknown> }) => Promise<Row>;
  update: (args: { where: Record<string, unknown>; data: Record<string, unknown> }) => Promise<Row>;
  deleteMany: (args: { where: Record<string, unknown> }) => Promise<{ count: number }>;
}

export class PrismaIngestionRepository implements IIngestionRepository {
  private readonly fallback = new MemoryIngestionRepository();

  constructor(private readonly prismaGetter: () => Record<string, unknown>) {}

  private get prisma(): Record<string, unknown> {
    return this.prismaGetter();
  }

  private client(name: string): ModelClient | undefined {
    return this.prisma[name] as ModelClient | undefined;
  }

  private mapFeed(row: Row): IngestionFeed {
    return {
      id: String(row.id),
      organizationId: String(row.organizationId),
      name: String(row.name),
      url: String(row.url),
      type: String(row.type) as IngestionFeed['type'],
      active: Boolean(row.active),
      defaultTopicIds: stringArray(row.defaultTopicIds),
      defaultEntityIds: stringArray(row.defaultEntityIds),
      defaultSourceType: String(row.defaultSourceType ?? 'NEWS_ARTICLE'),
      fetchIntervalMinutes: Number(row.fetchIntervalMinutes ?? 15),
      lastFetchedAt: optionalIso(row.lastFetchedAt),
      lastStatus: (row.lastStatus as string | null) ?? undefined,
      etag: (row.etag as string | null) ?? undefined,
      lastModified: (row.lastModified as string | null) ?? undefined,
      createdBy: String(row.createdBy),
      createdAt: iso(row.createdAt),
      updatedAt: iso(row.updatedAt),
    };
  }

  private mapItem(row: Row): IngestionItem {
    return {
      id: String(row.id),
      organizationId: String(row.organizationId),
      feedId: String(row.feedId),
      externalId: (row.externalId as string | null) ?? undefined,
      url: String(row.url),
      title: String(row.title),
      summary: (row.summary as string | null) ?? undefined,
      contentText: (row.contentText as string | null) ?? undefined,
      author: (row.author as string | null) ?? undefined,
      publishedAt: optionalIso(row.publishedAt),
      retrievedAt: iso(row.retrievedAt),
      dedupeHash: String(row.dedupeHash),
      status: String(row.status) as IngestionItem['status'],
      signals: IngestionSignalsSchema.parse(row.signals ?? {}),
      claimTexts: stringArray(row.claimTexts),
      raw: (row.raw as Record<string, unknown> | null) ?? undefined,
      createdAt: iso(row.createdAt),
      updatedAt: iso(row.updatedAt),
    };
  }

  // --- Feeds ----------------------------------------------------------------

  async listFeeds(orgId: string, activeOnly = false): Promise<IngestionFeed[]> {
    const client = this.client('ingestionFeed');
    if (!client) return this.fallback.listFeeds(orgId, activeOnly);
    try {
      const where: Record<string, unknown> = { organizationId: orgId };
      if (activeOnly) where.active = true;
      const rows = await client.findMany({ where, orderBy: { name: 'asc' } });
      return rows.map((r) => this.mapFeed(r));
    } catch {
      return this.fallback.listFeeds(orgId, activeOnly);
    }
  }

  async findFeedById(id: string, orgId: string): Promise<IngestionFeed | null> {
    const client = this.client('ingestionFeed');
    if (!client) return this.fallback.findFeedById(id, orgId);
    try {
      const row = await client.findFirst({ where: { id, organizationId: orgId } });
      return row ? this.mapFeed(row) : null;
    } catch {
      return this.fallback.findFeedById(id, orgId);
    }
  }

  async findFeedByUrl(url: string, orgId: string): Promise<IngestionFeed | null> {
    const client = this.client('ingestionFeed');
    if (!client) return this.fallback.findFeedByUrl(url, orgId);
    try {
      const row = await client.findFirst({ where: { url, organizationId: orgId } });
      return row ? this.mapFeed(row) : null;
    } catch {
      return this.fallback.findFeedByUrl(url, orgId);
    }
  }

  async createFeed(feed: IngestionFeed): Promise<IngestionFeed> {
    const client = this.client('ingestionFeed');
    if (!client) return this.fallback.createFeed(feed);
    try {
      const row = await client.create({
        data: {
          ...feed,
          lastFetchedAt: feed.lastFetchedAt ? new Date(feed.lastFetchedAt) : null,
          createdAt: new Date(feed.createdAt),
          updatedAt: new Date(feed.updatedAt),
        },
      });
      return this.mapFeed(row);
    } catch {
      return this.fallback.createFeed(feed);
    }
  }

  async updateFeed(feed: IngestionFeed): Promise<IngestionFeed> {
    const client = this.client('ingestionFeed');
    if (!client) return this.fallback.updateFeed(feed);
    try {
      const row = await client.update({
        where: { id: feed.id },
        data: {
          name: feed.name,
          url: feed.url,
          type: feed.type,
          active: feed.active,
          defaultTopicIds: feed.defaultTopicIds,
          defaultEntityIds: feed.defaultEntityIds,
          defaultSourceType: feed.defaultSourceType,
          fetchIntervalMinutes: feed.fetchIntervalMinutes,
          lastFetchedAt: feed.lastFetchedAt ? new Date(feed.lastFetchedAt) : null,
          lastStatus: feed.lastStatus,
          etag: feed.etag,
          lastModified: feed.lastModified,
          updatedAt: new Date(feed.updatedAt),
        },
      });
      return this.mapFeed(row);
    } catch {
      return this.fallback.updateFeed(feed);
    }
  }

  async deleteFeed(id: string, orgId: string): Promise<boolean> {
    const client = this.client('ingestionFeed');
    if (!client) return this.fallback.deleteFeed(id, orgId);
    try {
      const result = await client.deleteMany({ where: { id, organizationId: orgId } });
      const items = this.client('ingestionItem');
      if (items) await items.deleteMany({ where: { feedId: id, organizationId: orgId } });
      return result.count > 0;
    } catch {
      return this.fallback.deleteFeed(id, orgId);
    }
  }

  // --- Items ----------------------------------------------------------------

  async listOrganizationIds(): Promise<string[]> {
    const client = this.client('ingestionFeed');
    if (!client) return this.fallback.listOrganizationIds();
    try {
      const rows = await client.findMany({
        distinct: ['organizationId'],
        select: { organizationId: true },
      });
      return rows.map((row) => String(row.organizationId));
    } catch {
      return this.fallback.listOrganizationIds();
    }
  }

  async listItems(orgId: string, filter?: IngestionItemFilter): Promise<IngestionItem[]> {
    const client = this.client('ingestionItem');
    if (!client) return this.fallback.listItems(orgId, filter);
    try {
      const where: Record<string, unknown> = { organizationId: orgId };
      if (filter?.feedId) where.feedId = filter.feedId;
      if (filter?.status) where.status = filter.status;
      if (filter?.query) {
        where.OR = [
          { title: { contains: filter.query, mode: 'insensitive' } },
          { summary: { contains: filter.query, mode: 'insensitive' } },
        ];
      }
      const rows = await client.findMany({
        where,
        orderBy: { retrievedAt: 'desc' },
        take: filter?.limit,
        skip: filter?.offset,
      });
      return rows.map((r) => this.mapItem(r));
    } catch {
      return this.fallback.listItems(orgId, filter);
    }
  }

  async findItemById(id: string, orgId: string): Promise<IngestionItem | null> {
    const client = this.client('ingestionItem');
    if (!client) return this.fallback.findItemById(id, orgId);
    try {
      const row = await client.findFirst({ where: { id, organizationId: orgId } });
      return row ? this.mapItem(row) : null;
    } catch {
      return this.fallback.findItemById(id, orgId);
    }
  }

  async findItemByDedupeHash(orgId: string, dedupeHash: string): Promise<IngestionItem | null> {
    const client = this.client('ingestionItem');
    if (!client) return this.fallback.findItemByDedupeHash(orgId, dedupeHash);
    try {
      const row = await client.findFirst({ where: { organizationId: orgId, dedupeHash } });
      return row ? this.mapItem(row) : null;
    } catch {
      return this.fallback.findItemByDedupeHash(orgId, dedupeHash);
    }
  }

  async createItem(item: IngestionItem): Promise<IngestionItem> {
    const client = this.client('ingestionItem');
    if (!client) return this.fallback.createItem(item);
    try {
      const row = await client.create({
        data: {
          ...item,
          publishedAt: item.publishedAt ? new Date(item.publishedAt) : null,
          retrievedAt: new Date(item.retrievedAt),
          createdAt: new Date(item.createdAt),
          updatedAt: new Date(item.updatedAt),
        },
      });
      return this.mapItem(row);
    } catch {
      return this.fallback.createItem(item);
    }
  }

  async updateItem(item: IngestionItem): Promise<IngestionItem> {
    const client = this.client('ingestionItem');
    if (!client) return this.fallback.updateItem(item);
    try {
      const row = await client.update({
        where: { id: item.id },
        data: {
          externalId: item.externalId,
          url: item.url,
          title: item.title,
          summary: item.summary,
          contentText: item.contentText,
          author: item.author,
          publishedAt: item.publishedAt ? new Date(item.publishedAt) : null,
          dedupeHash: item.dedupeHash,
          status: item.status,
          signals: item.signals,
          claimTexts: item.claimTexts,
          raw: item.raw,
          updatedAt: new Date(item.updatedAt),
        },
      });
      return this.mapItem(row);
    } catch {
      return this.fallback.updateItem(item);
    }
  }

  async deleteItem(id: string, orgId: string): Promise<boolean> {
    const client = this.client('ingestionItem');
    if (!client) return this.fallback.deleteItem(id, orgId);
    try {
      const result = await client.deleteMany({ where: { id, organizationId: orgId } });
      return result.count > 0;
    } catch {
      return this.fallback.deleteItem(id, orgId);
    }
  }
}
