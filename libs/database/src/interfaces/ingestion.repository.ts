import type { IngestionFeed, IngestionItem } from '@ai-news/schemas';

export interface IngestionItemFilter {
  feedId?: string;
  status?: string;
  query?: string;
  limit?: number;
  offset?: number;
}

export interface IIngestionRepository {
  listFeeds(orgId: string, activeOnly?: boolean): Promise<IngestionFeed[]>;
  findFeedById(id: string, orgId: string): Promise<IngestionFeed | null>;
  findFeedByUrl(url: string, orgId: string): Promise<IngestionFeed | null>;
  createFeed(feed: IngestionFeed): Promise<IngestionFeed>;
  updateFeed(feed: IngestionFeed): Promise<IngestionFeed>;
  deleteFeed(id: string, orgId: string): Promise<boolean>;

  /**
   * Distinct organizations that own at least one feed.
   * Used by background schedulers to iterate tenants explicitly instead of
   * scanning every tenant's data for each poll.
   */
  listOrganizationIds(): Promise<string[]>;

  listItems(orgId: string, filter?: IngestionItemFilter): Promise<IngestionItem[]>;
  findItemById(id: string, orgId: string): Promise<IngestionItem | null>;
  findItemByDedupeHash(orgId: string, dedupeHash: string): Promise<IngestionItem | null>;
  createItem(item: IngestionItem): Promise<IngestionItem>;
  updateItem(item: IngestionItem): Promise<IngestionItem>;
  deleteItem(id: string, orgId: string): Promise<boolean>;
}
