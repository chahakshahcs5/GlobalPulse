-- Migration: events.slug support.
--
-- The event repository exposes findBySlug and the in-memory engine stores
-- event slugs, but the events table never had a slug column — the Prisma
-- engine therefore looked events up by id and silently returned null for
-- every real slug lookup. This migration adds the column and the matching
-- per-organization index.

ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "slug" TEXT NOT NULL DEFAULT '';

CREATE INDEX IF NOT EXISTS "events_organizationId_slug_idx" ON "events"("organizationId", "slug");
