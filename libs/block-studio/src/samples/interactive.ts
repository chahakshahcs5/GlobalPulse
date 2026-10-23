/**
 * Sample payloads for the interactive blocks.
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

/**
 * The thread the live-comments variants show.
 *
 * The comments themselves live on the server, so a block that could only
 * be drawn from the server could not be previewed. The samples carry the
 * thread as it was published, and the live comments are merged over the
 * top of it when the server answers.
 *
 * One of them answers another, so the thread treatment has something to
 * indent.
 */
const SAMPLE_COMMENTS = [
  {
    id: 'comment_1',
    storyId: 'story_review',
    organizationId: 'org_globalpulse',
    authorId: 'reader_1',
    authorName: 'Marta Oyelaran',
    authorRole: 'reader' as const,
    content:
      'The verification step is the missing piece here. A second pair of eyes before publication is not a luxury for a figure that ends up in a report.',
    status: 'approved' as const,
    likesCount: 24,
    createdAt: '2026-10-20T09:12:00.000Z',
    updatedAt: '2026-10-20T09:12:00.000Z',
  },
  {
    id: 'comment_2',
    storyId: 'story_review',
    organizationId: 'org_globalpulse',
    authorId: 'reader_2',
    authorName: 'Tomás Bermúdez',
    authorRole: 'reader' as const,
    content: 'Was the overstatement checked against the meter data, or only against the filings?',
    status: 'approved' as const,
    likesCount: 11,
    parentId: 'comment_1',
    createdAt: '2026-10-20T10:04:00.000Z',
    updatedAt: '2026-10-20T10:04:00.000Z',
  },
  {
    id: 'comment_3',
    storyId: 'story_review',
    organizationId: 'org_globalpulse',
    authorId: 'reader_3',
    authorName: 'Priya Raghunathan',
    authorRole: 'subscriber' as const,
    content:
      'Three of the four sites filed on a different calendar from the rest, which is worth a line of its own in the piece.',
    status: 'approved' as const,
    likesCount: 8,
    createdAt: '2026-10-20T11:38:00.000Z',
    updatedAt: '2026-10-20T11:38:00.000Z',
  },
];

