-- Migration: AI-operable journalism intelligence platform.
--
-- Adds first-class claims/evidence, story timelines, editorial perspectives,
-- a generic knowledge graph, alert rules/triggers, ingestion feeds/items, and
-- source corrections. Also extends events (category/severity/metadata) and
-- publishers (ownership/methodology/correction policy/founding year) so map,
-- alerting, and source-intelligence features have durable storage.
--
-- All tables are additive and carry organizationId for tenant isolation.

-- ---------------------------------------------------------------------------
-- Event / Publisher extensions
-- ---------------------------------------------------------------------------

ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "category" TEXT DEFAULT 'general';
ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "severity" TEXT DEFAULT 'MODERATE';
ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "metadata" JSONB;

CREATE INDEX IF NOT EXISTS "events_organizationId_category_idx" ON "events"("organizationId", "category");
CREATE INDEX IF NOT EXISTS "events_organizationId_severity_idx" ON "events"("organizationId", "severity");

ALTER TABLE "publishers" ADD COLUMN IF NOT EXISTS "ownership" TEXT;
ALTER TABLE "publishers" ADD COLUMN IF NOT EXISTS "methodology" TEXT;
ALTER TABLE "publishers" ADD COLUMN IF NOT EXISTS "correctionPolicyUrl" TEXT;
ALTER TABLE "publishers" ADD COLUMN IF NOT EXISTS "foundedYear" INTEGER;
ALTER TABLE "publishers" ADD COLUMN IF NOT EXISTS "metadata" JSONB;

-- ---------------------------------------------------------------------------
-- Story intelligence
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS "story_claims" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "storyId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'UNVERIFIED',
    "confidence" DOUBLE PRECISION,
    "confidenceMethodology" TEXT,
    "methodology" TEXT,
    "reviewerId" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "reviewNotes" TEXT,
    "sourceIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "citationIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "story_claims_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "story_claims_organizationId_storyId_idx" ON "story_claims"("organizationId", "storyId");
CREATE INDEX IF NOT EXISTS "story_claims_organizationId_status_idx" ON "story_claims"("organizationId", "status");

CREATE TABLE IF NOT EXISTS "evidence" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "storyId" TEXT NOT NULL,
    "claimId" TEXT,
    "sourceId" TEXT,
    "citationId" TEXT,
    "type" TEXT NOT NULL DEFAULT 'OTHER',
    "title" TEXT NOT NULL,
    "description" TEXT,
    "url" TEXT,
    "excerpt" TEXT,
    "stance" TEXT NOT NULL DEFAULT 'CONTEXT',
    "strength" DOUBLE PRECISION,
    "methodology" TEXT,
    "retrievedAt" TIMESTAMP(3),
    "publishedAt" TIMESTAMP(3),
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "evidence_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "evidence_organizationId_storyId_idx" ON "evidence"("organizationId", "storyId");
CREATE INDEX IF NOT EXISTS "evidence_organizationId_claimId_idx" ON "evidence"("organizationId", "claimId");

CREATE TABLE IF NOT EXISTS "story_timeline_events" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "storyId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "eventType" TEXT NOT NULL DEFAULT 'DEVELOPMENT',
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "location" TEXT,
    "coordinates" DOUBLE PRECISION[] DEFAULT ARRAY[]::DOUBLE PRECISION[],
    "entityIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "sourceIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "citationIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "mediaUrl" TEXT,
    "authorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "story_timeline_events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "story_timeline_events_organizationId_storyId_occurredAt_idx"
    ON "story_timeline_events"("organizationId", "storyId", "occurredAt");

CREATE TABLE IF NOT EXISTS "editorial_perspectives" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "storyId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "stance" TEXT NOT NULL DEFAULT 'UNKNOWN',
    "sourceIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "citationIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "quoteExcerpt" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "editorial_perspectives_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "editorial_perspectives_organizationId_storyId_idx"
    ON "editorial_perspectives"("organizationId", "storyId");

-- ---------------------------------------------------------------------------
-- Knowledge graph
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS "knowledge_edges" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "fromType" TEXT NOT NULL,
    "fromId" TEXT NOT NULL,
    "relation" TEXT NOT NULL,
    "toType" TEXT NOT NULL,
    "toId" TEXT NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "knowledge_edges_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "knowledge_edges_organizationId_fromType_fromId_relation_toType_toId_key"
    ON "knowledge_edges"("organizationId", "fromType", "fromId", "relation", "toType", "toId");
