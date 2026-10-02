import type { Category } from '@ai-news/schemas';

export interface ICategoryRepository {
  list(): Promise<Category[]>;
  findBySlug(slug: string): Promise<Category | null>;
  create(category: Category): Promise<Category>;
  update(category: Category): Promise<Category>;
  delete(slug: string): Promise<boolean>;
}