export const INTERACTIVE_SAMPLES: Record<string, StudioVariant[]> = {
  quiz: [
    {
      id: 'cards',
      label: 'Cards',
      description: 'The questions as cards.',
      data: {
        layout: 'cards',
        title: 'Test your understanding',
        description: 'Two questions on what the review actually found.',
        questions: [
          {
            id: 'q1',
            question: 'How many of the four sites had no independent verification step?',
            options: [
              { id: 'a', text: 'One', correct: false },
              { id: 'b', text: 'Three', correct: true },
              { id: 'c', text: 'All four', correct: false },
            ],
            explanation:
              'Three of the four sites had no second sign-off. The fourth verified only a sample.',
            sourceId: 'src_review_report',
          },
          {
            id: 'q2',
            question: 'What was the median overstatement across all sites?',
            options: [
              { id: 'a', text: '9.4%', correct: true },
              { id: 'b', text: '19%', correct: false },
              { id: 'c', text: '4.2%', correct: false },
            ],
            explanation:
              'The median was 9.4%. Nineteen per cent was the worst single site, not the median.',
          },
        ],
        showScore: true,
        allowRetry: true,
      },
    },
    {
      id: 'list',
      label: 'List',
      description: 'The questions as a plain list.',
      data: {
        layout: 'list',
        title: 'Test your understanding',
        description: 'Two questions on what the review actually found.',
        questions: [
          {
            id: 'q1',
            question: 'How many of the four sites had no independent verification step?',
            options: [
              { id: 'a', text: 'One', correct: false },
              { id: 'b', text: 'Three', correct: true },
              { id: 'c', text: 'All four', correct: false },
            ],
            explanation:
              'Three of the four sites had no second sign-off. The fourth verified only a sample.',
            sourceId: 'src_review_report',
          },
          {
            id: 'q2',
            question: 'What was the median overstatement across all sites?',
            options: [
              { id: 'a', text: '9.4%', correct: true },
              { id: 'b', text: '19%', correct: false },
              { id: 'c', text: '4.2%', correct: false },
            ],
            explanation:
              'The median was 9.4%. Nineteen per cent was the worst single site, not the median.',
          },
        ],
        showScore: true,
        allowRetry: true,
      },
    },
    {
      id: 'inline',
      label: 'Inline',
      description: 'The questions set inline, for a mention in the text.',
      data: {
        layout: 'inline',
        title: 'Test your understanding',
        description: 'Two questions on what the review actually found.',
        questions: [
          {
            id: 'q1',
            question: 'How many of the four sites had no independent verification step?',
            options: [
              { id: 'a', text: 'One', correct: false },
              { id: 'b', text: 'Three', correct: true },
              { id: 'c', text: 'All four', correct: false },
            ],
            explanation:
              'Three of the four sites had no second sign-off. The fourth verified only a sample.',
            sourceId: 'src_review_report',
          },
          {
            id: 'q2',
            question: 'What was the median overstatement across all sites?',
            options: [
              { id: 'a', text: '9.4%', correct: true },
              { id: 'b', text: '19%', correct: false },
              { id: 'c', text: '4.2%', correct: false },
            ],
            explanation:
              'The median was 9.4%. Nineteen per cent was the worst single site, not the median.',
          },
        ],
        showScore: true,
        allowRetry: true,
      },
    },
  ],

  what_if: [
    {
      id: 'sliders',
      label: 'Sliders',
      description: 'The scenario with its sliders beside the outcome.',
      data: {
        layout: 'sliders',
        title: 'What would it take to cut household energy bills by a fifth?',
        description: 'Move the sliders to see how a retrofit programme changes the average bill.',
        outcomeLabel: 'Average household bill',
        outcomeUnit: '$/year',
        expression: 'base_bill * (1 - insulation_saving) * (1 - solar_saving)',
        inputs: [
          {
            id: 'base_bill',
            label: 'Current average bill',
            min: 800,
            max: 4000,
            step: 50,
            defaultValue: 1800,
            unit: '$',
            note: 'Median across 12,000 households.',
          },
          {
            id: 'insulation_saving',
            label: 'Insulation saving',
            min: 0,
            max: 0.35,
            step: 0.01,
            defaultValue: 0.15,
            unit: '',
          },
          {
            id: 'solar_saving',
            label: 'Solar saving',
            min: 0,
            max: 0.4,
            step: 0.01,
            defaultValue: 0.1,
            unit: '',
          },
        ],
        breakdown: [
          { label: 'Bill after insulation', expression: 'base_bill * (1 - insulation_saving)' },
          { label: 'Solar contribution', expression: 'base_bill * solar_saving' },
        ],
        baselineOutcome: 1800,
        methodology: 'Savings are applied to the current average bill and compounded.',
        sourceAttribution: 'GlobalPulse modelling desk',
      },
    },
    {
      id: 'cards',
      label: 'Cards',
      description: 'The scenario as a card an input.',
      data: {
        layout: 'cards',
        title: 'What would it take to cut household energy bills by a fifth?',
        description: 'Move the sliders to see how a retrofit programme changes the average bill.',
        outcomeLabel: 'Average household bill',
        outcomeUnit: '$/year',
        expression: 'base_bill * (1 - insulation_saving) * (1 - solar_saving)',
        inputs: [
          {
            id: 'base_bill',
            label: 'Current average bill',
            min: 800,
            max: 4000,
            step: 50,
            defaultValue: 1800,
            unit: '$',
            note: 'Median across 12,000 households.',
          },
          {
            id: 'insulation_saving',
            label: 'Insulation saving',
            min: 0,
            max: 0.35,
            step: 0.01,
            defaultValue: 0.15,
            unit: '',
          },
          {
            id: 'solar_saving',
            label: 'Solar saving',
            min: 0,
            max: 0.4,
            step: 0.01,
            defaultValue: 0.1,
            unit: '',
          },
        ],
        breakdown: [
          { label: 'Bill after insulation', expression: 'base_bill * (1 - insulation_saving)' },
          { label: 'Solar contribution', expression: 'base_bill * solar_saving' },
        ],
        baselineOutcome: 1800,
        methodology: 'Savings are applied to the current average bill and compounded.',
        sourceAttribution: 'GlobalPulse modelling desk',
      },
    },
    {
      id: 'inline',
      label: 'Inline',
      description: 'The scenario on one line, for a mention in the text.',
      data: {
        layout: 'inline',
        title: 'What would it take to cut household energy bills by a fifth?',
        description: 'Move the sliders to see how a retrofit programme changes the average bill.',
        outcomeLabel: 'Average household bill',
        outcomeUnit: '$/year',
        expression: 'base_bill * (1 - insulation_saving) * (1 - solar_saving)',
        inputs: [
          {
            id: 'base_bill',
            label: 'Current average bill',
            min: 800,
            max: 4000,
            step: 50,
            defaultValue: 1800,
            unit: '$',
            note: 'Median across 12,000 households.',
          },
          {
            id: 'insulation_saving',
            label: 'Insulation saving',
            min: 0,
            max: 0.35,
            step: 0.01,
            defaultValue: 0.15,
            unit: '',
          },
          {
            id: 'solar_saving',
            label: 'Solar saving',
            min: 0,
            max: 0.4,
            step: 0.01,
            defaultValue: 0.1,
            unit: '',
          },
        ],
        breakdown: [
          { label: 'Bill after insulation', expression: 'base_bill * (1 - insulation_saving)' },
          { label: 'Solar contribution', expression: 'base_bill * solar_saving' },
        ],
        baselineOutcome: 1800,
        methodology: 'Savings are applied to the current average bill and compounded.',
        sourceAttribution: 'GlobalPulse modelling desk',
      },
    },
  ],

  live_comments: [
    {
      id: 'list',
      label: 'List',
      description: 'The comments as a list, one after another.',
      data: {
        layout: 'list',
        title: 'What readers are saying',
        description: 'The latest approved comments on this story.',
        maxComments: 10,
        showCta: true,
        comments: SAMPLE_COMMENTS,
      },
    },
    {
      id: 'thread',
      label: 'Thread',
      description: 'The comments as a thread, with replies under what they answer.',
      data: {
        layout: 'thread',
        title: 'What readers are saying',
        description: 'The latest approved comments on this story.',
        maxComments: 10,
        showCta: true,
        comments: SAMPLE_COMMENTS,
      },
    },
    {
      id: 'compact',
      label: 'Compact',
      description: 'The comments as one-line excerpts, for a narrow column.',
      data: {
        layout: 'compact',
        title: 'What readers are saying',
        description: 'The latest approved comments on this story.',
        maxComments: 10,
        showCta: true,
        comments: SAMPLE_COMMENTS,
      },
    },
  ],

  calculator: [
    {
      id: 'panel',
      label: 'Panel',
      description: 'The calculator as a panel.',
      data: {
        layout: 'panel',
        title: 'Fuel cost',
        description: 'Change the distance to see the cost move.',
        inputs: [
          { id: 'distance', label: 'Distance', type: 'number', unit: 'km', defaultValue: 100 },
          { id: 'efficiency', label: 'Efficiency', type: 'number', unit: 'km/l', defaultValue: 14 },
        ],
        outputs: [
          {
            id: 'cost',
            label: 'Cost',
            expression: 'distance / efficiency * 1.6',
            unit: '$',
            precision: 2,
          },
          {
            id: 'co2',
            label: 'CO2',
            expression: 'distance / efficiency * 0.17',
            unit: 'kg',
            precision: 1,
          },
        ],
        explanation: 'Fuel burn is distance divided by efficiency; the rate is 1.6 per litre.',
        assumptions: [
          'Fuel price held at 1.6 per litre',
          'Efficiency is the median for a mid-size car',
        ],
        sourceAttribution: 'GlobalPulse data desk',
      },
    },
    {
      id: 'inline',
      label: 'Inline',
      description: 'The calculator set inline, for a mention in the text.',
      data: {
        layout: 'inline',
        title: 'Fuel cost',
        description: 'Change the distance to see the cost move.',
        inputs: [
          { id: 'distance', label: 'Distance', type: 'number', unit: 'km', defaultValue: 100 },
          { id: 'efficiency', label: 'Efficiency', type: 'number', unit: 'km/l', defaultValue: 14 },
        ],
        outputs: [
          {
            id: 'cost',
            label: 'Cost',
            expression: 'distance / efficiency * 1.6',
            unit: '$',
            precision: 2,
          },
          {
            id: 'co2',
            label: 'CO2',
            expression: 'distance / efficiency * 0.17',
            unit: 'kg',
            precision: 1,
          },
        ],
        explanation: 'Fuel burn is distance divided by efficiency; the rate is 1.6 per litre.',
        assumptions: [
          'Fuel price held at 1.6 per litre',
          'Efficiency is the median for a mid-size car',
        ],
        sourceAttribution: 'GlobalPulse data desk',
      },
    },
    {
      id: 'steps',
      label: 'Steps',
      description: 'The calculator as a numbered set of steps.',
      data: {
        layout: 'steps',
        title: 'Fuel cost',
        description: 'Change the distance to see the cost move.',
        inputs: [
          { id: 'distance', label: 'Distance', type: 'number', unit: 'km', defaultValue: 100 },
          { id: 'efficiency', label: 'Efficiency', type: 'number', unit: 'km/l', defaultValue: 14 },
        ],
        outputs: [
          {
            id: 'cost',
            label: 'Cost',
            expression: 'distance / efficiency * 1.6',
            unit: '$',
            precision: 2,
          },
          {
            id: 'co2',
            label: 'CO2',
            expression: 'distance / efficiency * 0.17',
            unit: 'kg',
            precision: 1,
          },
        ],
        explanation: 'Fuel burn is distance divided by efficiency; the rate is 1.6 per litre.',
        assumptions: [
          'Fuel price held at 1.6 per litre',
          'Efficiency is the median for a mid-size car',
        ],
        sourceAttribution: 'GlobalPulse data desk',
      },
    },
  ],

  poll: [
    {
      id: 'bars',
      label: 'Bars',
      description: 'The answers as rows filled to the proportion of votes.',
      data: {
        layout: 'bars',
        pollId: 'poll_grid_trust_2026',
        question: 'Do you trust the figures your utility publishes?',
        options: [
          { id: 'opt_yes', text: 'Yes, mostly', voteCount: 412 },
          { id: 'opt_some', text: 'Some of the time', voteCount: 689 },
          { id: 'opt_no', text: 'No', voteCount: 288 },
        ],
        totalVotes: 1389,
        expiresAt: '2026-12-31T23:59:59Z',
        closed: false,
      },
    },
    {
      id: 'pills',
      label: 'Pills',
      description: 'The answers as a row of pills, to tap.',
      data: {
        layout: 'pills',
        pollId: 'poll_grid_trust_2026',
        question: 'Do you trust the figures your utility publishes?',
        options: [
          { id: 'opt_yes', text: 'Yes, mostly', voteCount: 412 },
          { id: 'opt_some', text: 'Some of the time', voteCount: 689 },
          { id: 'opt_no', text: 'No', voteCount: 288 },
        ],
        totalVotes: 1389,
        expiresAt: '2026-12-31T23:59:59Z',
        closed: false,
      },
    },
    {
      id: 'list',
      label: 'List',
      description: 'The answers as a list, with the counts beside them.',
      data: {
        layout: 'list',
        pollId: 'poll_grid_trust_2026',
        question: 'Do you trust the figures your utility publishes?',
        options: [
          { id: 'opt_yes', text: 'Yes, mostly', voteCount: 412 },
          { id: 'opt_some', text: 'Some of the time', voteCount: 689 },
          { id: 'opt_no', text: 'No', voteCount: 288 },
        ],
        totalVotes: 1389,
        expiresAt: '2026-12-31T23:59:59Z',
        closed: false,
      },
    },
  ],

  live_ticker: [
    {
      id: 'row',
      label: 'Row',
      description: 'The figures in a row.',
      data: {
        layout: 'row',
        title: 'Markets',
        refreshIntervalSeconds: 30,
        items: [
          {
            symbol: 'NIFTY',
            label: 'Nifty 50',
            value: 25430.2,
            delta: 1.2,
            unit: 'index',
            sparkline: [24810, 24940, 24890, 25120, 25230, 25180, 25430],
            lastUpdated: '2026-10-21T10:42:00Z',
          },
          {
            symbol: 'EURUSD',
            label: 'Euro / US dollar',
            value: 1.0842,
            delta: -0.3,
            sparkline: [1.091, 1.089, 1.0902, 1.0861, 1.0842],
            lastUpdated: '2026-10-21T10:42:00Z',
          },
          {
            symbol: 'BRENT',
            label: 'Brent crude',
            value: 78.41,
            delta: 2.1,
            unit: '$',
            sparkline: [74.2, 75.1, 76.8, 76.2, 77.9, 78.41],
            lastUpdated: '2026-10-21T10:42:00Z',
          },
          {
            symbol: 'GOLD',
            label: 'Gold',
            value: 2640.8,
            delta: 0.4,
            unit: '$',
            sparkline: [2610, 2625, 2618, 2631, 2640.8],
            lastUpdated: '2026-10-21T10:42:00Z',
          },
        ],
      },
    },
    {
      id: 'grid',
      label: 'Grid',
      description: 'The figures in a grid.',
      data: {
        layout: 'grid',
        title: 'Markets',
        refreshIntervalSeconds: 30,
        items: [
          {
            symbol: 'NIFTY',
            label: 'Nifty 50',
            value: 25430.2,
            delta: 1.2,
            unit: 'index',
            sparkline: [24810, 24940, 24890, 25120, 25230, 25180, 25430],
            lastUpdated: '2026-10-21T10:42:00Z',
          },
          {
            symbol: 'EURUSD',
            label: 'Euro / US dollar',
            value: 1.0842,
            delta: -0.3,
            sparkline: [1.091, 1.089, 1.0902, 1.0861, 1.0842],
            lastUpdated: '2026-10-21T10:42:00Z',
          },
          {
            symbol: 'BRENT',
            label: 'Brent crude',
            value: 78.41,
            delta: 2.1,
            unit: '$',
            sparkline: [74.2, 75.1, 76.8, 76.2, 77.9, 78.41],
            lastUpdated: '2026-10-21T10:42:00Z',
          },
          {
            symbol: 'GOLD',
            label: 'Gold',
            value: 2640.8,
            delta: 0.4,
            unit: '$',
            sparkline: [2610, 2625, 2618, 2631, 2640.8],
            lastUpdated: '2026-10-21T10:42:00Z',
          },
        ],
      },
    },
    {
      id: 'cards',
      label: 'Cards',
      description: 'The figures as a card each.',
      data: {
        layout: 'cards',
        title: 'Markets',
        refreshIntervalSeconds: 30,
        items: [
          {
            symbol: 'NIFTY',
            label: 'Nifty 50',
            value: 25430.2,
            delta: 1.2,
            unit: 'index',
            sparkline: [24810, 24940, 24890, 25120, 25230, 25180, 25430],
            lastUpdated: '2026-10-21T10:42:00Z',
          },
          {
            symbol: 'EURUSD',
            label: 'Euro / US dollar',
            value: 1.0842,
            delta: -0.3,
            sparkline: [1.091, 1.089, 1.0902, 1.0861, 1.0842],
            lastUpdated: '2026-10-21T10:42:00Z',
          },
          {
            symbol: 'BRENT',
            label: 'Brent crude',
            value: 78.41,
            delta: 2.1,
            unit: '$',
            sparkline: [74.2, 75.1, 76.8, 76.2, 77.9, 78.41],
            lastUpdated: '2026-10-21T10:42:00Z',
          },
          {
            symbol: 'GOLD',
            label: 'Gold',
            value: 2640.8,
            delta: 0.4,
            unit: '$',
            sparkline: [2610, 2625, 2618, 2631, 2640.8],
            lastUpdated: '2026-10-21T10:42:00Z',
          },
        ],
      },
    },
  ],

  live_data: [
    {
      id: 'cards',
      label: 'Cards',
      description: 'The values as cards.',
      data: {
        layout: 'cards',
        title: 'Grid stress monitor',
        refreshIntervalSeconds: 60,
        items: [
          {
            id: 'reserve',
            label: 'Reserve margin',
            provider: 'Grid Authority',
            value: 6.4,
            previousValue: 8.1,
            change: -1.7,
            unit: '%',
            asOf: '2026-10-21T10:42:00Z',
            sourceUrl: 'https://example.org/grid/reserve-margin',
            methodology: 'Spare capacity as a share of forecast peak demand.',
            license: 'Open Data 1.0',
          },
          {
            id: 'frequency',
            label: 'System frequency',
            provider: 'Grid Authority',
            value: 50.02,
            previousValue: 50.01,
            change: 0.01,
            unit: 'Hz',
            asOf: '2026-10-21T10:42:00Z',
          },
        ],
        sourceAttribution: 'Grid Authority live feed',
      },
    },
    {
      id: 'table',
      label: 'Table',
      description: 'The values as a table.',
      data: {
        layout: 'table',
        title: 'Grid stress monitor',
        refreshIntervalSeconds: 60,
        items: [
          {
            id: 'reserve',
            label: 'Reserve margin',
            provider: 'Grid Authority',
            value: 6.4,
            previousValue: 8.1,
            change: -1.7,
            unit: '%',
            asOf: '2026-10-21T10:42:00Z',
            sourceUrl: 'https://example.org/grid/reserve-margin',
            methodology: 'Spare capacity as a share of forecast peak demand.',
            license: 'Open Data 1.0',
          },
          {
            id: 'frequency',
            label: 'System frequency',
            provider: 'Grid Authority',
            value: 50.02,
            previousValue: 50.01,
            change: 0.01,
            unit: 'Hz',
            asOf: '2026-10-21T10:42:00Z',
          },
        ],
        sourceAttribution: 'Grid Authority live feed',
      },
    },
    {
      id: 'inline',
      label: 'Inline',
      description: 'The values on one line.',
      data: {
        layout: 'inline',
        title: 'Grid stress monitor',
        refreshIntervalSeconds: 60,
        items: [
          {
            id: 'reserve',
            label: 'Reserve margin',
            provider: 'Grid Authority',
            value: 6.4,
            previousValue: 8.1,
            change: -1.7,
            unit: '%',
            asOf: '2026-10-21T10:42:00Z',
            sourceUrl: 'https://example.org/grid/reserve-margin',
            methodology: 'Spare capacity as a share of forecast peak demand.',
            license: 'Open Data 1.0',
          },
          {
            id: 'frequency',
            label: 'System frequency',
            provider: 'Grid Authority',
            value: 50.02,
            previousValue: 50.01,
            change: 0.01,
            unit: 'Hz',
            asOf: '2026-10-21T10:42:00Z',
          },
        ],
        sourceAttribution: 'Grid Authority live feed',
      },
    },
  ],

  document_viewer: [
    {
      id: 'reader',
      label: 'Reader',
      description: 'The document as a reader.',
      data: {
        layout: 'reader',
        documentUrl: 'https://example.org/documents/grid-review-2026.pdf',
        title: 'Independent Grid Review: Findings and Recommendations',
        pageCount: 84,
        documentType: 'regulatory_directive',
        description: 'The full review, published on 1 October 2026.',
        highlights: [
          {
            page: 14,
            excerpt:
              'Three of the four sites operated without an independent verification step at any point in the review period.',
            note: 'The finding that anchors the story.',
            tag: 'key finding',
          },
          {
            page: 41,
            excerpt:
              'Reporting instructions issued in 2022 described the verification step as optional and were not distributed to two of the four sites.',
            note: 'Explains why the gap happened.',
            tag: 'guidance',
          },
          {
            page: 67,
            excerpt:
              'A second sign-off shall be mandatory for every reported value, and results shall be published quarterly.',
            note: 'What changes now.',
            tag: 'recommendation',
          },
        ],
        sourceAttribution: 'Office of the Independent Grid Review',
      },
    },
    {
      id: 'gallery',
      label: 'Gallery',
      description: 'The document as a gallery of its highlights.',
      data: {
        layout: 'gallery',
        documentUrl: 'https://example.org/documents/grid-review-2026.pdf',
        title: 'Independent Grid Review: Findings and Recommendations',
        pageCount: 84,
        documentType: 'regulatory_directive',
        description: 'The full review, published on 1 October 2026.',
        highlights: [
          {
            page: 14,
            excerpt:
              'Three of the four sites operated without an independent verification step at any point in the review period.',
            note: 'The finding that anchors the story.',
            tag: 'key finding',
          },
          {
            page: 41,
            excerpt:
              'Reporting instructions issued in 2022 described the verification step as optional and were not distributed to two of the four sites.',
            note: 'Explains why the gap happened.',
            tag: 'guidance',
          },
          {
            page: 67,
            excerpt:
              'A second sign-off shall be mandatory for every reported value, and results shall be published quarterly.',
            note: 'What changes now.',
            tag: 'recommendation',
          },
        ],
        sourceAttribution: 'Office of the Independent Grid Review',
      },
    },
    {
      id: 'list',
      label: 'List',
      description: 'The document as a list of its highlights.',
      data: {
        layout: 'list',
        documentUrl: 'https://example.org/documents/grid-review-2026.pdf',
        title: 'Independent Grid Review: Findings and Recommendations',
        pageCount: 84,
        documentType: 'regulatory_directive',
        description: 'The full review, published on 1 October 2026.',
        highlights: [
          {
            page: 14,
            excerpt:
              'Three of the four sites operated without an independent verification step at any point in the review period.',
            note: 'The finding that anchors the story.',
            tag: 'key finding',
          },
          {
            page: 41,
            excerpt:
              'Reporting instructions issued in 2022 described the verification step as optional and were not distributed to two of the four sites.',
            note: 'Explains why the gap happened.',
            tag: 'guidance',
          },
          {
            page: 67,
            excerpt:
              'A second sign-off shall be mandatory for every reported value, and results shall be published quarterly.',
            note: 'What changes now.',
            tag: 'recommendation',
          },
        ],
        sourceAttribution: 'Office of the Independent Grid Review',
      },
    },
  ],
};
