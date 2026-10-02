import { randomUUID } from 'crypto';
import type { NavTab } from '@ai-news/schemas';
import { BASELINE_NAV_TABS } from '@ai-news/schemas';
import type { INavTabRepository } from '../../interfaces/nav-tab.repository';

export class MemoryNavTabRepository implements INavTabRepository {
  private tabs = new Map<string, NavTab>();

  constructor() {
    this.seedBaselineNavTabs();
  }

  private seedBaselineNavTabs(): void {
    for (const tab of BASELINE_NAV_TABS) {
      this.tabs.set(tab.tabId, {
        ...tab,
        id: tab.id || `tab_${tab.tabId}`,
      });
    }
  }

  async list(activeOnly: boolean = true): Promise<NavTab[]> {
    let items = Array.from(this.tabs.values());
    if (activeOnly) {
      items = items.filter((t) => t.active !== false);
    }
    items.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
    return items.map((t) => ({ ...t }));
  }

  async findById(tabId: string): Promise<NavTab | null> {
    const tab = this.tabs.get(tabId);
    return tab ? { ...tab } : null;
  }

  async create(tab: NavTab): Promise<NavTab> {
    const record: NavTab = {
      ...tab,
      id: tab.id || `tab_${randomUUID().replace(/-/g, '').slice(0, 12)}`,
    };
    this.tabs.set(record.tabId, record);
    return { ...record };
  }

  async update(tab: NavTab): Promise<NavTab> {
    if (!this.tabs.has(tab.tabId)) {
      throw new Error(`Nav tab "${tab.tabId}" does not exist`);
    }
    const updated = { ...this.tabs.get(tab.tabId)!, ...tab };
    this.tabs.set(tab.tabId, updated);
    return { ...updated };
  }

  async delete(tabId: string): Promise<boolean> {
    return this.tabs.delete(tabId);
  }

  snapshot(): Map<string, NavTab> {
    return new Map(this.tabs);
  }

  restore(snapshot: Map<string, NavTab>): void {
    this.tabs = new Map(snapshot);
  }

  clear(): void {
    this.tabs.clear();
    this.seedBaselineNavTabs();
  }
}
