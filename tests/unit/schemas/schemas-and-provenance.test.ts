import { describe, it, expect } from 'vitest';
import {
  AIStoryProvenanceSchema,
  RecordStoryProvenanceInputSchema,
  RegionalEditionCodeSchema,
  RegionalEditionSchema,
  SUPPORTED_REGIONAL_EDITIONS,
  AuditLogSchema,
  IdempotencyRecordSchema,
  CitizenTipSchema,
} from '@ai-news/schemas';

describe('Enterprise Schemas, Provenance & Localization (Unit Tests)', () => {
  describe('AI Story Provenance & C2PA Tracking', () => {
    it('validates a complete AI Story Provenance record', () => {
      const provenanceData = {
        id: 'prov_12345678',
        storyId: 'sty_quantum_01',
        generatorModel: 'gemini-1.5-pro',
        promptHash: 'sha256_e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
        confidenceScore: 0.98,
        humanReviewedBy: 'usr_editor_sarah',
        watermarkSignature: 'sig_gp_watermark_8492048102',
        c2paManifestUrl: 'https://cdn.globalpulse.org/c2pa/sty_quantum_01.c2pa',
        generationTimestamp: '2026-10-02T10:00:00Z',
        createdAt: '2026-10-02T10:05:00Z',
      };

      const parsed = AIStoryProvenanceSchema.safeParse(provenanceData);
      expect(parsed.success).toBe(true);
      if (parsed.success) {
        expect(parsed.data.generatorModel).toBe('gemini-1.5-pro');
        expect(parsed.data.confidenceScore).toBe(0.98);
        expect(parsed.data.c2paManifestUrl).toContain('.c2pa');
      }
    });

    it('rejects invalid confidence scores (< 0 or > 1)', () => {
      const invalidData = {
        id: 'prov_invalid',
        storyId: 'sty_test',
        generatorModel: 'model-x',
        promptHash: 'hash123',
        confidenceScore: 1.5, // Invalid > 1
        watermarkSignature: 'sig123',
        generationTimestamp: '2026-10-02T10:00:00Z',
        createdAt: '2026-10-02T10:05:00Z',
      };

      const parsed = AIStoryProvenanceSchema.safeParse(invalidData);
      expect(parsed.success).toBe(false);
    });

    it('validates RecordStoryProvenanceInput with default confidence score', () => {
      const input = {
        generatorModel: 'claude-3-7-sonnet',
        prompt: 'Synthesize global central bank interest rate decisions.',
      };

      const parsed = RecordStoryProvenanceInputSchema.safeParse(input);
      expect(parsed.success).toBe(true);
      if (parsed.success) {
        expect(parsed.data.confidenceScore).toBe(0.95);
      }
    });
  });

  describe('Regional Editions & Localization', () => {
    it('validates supported regional edition codes', () => {
      expect(RegionalEditionCodeSchema.safeParse('global').success).toBe(true);
      expect(RegionalEditionCodeSchema.safeParse('us').success).toBe(true);
      expect(RegionalEditionCodeSchema.safeParse('eu').success).toBe(true);
      expect(RegionalEditionCodeSchema.safeParse('uk').success).toBe(true);
      expect(RegionalEditionCodeSchema.safeParse('in').success).toBe(true);
      expect(RegionalEditionCodeSchema.safeParse('apac').success).toBe(true);
      expect(RegionalEditionCodeSchema.safeParse('invalid_zone').success).toBe(false);
    });

    it('ensures all 6 predefined SUPPORTED_REGIONAL_EDITIONS satisfy RegionalEditionSchema', () => {
      expect(SUPPORTED_REGIONAL_EDITIONS.length).toBe(6);

      for (const edition of SUPPORTED_REGIONAL_EDITIONS) {
        const parsed = RegionalEditionSchema.safeParse(edition);
        expect(parsed.success).toBe(true);
        expect(edition.code).toBeDefined();
        expect(edition.defaultLanguage).toBe('en');
        expect(edition.currency).toBeDefined();
        expect(edition.timezone).toBeDefined();
      }
    });
  });

  describe('Audit Logging & Citizen Whistleblower Tips', () => {
    it('validates an immutable AuditLog record', () => {
      const auditLog = {
        id: 'aud_987654',
        organizationId: 'org_default',
        userId: 'usr_editor_1',
        clientType: 'human_web',
        action: 'mcp.publish_story',
        resourceType: 'story',
        resourceId: 'sty_test_1',
        status: 'SUCCESS',
        timestamp: '2026-10-02T12:00:00Z',
      };

      const parsed = AuditLogSchema.safeParse(auditLog);
      expect(parsed.success).toBe(true);
    });

    it('validates an IdempotencyRecord', () => {
      const record = {
        id: 'idemp_123',
        organizationId: 'org_default',
        key: 'idemp-key-abc',
        action: 'create_story',
        responseJson: { storyId: 'sty_abc', status: 'DRAFT' },
        createdAt: '2026-10-02T12:00:00Z',
      };

      const parsed = IdempotencyRecordSchema.safeParse(record);
      expect(parsed.success).toBe(true);
    });

    it('validates CitizenTip schema with secure anonymity mode and attachments', () => {
      const tip = {
        id: 'tip_998877',
        organizationId: 'org_default',
        headline: 'Financial irregularity disclosure at regional clearinghouse',
        details:
          'Audit logs reveal unallocated balance transfers across international liquidity facilities.',
        category: 'financial_integrity',
        urgency: 'elevated',
        anonymityMode: 'full_anonymous',
        verificationChecksum: 'chk_998877665544',
        attachments: [
          {
            filename: 'audit-ledger-excerpt.csv',
            mimeType: 'text/csv',
            sizeBytes: 45020,
            checksumSha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
          },
        ],
        status: 'received',
        createdAt: '2026-10-02T14:00:00Z',
        updatedAt: '2026-10-02T14:00:00Z',
      };

      const parsed = CitizenTipSchema.safeParse(tip);
      expect(parsed.success).toBe(true);
      if (parsed.success) {
        expect(parsed.data.anonymityMode).toBe('full_anonymous');
        expect(parsed.data.attachments).toHaveLength(1);
        expect(parsed.data.attachments[0].sizeBytes).toBe(45020);
      }
    });
  });
});
