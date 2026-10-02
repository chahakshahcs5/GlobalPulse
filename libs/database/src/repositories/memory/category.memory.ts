import { randomUUID } from 'crypto';
import type { Category } from '@ai-news/schemas';
import { CANONICAL_CATEGORIES } from '@ai-news/schemas';
import type { ICategoryRepository } from '../../interfaces/category.repository';

export class MemoryCategoryRepository implements ICategoryRepository {
  private categories = new Map<string, Category>();

  constructor() {
    this.seedBaselineCategories();
  }

  private seedBaselineCategories(): void {
    for (const cat of CANONICAL_CATEGORIES) {
      this.categories.set(cat.slug, {
        ...cat,
        id: cat.id || `cat_${cat.slug}`,
      });
    }
  }

  async list(): Promise<Category[]> {
    const items = Array.from(this.categories.values());
    items.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
    return items.map((c) => ({ ...c }));
  }

  async findBySlug(slug: string): Promise<Category | null> {
    const normalized = slug.toLowerCase();
    for (const cat of this.categories.values()) {
      if (cat.slug.toLowerCase() === normalized || cat.code.toLowerCase() === normalized) {
        return { ...cat };
      }
    }
    return null;
  }

  async create(category: Category): Promise<Category> {
    const record: Category = {
      ...category,
      id: category.id || `cat_${randomUUID().replace(/-/g, '').slice(0, 12)}`,
    };
    this.categories.set(record.slug, record);
    return { ...record };
  }

  async update(category: Category): Promise<Category> {
    if (!this.categories.has(category.slug)) {
      throw new Error(`Category "${category.slug}" does not exist`);
    }
    const updated = { ...this.categories.get(category.slug)!, ...category };
    this.categories.set(category.slug, updated);
    return { ...updated };
  }

  async delete(slug: string): Promise<boolean> {
    return this.categories.delete(slug);
  }

  snapshot(): Map<string, Category> {
    return new Map(this.categories);
  }

  restore(snapshot: Map<string, Category>): void {
    this.categories = new Map(snapshot);
  }

  clear(): void {
    this.categories.clear();
    this.seedBaselineCategories();
  }
}
