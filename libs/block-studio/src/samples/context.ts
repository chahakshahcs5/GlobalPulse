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
      id: 'card',
      label: 'Card',
      description: 'The source as a card, with its date and a link out.',
      data: {
        layout: 'card',
        sourceId: 'src_review_report',
        title: 'Independent Grid Review: Findings and Recommendations',
        publisher: 'Office of the Independent Grid Review',
        url: 'https://example.org/independent-grid-review-2026',
        publishedAt: '2026-10-01',
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
        description: 'Director of the Independent Grid Review and former system operator.',
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
      },
    },
    {
      id: 'list',
      label: 'List',
      description: 'The related stories as a list, one to a line.',
      data: {
        layout: 'list',
        title: 'Related Coverage',
        storyIds: ['story_grid_review_2026', 'story_utility_transparency_2025'],
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
      id: 'table',
      label: 'Table',
      description: 'The two options as a table of matching points.',
      data: {
        layout: 'table',
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
      id: 'versus',
      label: 'Versus',
      description: 'The two options set against each other, with a rule between them.',
      data: {
        layout: 'versus',
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
