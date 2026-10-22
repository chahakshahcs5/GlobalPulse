/**
 * Sample payloads for the context blocks.
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

export const CONTEXT_SAMPLES: Record<string, StudioVariant[]> = {
  knowledge_graph: [
    {
      id: 'graph',
      label: 'Knowledge graph',
      description: 'Typed nodes with named relationships.',
      data: {
        title: 'Who is connected to whom',
        description: 'The entities behind the investigation and how they relate.',
        nodes: [
          {
            id: 'n1',
            label: 'Northwind Energy',
            type: 'company',
            description: 'Operator of three reporting sites.',
          },
          {
            id: 'n2',
            label: 'Ada Okafor',
            type: 'person',
            description: 'Director, Independent Grid Review.',
          },
          { id: 'n3', label: 'Ministry of Energy', type: 'organization' },
          { id: 'n4', label: 'The Ledger', type: 'source' },
          { id: 'n5', label: 'Harbour East', type: 'location' },
        ],
        edges: [
          { id: 'e1', from: 'n2', to: 'n1', relation: 'reviewed', label: 'reviewed' },
          { id: 'e2', from: 'n3', to: 'n1', relation: 'regulates' },
          { id: 'e3', from: 'n4', to: 'n1', relation: 'reported on' },
          { id: 'e4', from: 'n1', to: 'n5', relation: 'operates' },
        ],
        focusNodeId: 'n1',
        methodology: 'Relationships are drawn from the platform knowledge graph.',
      },
    },
  ],

  source: [
    {
      id: 'source',
      label: 'Source card',
      description: 'A registered source with a link out.',
      data: {
        sourceId: 'src_review_report',
        title: 'Independent Grid Review: Findings and Recommendations',
        publisher: 'Office of the Independent Grid Review',
        url: 'https://example.org/independent-grid-review-2026',
        publishedAt: '2026-10-01',
      },
    },
  ],

  entity: [
    {
      id: 'entity',
      label: 'Entity card',
      description: 'A person, company or place.',
      data: {
        entityId: 'ent_ada_okafor',
        name: 'Ada Okafor',
        type: 'person',
        description: 'Director of the Independent Grid Review and former system operator.',
        avatarUrl: 'https://i.pravatar.cc/300?img=47',
      },
    },
  ],

  related_stories: [
    {
      id: 'related',
      label: 'Related coverage',
      description: 'Links to other stories on the topic.',
      data: {
        title: 'Related Coverage',
        storyIds: ['story_grid_review_2026', 'story_utility_transparency_2025'],
      },
    },
  ],

  what_changed: [
    {
      id: 'changes',
      label: 'What changed',
      description: 'A structured summary of an update.',
      data: {
        previousVersionNumber: 3,
        updatedAt: '2026-10-02T09:15:00Z',
        items: [
          {
            changeType: 'corrected',
            description: 'The May figure was corrected from 14.2 to 12.9 TWh.',
            affectedSection: 'The numbers',
          },
          {
            changeType: 'added',
            description: 'A third-party check was added to the verification chain diagram.',
            affectedSection: 'How it works',
          },
          {
            changeType: 'updated',
            description: 'The site ranking was refreshed with the Q3 filings.',
            affectedSection: 'The ranking',
          },
        ],
      },
    },
  ],

  comparison: [
    {
      id: 'comparison',
      label: 'Two-option comparison',
      description: 'Side by side, with points on each side.',
      data: {
        title: 'Two ways to verify the number',
        subjectA: {
          name: 'Internal second sign-off',
          points: [
            'Cheap: no new meter reading.',
            'Catches classification errors, not measurement errors.',
            'Not independent of the reporting site.',
          ],
        },
        subjectB: {
          name: 'Third-party meter check',
          points: [
            'Catches both measurement and classification errors.',
            'Expensive: roughly a third of a reporting site budget.',
            'Independent of the reporting site.',
          ],
        },
      },
    },
  ],
};
