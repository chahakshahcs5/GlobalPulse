-- Migration: persist webhook dispatch logs in the database.
--
-- WebhookDelivery history was only ever accumulated in per-process memory,
-- so every restart dropped the audit trail of actual webhook deliveries.
-- This migration adds the payload JSON column the repository maps against.

ALTER TABLE "webhook_dispatch_logs" ADD COLUMN IF NOT EXISTS "payload" JSONB NOT NULL DEFAULT '{}';
