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

export const INTERACTIVE_SAMPLES: Record<string, StudioVariant[]> = {
  quiz: [
    {
      id: 'comprehension',
      label: 'Comprehension check',
      description: 'Questions with an explanation revealed after answering.',
      data: {
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
      id: 'no-score',
      label: 'Without a score',
      description: 'Questions with explanations, but no score at the end.',
      data: {
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
          },
        ],
        showScore: false,
        allowRetry: true,
      },
    },
    {
      id: 'one-shot',
      label: 'No retry',
      description: 'The reader answers once, and that is the end of it.',
      data: {
        title: 'One question on the review',
        questions: [
          {
            id: 'q1',
            question: 'Which site reported the most accurately?',
            options: [
              { id: 'a', text: 'Ridgeway', correct: true },
              { id: 'b', text: 'Northfield', correct: false },
              { id: 'c', text: 'Harbour East', correct: false },
              { id: 'd', text: 'Coastal', correct: false },
            ],
            explanation:
              'Ridgeway signed every filing throughout the review period, and its median gap was 5.1 per cent — the smallest of the four.',
            sourceId: 'src_review_data',
          },
        ],
        showScore: true,
        allowRetry: false,
      },
    },
    {
      id: 'single-question',
      label: 'A single question',
      description: 'The smallest a quiz can be.',
      data: {
        title: 'Did you know?',
        questions: [
          {
            id: 'q1',
            question: 'What was the median overstatement across all four sites?',
            options: [
              { id: 'a', text: '9.4%', correct: true },
              { id: 'b', text: '19%', correct: false },
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
      id: 'many-questions',
      label: 'Five questions',
      description: 'A longer quiz, with a question on each part of the finding.',
      data: {
        title: 'Five questions on the review',
        description: 'One question for each thing the review establishes.',
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
          {
            id: 'q3',
            question: 'What caused most of the gap?',
            options: [
              { id: 'a', text: 'Measurement error', correct: true },
              { id: 'b', text: 'Deliberate inflation', correct: false },
              { id: 'c', text: 'Bad weather', correct: false },
            ],
            explanation:
              'Measurement error accounted for the largest share, and for most of the growth. No document evidences intent.',
          },
          {
            id: 'q4',
            question: 'Which site reported most accurately?',
            options: [
              { id: 'a', text: 'Ridgeway', correct: true },
              { id: 'b', text: 'Coastal', correct: false },
            ],
            explanation:
              'Ridgeway signed every filing throughout the period, and had the smallest median gap.',
          },
          {
            id: 'q5',
            question: 'What changes from January?',
            options: [
              { id: 'a', text: 'A second sign-off is mandatory', correct: true },
              { id: 'b', text: 'The sites are merged', correct: false },
              { id: 'c', text: 'Reporting is unchanged', correct: false },
            ],
            explanation:
              'A second sign-off is now mandatory at every site, and results are published quarterly.',
          },
        ],
        showScore: true,
        allowRetry: true,
        methodology:
          'Every explanation points to the page of the review it comes from, or to the dataset it was calculated from.',
        sourceAttribution: 'GlobalPulse investigations',
      },
    },
  ],

  what_if: [
    {
      id: 'retrofit',
      label: 'Scenario explorer',
      description: 'Sliders that recompute the outcome live.',
      data: {
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
      id: 'no-breakdown',
      label: 'Without a breakdown',
      description: 'The outcome moves, but the components are not shown.',
      data: {
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
        methodology: 'Savings are applied to the current average bill and compounded.',
        sourceAttribution: 'GlobalPulse modelling desk',
      },
    },
    {
      id: 'with-notes',
      label: 'With notes',
      description: 'Every slider says where its range comes from.',
      data: {
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
            note: 'Median across 12,000 households, before any support scheme.',
          },
          {
            id: 'insulation_saving',
            label: 'Insulation saving',
            min: 0,
            max: 0.35,
            step: 0.01,
            defaultValue: 0.15,
            unit: '',
            note: 'The median saving in the retrofit programme’s own evaluation.',
          },
          {
            id: 'solar_saving',
            label: 'Solar saving',
            min: 0,
            max: 0.4,
            step: 0.01,
            defaultValue: 0.1,
            unit: '',
            note: 'Assumes rooftop panels on an unshaded south-facing roof.',
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
      id: 'many-inputs',
      label: 'Five inputs',
      description: 'A scenario with more levers to move.',
      data: {
        title: 'What would it take to cut household energy bills by a fifth?',
        description:
          'Five assumptions, and the bill that comes out of them. Move any one of them and the rest hold.',
        outcomeLabel: 'Average household bill',
        outcomeUnit: '$/year',
        expression:
          'base_bill * (1 - insulation_saving) * (1 - solar_saving) * (1 - efficiency_saving) - tariff_support',
        inputs: [
          {
            id: 'base_bill',
            label: 'Current average bill',
            min: 800,
            max: 4000,
            step: 50,
            defaultValue: 1800,
            unit: '$',
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
          {
            id: 'efficiency_saving',
            label: 'Efficiency saving',
            min: 0,
            max: 0.2,
            step: 0.01,
            defaultValue: 0.05,
            unit: '',
          },
          {
            id: 'tariff_support',
            label: 'Tariff support',
            min: 0,
            max: 400,
            step: 10,
            defaultValue: 0,
            unit: '$',
          },
        ],
        breakdown: [
          { label: 'Bill after insulation', expression: 'base_bill * (1 - insulation_saving)' },
          { label: 'Solar contribution', expression: 'base_bill * solar_saving' },
          { label: 'Efficiency contribution', expression: 'base_bill * efficiency_saving' },
          { label: 'Tariff support', expression: 'tariff_support' },
        ],
        baselineOutcome: 1800,
        methodology: 'Savings are applied to the current average bill and compounded.',
        sourceAttribution: 'GlobalPulse modelling desk',
      },
    },
    {
      id: 'single-input',
      label: 'One input',
      description: 'A scenario with a single lever.',
      data: {
        title: 'What would a second sign-off cost?',
        description: 'Move the slider to see what the verification step costs each site.',
        outcomeLabel: 'Annual cost per site',
        outcomeUnit: '$',
        expression: 'staff_hours * 42 * 38',
        inputs: [
          {
            id: 'staff_hours',
            label: 'Verification hours per week',
            min: 0,
            max: 40,
            step: 1,
            defaultValue: 8,
            unit: 'hours',
            note: 'One analyst checking a second signature on every filing.',
          },
        ],
        breakdown: [{ label: 'Annual staff cost', expression: 'staff_hours * 42 * 38' }],
        baselineOutcome: 12768,
        methodology:
          'Assumes 42 working weeks at an all-in hourly rate of 38. The authority has not published its own estimate.',
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
      },
    },
  ],

  calculator: [
    {
      id: 'calculator',
      label: 'Calculator',
      description: 'Structured inputs feeding safe expressions.',
      data: {
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
      id: 'range-input',
      label: 'A range input',
      description: 'One of the inputs is a slider rather than a number box.',
      data: {
        title: 'Fuel cost',
        description: 'Drag the efficiency slider to see how the cost moves.',
        inputs: [
          {
            id: 'distance',
            label: 'Distance',
            type: 'number',
            unit: 'km',
            defaultValue: 100,
          },
          {
            id: 'efficiency',
            label: 'Efficiency',
            type: 'range',
            unit: 'km/l',
            defaultValue: 14,
            min: 6,
            max: 25,
            step: 0.5,
          },
        ],
        outputs: [
          {
            id: 'cost',
            label: 'Cost',
            expression: 'distance / efficiency * 1.6',
            unit: '$',
            precision: 2,
          },
        ],
        explanation: 'Fuel burn is distance divided by efficiency; the rate is 1.6 per litre.',
        assumptions: ['Fuel price held at 1.6 per litre'],
      },
    },
    {
      id: 'select-input',
      label: 'A select input',
      description: 'One of the inputs is a choice rather than a number.',
      data: {
        title: 'Annual cost of a second sign-off',
        description: 'Pick a vehicle class and the cost updates.',
        inputs: [
          {
            id: 'distance',
            label: 'Distance',
            type: 'number',
            unit: 'km',
            defaultValue: 100,
          },
          {
            id: 'class',
            label: 'Vehicle class',
            type: 'select',
            defaultValue: 'medium',
            options: [
              { label: 'Small', value: 'small' },
              { label: 'Medium', value: 'medium' },
              { label: 'Large', value: 'large' },
            ],
          },
        ],
        outputs: [
          {
            id: 'cost',
            label: 'Cost',
            expression: 'distance / 14 * 1.6',
            unit: '$',
            description: 'At the median efficiency of 14 km/l.',
            precision: 2,
          },
        ],
        assumptions: ['Fuel price held at 1.6 per litre'],
      },
    },
    {
      id: 'many-outputs',
      label: 'Four outputs',
      description: 'One set of inputs, four things calculated from them.',
      data: {
        title: 'A journey, worked out',
        description: 'Change the distance to see every figure move together.',
        inputs: [
          { id: 'distance', label: 'Distance', type: 'number', unit: 'km', defaultValue: 100 },
          { id: 'efficiency', label: 'Efficiency', type: 'number', unit: 'km/l', defaultValue: 14 },
        ],
        outputs: [
          {
            id: 'cost',
            label: 'Fuel cost',
            expression: 'distance / efficiency * 1.6',
            unit: '$',
            precision: 2,
          },
          {
            id: 'co2',
            label: 'Carbon',
            expression: 'distance / efficiency * 0.17',
            unit: 'kg',
            precision: 1,
          },
          {
            id: 'litres',
            label: 'Fuel burned',
            expression: 'distance / efficiency',
            unit: 'litres',
            precision: 1,
          },
          {
            id: 'cost_per_km',
            label: 'Cost per kilometre',
            expression: 'distance / efficiency * 1.6 / distance',
            unit: '$/km',
            precision: 3,
          },
        ],
        explanation: 'Fuel burn is distance divided by efficiency; the rate is 1.6 per litre.',
        assumptions: [
          'Fuel price held at 1.6 per litre',
          'Efficiency is the median for a mid-size car',
          'Carbon at 0.17 kg per litre',
        ],
        sourceAttribution: 'GlobalPulse data desk',
      },
    },
    {
      id: 'minimal',
      label: 'One input, one output',
      description: 'The smallest a calculator can be.',
      data: {
        title: 'Cost per kilometre',
        inputs: [
          { id: 'distance', label: 'Distance', type: 'number', unit: 'km', defaultValue: 100 },
        ],
        outputs: [
          {
            id: 'cost',
            label: 'Cost',
            expression: 'distance / 14 * 1.6',
            unit: '$',
            precision: 2,
          },
        ],
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
      id: 'markets',
      label: 'Market ticker',
      description: 'A ticker with per-item sparklines.',
      data: {
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
      id: 'with-live-key',
      label: 'Bound to a live feed',
      description: 'A ticker that refreshes from the platform’s own feed.',
      data: {
        title: 'Markets',
        refreshIntervalSeconds: 15,
        liveKey: 'markets:global',
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
            symbol: 'BRENT',
            label: 'Brent crude',
            value: 78.41,
            delta: 2.1,
            unit: '$',
            sparkline: [74.2, 75.1, 76.8, 76.2, 77.9, 78.41],
            lastUpdated: '2026-10-21T10:42:00Z',
          },
        ],
      },
    },
    {
      id: 'single-item',
      label: 'One item',
      description: 'A ticker with a single symbol in it.',
      data: {
        title: 'The one number that matters',
        refreshIntervalSeconds: 60,
        items: [
          {
            symbol: 'RESERVE',
            label: 'Reserve margin',
            value: 6.4,
            delta: -1.7,
            unit: '%',
            sparkline: [9.2, 8.8, 8.1, 7.4, 7.1, 6.8, 6.4],
            lastUpdated: '2026-10-21T10:42:00Z',
          },
        ],
      },
    },
    {
      id: 'no-sparklines',
      label: 'Without sparklines',
      description: 'A ticker with no history behind each symbol.',
      data: {
        title: 'Markets',
        refreshIntervalSeconds: 30,
        items: [
          { symbol: 'NIFTY', label: 'Nifty 50', value: 25430.2, delta: 1.2, unit: 'index' },
          { symbol: 'EURUSD', label: 'Euro / US dollar', value: 1.0842, delta: -0.3 },
          { symbol: 'BRENT', label: 'Brent crude', value: 78.41, delta: 2.1, unit: '$' },
        ],
      },
    },
    {
      id: 'many-items',
      label: 'Six symbols',
      description: 'A longer ticker, with a sparkline on every line.',
      data: {
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
            symbol: 'SENSEX',
            label: 'Sensex',
            value: 79412.6,
            delta: 0.8,
            unit: 'index',
            sparkline: [78100, 78540, 78390, 78980, 79120, 79040, 79412],
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
            symbol: 'GBPUSD',
            label: 'Pound / US dollar',
            value: 1.2714,
            delta: 0.2,
            sparkline: [1.268, 1.2691, 1.2702, 1.2708, 1.2714],
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
      id: 'live-data',
      label: 'Live dataset',
      description: 'Named live values with a provider and a refresh interval.',
      data: {
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
      id: 'with-live-key',
      label: 'Bound to a live feed',
      description: 'Values that refresh from the platform’s own feed.',
      data: {
        title: 'Grid stress monitor',
        refreshIntervalSeconds: 30,
        liveKey: 'grid:stress',
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
        ],
        sourceAttribution: 'Grid Authority live feed',
      },
    },
    {
      id: 'text-value',
      label: 'A value that is text',
      description: 'A live value that is a state rather than a number.',
      data: {
        title: 'Reporting status',
        refreshIntervalSeconds: 300,
        items: [
          {
            id: 'northfield',
            label: 'Northfield',
            provider: 'Grid Authority',
            value: 'Verified',
            asOf: '2026-10-21T10:42:00Z',
            sourceUrl: 'https://example.org/grid/sites/northfield',
          },
          {
            id: 'harbour',
            label: 'Harbour East',
            provider: 'Grid Authority',
            value: 'Partly verified',
            previousValue: 12,
            change: -2,
            unit: '%',
            asOf: '2026-10-21T10:42:00Z',
          },
          {
            id: 'coastal',
            label: 'Coastal',
            provider: 'Grid Authority',
            value: 'Unverified',
            asOf: '2026-10-21T10:42:00Z',
          },
        ],
        sourceAttribution: 'Grid Authority live feed',
      },
    },
    {
      id: 'many-items',
      label: 'Six values',
      description: 'A fuller monitor, with a source and a licence on each value.',
      data: {
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
          {
            id: 'demand',
            label: 'Current demand',
            provider: 'Grid Authority',
            value: 41240,
            previousValue: 38900,
            change: 2330,
            unit: 'MW',
            asOf: '2026-10-21T10:42:00Z',
            methodology: 'Metered demand across the four reporting sites.',
          },
          {
            id: 'wind',
            label: 'Wind generation',
            provider: 'Grid Authority',
            value: 6840,
            previousValue: 7210,
            change: -370,
            unit: 'MW',
            asOf: '2026-10-21T10:42:00Z',
          },
          {
            id: 'interconnect',
            label: 'Interconnector flow',
            provider: 'Grid Authority',
            value: 1180,
            previousValue: 1240,
            change: -60,
            unit: 'MW',
            asOf: '2026-10-21T10:42:00Z',
          },
          {
            id: 'alarms',
            label: 'Open capacity alarms',
            provider: 'Grid Authority',
            value: 2,
            previousValue: 5,
            change: -3,
            unit: 'alarms',
            asOf: '2026-10-21T10:42:00Z',
          },
        ],
        sourceAttribution: 'Grid Authority live feed',
      },
    },
    {
      id: 'single-item',
      label: 'One value',
      description: 'The smallest a live dataset can be.',
      data: {
        title: 'Reserve margin',
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
          },
        ],
      },
    },
  ],

  document_viewer: [
    {
      id: 'filing',
      label: 'Paginated document',
      description: 'A sourced document with highlighted pages.',
      data: {
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
      id: 'court-filing',
      label: 'A court filing',
      description: 'A document from a court, with the relevant paragraphs picked out.',
      data: {
        documentUrl: 'https://example.org/documents/northfield-appeal-2026.pdf',
        title: 'Northfield Energy: appeal against the 2025 reporting direction',
        pageCount: 46,
        documentType: 'court_filing',
        description: 'The appeal, and the authority’s response, filed on 12 August 2026.',
        highlights: [
          {
            page: 6,
            excerpt:
              'The appellant contends that the verification step described at paragraph 3.2 of the 2022 instructions constituted a mandatory obligation.',
            note: 'The whole case turns on the status of paragraph 3.2.',
            tag: 'the issue',
          },
          {
            page: 28,
            excerpt:
              'We accept that the instructions were drafted in terms that permitted a reasonable operator to treat the step as optional.',
            note: 'The authority concedes the drafting point.',
            tag: 'concession',
          },
        ],
        sourceAttribution: 'Regional Court, Civil Division',
      },
    },
    {
      id: 'financial-disclosure',
      label: 'A financial disclosure',
      description: 'A regulatory filing, with the figures that matter marked.',
      data: {
        documentUrl: 'https://example.org/documents/northwind-q3-2026.pdf',
        title: 'Northwind Energy: third-quarter disclosure',
        pageCount: 28,
        documentType: 'financial_disclosure',
        description: 'The quarterly filing, published on 30 September 2026.',
        highlights: [
          {
            page: 4,
            excerpt:
              'Revenue for the quarter was 1,840m, an increase of 4.2 per cent on the same quarter of 2025.',
            note: 'Revenue, as reported.',
            tag: 'revenue',
          },
          {
            page: 11,
            excerpt: 'Reported demand across the four sites was 214.6 TWh for the quarter.',
            note: 'The demand figure — the one the review re-checked.',
            tag: 'demand',
          },
        ],
        sourceAttribution: 'Northwind Energy quarterly filing',
      },
    },
    {
      id: 'leak',
      label: 'A leaked document',
      description: 'An unpublished document, with the passages that matter marked.',
      data: {
        documentUrl: 'https://example.org/documents/2022-instructions-draft.pdf',
        title: 'Reporting instructions, 2022: the draft that was circulated',
        pageCount: 9,
        documentType: 'leak',
        description:
          'The draft instructions, obtained by the review team and published with their findings.',
        highlights: [
          {
            page: 2,
            excerpt:
              'Verification of reported values is a recommended practice. Sites are encouraged, but not required, to seek a second sign-off.',
            note: 'This is the sentence the whole finding rests on.',
            tag: 'key document',
          },
          {
            page: 3,
            excerpt: 'Distribution: all registered reporting sites. [Draft — not yet issued.]',
            note: 'The draft was never marked as issued.',
            tag: 'distribution',
          },
        ],
        sourceAttribution: 'Office of the Independent Grid Review',
      },
    },
    {
      id: 'treaty',
      label: 'A treaty',
      description: 'An international agreement, with the articles that matter marked.',
      data: {
        documentUrl: 'https://example.org/documents/cross-border-reporting-agreement-2026.pdf',
        title: 'Agreement on cross-border grid reporting',
        pageCount: 32,
        documentType: 'treaty',
        description: 'The agreement signed on 2 July 2026, by three reporting authorities.',
        highlights: [
          {
            page: 9,
            excerpt:
              'Each signatory shall publish the verified values underlying its reported figures on a quarterly basis.',
            note: 'The quarterly publication duty.',
            tag: 'key term',
          },
          {
            page: 18,
            excerpt:
              'Nothing in this agreement requires a signatory to publish data relating to a reporting site in the territory of another signatory.',
            note: 'The limit on what the agreement actually does.',
            tag: 'limit',
          },
        ],
        sourceAttribution: 'Cross-Border Reporting Secretariat',
      },
    },
    {
      id: 'no-highlights',
      label: 'Without highlights',
      description: 'A document with nothing marked in it.',
      data: {
        documentUrl: 'https://example.org/documents/grid-review-2026.pdf',
        title: 'Independent Grid Review: Findings and Recommendations',
        pageCount: 84,
        documentType: 'whitepaper',
        description: 'The full review, published on 1 October 2026.',
      },
    },
  ],
};
