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
      id: 'evidence',
      label: 'Evidence trail',
      description: 'Claims with status, plus supporting and contradicting evidence.',
      data: {
        title: 'What the filings actually show',
        summary: 'Three claims examined against the filing record.',
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
      id: 'evidence-only',
      label: 'Evidence without claims',
      description: 'The documents on their own, with no claim attached.',
      data: {
        title: 'The documents behind the finding',
        summary: 'Three items of record, with no claim assessed.',
        evidence: [
          {
            id: 'e1',
            title: 'Independent Grid Review, findings',
            stance: 'SUPPORTS',
            sourceId: 'src_review_report',
            url: 'https://example.org/independent-grid-review-2026',
            type: 'report',
            excerpt:
              'Three of the four sites operated without an independent verification step at any point in the review period.',
          },
          {
            id: 'e2',
            title: 'Meter data, 2024-2025',
            stance: 'CONTEXT',
            sourceId: 'src_review_data',
            type: 'dataset',
            excerpt: 'Meter readings for 1,240 filings, re-checked against each published value.',
          },
          {
            id: 'e3',
            title: 'Reporting instructions, 2022',
            stance: 'CONTRADICTS',
            type: 'guidance',
            excerpt:
              'The verification step is described as a recommended practice and does not require a second signature.',
          },
        ],
        methodology: 'Each item is the document itself, linked and quoted.',
        sourceAttribution: 'GlobalPulse investigations',
      },
    },
    {
      id: 'claims-only',
      label: 'Claims without evidence',
      description: 'The claims and their status, with no documents attached.',
      data: {
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
        methodology: 'Each claim is assessed against the filing record and the issued guidance.',
        sourceAttribution: 'GlobalPulse investigations',
      },
    },
    {
      id: 'confident',
      label: 'With confidence',
      description: 'Claims that carry a confidence score and say how it was reached.',
      data: {
        title: 'How certain each finding is',
        summary: 'Two claims, both with the method behind the score.',
        claims: [
          {
            claimId: 'c1',
            text: 'The reported figures were overstated at all four sites.',
            status: 'SUPPORTED',
            confidence: 0.9,
            confidenceMethodology:
              'Every site showed a positive median gap, and the direction of the gap is consistent across all three years.',
          },
          {
            claimId: 'c2',
            text: 'The overstatement was caused by deliberate inflation.',
            status: 'UNSUPPORTED',
            confidence: 0.3,
            confidenceMethodology:
              'No document in the record evidences intent, and the pattern is better explained by measurement and classification errors.',
          },
        ],
        methodology:
          'Confidence is scored against the strength of the record that supports each claim, not against how important the claim is.',
        sourceAttribution: 'GlobalPulse investigations',
      },
    },
    {
      id: 'no-methodology',
      label: 'Without a methodology',
      description: 'The claims and the evidence, with no note on how they were assessed.',
      data: {
        title: 'What the filings actually show',
        summary: 'Two claims examined against the filing record.',
        claims: [
          {
            claimId: 'c1',
            text: 'Reported demand was overstated across all four sites.',
            status: 'SUPPORTED',
          },
          {
            claimId: 'c2',
            text: 'The overstatement was caused by deliberate inflation.',
            status: 'UNSUPPORTED',
          },
        ],
        evidence: [
          {
            id: 'e1',
            title: 'Re-checked filings',
            stance: 'SUPPORTS',
            sourceId: 'src_review_report',
            excerpt:
              'Across 1,240 filings the median gap between reported and verified values was 9.4 per cent.',
          },
        ],
      },
    },
  ],

  perspective: [
    {
      id: 'perspectives',
      label: 'Perspectives',
      description: 'Documented positions, each anchored to its source.',
      data: {
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
      id: 'mixed',
      label: 'A mixed position',
      description: 'One party that agrees with part of the finding and disputes the rest.',
      data: {
        title: 'Where the operator agrees, and where it does not',
        perspectives: [
          {
            label: 'The operator',
            summary:
              'The operator accepts that three of the four sites lacked a verification step, and disputes the review’s reading of the 2022 guidance.',
            stance: 'MIXED',
            sourceIds: ['src_operator_statement'],
            quoteExcerpt:
              'We accept the finding on the second sign-off. We do not accept the characterisation of the guidance.',
          },
        ],
        methodology: 'Each position is quoted from a published document.',
      },
    },
    {
      id: 'unknown',
      label: 'An unstated position',
      description: 'A party that has not taken a position the review can characterise.',
      data: {
        title: 'The parties, and where each one stands',
        perspectives: [
          {
            label: 'The operator',
            summary:
              'The operator repeats the figures the review disputes and does not address the guidance.',
            stance: 'UNKNOWN',
            sourceIds: ['src_operator_statement'],
          },
          {
            label: 'The review',
            summary:
              'The burden sat with the operator, and an optional step is not a step. The guidance has now been rewritten.',
            stance: 'SUPPORTS',
            sourceIds: ['src_review_report'],
          },
        ],
        methodology: 'Each position is quoted from a published document.',
      },
    },
    {
      id: 'with-quotes',
      label: 'Every position quoted',
      description: 'Each position with the words it was made in.',
      data: {
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
            quoteExcerpt:
              'We found no evidence of intent. What we found was a guidance document that made the check optional.',
          },
          {
            label: 'The regulator',
            summary: 'A second sign-off is now mandatory and reporting is published quarterly.',
            stance: 'NEUTRAL',
            sourceIds: ['src_regulator_directive'],
            quoteExcerpt:
              'A second sign-off shall be mandatory for every reported value, and results shall be published quarterly.',
          },
        ],
        methodology: 'Each position is quoted from a published document.',
      },
    },
    {
      id: 'no-quotes',
      label: 'Without quotations',
      description: 'Positions summarised from the record, with no quotation pulled out.',
      data: {
        title: 'What the parties say',
        perspectives: [
          {
            label: 'The operator',
            summary:
              'The guidance was ambiguous and the verification step was described as optional in the 2022 instructions.',
            stance: 'OPPOSES',
            sourceIds: ['src_operator_statement'],
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
        methodology: 'Each position is summarised from a published document.',
      },
    },
  ],

  fact_check: [
    {
      id: 'fact-check',
      label: 'Fact check',
      description: 'A claim-level verdict with review metadata.',
      data: {
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
      id: 'supported',
      label: 'Supported',
      description: 'A claim that holds up against the record.',
      data: {
        claim: 'Three of the four reporting sites had no independent verification step.',
        claimant: 'GlobalPulse investigations, 1 October 2026',
        status: 'SUPPORTED',
        confidence: 0.95,
        confidenceMethodology:
          'The review team confirmed the position of each site from its own reporting instructions and filing records.',
        summary:
          'The claim matches the review’s central finding, and the review supports it with the reporting record of every site.',
        evidenceSummary:
          'Three sites filed throughout the review period without a second signature on any filing; the fourth signed every filing.',
        sources: ['src_review_report'],
        methodology: 'Compared the claim against the published review findings.',
        reviewedAt: '2026-10-02',
        reviewer: 'GlobalPulse fact-check desk',
      },
    },
    {
      id: 'contradicted',
      label: 'Contradicted',
      description: 'A claim the record goes the other way on.',
      data: {
        claim: 'Sites deliberately inflated their reported figures.',
        claimant: 'Comment thread, 2 October 2026',
        status: 'CONTRADICTED',
        confidence: 0.9,
        confidenceMethodology:
          'No document in the record evidences intent, and the gaps track the sites with the weakest verification step rather than any commercial motive.',
        summary:
          'The record does not support intent. The overstatement is fully explained by measurement and classification error, and it is largest where the verification step was missing.',
        evidenceSummary:
          'The site with the cleanest verification record showed the smallest gap; the site with the weakest showed the largest.',
        sources: ['src_review_report', 'src_review_data'],
        methodology: 'Compared the claim against the published review findings.',
        reviewedAt: '2026-10-03',
        reviewer: 'GlobalPulse fact-check desk',
      },
    },
    {
      id: 'disputed',
      label: 'Disputed',
      description: 'A claim the parties still disagree about.',
      data: {
        claim: 'The 2022 reporting instructions were never sent to two of the four sites.',
        claimant: 'GlobalPulse investigations, 2 October 2026',
        status: 'DISPUTED',
        confidence: 0.5,
        confidenceMethodology:
          'Two sites state they never received the instructions; the authority states they were published for all sites. Neither record is conclusive.',
        summary:
          'The claim turns on a delivery record the authority has not produced. It is plausible and unresolved, not established.',
        evidenceSummary:
          'Site correspondence says the instructions were not received. The authority’s response does not include a distribution log.',
        sources: ['src_operator_statement', 'src_regulator_directive'],
        methodology: 'Compared the claim against the published review findings.',
        reviewedAt: '2026-10-03',
        reviewer: 'GlobalPulse fact-check desk',
      },
    },
    {
      id: 'unverified',
      label: 'Unverified',
      description: 'A claim nobody has checked yet.',
      data: {
        claim: 'The remaining verification work will cost the sites £4.2 million in total.',
        claimant: 'Harbour East, 4 October 2026',
        status: 'UNVERIFIED',
        summary:
          'The figure has not been checked against any published cost data, and the review does not attempt to estimate it.',
        methodology: 'Logged for checking when the authority publishes its implementation budget.',
        reviewedAt: '2026-10-04',
        reviewer: 'GlobalPulse fact-check desk',
      },
    },
    {
      id: 'minimal',
      label: 'Verdict only',
      description: 'The verdict and nothing else — no confidence, no sources, no reviewer.',
      data: {
        claim: 'The reported figures were overstated at all four sites.',
        status: 'SUPPORTED',
        summary:
          'Every site showed a positive median gap between the reported and the independently verified value.',
      },
    },
  ],
};
