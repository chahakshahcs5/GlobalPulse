import { describe, it, expect, beforeEach } from 'vitest';
import {
  StoryPerspectiveSchema,
  CreateStoryPerspectiveInputSchema,
  CitizenTipSchema,
  SubmitCitizenTipInputSchema,
} from '@ai-news/schemas';
import { PerspectivesService, CitizenTipsService } from '@ai-news/stories';

describe('Community Perspectives & Whistleblower Tip Line', () => {
  describe('Schemas Validation', () => {
    it('should validate valid StoryPerspective', () => {
      const validPerspective = {
        id: 'psp_test_1',
        storyId: 'sty_cop30',
        organizationId: 'org_test',
        authorId: 'usr_climate',
        authorName: 'Dr. Expert',
        authorRole: 'subscriber' as const,
        stance: 'analytical' as const,
        targetParagraphQuote: 'Agreement signed by 194 delegations.',
        argument: 'Crucial progress, but requires multilateral validation before fund delivery.',
        evidenceUrl: 'https://unfccc.int',
        status: 'approved' as const,
        upvotes: 12,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const parsed = StoryPerspectiveSchema.parse(validPerspective);
      expect(parsed.stance).toBe('analytical');
      expect(parsed.upvotes).toBe(12);
    });

    it('should reject invalid stance in StoryPerspective', () => {
      expect(() =>
        CreateStoryPerspectiveInputSchema.parse({
          stance: 'unsupported_stance' as never,
          argument: 'Test argument',
        })
      ).toThrow();
    });

    it('should validate CitizenTip schema', () => {
      const validTip = {
        id: 'tip_123',
        organizationId: 'org_test',
        headline: 'Unauthorized Autonomous Flight Corridors',
        details: 'Internal FAA telemetry logs show drones testing outside allocated air corridors.',
        category: 'defense',
        urgency: 'elevated' as const,
        anonymityMode: 'full_anonymous' as const,
        verificationChecksum:
          'sha256:7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069',
        attachments: [],
        status: 'received' as const,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const parsed = CitizenTipSchema.parse(validTip);
      expect(parsed.category).toBe('defense');
      expect(parsed.anonymityMode).toBe('full_anonymous');
    });

    it('should validate SubmitCitizenTipInputSchema and enforce minimum lengths', () => {
      expect(() =>
        SubmitCitizenTipInputSchema.parse({
          headline: '',
          details: 'Details',
          verificationChecksum: 'short',
        })
      ).toThrow();
    });
  });

  describe('PerspectivesService', () => {
    let service: PerspectivesService;

    beforeEach(() => {
      service = new PerspectivesService();
    });

    it('should submit and retrieve community perspectives', async () => {
      const created = await service.submitPerspective(
        'sty_custom_1',
        {
          stance: 'in_favor',
          argument: 'High compute disclosure standards protect public interest.',
          authorName: 'Sovereign AI Advocate',
        },
        { id: 'usr_me', name: 'Sovereign AI Advocate', role: 'reader' },
        'org_default'
      );

      expect(created.id).toMatch(/^psp_/);
      expect(created.stance).toBe('in_favor');

      const list = await service.listPerspectives('sty_custom_1');
      expect(list.length).toBe(1);
      expect(list[0].id).toBe(created.id);
    });

    it('should filter perspectives by stance', async () => {
      await service.submitPerspective(
        'sty_filter_test',
        { stance: 'in_favor', argument: 'In favor argument' },
        { id: 'usr_1', name: 'User 1' },
        'org_default'
      );
      await service.submitPerspective(
        'sty_filter_test',
        { stance: 'dissenting', argument: 'Dissenting argument' },
        { id: 'usr_2', name: 'User 2' },
        'org_default'
      );

      const inFavorOnly = await service.listPerspectives('sty_filter_test', { stance: 'in_favor' });
      expect(inFavorOnly.length).toBe(1);
      expect(inFavorOnly[0].stance).toBe('in_favor');

      const dissentingOnly = await service.listPerspectives('sty_filter_test', {
        stance: 'dissenting',
      });
      expect(dissentingOnly.length).toBe(1);
      expect(dissentingOnly[0].stance).toBe('dissenting');
    });

    it('should upvote and moderate perspectives', async () => {
      const created = await service.submitPerspective(
        'sty_mod_test',
        { stance: 'analytical', argument: 'Analysis on fiscal implications' },
        { id: 'usr_1', name: 'User 1' },
        'org_default'
      );

      const upvoted = await service.upvotePerspective(created.id);
      expect(upvoted.upvotes).toBe(1);

      const moderated = await service.moderatePerspective(
        created.id,
        'rejected',
        'Violates civil discourse guidelines'
      );
      expect(moderated.status).toBe('rejected');
      expect(moderated.moderationReason).toBe('Violates civil discourse guidelines');
    });
  });

  describe('CitizenTipsService', () => {
    let service: CitizenTipsService;

    beforeEach(() => {
      service = new CitizenTipsService();
    });

    it('should submit tip with cryptographic checksum and receipt token', async () => {
      const checksum = 'sha256:abc123def45678901234567890abcdef1234567890abcdef1234567890abcdef';
      const result = await service.submitTip(
        {
          headline: 'Suspicious procurement irregularities',
          details: 'Documentary evidence of contract bidding alterations without public tender.',
          category: 'finance',
          urgency: 'elevated',
          anonymityMode: 'full_anonymous',
          verificationChecksum: checksum,
        },
        'org_default'
      );

      expect(result.tip.id).toMatch(/^tip_/);
      expect(result.receiptToken).toMatch(/^rcpt_/);
      expect(result.tip.status).toBe('received');

      const retrievedByChecksum = await service.getTipByChecksum(checksum, 'org_default');
      expect(retrievedByChecksum?.id).toBe(result.tip.id);
    });

    it('should review tip status and record editorial notes', async () => {
      const tips = await service.listTips('org_default');
      expect(tips.length).toBeGreaterThanOrEqual(2);

      const targetTip = tips[0];
      const reviewed = await service.reviewTip(
        targetTip.id,
        'verified_developing',
        'Directly corroborated by satellite flight logs.',
        'org_default'
      );

      expect(reviewed.status).toBe('verified_developing');
      expect(reviewed.editorialNotes).toBe('Directly corroborated by satellite flight logs.');
    });
  });
});
