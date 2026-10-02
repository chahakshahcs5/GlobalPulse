import type { NavTab } from '@ai-news/schemas';

export interface INavTabRepository {
  list(activeOnly?: boolean): Promise<NavTab[]>;
  findById(tabId: string): Promise<NavTab | null>;
  create(tab: NavTab): Promise<NavTab>;
  update(tab: NavTab): Promise<NavTab>;
  delete(tabId: string): Promise<boolean>;
}