CREATE INDEX IF NOT EXISTS "knowledge_edges_organizationId_fromType_fromId_idx"
    ON "knowledge_edges"("organizationId", "fromType", "fromId");
CREATE INDEX IF NOT EXISTS "knowledge_edges_organizationId_toType_toId_idx"
    ON "knowledge_edges"("organizationId", "toType", "toId");
CREATE INDEX IF NOT EXISTS "knowledge_edges_organizationId_relation_idx"
    ON "knowledge_edges"("organizationId", "relation");

-- ---------------------------------------------------------------------------
-- Alerts
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS "alert_rules" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "conditions" JSONB NOT NULL,
    "channels" TEXT[] DEFAULT ARRAY['in_app']::TEXT[],
    "schedule" JSONB,
    "cooldownMinutes" INTEGER NOT NULL DEFAULT 15,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastTriggeredAt" TIMESTAMP(3),
    CONSTRAINT "alert_rules_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "alert_rules_organizationId_enabled_idx" ON "alert_rules"("organizationId", "enabled");

-- Per-user alert rules: a rule with a userId is personal to that reader.
ALTER TABLE "alert_rules" ADD COLUMN IF NOT EXISTS "userId" TEXT;
ALTER TABLE "alert_rules" ADD COLUMN IF NOT EXISTS "scope" TEXT DEFAULT 'organization';
CREATE INDEX IF NOT EXISTS "alert_rules_organizationId_userId_idx" ON "alert_rules"("organizationId", "userId");

CREATE TABLE IF NOT EXISTS "alert_triggers" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "ruleId" TEXT NOT NULL,
    "resourceType" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "matchedConditions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "deliveredChannels" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "alert_triggers_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "alert_triggers_organizationId_createdAt_idx"
    ON "alert_triggers"("organizationId", "createdAt");
CREATE INDEX IF NOT EXISTS "alert_triggers_ruleId_createdAt_idx"
    ON "alert_triggers"("ruleId", "createdAt");

-- ---------------------------------------------------------------------------
-- Ingestion
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS "ingestion_feeds" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'rss',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "defaultTopicIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "defaultEntityIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "defaultSourceType" TEXT NOT NULL DEFAULT 'NEWS_ARTICLE',
    "fetchIntervalMinutes" INTEGER NOT NULL DEFAULT 15,
    "lastFetchedAt" TIMESTAMP(3),
    "lastStatus" TEXT,
    "etag" TEXT,
    "lastModified" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ingestion_feeds_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "ingestion_feeds_organizationId_url_key"
    ON "ingestion_feeds"("organizationId", "url");
CREATE INDEX IF NOT EXISTS "ingestion_feeds_organizationId_active_idx"
    ON "ingestion_feeds"("organizationId", "active");

CREATE TABLE IF NOT EXISTS "ingestion_items" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "feedId" TEXT NOT NULL,
    "externalId" TEXT,
    "url" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT,
    "contentText" TEXT,
    "author" TEXT,
    "publishedAt" TIMESTAMP(3),
    "retrievedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dedupeHash" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'NEW',
    "signals" JSONB NOT NULL,
    "claimTexts" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "raw" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ingestion_items_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "ingestion_items_organizationId_dedupeHash_key"
    ON "ingestion_items"("organizationId", "dedupeHash");
CREATE INDEX IF NOT EXISTS "ingestion_items_organizationId_feedId_idx"
    ON "ingestion_items"("organizationId", "feedId");
CREATE INDEX IF NOT EXISTS "ingestion_items_organizationId_status_idx"
    ON "ingestion_items"("organizationId", "status");

-- ---------------------------------------------------------------------------
-- Source intelligence
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS "source_corrections" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "publisherId" TEXT,
    "sourceId" TEXT,
    "storyId" TEXT,
    "type" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "url" TEXT,
    "recordedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "source_corrections_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "source_corrections_organizationId_publisherId_idx"
    ON "source_corrections"("organizationId", "publisherId");
CREATE INDEX IF NOT EXISTS "source_corrections_organizationId_sourceId_idx"
    ON "source_corrections"("organizationId", "sourceId");
CREATE INDEX IF NOT EXISTS "source_corrections_organizationId_storyId_idx"
    ON "source_corrections"("organizationId", "storyId");
