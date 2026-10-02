import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { DatabaseService } from '@ai-news/database';
import { CitizenTipsService } from '@ai-news/stories';
import { AuthService, type AuthenticatedPrincipal } from '@ai-news/auth';
import { mcpJsonResponse, mcpErrorResponse } from './tool-helpers';

export function registerTipTools(
  server: McpServer,
  _db: DatabaseService,
  getPrincipal: () => AuthenticatedPrincipal
) {
  const tipsService = new CitizenTipsService();

  // 1. submit_citizen_tip
  server.tool(
    'submit_citizen_tip',
    '[WHISTLEBLOWER & TIP LINE] Securely submit an investigative news tip, leak, or whistleblower report with cryptographic payload checksum and anonymity mode.',
    {
      headline: z.string().min(1).describe('Working headline or summary of the leak/tip'),
      details: z.string().min(1).describe('Detailed factual disclosure or eyewitness account'),
      category: z
        .string()
        .default('general')
        .describe('Topic area (defense, climate, tech, corporate, politics)'),
      urgency: z.enum(['routine', 'elevated', 'breaking']).default('routine'),
      anonymityMode: z.enum(['full_anonymous', 'confidential_source']).default('full_anonymous'),
      verificationChecksum: z
        .string()
        .min(8)
        .describe('Client-side SHA-256 hash verifying document/content integrity'),
      contactAlias: z
        .string()
        .optional()
        .describe('Pseudonym, secure drop key, or encrypted contact handle'),
      attachments: z
        .array(
          z.object({
            filename: z.string().min(1),
            mimeType: z.string().min(1),
            sizeBytes: z.number().int().positive(),
            checksumSha256: z.string().min(1),
          })
        )
        .optional()
        .default([]),
    },
    async ({
      headline,
      details,
      category,
      urgency,
      anonymityMode,
      verificationChecksum,
      contactAlias,
      attachments,
    }) => {
      try {
        const principal = getPrincipal();
        AuthService.requireScope(principal, 'news:write');

        const { tip, receiptToken } = await tipsService.submitTip(
          {
            headline,
            details,
            category,
            urgency,
            anonymityMode,
            verificationChecksum,
            contactAlias,
            attachments,
          },
          principal.organizationId
        );

        return mcpJsonResponse({
          message: 'Tip registered securely in newsroom triage intake queue.',
          tipId: tip.id,
          receiptToken,
          status: tip.status,
          checksum: tip.verificationChecksum,
        });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        return mcpErrorResponse(`Failed to submit citizen tip: ${msg}`);
      }
    }
  );

  // 2. list_citizen_tips
  server.tool(
    'list_citizen_tips',
    '[EDITORIAL TRIAGE] Retrieve submitted whistleblower drops and reader tips for investigative evaluation.',
    {
      status: z
        .enum(['received', 'under_review', 'verified_developing', 'dismissed'])
        .optional()
        .describe('Filter by verification status'),
      urgency: z
        .enum(['routine', 'elevated', 'breaking'])
        .optional()
        .describe('Filter by urgency level'),
      category: z.string().optional().describe('Filter by category'),
      limit: z.number().int().min(1).max(50).default(20),
    },
    async ({ status, urgency, category, limit }) => {
      try {
        const principal = getPrincipal();
        AuthService.requireScope(principal, 'news:read');

        const tips = await tipsService.listTips(principal.organizationId, {
          status,
          urgency,
          category,
          limit,
        });

        return mcpJsonResponse({
          count: tips.length,
          tips,
        });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        return mcpErrorResponse(`Failed to list tips: ${msg}`);
      }
    }
  );

  // 3. review_citizen_tip
  server.tool(
    'review_citizen_tip',
    '[EDITORIAL TRIAGE] Update review status of an investigative tip and record reporter verification notes.',
    {
      tipId: z.string().min(1).describe('Target tip ID'),
      status: z
        .enum(['received', 'under_review', 'verified_developing', 'dismissed'])
        .describe('New triage status'),
      editorialNotes: z
        .string()
        .optional()
        .describe('Reporter verification notes, corroboration leads, or sources contacted'),
    },
    async ({ tipId, status, editorialNotes }) => {
      try {
        const principal = getPrincipal();
        AuthService.requireScope(principal, 'news:publish');

        const updated = await tipsService.reviewTip(
          tipId,
          status,
          editorialNotes,
          principal.organizationId
        );

        return mcpJsonResponse({
          message: `Tip "${tipId}" status updated to ${status}.`,
          tip: updated,
        });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        return mcpErrorResponse(`Failed to review tip: ${msg}`);
      }
    }
  );

  // 4. get_citizen_tip
  server.tool(
    'get_citizen_tip',
    '[EDITORIAL TRIAGE] Retrieve comprehensive details, verification checksum, and attachment metadata of a specific tip by ID.',
    {
      tipId: z.string().min(1).describe('The unique tip ID (e.g. "tip_seed_1")'),
    },
    async ({ tipId }) => {
      try {
        const principal = getPrincipal();
        AuthService.requireScope(principal, 'news:read');

        const tip = await tipsService.getTipById(tipId, principal.organizationId);
        if (!tip) {
          return mcpErrorResponse(`Citizen tip "${tipId}" not found`);
        }

        return mcpJsonResponse(tip);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        return mcpErrorResponse(`Failed to get citizen tip: ${msg}`);
      }
    }
  );

  // 5. verify_tip
  server.tool(
    'verify_tip',
    '[EDITORIAL TRIAGE] Verify an investigative citizen or whistleblower tip and record reporter corroboration notes.',
    {
      tipId: z.string().min(1).describe('The target tip ID'),
      editorialNotes: z
        .string()
        .min(1)
        .describe('Reporter verification findings and corroborating evidence'),
    },
    async ({ tipId, editorialNotes }) => {
      try {
        const principal = getPrincipal();
        AuthService.requireScope(principal, 'news:publish');

        const updated = await tipsService.reviewTip(
          tipId,
          'verified_developing',
          editorialNotes,
          principal.organizationId
        );

        return mcpJsonResponse({
          message: `Tip "${tipId}" successfully verified for developing newsroom coverage.`,
          tip: updated,
        });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        return mcpErrorResponse(`Failed to verify tip: ${msg}`);
      }
    }
  );

  // 6. submit_whistleblower_tip (Alias)
  server.tool(
    'submit_whistleblower_tip',
    '[WHISTLEBLOWER & TIP LINE] Direct alias for submit_citizen_tip to securely transmit investigative leaks.',
    {
      headline: z.string().min(1).describe('Working headline or summary of the leak/tip'),
      details: z.string().min(1).describe('Detailed factual disclosure or eyewitness account'),
      category: z.string().default('general').describe('Topic area'),
      urgency: z.enum(['routine', 'elevated', 'breaking']).default('routine'),
      anonymityMode: z.enum(['full_anonymous', 'confidential_source']).default('full_anonymous'),
      verificationChecksum: z
        .string()
        .min(8)
        .describe('Client-side SHA-256 hash verifying document/content integrity'),
      contactAlias: z
        .string()
        .optional()
        .describe('Pseudonym, secure drop key, or encrypted contact handle'),
    },
    async (params) => {
      try {
        const principal = getPrincipal();
        AuthService.requireScope(principal, 'news:write');

        const { tip, receiptToken } = await tipsService.submitTip(
          { ...params, attachments: [] },
          principal.organizationId
        );

        return mcpJsonResponse({
          message: 'Whistleblower tip registered securely in newsroom triage intake queue.',
          tipId: tip.id,
          receiptToken,
          status: tip.status,
          checksum: tip.verificationChecksum,
        });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        return mcpErrorResponse(`Failed to submit whistleblower tip: ${msg}`);
      }
    }
  );

  // 7. list_whistleblower_tips (Alias)
  server.tool(
    'list_whistleblower_tips',
    '[EDITORIAL TRIAGE] Direct alias for list_citizen_tips to evaluate whistleblower drops.',
    {
      status: z.enum(['received', 'under_review', 'verified_developing', 'dismissed']).optional(),
      urgency: z.enum(['routine', 'elevated', 'breaking']).optional(),
      category: z.string().optional(),
      limit: z.number().int().min(1).max(50).default(20),
    },
    async (params) => {
      try {
        const principal = getPrincipal();
        AuthService.requireScope(principal, 'news:read');

        const tips = await tipsService.listTips(principal.organizationId, params);
        return mcpJsonResponse({ count: tips.length, tips });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        return mcpErrorResponse(`Failed to list whistleblower tips: ${msg}`);
      }
    }
  );
}
