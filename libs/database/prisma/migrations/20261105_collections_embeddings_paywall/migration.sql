-- Tenant-scoped collections
ALTER TABLE "story_collections" ADD COLUMN "organizationId" TEXT NOT NULL DEFAULT 'org_default';
ALTER TABLE "story_collections" ALTER COLUMN "organizationId" DROP DEFAULT;
DROP INDEX IF EXISTS "story_collections_slug_key";
CREATE UNIQUE INDEX "story_collections_organizationId_slug_key"
  ON "story_collections"("organizationId", "slug");
CREATE INDEX "story_collections_organizationId_curatorId_idx"
  ON "story_collections"("organizationId", "curatorId");
CREATE INDEX "story_collections_organizationId_isPublic_idx"
  ON "story_collections"("organizationId", "isPublic");
ALTER TABLE "story_collections"
  ADD CONSTRAINT "story_collections_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "organizations"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- Reader subscription entitlement
ALTER TABLE "users" ADD COLUMN "isSubscriber" BOOLEAN NOT NULL DEFAULT false;

-- Persisted semantic embeddings
CREATE TABLE "story_embeddings" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "storyId" TEXT NOT NULL,
  "versionNumber" INTEGER NOT NULL,
  "dimensions" INTEGER NOT NULL,
  "embedding" JSONB NOT NULL,
  "tokens" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "model" TEXT NOT NULL DEFAULT 'deterministic-projection-v1',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "story_embeddings_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "story_embeddings_storyId_versionNumber_key"
  ON "story_embeddings"("storyId", "versionNumber");
CREATE INDEX "story_embeddings_organizationId_storyId_idx"
  ON "story_embeddings"("organizationId", "storyId");
ALTER TABLE "story_embeddings"
  ADD CONSTRAINT "story_embeddings_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "organizations"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "story_embeddings"
  ADD CONSTRAINT "story_embeddings_storyId_fkey"
  FOREIGN KEY ("storyId") REFERENCES "stories"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- Server-side metered reads (one row per reader/story/month)
CREATE TABLE "story_reads" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "storyId" TEXT NOT NULL,
  "monthKey" TEXT NOT NULL,
  "readAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "story_reads_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "story_reads_userId_storyId_monthKey_key"
  ON "story_reads"("userId", "storyId", "monthKey");
CREATE INDEX "story_reads_organizationId_userId_monthKey_idx"
  ON "story_reads"("organizationId", "userId", "monthKey");
ALTER TABLE "story_reads"
  ADD CONSTRAINT "story_reads_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "organizations"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "story_reads"
  ADD CONSTRAINT "story_reads_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
