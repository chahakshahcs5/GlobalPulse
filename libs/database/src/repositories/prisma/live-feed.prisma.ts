import type { LiveFeedItem } from '@ai-news/schemas';
import type { ILiveFeedRepository, LiveFeedRecord } from '../../interfaces/live-feed.repository';

interface PrismaLiveFeedRow {
  key: string;
  title: string;
  provider?: string | null;
  items: unknown;
  asOf: Date;
  refreshIntervalSeconds: number;
  license?: string | null;
  methodology?: string | null;
  sourceAttribution?: string | null;
  organizationId?: string | null;
  updatedAt: Date;
}

export class PrismaLiveFeedRepository implements ILiveFeedRepository {
  constructor(private readonly prismaGetter: () => Record<string, unknown>) {}

  private get prisma(): Record<string, unknown> {
    return this.prismaGetter();
  }

  private get feedClient():
    | {
        upsert: (args: {
          where: Record<string, unknown>;
          create: Record<string, unknown>;
          update: Record<string, unknown>;
        }) => Promise<PrismaLiveFeedRow>;
        findUnique: (args: { where: Record<string, unknown> }) => Promise<PrismaLiveFeedRow | null>;
        findMany: (args: {
          where?: Record<string, unknown>;
          orderBy?: Record<string, unknown>;
        }) => Promise<PrismaLiveFeedRow[]>;
      }
    | undefined {
    return (this.prisma as Record<string, unknown>)?.liveFeed as typeof this.feedClient;
  }

  private mapFeed(row: PrismaLiveFeedRow): LiveFeedRecord {
    const items = Array.isArray(row.items) ? (row.items as LiveFeedItem[]) : [];
    return {
      key: row.key,
      title: row.title,
      provider: row.provider ?? undefined,
      items,
      asOf:
        row.asOf instanceof Date
          ? row.asOf.toISOString()
          : String(row.asOf ?? new Date().toISOString()),
      refreshIntervalSeconds: row.refreshIntervalSeconds ?? 60,
      license: row.license ?? undefined,
      methodology: row.methodology ?? undefined,
      sourceAttribution: row.sourceAttribution ?? undefined,
      organizationId: row.organizationId ?? undefined,
      updatedAt:
        row.updatedAt instanceof Date ? row.updatedAt.toISOString() : String(row.updatedAt ?? ''),
    };
  }

  async getFeed(key: string): Promise<LiveFeedRecord | null> {
    if (!this.feedClient) return null;
    try {
      const row = await this.feedClient.findUnique({ where: { key } });
      return row ? this.mapFeed(row) : null;
    } catch {
      return null;
    }
  }

  async listFeeds(organizationId?: string): Promise<LiveFeedRecord[]> {
    if (!this.feedClient) return [];
    try {
      const rows = await this.feedClient.findMany({
        where: organizationId ? { organizationId } : undefined,
        orderBy: { key: 'asc' },
      });
      return rows.map((r) => this.mapFeed(r));
    } catch {
      return [];
    }
  }

  async saveFeed(feed: LiveFeedRecord): Promise<LiveFeedRecord> {
    if (!this.feedClient) {
      return { ...feed, items: feed.items.map((i) => ({ ...i })) };
    }
    try {
      const row = await this.feedClient.upsert({
        where: { key: feed.key },
        create: {
          key: feed.key,
          title: feed.title,
          provider: feed.provider ?? null,
          items: feed.items,
          asOf: new Date(feed.asOf),
          refreshIntervalSeconds: feed.refreshIntervalSeconds,
          license: feed.license ?? null,
          methodology: feed.methodology ?? null,
          sourceAttribution: feed.sourceAttribution ?? null,
          organizationId: feed.organizationId ?? null,
        },
        update: {
          title: feed.title,
          provider: feed.provider ?? null,
          items: feed.items,
          asOf: new Date(feed.asOf),
          refreshIntervalSeconds: feed.refreshIntervalSeconds,
          license: feed.license ?? null,
          methodology: feed.methodology ?? null,
          sourceAttribution: feed.sourceAttribution ?? null,
        },
      });
      return this.mapFeed(row);
    } catch {
      return { ...feed, items: feed.items.map((i) => ({ ...i })) };
    }
  }
}
