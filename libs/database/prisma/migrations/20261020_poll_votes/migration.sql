-- Migration: persist reader poll votes.
--
-- Poll votes were previously only counted inside the `poll` story block
-- payload, which meant a reader could vote repeatedly and every vote rewrote
-- the published article. Votes are now stored on their own table so the story
-- payload stays immutable and each reader has at most one vote per block.

CREATE TABLE IF NOT EXISTS "poll_votes" (
    "id" TEXT NOT NULL,
    "storyId" TEXT NOT NULL,
    "blockId" TEXT NOT NULL,
    "pollId" TEXT NOT NULL,
    "optionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "poll_votes_pkey" PRIMARY KEY ("id")
);

-- One vote per reader per poll block.
CREATE UNIQUE INDEX IF NOT EXISTS "poll_votes_blockId_userId_key" ON "poll_votes"("blockId", "userId");
CREATE INDEX IF NOT EXISTS "poll_votes_storyId_idx" ON "poll_votes"("storyId");
CREATE INDEX IF NOT EXISTS "poll_votes_organizationId_idx" ON "poll_votes"("organizationId");
