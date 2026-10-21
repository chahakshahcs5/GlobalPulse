-- Migration: persist live feeds.
--
-- Live feeds back the `live_data` and `live_ticker` story blocks. Keeping
-- them in the database (rather than in process memory) means a published
-- story still resolves its feed after a deploy, and the API and the MCP
-- server operate on the same feed.

CREATE TABLE IF NOT EXISTS "live_feeds" (
    "key" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "provider" TEXT,
    "items" JSONB NOT NULL DEFAULT '[]',
    "asOf" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "refreshIntervalSeconds" INTEGER NOT NULL DEFAULT 60,
    "license" TEXT,
    "methodology" TEXT,
    "sourceAttribution" TEXT,
    "organizationId" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "live_feeds_pkey" PRIMARY KEY ("key")
);

CREATE INDEX IF NOT EXISTS "live_feeds_organizationId_idx" ON "live_feeds"("organizationId");
