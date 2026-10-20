import type { IngestionFeed, IngestionItem } from '@ai-news/schemas';
import type {
  IIngestionRepository,
  IngestionItemFilter,
} from '../../interfaces/ingestion.repository';

function cloneFeed(feed: IngestionFeed): IngestionFeed {
  return {
    ...feed,
    defaultTopicIds: [...feed.defaultTopicIds],
    defaultEntityIds: [...feed.defaultEntityIds],
  };
}

function cloneItem(item: IngestionItem): IngestionItem {
  return {
    ...item,
    signals: {
      ...item.signals,
      entityIds: [...item.signals.entityIds],
      topicIds: [...item.signals.topicIds],
    },
    claimTexts: [...item.claimTexts],
    raw: item.raw ? { ...item.raw } : undefined,
  };
}

export interface IngestionSnapshot {
  feeds: Map<string, IngestionFeed>;
  items: Map<string, IngestionItem>;
}

export class MemoryIngestionRepository implements IIngestionRepository {
  private feeds = new Map<string, IngestionFeed>();
  private items = new Map<string, IngestionItem>();

  async listFeeds(orgId: string, activeOnly = false): Promise<IngestionFeed[]> {
    return Array.from(this.feeds.values())
      .filter((f) => f.organizationId === orgId && (!activeOnly || f.active))
      .sort((a, b) => a.name.localeCompare(b.name))
      .map(cloneFeed);
  }

  async findFeedById(id: string, orgId: string): Promise<IngestionFeed | null> {
    const feed = this.feeds.get(id);
    return feed && feed.organizationId === orgId ? cloneFeed(feed) : null;
  }

  async findFeedByUrl(url: string, orgId: string): Promise<IngestionFeed | null> {
    const feed = Array.from(this.feeds.values()).find(
      (f) => f.organizationId === orgId && f.url === url
    );
    return feed ? cloneFeed(feed) : null;
  }

  async createFeed(feed: IngestionFeed): Promise<IngestionFeed> {
    if (this.feeds.has(feed.id)) {
      throw new Error(`Ingestion feed with id ${feed.id} already exists`);
    }
    const stored = cloneFeed(feed);
    this.feeds.set(stored.id, stored);
    return cloneFeed(stored);
  }

  async updateFeed(feed: IngestionFeed): Promise<IngestionFeed> {
    const existing = this.feeds.get(feed.id);
    if (!existing || existing.organizationId !== feed.organizationId) {
      throw new Error(`Ingestion feed with id ${feed.id} does not exist`);
    }
    const stored = cloneFeed(feed);
    this.feeds.set(stored.id, stored);
    return cloneFeed(stored);
  }

  async deleteFeed(id: string, orgId: string): Promise<boolean> {
    const existing = this.feeds.get(id);
    if (!existing || existing.organizationId !== orgId) return false;
    this.feeds.delete(id);
    for (const [itemId, item] of this.items) {
      if (item.feedId === id && item.organizationId === orgId) this.items.delete(itemId);
    }
    return true;
  }

  async listOrganizationIds(): Promise<string[]> {
    return Array.from(new Set(Array.from(this.feeds.values()).map((f) => f.organizationId)));
  }

  async listItems(orgId: string, filter?: IngestionItemFilter): Promise<IngestionItem[]> {
    const query = filter?.query?.toLowerCase();
    return Array.from(this.items.values())
      .filter(
        (i) =>
          i.organizationId === orgId &&
          (filter?.feedId === undefined || i.feedId === filter.feedId) &&
          (filter?.status === undefined || i.status === filter.status) &&
          (!query ||
            i.title.toLowerCase().includes(query) ||
            (i.summary || '').toLowerCase().includes(query))
      )
      .sort((a, b) => b.retrievedAt.localeCompare(a.retrievedAt))
      .slice(
        filter?.offset ?? 0,
        (filter?.offset ?? 0) + (filter?.limit ?? Number.MAX_SAFE_INTEGER)
      )
      .map(cloneItem);
  }

  async findItemById(id: string, orgId: string): Promise<IngestionItem | null> {
    const item = this.items.get(id);
    return item && item.organizationId === orgId ? cloneItem(item) : null;
  }

  async findItemByDedupeHash(orgId: string, dedupeHash: string): Promise<IngestionItem | null> {
    const item = Array.from(this.items.values()).find(
      (i) => i.organizationId === orgId && i.dedupeHash === dedupeHash
    );
    return item ? cloneItem(item) : null;
  }

  async createItem(item: IngestionItem): Promise<IngestionItem> {
    if (this.items.has(item.id)) {
      throw new Error(`Ingestion item with id ${item.id} already exists`);
    }
    const stored = cloneItem(item);
    this.items.set(stored.id, stored);
    return cloneItem(stored);
  }

  async updateItem(item: IngestionItem): Promise<IngestionItem> {
    const existing = this.items.get(item.id);
    if (!existing || existing.organizationId !== item.organizationId) {
      throw new Error(`Ingestion item with id ${item.id} does not exist`);
    }
    const stored = cloneItem(item);
    this.items.set(stored.id, stored);
    return cloneItem(stored);
  }

  async deleteItem(id: string, orgId: string): Promise<boolean> {
    const existing = this.items.get(id);
    if (!existing || existing.organizationId !== orgId) return false;
    this.items.delete(id);
    return true;
  }

  snapshot(): IngestionSnapshot {
    return { feeds: new Map(this.feeds), items: new Map(this.items) };
  }

  restore(snapshot: IngestionSnapshot): void {
    this.feeds = new Map(snapshot.feeds);
    this.items = new Map(snapshot.items);
  }

  clear(): void {
    this.feeds.clear();
    this.items.clear();
  }
}
