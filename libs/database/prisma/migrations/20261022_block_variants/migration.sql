-- Migration: persist the newsroom's block variants.
--
-- A variant is a named, ready-made payload for a block type. The samples
-- that ship with the Block Studio live in the repository; the newsroom's
-- own live here, so that a treatment one editor agreed on is offered to
-- everybody — the studio and the newsroom composer read the same list.
--
-- A variant that is not shared belongs to the organisation that made it;
-- the ones everybody shares are offered to every organisation.

CREATE TABLE IF NOT EXISTS "block_variants" (
    "id" TEXT NOT NULL,
    "blockType" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "data" JSONB NOT NULL DEFAULT '{}',
    "shared" BOOLEAN NOT NULL DEFAULT true,
    "organizationId" TEXT,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "block_variants_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "block_variants_blockType_idx" ON "block_variants"("blockType");
CREATE INDEX IF NOT EXISTS "block_variants_organizationId_idx" ON "block_variants"("organizationId");
