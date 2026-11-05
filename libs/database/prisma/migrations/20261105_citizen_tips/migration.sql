-- Citizen tips: persisted whistleblower intake.
CREATE TABLE "citizen_tips" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "headline" TEXT NOT NULL,
    "details" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'general',
    "urgency" TEXT NOT NULL DEFAULT 'routine',
    "anonymityMode" TEXT NOT NULL DEFAULT 'full_anonymous',
    "verificationChecksum" TEXT NOT NULL,
    "contactAlias" TEXT,
    "attachments" JSONB NOT NULL DEFAULT '[]',
    "status" TEXT NOT NULL DEFAULT 'received',
    "editorialNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "citizen_tips_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "citizen_tips_organizationId_createdAt_idx"
    ON "citizen_tips"("organizationId", "createdAt");

CREATE INDEX "citizen_tips_organizationId_status_idx"
    ON "citizen_tips"("organizationId", "status");

CREATE INDEX "citizen_tips_organizationId_verificationChecksum_idx"
    ON "citizen_tips"("organizationId", "verificationChecksum");
