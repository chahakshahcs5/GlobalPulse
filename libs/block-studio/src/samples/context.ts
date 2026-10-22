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
    {
      id: 'many-nodes',
      label: 'A wider graph',
      description: 'Nine entities, and the relationships between them.',
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
          { id: 'n6', label: 'Ridgeway', type: 'location' },
          { id: 'n7', label: 'Northfield', type: 'location' },
          { id: 'n8', label: 'GlobalPulse', type: 'organization' },
          { id: 'n9', label: 'Coastal', type: 'location' },
        ],
        edges: [
          { id: 'e1', from: 'n2', to: 'n1', relation: 'reviewed', label: 'reviewed' },
          { id: 'e2', from: 'n3', to: 'n1', relation: 'regulates' },
          { id: 'e3', from: 'n4', to: 'n1', relation: 'reported on' },
          { id: 'e4', from: 'n1', to: 'n5', relation: 'operates' },
          { id: 'e5', from: 'n1', to: 'n6', relation: 'operates' },
          { id: 'e6', from: 'n1', to: 'n7', relation: 'operates' },
          { id: 'e7', from: 'n8', to: 'n4', relation: 'published' },
          { id: 'e8', from: 'n2', to: 'n9', relation: 'reviewed' },
        ],
        focusNodeId: 'n1',
        methodology: 'Relationships are drawn from the platform knowledge graph.',
        sourceAttribution: 'GlobalPulse investigations',
      },
    },
    {
      id: 'focused',
      label: 'Focused on a person',
      description: 'A graph laid out around one person.',
      data: {
        title: 'Ada Okafor and the review',
        description: 'The people and institutions around the review director.',
        nodes: [
          {
            id: 'n2',
            label: 'Ada Okafor',
            type: 'person',
            description: 'Director, Independent Grid Review.',
            url: 'https://example.org/entities/ent_ada_okafor',
          },
          { id: 'n1', label: 'Northwind Energy', type: 'company' },
          { id: 'n3', label: 'Ministry of Energy', type: 'organization' },
          { id: 'n4', label: 'The Ledger', type: 'source' },
        ],
        edges: [
          { id: 'e1', from: 'n2', to: 'n1', relation: 'reviewed', label: 'reviewed' },
          { id: 'e2', from: 'n3', to: 'n2', relation: 'appointed', weight: 2 },
          { id: 'e3', from: 'n4', to: 'n2', relation: 'quoted', label: 'quoted' },
        ],
        focusNodeId: 'n2',
        methodology: 'Relationships are drawn from the platform knowledge graph.',
      },
    },
    {
      id: 'weighted',
      label: 'With weighted edges',
      description: 'Relationships that carry a weight, so the strong ones show.',
      data: {
        title: 'Who is connected to whom',
        description: 'The same relationships, with the number of links between each pair.',
        nodes: [
          { id: 'n1', label: 'Northwind Energy', type: 'company' },
          { id: 'n4', label: 'The Ledger', type: 'source' },
          { id: 'n5', label: 'Harbour East', type: 'location' },
          { id: 'n6', label: 'Ridgeway', type: 'location' },
        ],
        edges: [
          { id: 'e1', from: 'n4', to: 'n1', relation: 'reported on', weight: 14 },
          { id: 'e2', from: 'n1', to: 'n5', relation: 'operates', weight: 6 },
          { id: 'e3', from: 'n1', to: 'n6', relation: 'operates', weight: 2 },
        ],
        focusNodeId: 'n4',
        methodology: 'Relationships are drawn from the platform knowledge graph.',
      },
    },
    {
      id: 'minimal',
      label: 'Two nodes',
      description: 'The smallest a graph can be.',
      data: {
        title: 'One relationship',
        nodes: [
          { id: 'n1', label: 'Northwind Energy', type: 'company' },
          { id: 'n5', label: 'Harbour East', type: 'location' },
        ],
        edges: [{ id: 'e1', from: 'n1', to: 'n5', relation: 'operates' }],
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
    {
      id: 'dataset',
      label: 'A dataset',
      description: 'A published dataset, with its publisher and its date.',
      data: {
        sourceId: 'src_review_data',
        title: 'The grid review dataset: 1,240 filings, re-checked',
        publisher: 'GlobalPulse data desk',
        url: 'https://example.org/datasets/grid-review-2026.csv',
        publishedAt: '2026-10-01',
      },
    },
    {
      id: 'guidance',
      label: 'A guidance note',
      description: 'The 2022 instructions the finding turns on.',
      data: {
        sourceId: 'src_site_guidance_2022',
        title: 'Reporting instructions for grid reporting sites, 2022',
        publisher: 'Grid Authority',
        url: 'https://example.org/grid/reporting-instructions-2022',
        publishedAt: '2022-04-11',
      },
    },
    {
      id: 'statement',
      label: 'A statement',
      description: 'A party’s own statement of its position.',
      data: {
        sourceId: 'src_operator_statement',
        title: 'Northwind Energy: statement on the independent grid review',
        publisher: 'Northwind Energy',
        url: 'https://example.org/northwind/statement-2026-10-02',
        publishedAt: '2026-10-02',
      },
    },
    {
      id: 'newspaper',
      label: 'A newspaper article',
      description: 'A piece of journalism, from another publication.',
      data: {
        sourceId: 'src_ledger_2026',
        title: 'Grid figures “were never checked”, review finds',
        publisher: 'The Ledger',
        url: 'https://example.org/ledger/grid-figures-never-checked',
        publishedAt: '2026-10-02',
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
    {
      id: 'company',
      label: 'A company',
      description: 'An organisation, and what it does.',
      data: {
        entityId: 'ent_northwind',
        name: 'Northwind Energy',
        type: 'company',
        description:
          'Operator of three of the four reporting sites, and the largest single holder of grid capacity in the north.',
        avatarUrl: 'https://i.pravatar.cc/300?img=12',
      },
    },
    {
      id: 'place',
      label: 'A place',
      description: 'A location, with no portrait.',
      data: {
        entityId: 'ent_harbour_east',
        name: 'Harbour East',
        type: 'location',
        description:
          'The reporting site with the largest gap between its reported and verified figures.',
      },
    },
    {
      id: 'organisation',
      label: 'An organisation',
      description: 'A body, rather than a business.',
      data: {
        entityId: 'ent_grid_authority',
        name: 'Grid Authority',
        type: 'organization',
        description:
          'The regulator that sets the reporting rules and receives the quarterly figures.',
      },
    },
    {
      id: 'with-link',
      label: 'With a link',
      description: 'An entity that links out to its own page.',
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
    {
      id: 'one',
      label: 'One story',
      description: 'A single related story.',
      data: {
        title: 'Read next',
        storyIds: ['story_grid_review_2026'],
      },
    },
    {
      id: 'many',
      label: 'Five stories',
      description: 'A longer list of related coverage.',
      data: {
        title: 'More on grid reporting',
        storyIds: [
          'story_grid_review_2026',
          'story_utility_transparency_2025',
          'story_meter_data_2025',
          'story_quarterly_reporting_2026',
          'story_northfield_appeal_2026',
        ],
      },
    },
    {
      id: 'default-title',
      label: 'Default title',
      description: 'No title of its own, so the block falls back to its default.',
      data: {
        storyIds: ['story_grid_review_2026', 'story_meter_data_2025'],
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
    {
      id: 'added',
      label: 'Something added',
      description: 'Only what was added to the story.',
      data: {
        previousVersionNumber: 4,
        updatedAt: '2026-10-03T14:20:00Z',
        items: [
          {
            changeType: 'added',
            description: 'A third-party check was added to the verification chain diagram.',
            affectedSection: 'How it works',
          },
          {
            changeType: 'added',
            description: 'The response from the Grid Authority was added in full.',
            affectedSection: 'The response',
          },
        ],
      },
    },
    {
      id: 'updated',
      label: 'Something updated',
      description: 'Only what was updated.',
      data: {
        previousVersionNumber: 4,
        updatedAt: '2026-10-03T14:20:00Z',
        items: [
          {
            changeType: 'updated',
            description: 'The site ranking was refreshed with the Q3 filings.',
            affectedSection: 'The ranking',
          },
          {
            changeType: 'updated',
            description: 'The reserve margin figure now reads 6.4 per cent rather than 6.1.',
            affectedSection: 'The monitor',
          },
        ],
      },
    },
    {
      id: 'retracted',
      label: 'Something retracted',
      description: 'Only what was taken back.',
      data: {
        previousVersionNumber: 4,
        updatedAt: '2026-10-03T14:20:00Z',
        items: [
          {
            changeType: 'retracted',
            description:
              'The claim that the guidance was never distributed was retracted, because the distribution log was produced after publication.',
            affectedSection: 'The guidance',
          },
          {
            changeType: 'retracted',
            description: 'A quotation attributed to the operator was withdrawn at their request.',
            affectedSection: 'The response',
          },
        ],
      },
    },
    {
      id: 'single',
      label: 'One change',
      description: 'The smallest a change summary can be.',
      data: {
        previousVersionNumber: 4,
        updatedAt: '2026-10-03T14:20:00Z',
        items: [
          {
            changeType: 'corrected',
            description: 'The May figure was corrected from 14.2 to 12.9 TWh.',
            affectedSection: 'The numbers',
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
    {
      id: 'three-points',
      label: 'Three points each',
      description: 'A comparison with a point on either side of every line.',
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
    {
      id: 'five-points',
      label: 'Five points each',
      description: 'A fuller comparison, with the cost and the speed on each side.',
      data: {
        title: 'Two ways to verify the number',
        subjectA: {
          name: 'Internal second sign-off',
          points: [
            'Cheap: no new meter reading.',
            'Fast: a signature on the same form, the same day.',
            'Catches classification errors, not measurement errors.',
            'Not independent of the reporting site.',
            'Can be skipped, as it was at three of the four sites.',
          ],
        },
        subjectB: {
          name: 'Third-party meter check',
          points: [
            'Catches both measurement and classification errors.',
            'Expensive: roughly a third of a reporting site budget.',
            'Slow: the meter has to be read by someone from outside.',
            'Independent of the reporting site.',
            'Cannot be skipped, because the operator does not control it.',
          ],
        },
      },
    },
    {
      id: 'long-names',
      label: 'Long names',
      description: 'Two long headings, which is where a comparison usually breaks.',
      data: {
        title: 'Two ways to verify the number',
        subjectA: {
          name: 'A mandatory second sign-off by a second analyst employed by the reporting site',
          points: ['Cheap: no new meter reading.', 'Not independent of the reporting site.'],
        },
        subjectB: {
          name: 'A third-party meter check carried out by an accredited body appointed by the authority',
          points: [
            'Catches both measurement and classification errors.',
            'Expensive: roughly a third of a reporting site budget.',
          ],
        },
      },
    },
    {
      id: 'minimal',
      label: 'One point each',
      description: 'The smallest a comparison can be.',
      data: {
        title: 'Two ways to verify the number',
        subjectA: {
          name: 'Internal second sign-off',
          points: ['Cheap, but not independent.'],
        },
        subjectB: {
          name: 'Third-party meter check',
          points: ['Independent, but expensive.'],
        },
      },
    },
  ],
};
