import type { NavTab } from '@ai-news/schemas';
import type { INavTabRepository } from '../../interfaces/nav-tab.repository';
import { MemoryNavTabRepository } from '../memory/nav-tab.memory';

interface PrismaNavTabRow {
  id: string;
  tabId: string;
  name: string;
  href: string;
  icon?: string | null;
  sortOrder: number;
  active: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export class PrismaNavTabRepository implements INavTabRepository {
  private fallbackMemory = new MemoryNavTabRepository();

  constructor(private readonly prismaGetter: () => Record<string, unknown>) {}

  private get prisma(): Record<string, unknown> {
    return this.prismaGetter();
  }

  private get navTabClient():
    | {
        findMany: (args?: {
          where?: Record<string, unknown>;
          orderBy?: Record<string, unknown>;
        }) => Promise<PrismaNavTabRow[]>;
        findUnique: (args: { where: Record<string, unknown> }) => Promise<PrismaNavTabRow | null>;
        create: (args: { data: Record<string, unknown> }) => Promise<PrismaNavTabRow>;
        update: (args: {
          where: Record<string, unknown>;
          data: Record<string, unknown>;
        }) => Promise<PrismaNavTabRow>;
        upsert: (args: {
          where: Record<string, unknown>;
          update: Record<string, unknown>;
          create: Record<string, unknown>;
        }) => Promise<PrismaNavTabRow>;
        delete: (args: { where: Record<string, unknown> }) => Promise<unknown>;
      }
    | undefined {
    return (this.prisma as Record<string, unknown>).navTab as typeof this.navTabClient;
  }

  private mapToDomain(row: PrismaNavTabRow): NavTab {
    return {
      id: row.id,
      tabId: row.tabId,
      name: row.name,
      href: row.href,
      icon: row.icon || undefined,
      sortOrder: row.sortOrder ?? 0,
      active: row.active ?? true,
      createdAt:
        row.createdAt instanceof Date ? row.createdAt.toISOString() : String(row.createdAt),
      updatedAt:
        row.updatedAt instanceof Date ? row.updatedAt.toISOString() : String(row.updatedAt),
    };
  }

  async list(activeOnly: boolean = true): Promise<NavTab[]> {
    if (!this.navTabClient) {
      return this.fallbackMemory.list(activeOnly);
    }
    try {
      const where: Record<string, unknown> = {};
      if (activeOnly) {
        where.active = true;
      }
      const rows = await this.navTabClient.findMany({
        where,
        orderBy: { sortOrder: 'asc' },
      });
      if (rows.length === 0) {
        return this.fallbackMemory.list(activeOnly);
      }
      return rows.map((r) => this.mapToDomain(r));
    } catch {
      return this.fallbackMemory.list(activeOnly);
    }
  }

  async findById(tabId: string): Promise<NavTab | null> {
    if (!this.navTabClient) {
      return this.fallbackMemory.findById(tabId);
    }
    try {
      const row = await this.navTabClient.findUnique({
        where: { tabId },
      });
      return row ? this.mapToDomain(row) : null;
    } catch {
      return this.fallbackMemory.findById(tabId);
    }
  }

  async create(tab: NavTab): Promise<NavTab> {
    if (!this.navTabClient) {
      return this.fallbackMemory.create(tab);
    }
    try {
      const created = await this.navTabClient.create({
        data: {
          id: tab.id,
          tabId: tab.tabId,
          name: tab.name,
          href: tab.href,
          icon: tab.icon,
          sortOrder: tab.sortOrder ?? 0,
          active: tab.active ?? true,
        },
      });
      return this.mapToDomain(created);
    } catch {
      return this.fallbackMemory.create(tab);
    }
  }

  async update(tab: NavTab): Promise<NavTab> {
    if (!this.navTabClient) {
      return this.fallbackMemory.update(tab);
    }
    try {
      const updated = await this.navTabClient.upsert({
        where: { tabId: tab.tabId },
        update: {
          name: tab.name,
          href: tab.href,
          icon: tab.icon,
          sortOrder: tab.sortOrder ?? 0,
          active: tab.active ?? true,
        },
        create: {
          id: tab.id,
          tabId: tab.tabId,
          name: tab.name,
          href: tab.href,
          icon: tab.icon,
          sortOrder: tab.sortOrder ?? 0,
          active: tab.active ?? true,
        },
      });
      return this.mapToDomain(updated);
    } catch {
      return this.fallbackMemory.update(tab);
    }
  }

  async delete(tabId: string): Promise<boolean> {
    if (!this.navTabClient) {
      return this.fallbackMemory.delete(tabId);
    }
    try {
      await this.navTabClient.delete({ where: { tabId } });
      return true;
    } catch {
      return this.fallbackMemory.delete(tabId);
    }
  }
}
