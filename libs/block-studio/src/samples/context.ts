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
      label: 'Graph',
      description: 'The picture, with the relationships listed beneath it.',
      data: {
        layout: 'graph',
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
      id: 'list',
      label: 'List',
      description: 'The relationships as a list, with no picture.',
      data: {
        layout: 'list',
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
      id: 'matrix',
      label: 'Matrix',
      description: 'The relationships as a matrix, one node against another.',
      data: {
        layout: 'matrix',
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
      id: 'card',
      label: 'Card',
      description: 'The source as a card, with its kind, its date and a link out.',
      data: {
        layout: 'card',
        sourceId: 'src_review_report',
        title: 'Independent Grid Review: Findings and Recommendations',
        publisher: 'Office of the Independent Grid Review',
        url: 'https://example.org/independent-grid-review-2026',
        publishedAt: '2026-10-01',
        kind: 'report',
      },
    },
    {
      id: 'compact',
      label: 'Compact',
      description: 'The source as one line, with the publisher in front.',
      data: {
        layout: 'compact',
        sourceId: 'src_review_report',
        title: 'Independent Grid Review: Findings and Recommendations',
        publisher: 'Office of the Independent Grid Review',
        url: 'https://example.org/independent-grid-review-2026',
        publishedAt: '2026-10-01',
        kind: 'report',
      },
    },
    {
      id: 'badge',
      label: 'Badge',
      description: 'The publisher as a badge, with the title beside it.',
      data: {
        layout: 'badge',
        sourceId: 'src_review_report',
        title: 'Independent Grid Review: Findings and Recommendations',
        publisher: 'Office of the Independent Grid Review',
        url: 'https://example.org/independent-grid-review-2026',
        publishedAt: '2026-10-01',
        kind: 'report',
      },
    },
    {
      id: 'quote',
      label: 'Quote',
      description: 'The passage the story leans on, set as a pull quote.',
      data: {
        layout: 'quote',
        sourceId: 'src_review_report',
        title: 'Independent Grid Review: Findings and Recommendations',
        publisher: 'Office of the Independent Grid Review',
        url: 'https://example.org/independent-grid-review-2026',
        publishedAt: '2026-10-01',
        kind: 'report',
        excerpt:
          'Three of the four sites operated without an independent verification step at any point in the review period.',
      },
    },
    {
      id: 'reference',
      label: 'Reference',
      description: 'An entry in a numbered reference list.',
      data: {
        layout: 'reference',
        sourceId: 'src_review_report',
        title: 'Independent Grid Review: Findings and Recommendations',
        publisher: 'Office of the Independent Grid Review',
        url: 'https://example.org/independent-grid-review-2026',
        publishedAt: '2026-10-01',
        accessedAt: '2026-10-02',
        kind: 'report',
        referenceNumber: 1,
      },
    },
  ],

  entity: [
    {
      id: 'card',
      label: 'Card',
      description: 'The entity as a card, with a portrait and a profile link.',
      data: {
        layout: 'card',
        entityId: 'ent_ada_okafor',
        name: 'Ada Okafor',
        type: 'person',
        role: 'Director, Independent Grid Review',
        organization: 'Office of the Independent Grid Review',
        description: 'Director of the Independent Grid Review and former system operator.',
        avatarUrl: 'https://i.pravatar.cc/300?img=47',
      },
    },
    {
      id: 'compact',
      label: 'Compact',
      description: 'The entity as one line, with a small portrait.',
      data: {
        layout: 'compact',
        entityId: 'ent_ada_okafor',
        name: 'Ada Okafor',
        type: 'person',
        role: 'Director, Independent Grid Review',
        organization: 'Office of the Independent Grid Review',
        description: 'Director of the Independent Grid Review and former system operator.',
        avatarUrl: 'https://i.pravatar.cc/300?img=47',
      },
    },
    {
      id: 'chip',
      label: 'Chip',
      description: 'The entity as a small chip, with its initials.',
      data: {
        layout: 'chip',
        entityId: 'ent_ada_okafor',
        name: 'Ada Okafor',
        type: 'person',
        role: 'Director, Independent Grid Review',
        organization: 'Office of the Independent Grid Review',
        description: 'Director of the Independent Grid Review and former system operator.',
      },
    },
    {
      id: 'profile',
      label: 'Profile',
      description: 'The entity as a full profile, with its role and its links.',
      data: {
        layout: 'profile',
        entityId: 'ent_ada_okafor',
        name: 'Ada Okafor',
        type: 'person',
        role: 'Director, Independent Grid Review',
        organization: 'Office of the Independent Grid Review',
        description:
          'Director of the Independent Grid Review and former system operator. Appointed in 2025, and the author of the report that found the reporting gap.',
        avatarUrl: 'https://i.pravatar.cc/300?img=47',
        links: [
          { label: 'The review', url: 'https://example.org/independent-grid-review-2026' },
          { label: 'Appointment', url: 'https://example.org/press/okafor-appointment' },
        ],
      },
    },
    {
      id: 'directory',
      label: 'Directory',
      description: 'The entity as a directory entry, with its organisation.',
      data: {
        layout: 'directory',
        entityId: 'ent_ada_okafor',
        name: 'Ada Okafor',
        type: 'person',
        role: 'Director, Independent Grid Review',
        organization: 'Office of the Independent Grid Review',
        description: 'Director of the Independent Grid Review and former system operator.',
        avatarUrl: 'https://i.pravatar.cc/300?img=47',
      },
    },
  ],

  related_stories: [
    {
      id: 'grid',
      label: 'Grid',
      description: 'The related stories in a two-column grid.',
      data: {
        layout: 'grid',
        title: 'Related Coverage',
        storyIds: ['story_grid_review_2026', 'story_utility_transparency_2025'],
        stories: [
          {
            id: 'story_grid_review_2026',
            title: 'Three of the four sites checked nothing',
            summary:
              'The review that found that most of the country’s grid figures had never been verified.',
            topic: 'Investigation',
            publishedAt: '2026-10-01',
          },
          {
            id: 'story_utility_transparency_2025',
            title: 'What the utilities owe the public',
            summary: 'A year earlier, the question the review would end up answering.',
            topic: 'Analysis',
            publishedAt: '2025-11-12',
          },
        ],
      },
    },
    {
      id: 'list',
      label: 'List',
      description: 'The related stories as a list, one after another.',
      data: {
        layout: 'list',
        title: 'Related Coverage',
        storyIds: ['story_grid_review_2026', 'story_utility_transparency_2025'],
        stories: [
          {
            id: 'story_grid_review_2026',
            title: 'Three of the four sites checked nothing',
            summary:
              'The review that found that most of the country’s grid figures had never been verified.',
            topic: 'Investigation',
            publishedAt: '2026-10-01',
          },
          {
            id: 'story_utility_transparency_2025',
            title: 'What the utilities owe the public',
            summary: 'A year earlier, the question the review would end up answering.',
            topic: 'Analysis',
            publishedAt: '2025-11-12',
          },
        ],
      },
    },
    {
      id: 'carousel',
      label: 'Carousel',
      description: 'The related stories in a row that scrolls sideways.',
      data: {
        layout: 'carousel',
        title: 'Related Coverage',
        storyIds: ['story_grid_review_2026', 'story_utility_transparency_2025'],
        stories: [
          {
            id: 'story_grid_review_2026',
            title: 'Three of the four sites checked nothing',
            summary:
              'The review that found that most of the country’s grid figures had never been verified.',
            topic: 'Investigation',
            publishedAt: '2026-10-01',
          },
          {
            id: 'story_utility_transparency_2025',
            title: 'What the utilities owe the public',
            summary: 'A year earlier, the question the review would end up answering.',
            topic: 'Analysis',
            publishedAt: '2025-11-12',
          },
        ],
      },
    },
    {
      id: 'featured',
      label: 'Featured',
      description: 'The first story given the room, the rest beneath it.',
      data: {
        layout: 'featured',
        title: 'Related Coverage',
        storyIds: ['story_grid_review_2026', 'story_utility_transparency_2025'],
        stories: [
          {
            id: 'story_grid_review_2026',
            title: 'Three of the four sites checked nothing',
            summary:
              'The review that found that most of the country’s grid figures had never been verified.',
            topic: 'Investigation',
            publishedAt: '2026-10-01',
          },
          {
            id: 'story_utility_transparency_2025',
            title: 'What the utilities owe the public',
            summary: 'A year earlier, the question the review would end up answering.',
            topic: 'Analysis',
            publishedAt: '2025-11-12',
          },
        ],
      },
    },
    {
      id: 'compact',
      label: 'Compact',
      description: 'The related stories as a run of titles, for a narrow column.',
      data: {
        layout: 'compact',
        title: 'Related Coverage',
        storyIds: ['story_grid_review_2026', 'story_utility_transparency_2025'],
        stories: [
          {
            id: 'story_grid_review_2026',
            title: 'Three of the four sites checked nothing',
            topic: 'Investigation',
          },
          {
            id: 'story_utility_transparency_2025',
            title: 'What the utilities owe the public',
            topic: 'Analysis',
          },
        ],
      },
    },
  ],

  what_changed: [
    {
      id: 'list',
      label: 'List',
      description: 'The changes as a list, each with its own badge.',
      data: {
        layout: 'list',
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
      id: 'timeline',
      label: 'Timeline',
      description: 'The changes down a timeline, with a rule beside them.',
      data: {
        layout: 'timeline',
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
      id: 'summary',
      label: 'Summary',
      description: 'The changes counted by kind, in one line each.',
      data: {
        layout: 'summary',
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
      id: 'split',
      label: 'Split',
      description: 'The two options side by side, in their own panels.',
      data: {
        layout: 'split',
        title: 'Two ways to verify the number',
        subjectA: {
          name: 'Internal second sign-off',
          subtitle: 'A second analyst at the same site',
          points: [
            'Cheap: no new meter reading.',
            'Catches classification errors, not measurement errors.',
            'Not independent of the reporting site.',
          ],
          score: 3,
        },
        subjectB: {
          name: 'Third-party meter check',
          subtitle: 'An accredited body, appointed by the authority',
          points: [
            'Catches both measurement and classification errors.',
            'Expensive: roughly a third of a reporting site budget.',
            'Independent of the reporting site.',
          ],
          score: 8,
        },
        verdict:
          'The second sign-off is cheaper and faster; only the third-party check is actually independent.',
        criteria: [
          { label: 'Catches measurement error', a: 'weak', b: 'strong' },
          { label: 'Catches classification error', a: 'strong', b: 'strong' },
          { label: 'Cost', a: 'strong', b: 'weak' },
          { label: 'Independence from the site', a: 'weak', b: 'strong' },
          { label: 'Speed', a: 'strong', b: 'weak' },
        ],
      },
    },
    {
      id: 'table',
      label: 'Table',
      description: 'The two options as a table of matching points.',
      data: {
        layout: 'table',
        title: 'Two ways to verify the number',
        subjectA: {
          name: 'Internal second sign-off',
          subtitle: 'A second analyst at the same site',
          points: [
            'Cheap: no new meter reading.',
            'Catches classification errors, not measurement errors.',
            'Not independent of the reporting site.',
          ],
          score: 3,
        },
        subjectB: {
          name: 'Third-party meter check',
          subtitle: 'An accredited body, appointed by the authority',
          points: [
            'Catches both measurement and classification errors.',
            'Expensive: roughly a third of a reporting site budget.',
            'Independent of the reporting site.',
          ],
          score: 8,
        },
        verdict:
          'The second sign-off is cheaper and faster; only the third-party check is actually independent.',
        criteria: [
          { label: 'Catches measurement error', a: 'weak', b: 'strong' },
          { label: 'Catches classification error', a: 'strong', b: 'strong' },
          { label: 'Cost', a: 'strong', b: 'weak' },
          { label: 'Independence from the site', a: 'weak', b: 'strong' },
          { label: 'Speed', a: 'strong', b: 'weak' },
        ],
      },
    },
    {
      id: 'versus',
      label: 'Versus',
      description: 'The two options set against each other, with a rule between them.',
      data: {
        layout: 'versus',
        title: 'Two ways to verify the number',
        subjectA: {
          name: 'Internal second sign-off',
          subtitle: 'A second analyst at the same site',
          points: [
            'Cheap: no new meter reading.',
            'Catches classification errors, not measurement errors.',
            'Not independent of the reporting site.',
          ],
          score: 3,
        },
        subjectB: {
          name: 'Third-party meter check',
          subtitle: 'An accredited body, appointed by the authority',
          points: [
            'Catches both measurement and classification errors.',
            'Expensive: roughly a third of a reporting site budget.',
            'Independent of the reporting site.',
          ],
          score: 8,
        },
        verdict:
          'The second sign-off is cheaper and faster; only the third-party check is actually independent.',
        criteria: [
          { label: 'Catches measurement error', a: 'weak', b: 'strong' },
          { label: 'Catches classification error', a: 'strong', b: 'strong' },
          { label: 'Cost', a: 'strong', b: 'weak' },
          { label: 'Independence from the site', a: 'weak', b: 'strong' },
          { label: 'Speed', a: 'strong', b: 'weak' },
        ],
      },
    },
    {
      id: 'scorecard',
      label: 'Scorecard',
      description: 'The two options rated against the same criteria.',
      data: {
        layout: 'scorecard',
        title: 'Two ways to verify the number',
        subjectA: {
          name: 'Internal second sign-off',
          subtitle: 'A second analyst at the same site',
          points: [
            'Cheap: no new meter reading.',
            'Catches classification errors, not measurement errors.',
            'Not independent of the reporting site.',
          ],
          score: 3,
        },
        subjectB: {
          name: 'Third-party meter check',
          subtitle: 'An accredited body, appointed by the authority',
          points: [
            'Catches both measurement and classification errors.',
            'Expensive: roughly a third of a reporting site budget.',
            'Independent of the reporting site.',
          ],
          score: 8,
        },
        verdict:
          'The second sign-off is cheaper and faster; only the third-party check is actually independent.',
        criteria: [
          { label: 'Catches measurement error', a: 'weak', b: 'strong' },
          { label: 'Catches classification error', a: 'strong', b: 'strong' },
          { label: 'Cost', a: 'strong', b: 'weak' },
          { label: 'Independence from the site', a: 'weak', b: 'strong' },
          { label: 'Speed', a: 'strong', b: 'weak' },
        ],
      },
    },
    {
      id: 'verdict',
      label: 'Verdict',
      description: 'The conclusion on its own, with the two options named beneath it.',
      data: {
        layout: 'verdict',
        title: 'Two ways to verify the number',
        subjectA: {
          name: 'Internal second sign-off',
          subtitle: 'A second analyst at the same site',
          points: [
            'Cheap: no new meter reading.',
            'Catches classification errors, not measurement errors.',
            'Not independent of the reporting site.',
          ],
          score: 3,
        },
        subjectB: {
          name: 'Third-party meter check',
          subtitle: 'An accredited body, appointed by the authority',
          points: [
            'Catches both measurement and classification errors.',
            'Expensive: roughly a third of a reporting site budget.',
            'Independent of the reporting site.',
          ],
          score: 8,
        },
        verdict:
          'The second sign-off is cheaper and faster; only the third-party check is actually independent.',
        criteria: [
          { label: 'Catches measurement error', a: 'weak', b: 'strong' },
          { label: 'Catches classification error', a: 'strong', b: 'strong' },
          { label: 'Cost', a: 'strong', b: 'weak' },
          { label: 'Independence from the site', a: 'weak', b: 'strong' },
          { label: 'Speed', a: 'strong', b: 'weak' },
        ],
      },
    },
    {
      id: 'bars',
      label: 'Bars',
      description: 'The two options as bars scaled to their score.',
      data: {
        layout: 'bars',
        title: 'Two ways to verify the number',
        subjectA: {
          name: 'Internal second sign-off',
          subtitle: 'A second analyst at the same site',
          points: [
            'Cheap: no new meter reading.',
            'Catches classification errors, not measurement errors.',
            'Not independent of the reporting site.',
          ],
          score: 3,
        },
        subjectB: {
          name: 'Third-party meter check',
          subtitle: 'An accredited body, appointed by the authority',
          points: [
            'Catches both measurement and classification errors.',
            'Expensive: roughly a third of a reporting site budget.',
            'Independent of the reporting site.',
          ],
          score: 8,
        },
        verdict:
          'The second sign-off is cheaper and faster; only the third-party check is actually independent.',
        criteria: [
          { label: 'Catches measurement error', a: 'weak', b: 'strong' },
          { label: 'Catches classification error', a: 'strong', b: 'strong' },
          { label: 'Cost', a: 'strong', b: 'weak' },
          { label: 'Independence from the site', a: 'weak', b: 'strong' },
          { label: 'Speed', a: 'strong', b: 'weak' },
        ],
      },
    },
  ],
};
