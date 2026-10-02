import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  NotFoundException,
} from '@nestjs/common';
import { db } from '@ai-news/database';
import { NestAuthGuard, RequireScope, Principal } from '../../common/auth.guard';
import type { AuthenticatedPrincipal } from '@ai-news/auth';
import { CANONICAL_CATEGORIES, Category, ArticleType } from '@ai-news/schemas';
import { ApiResponse } from '../../common/response/api-response';

@Controller('api/categories')
@UseGuards(NestAuthGuard)
export class CategoriesController {
  @Get()
  @RequireScope('news:read')
  async listCategories(@Principal() principal: AuthenticatedPrincipal) {
    const publishedStories = await db.stories.list(
      { status: 'PUBLISHED', limit: 500 },
      principal.organizationId
    );

    // Count stories per category dynamically
    const countsByArticleType: Record<string, number> = {};
    for (const story of publishedStories) {
      const type = (story.articleType || '').toLowerCase();
      countsByArticleType[type] = (countsByArticleType[type] || 0) + 1;
    }

    const dbCategories = await db.categories.list();
    const categoriesSource = dbCategories.length > 0 ? dbCategories : CANONICAL_CATEGORIES;

    const categoriesWithCounts: Category[] = categoriesSource.map((cat) => {
      // Map category to possible article types
      let count = 0;
      if (cat.slug === 'top-stories') {
        count = publishedStories.length;
      } else {
        count = countsByArticleType[cat.code] || countsByArticleType[cat.slug] || 0;
      }
      return {
        ...cat,
        storyCount: count,
      };
    });

    return categoriesWithCounts;
  }

  @Get(':slug')
  @RequireScope('news:read')
  async getCategoryBySlug(
    @Param('slug') slug: string,
    @Principal() principal: AuthenticatedPrincipal
  ) {
    const normalized = slug.toLowerCase();
    const found =
      (await db.categories.findBySlug(normalized)) ||
      CANONICAL_CATEGORIES.find((c) => c.slug === normalized || c.code === normalized);
    if (!found) {
      throw new NotFoundException(`Category "${slug}" not found`);
    }

    // Get story count
    const publishedStories = await db.stories.list(
      { status: 'PUBLISHED', limit: 500 },
      principal.organizationId
    );
    const count =
      found.slug === 'top-stories'
        ? publishedStories.length
        : publishedStories.filter(
            (s) =>
              s.articleType?.toLowerCase() === found.code ||
              s.articleType?.toLowerCase() === found.slug
          ).length;

    return { ...found, storyCount: count };
  }

  @Get(':slug/stories')
  @RequireScope('news:read')
  async getStoriesByCategory(
    @Param('slug') slug: string,
    @Query('limit') limitStr: string,
    @Principal() principal: AuthenticatedPrincipal
  ) {
    const limit = parseInt(limitStr || '20', 10);
    const normalized = slug.toLowerCase();
    const category =
      (await db.categories.findBySlug(normalized)) ||
      CANONICAL_CATEGORIES.find((c) => c.slug === normalized || c.code === normalized);

    if (normalized === 'top-stories' || normalized === 'top_stories') {
      const stories = await db.stories.list(
        { status: 'PUBLISHED', limit },
        principal.organizationId
      );
      return ApiResponse.paginated(stories, stories.length, limit);
    }

    const targetArticleType = (category ? category.code : slug) as ArticleType;
    const stories = await db.stories.list(
      { status: 'PUBLISHED', articleType: targetArticleType, limit },
      principal.organizationId
    );

    return ApiResponse.paginated(stories, stories.length, limit);
  }

  @Post()
  @RequireScope('news:write')
  async createCategory(
    @Body()
    body: {
      name: string;
      slug?: string;
      code?: string;
      description?: string;
      icon?: string;
      subCategories?: string[];
    }
  ) {
    const slug = (body.slug || body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')).toLowerCase();
    const newCat: Category = {
      id: `cat_${slug}`,
      slug,
      code: (body.code || slug).toLowerCase(),
      name: body.name,
      description: body.description || '',
      icon: body.icon || '📁',
      sortOrder: 10,
      storyCount: 0,
      isPinned: false,
      subCategories: body.subCategories || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    return db.categories.create(newCat);
  }

  @Post(':slug/desks')
  @RequireScope('news:write')
  async addCategoryDesk(@Param('slug') slug: string, @Body() body: { desk: string }) {
    const desk = (body.desk || '').trim();
    if (!desk) throw new NotFoundException('Desk name is required');
    const normalized = slug.toLowerCase();
    let found = await db.categories.findBySlug(normalized);
    if (!found) {
      const canonical = CANONICAL_CATEGORIES.find(
        (c) => c.slug === normalized || c.code === normalized
      );
      if (!canonical) throw new NotFoundException(`Category "${slug}" not found`);
      found = await db.categories.create({
        ...canonical,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }

    const currentSubs = Array.isArray(found.subCategories) ? [...found.subCategories] : [];
    if (!currentSubs.includes(desk)) {
      currentSubs.push(desk);
      found.subCategories = currentSubs;
      found.updatedAt = new Date().toISOString();
      await db.categories.update(found);
    }
    return found;
  }

  @Delete(':slug/desks/:desk')
  @RequireScope('news:write')
  async removeCategoryDesk(@Param('slug') slug: string, @Param('desk') desk: string) {
    const normalized = slug.toLowerCase();
    let found = await db.categories.findBySlug(normalized);
    if (!found) {
      const canonical = CANONICAL_CATEGORIES.find(
        (c) => c.slug === normalized || c.code === normalized
      );
      if (!canonical) throw new NotFoundException(`Category "${slug}" not found`);
      found = await db.categories.create({
        ...canonical,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }

    const currentSubs = Array.isArray(found.subCategories) ? [...found.subCategories] : [];
    const filtered = currentSubs.filter(
      (s) => s.toLowerCase() !== decodeURIComponent(desk).toLowerCase()
    );
    found.subCategories = filtered;
    found.updatedAt = new Date().toISOString();
    await db.categories.update(found);
    return found;
  }
}
