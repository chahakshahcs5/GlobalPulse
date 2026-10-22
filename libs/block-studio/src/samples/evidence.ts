/**
 * Sample payloads for the evidence blocks.
 *
 * Each entry is a named, ready-made treatment of one block type. They are
 * deliberately realistic: a chart that says "cases" and "year" tells an
 * editor far more about how the block reads in a story than
 * "Category 1 / 42" does.
 *
 * Every variant is validated against its block's schema by
 * `tests/unit/blocks/block-studio-samples.test.ts`, so a sample can never
 * drift away from the block it demonstrates.
 */
import type { StudioVariant } from '../types';

export const EVIDENCE_SAMPLES: Record<string, StudioVariant[]> = {
  citation: [
    {
      id: 'claim-source',
      label: 'Claim with sources',
      description: 'A claim bound to registered source ids.',
      data: {
        claim: 'The programme saved 4.1 million tonnes of carbon in its first year.',
        sourceIds: ['src_annual_review', 'src_audit_2026'],
        quoteExcerpt:
          '...a measured reduction of 4.1 MtCO2e against the 2024 baseline, the largest single-year fall recorded...',
      },
    },
    {
      id: 'claim-only',
      label: 'Claim without an excerpt',
      description: 'A claim and its sources, with nothing quoted back.',
      data: {
        claim: 'The programme saved 4.1 million tonnes of carbon in its first year.',
        sourceIds: ['src_annual_review', 'src_audit_2026'],
      },
    },
    {
      id: 'three-sources',
      label: 'Three sources',
      description: 'One claim resting on three separate documents.',
      data: {
        claim:
          'Three of the four reporting sites had no independent verification step at any point in the review period.',
        sourceIds: ['src_review_report', 'src_review_data', 'src_regulator_directive'],
        quoteExcerpt:
          '...three of the four sites operated without an independent verification step at any point in the review period...',
      },
    },
    {
      id: 'short-claim',
      label: 'Short claim',
      description: 'A claim that is one line, with a single source.',
      data: {
        claim: 'The median overstatement was 9.4 per cent.',
        sourceIds: ['src_review_data'],
        quoteExcerpt: '...the median gap between reported and verified values was 9.4 per cent...',
      },
    },
    {
      id: 'long-claim',
      label: 'Long claim',
      description: 'A claim with a condition in it, which is where claims usually go wrong.',
      data: {
        claim:
          'Sites that carried a second sign-off throughout the review period reported figures a median of 2.8 per cent below the independently verified value, against 11.6 per cent for sites that did not.',
        sourceIds: ['src_review_data', 'src_review_report'],
        quoteExcerpt:
          '...sites operating with a second sign-off showed a median gap of -2.8 per cent; sites operating without one showed 11.6 per cent...',
      },
    },
  ],

  evidence: [
    {
      id: 'claims',
      label: 'Claims and documents',
      description: 'The claims first, with the documents beneath them.',
      data: {
        layout: 'claims',
        title: 'What the filings actually show',
        summary: 'Two claims examined against the filing record.',
        claims: [
          {
            claimId: 'c1',
            text: 'Reported demand was overstated across all four sites.',
            status: 'SUPPORTED',
            confidence: 0.9,
            confidenceMethodology: 'All four sites showed a positive median gap.',
          },
          {
            claimId: 'c2',
            text: 'The overstatement was caused by deliberate inflation.',
            status: 'UNSUPPORTED',
            confidence: 0.3,
            confidenceMethodology:
              'The pattern is better explained by measurement and classification errors; no document evidences intent.',
          },
        ],
        evidence: [
          {
            id: 'e1',
            title: 'Re-checked filings',
            stance: 'SUPPORTS',
            sourceId: 'src_review_report',
            type: 'filing',
            excerpt:
              'Across 1,240 filings the median gap between reported and verified values was 9.4 per cent.',
          },
          {
            id: 'e2',
            title: 'Site guidance, 2022',
            stance: 'CONTRADICTS',
            type: 'guidance',
            excerpt:
              'Reporting instructions described the verification step as optional, and two sites said they never received them.',
          },
        ],
        methodology: 'Each claim is assessed against the filing record and the issued guidance.',
        sourceAttribution: 'GlobalPulse investigations',
      },
    },
    {
      id: 'documents',
      label: 'Documents only',
      description: 'The documents on their own, with no claim attached.',
      data: {
        layout: 'documents',
        title: 'The documents behind the finding',
        summary: 'Two items of record, with no claim assessed.',
        claims: [],
        evidence: [
          {
            id: 'e1',
            title: 'Re-checked filings',
            stance: 'SUPPORTS',
            sourceId: 'src_review_report',
            type: 'filing',
            excerpt:
              'Across 1,240 filings the median gap between reported and verified values was 9.4 per cent.',
          },
          {
            id: 'e2',
            title: 'Site guidance, 2022',
            stance: 'CONTRADICTS',
            type: 'guidance',
            excerpt:
              'Reporting instructions described the verification step as optional, and two sites said they never received them.',
          },
        ],
        methodology: 'Each item is the document itself, quoted.',
        sourceAttribution: 'GlobalPulse investigations',
      },
    },
    {
      id: 'split',
      label: 'Split',
      description: 'The claims and the documents side by side.',
      data: {
        layout: 'split',
        title: 'What the filings actually show',
        summary: 'Two claims examined against the filing record.',
        claims: [
          {
            claimId: 'c1',
            text: 'Reported demand was overstated across all four sites.',
            status: 'SUPPORTED',
            confidence: 0.9,
            confidenceMethodology: 'All four sites showed a positive median gap.',
          },
          {
            claimId: 'c2',
            text: 'The overstatement was caused by deliberate inflation.',
            status: 'UNSUPPORTED',
            confidence: 0.3,
            confidenceMethodology:
              'The pattern is better explained by measurement and classification errors; no document evidences intent.',
          },
        ],
        evidence: [
          {
            id: 'e1',
            title: 'Re-checked filings',
            stance: 'SUPPORTS',
            sourceId: 'src_review_report',
            type: 'filing',
            excerpt:
              'Across 1,240 filings the median gap between reported and verified values was 9.4 per cent.',
          },
          {
            id: 'e2',
            title: 'Site guidance, 2022',
            stance: 'CONTRADICTS',
            type: 'guidance',
            excerpt:
              'Reporting instructions described the verification step as optional, and two sites said they never received them.',
          },
        ],
        methodology: 'Each claim is assessed against the filing record and the issued guidance.',
        sourceAttribution: 'GlobalPulse investigations',
      },
    },
  ],

  perspective: [
    {
      id: 'cards',
      label: 'Cards',
      description: 'A card for each position.',
      data: {
        layout: 'cards',
        title: 'What the parties say',
        perspectives: [
          {
            label: 'The operator',
            summary:
              'The guidance was ambiguous and the verification step was described as optional in the 2022 instructions.',
            stance: 'OPPOSES',
            sourceIds: ['src_operator_statement'],
            quoteExcerpt: 'We followed the guidance as it was written at the time.',
          },
          {
            label: 'The review',
            summary:
              'The burden sat with the operator, and an optional step is not a step. The guidance has now been rewritten.',
            stance: 'SUPPORTS',
            sourceIds: ['src_review_report'],
          },
          {
            label: 'The regulator',
            summary: 'A second sign-off is now mandatory and reporting is published quarterly.',
            stance: 'NEUTRAL',
            sourceIds: ['src_regulator_directive'],
          },
        ],
        methodology: 'Each position is quoted from a published document.',
      },
    },
    {
      id: 'columns',
      label: 'Columns',
      description: 'The positions in two columns, ruled off one another.',
      data: {
        layout: 'columns',
        title: 'What the parties say',
        perspectives: [
          {
            label: 'The operator',
            summary:
              'The guidance was ambiguous and the verification step was described as optional in the 2022 instructions.',
            stance: 'OPPOSES',
            sourceIds: ['src_operator_statement'],
            quoteExcerpt: 'We followed the guidance as it was written at the time.',
          },
          {
            label: 'The review',
            summary:
              'The burden sat with the operator, and an optional step is not a step. The guidance has now been rewritten.',
            stance: 'SUPPORTS',
            sourceIds: ['src_review_report'],
          },
          {
            label: 'The regulator',
            summary: 'A second sign-off is now mandatory and reporting is published quarterly.',
            stance: 'NEUTRAL',
            sourceIds: ['src_regulator_directive'],
          },
        ],
        methodology: 'Each position is quoted from a published document.',
      },
    },
    {
      id: 'list',
      label: 'List',
      description: 'The positions as a list, one after another.',
      data: {
        layout: 'list',
        title: 'What the parties say',
        perspectives: [
          {
            label: 'The operator',
            summary:
              'The guidance was ambiguous and the verification step was described as optional in the 2022 instructions.',
            stance: 'OPPOSES',
            sourceIds: ['src_operator_statement'],
            quoteExcerpt: 'We followed the guidance as it was written at the time.',
          },
          {
            label: 'The review',
            summary:
              'The burden sat with the operator, and an optional step is not a step. The guidance has now been rewritten.',
            stance: 'SUPPORTS',
            sourceIds: ['src_review_report'],
          },
          {
            label: 'The regulator',
            summary: 'A second sign-off is now mandatory and reporting is published quarterly.',
            stance: 'NEUTRAL',
            sourceIds: ['src_regulator_directive'],
          },
        ],
        methodology: 'Each position is quoted from a published document.',
      },
    },
  ],

  fact_check: [
    {
      id: 'full',
      label: 'Full finding',
      description: 'The whole finding: the claim, the summary, the sources and the method.',
      data: {
        layout: 'full',
        claim: 'The review found the reported figures were inflated by up to 19 per cent.',
        claimant: 'Social media post, 1 October 2026',
        status: 'PARTIALLY_SUPPORTED',
        confidence: 0.85,
        confidenceMethodology:
          'The 19 per cent figure is real but applies to one site at one point; the median was 9.4 per cent.',
        summary:
          'The figure is accurate for a single site. Presenting it as the overall result overstates the problem by more than a factor of two.',
        evidenceSummary:
          'The review reports a median gap of 9.4 per cent across 1,240 filings, with a worst case of 19 per cent at Harbour East.',
        sources: ['src_review_report', 'src_review_data'],
        methodology: 'Compared the claim against the published review findings.',
        reviewedAt: '2026-10-02',
        reviewer: 'GlobalPulse fact-check desk',
      },
    },
    {
      id: 'verdict',
      label: 'Verdict',
      description: 'The claim and the verdict, without the working.',
      data: {
        layout: 'verdict',
        claim: 'The review found the reported figures were inflated by up to 19 per cent.',
        claimant: 'Social media post, 1 October 2026',
        status: 'PARTIALLY_SUPPORTED',
        confidence: 0.85,
        confidenceMethodology:
          'The 19 per cent figure is real but applies to one site at one point; the median was 9.4 per cent.',
        summary:
          'The figure is accurate for a single site. Presenting it as the overall result overstates the problem by more than a factor of two.',
        evidenceSummary:
          'The review reports a median gap of 9.4 per cent across 1,240 filings, with a worst case of 19 per cent at Harbour East.',
        sources: ['src_review_report', 'src_review_data'],
        methodology: 'Compared the claim against the published review findings.',
        reviewedAt: '2026-10-02',
        reviewer: 'GlobalPulse fact-check desk',
      },
    },
    {
      id: 'inline',
      label: 'Inline',
      description: 'One line, for a mention in the middle of a story.',
      data: {
        layout: 'inline',
        claim: 'The review found the reported figures were inflated by up to 19 per cent.',
        status: 'PARTIALLY_SUPPORTED',
        summary:
          'The figure is accurate for a single site. Presenting it as the overall result overstates the problem by more than a factor of two.',
      },
    },
  ],
};
