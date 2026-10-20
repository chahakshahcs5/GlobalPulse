-- Migration: category routing fix.
--
-- The category pages (apps/api categories.controller, apps/web categories page)
-- file stories by stories.articleType, and assign_story_categories wrote to a
-- field the Prisma repository never persisted. This migration:
--   1. extends the ArticleType enum with the category codes that were missing,
--      so a story can actually be filed under india / health / world / entertainment;
--   2. adds the stories.categories column the repository now maps.
--
-- Postgres cannot use a new enum value in the same transaction that adds it, so
-- the ALTER TYPE statements are run outside a transaction block.

ALTER TYPE "ArticleType" ADD VALUE IF NOT EXISTS 'india';
ALTER TYPE "ArticleType" ADD VALUE IF NOT EXISTS 'health';
ALTER TYPE "ArticleType" ADD VALUE IF NOT EXISTS 'world';
ALTER TYPE "ArticleType" ADD VALUE IF NOT EXISTS 'entertainment';

ALTER TABLE stories ADD COLUMN IF NOT EXISTS categories text[] NOT NULL DEFAULT ARRAY[]::text[];

CREATE INDEX IF NOT EXISTS stories_categories_idx ON stories USING gin (categories);
