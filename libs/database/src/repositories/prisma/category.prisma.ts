import type { Category } from '@ai-news/schemas';
import type { ICategoryRepository } from '../../interfaces/category.repository';
import { MemoryCategoryRepository } from '../memory/category.memory';

interface PrismaCategoryRow {
  id: string;
  slug: string;
  code: string;
  name: string;
  description?: string | null;
  icon?: string | null;
  sortOrder: number;
  isPinned: boolean;
  subCategories: string[];
  createdAt: Date | string;
  updatedAt: Date | string;
}

export class PrismaCategoryRepository implements ICategoryRepository {
  private fallbackMemory = new MemoryCategoryRepository();

  constructor(private readonly prismaGetter: () => Record<string, unknown>) {}

  private get prisma(): Record<string, unknown> {
    return this.prismaGetter();
  }

  private get categoryClient():
    | {
        findMany: (args?: {
          where?: Record<string, unknown>;
          orderBy?: Record<string, unknown>;
        }) => Promise<PrismaCategoryRow[]>;
        findFirst: (args: { where: Record<string, unknown> }) => Promise<PrismaCategoryRow | null>;
        create: (args: { data: Record<string, unknown> }) => Promise<PrismaCategoryRow>;
        update: (args: {
          where: Record<string, unknown>;
          data: Record<string, unknown>;
        }) => Promise<PrismaCategoryRow>;
        delete: (args: { where: Record<string, unknown> }) => Promise<unknown>;
      }
    | undefined {
    return (this.prisma as Record<string, unknown>).category as typeof this.categoryClient;
  }

  private mapToDomain(row: PrismaCategoryRow): Category {
    return {
      id: row.id,
      slug: row.slug,
      code: row.code,
      name: row.name,
      description: row.description || '',
      icon: row.icon || undefined,
      sortOrder: row.sortOrder ?? 0,
      storyCount: 0,
      isPinned: row.isPinned ?? false,
      subCategories: Array.isArray(row.subCategories) ? row.subCategories : [],
      createdAt:
        row.createdAt instanceof Date ? row.createdAt.toISOString() : String(row.createdAt),
      updatedAt:
        row.updatedAt instanceof Date ? row.updatedAt.toISOString() : String(row.updatedAt),
    };
  }

  async list(): Promise<Category[]> {
    if (!this.categoryClient) {
      return this.fallbackMemory.list();
    }
    try {
      const rows = await this.categoryClient.findMany({
        orderBy: { sortOrder: 'asc' },
      });
      if (rows.length === 0) {
        return this.fallbackMemory.list();
      }
      return rows.map((r) => this.mapToDomain(r));
    } catch {
      return this.fallbackMemory.list();
    }
  }

  async findBySlug(slug: string): Promise<Category | null> {
    if (!this.categoryClient) {
      return this.fallbackMemory.findBySlug(slug);
    }
    try {
      const normalized = slug.toLowerCase();
      const row = await this.categoryClient.findFirst({
        where: {
          OR: [{ slug: normalized }, { code: normalized }],
        },
      });
      return row ? this.mapToDomain(row) : null;
    } catch {
      return this.fallbackMemory.findBySlug(slug);
    }
  }

  async create(category: Category): Promise<Category> {
    if (!this.categoryClient) {
      return this.fallbackMemory.create(category);
    }
    try {
      const created = await this.categoryClient.create({
        data: {
          id: category.id,
          slug: category.slug,
          code: category.code,
          name: category.name,
          description: category.description,
          icon: category.icon,
          sortOrder: category.sortOrder ?? 0,
          isPinned: category.isPinned ?? false,
          subCategories: category.subCategories || [],
        },
      });
      return this.mapToDomain(created);
    } catch {
      return this.fallbackMemory.create(category);
    }
  }

  async update(category: Category): Promise<Category> {
    if (!this.categoryClient) {
      return this.fallbackMemory.update(category);
    }
    try {
      const updated = await this.categoryClient.update({
        where: { slug: category.slug },
        data: {
          code: category.code,
          name: category.name,
          description: category.description,
          icon: category.icon,
          sortOrder: category.sortOrder ?? 0,
          isPinned: category.isPinned ?? false,
          subCategories: category.subCategories || [],
        },
      });
      return this.mapToDomain(updated);
    } catch {
      return this.fallbackMemory.update(category);
    }
  }

  async delete(slug: string): Promise<boolean> {
    if (!this.categoryClient) {
      return this.fallbackMemory.delete(slug);
    }
    try {
      await this.categoryClient.delete({ where: { slug } });
      return true;
    } catch {
      return this.fallbackMemory.delete(slug);
    }
  }
}
