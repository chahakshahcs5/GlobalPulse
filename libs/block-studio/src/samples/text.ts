/**
 * Sample payloads for the text & editorial blocks.
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

export const TEXT_SAMPLES: Record<string, StudioVariant[]> = {
  heading: [
    {
      id: 'story-title',
      label: 'Story title',
      description: 'A level-one heading, for the top of the story.',
      data: {
        level: 1,
        style: 'plain',
        text: 'Four reporting sites, and three of them checked nothing',
      },
    },
    {
      id: 'section-heading',
      label: 'Section heading',
      description: 'A level-two heading with a standfirst.',
      data: {
        level: 2,
        style: 'plain',
        text: 'What the new figures actually show',
        subtext: 'Three years of data, and the trend is not the one you would expect.',
      },
    },
    {
      id: 'standfirst',
      label: 'Long standfirst',
      description: 'A level-two heading whose standfirst carries the argument.',
      data: {
        level: 2,
        style: 'plain',
        text: 'The gap was never a rounding error',
        subtext:
          'Across 1,240 filings the reported figures ran a median of 9.4 per cent above the independently verified ones — and at three of the four sites, no second person had ever looked at the numbers before they were published.',
      },
    },
    {
      id: 'sub-heading',
      label: 'Sub heading',
      description: 'A level-three heading, no standfirst.',
      data: {
        level: 3,
        style: 'plain',
        text: 'Where the money went',
      },
    },
    {
      id: 'minor-heading',
      label: 'Minor heading',
      description: 'A level-four heading, for the smallest step in an argument.',
      data: {
        level: 4,
        style: 'plain',
        text: 'What we cannot yet say',
      },
    },
    {
      id: 'underlined',
      label: 'Underlined',
      description: 'A heading with a rule under it.',
      data: {
        level: 2,
        style: 'underlined',
        text: 'Where the money went',
        subtext: 'Three years of data, and the trend is not the one you would expect.',
      },
    },
    {
      id: 'boxed',
      label: 'Boxed',
      description: 'A heading set in a box, for a change of gear.',
      data: {
        level: 2,
        style: 'boxed',
        text: 'What changed after the review',
        subtext: 'And what did not.',
      },
    },
    {
      id: 'numbered',
      label: 'Numbered',
      description: 'A heading numbered against the steps of the story.',
      data: {
        level: 2,
        style: 'numbered',
        text: 'What changed after the review',
        subtext: 'And what did not.',
      },
    },
  ],

  paragraph: [
    {
      id: 'body',
      label: 'Body',
      description: 'Ordinary body copy.',
      data: {
        layout: 'body',
        text: 'The revised figures landed on a Tuesday, and with them a question the ministry had spent four months hoping would not be asked: how much of the reported decline was real, and how much was a change in how the cases were counted?',
        format: 'markdown',
      },
    },
    {
      id: 'lede',
      label: 'Lede',
      description: 'Set larger, to lead the story.',
      data: {
        layout: 'lede',
        text: 'The revised figures landed on a Tuesday, and with them a question the ministry had spent four months hoping would not be asked: how much of the reported decline was real, and how much was a change in how the cases were counted?',
        format: 'markdown',
      },
    },
    {
      id: 'note',
      label: 'Note',
      description: 'Set smaller and marked off from the text around it.',
      data: {
        layout: 'note',
        text: 'The revised figures landed on a Tuesday, and with them a question the ministry had spent four months hoping would not be asked: how much of the reported decline was real, and how much was a change in how the cases were counted?',
        format: 'markdown',
      },
    },
  ],

  summary: [
    {
      id: 'card',
      label: 'Card',
      description: 'A briefing in a card, with a sentiment chip.',
      data: {
        layout: 'card',
        headline: 'The grid is holding, but the margin is thin',
        bulletPoints: [
          'Demand stayed within forecast for a fourth consecutive month.',
          'Reserve margins fell to their lowest level since the programme began.',
          'Two of the three delayed sites are back online.',
        ],
        sentiment: 'cautious',
      },
    },
    {
      id: 'numbered',
      label: 'Numbered',
      description: 'The takeaways as a numbered list, with no card around them.',
      data: {
        layout: 'numbered',
        headline: 'The grid is holding, but the margin is thin',
        bulletPoints: [
          'Demand stayed within forecast for a fourth consecutive month.',
          'Reserve margins fell to their lowest level since the programme began.',
          'Two of the three delayed sites are back online.',
        ],
        sentiment: 'cautious',
      },
    },
    {
      id: 'plain',
      label: 'Plain',
      description: 'The takeaways in plain text, with nothing but a heading.',
      data: {
        layout: 'plain',
        headline: 'The grid is holding, but the margin is thin',
        bulletPoints: [
          'Demand stayed within forecast for a fourth consecutive month.',
          'Reserve margins fell to their lowest level since the programme began.',
          'Two of the three delayed sites are back online.',
        ],
        sentiment: 'cautious',
      },
    },
    {
      id: 'grid',
      label: 'Grid',
      description: 'Each takeaway as a card of its own.',
      data: {
        layout: 'grid',
        headline: 'The grid is holding, but the margin is thin',
        bulletPoints: [
          'Demand stayed within forecast for a fourth consecutive month.',
          'Reserve margins fell to their lowest level since the programme began.',
          'Two of the three delayed sites are back online.',
        ],
        sentiment: 'cautious',
      },
    },
  ],

  quote: [
    {
      id: 'pull',
      label: 'Pull quote',
      description: 'A quote with a rule down the side.',
      data: {
        layout: 'pull',
        quote:
          'We were told the problem was technical. It was never technical. It was a decision about who was allowed to build what.',
        attribution: 'Dr. Amara Okafor',
        title: 'Director, Independent Grid Review',
      },
    },
    {
      id: 'inline',
      label: 'Inline',
      description: 'A quote that sits in the text, with no furniture.',
      data: {
        layout: 'inline',
        quote:
          'We were told the problem was technical. It was never technical. It was a decision about who was allowed to build what.',
        attribution: 'Dr. Amara Okafor',
        title: 'Director, Independent Grid Review',
      },
    },
    {
      id: 'card',
      label: 'Card',
      description: 'A quote in a bordered card, with a portrait.',
      data: {
        layout: 'card',
        quote:
          'We were told the problem was technical. It was never technical. It was a decision about who was allowed to build what.',
        attribution: 'Dr. Amara Okafor',
        title: 'Director, Independent Grid Review',
        avatarUrl: 'https://i.pravatar.cc/300?img=47',
      },
    },
  ],

  callout: [
    {
      id: 'info',
      label: 'Info',
      description: 'Context the reader needs.',
      data: {
        style: 'info',
        title: 'How we counted',
        text: 'Figures include only sites reporting for 14 consecutive days. Two sites that reported intermittently are excluded and listed in the appendix.',
      },
    },
    {
      id: 'warning',
      label: 'Warning',
      description: 'Something the reader should be careful about.',
      data: {
        style: 'warning',
        title: 'Provisional data',
        text: 'The March figures are provisional and will be revised once the remaining sites report.',
      },
    },
    {
      id: 'tip',
      label: 'Tip',
      description: 'A useful next step for the reader.',
      data: {
        style: 'tip',
        title: 'Read the underlying series',
        text: 'Every aggregate in this piece can be opened up to the site-level numbers it was built from.',
      },
    },
    {
      id: 'critical',
      label: 'Critical',
      description: 'A correction or a serious caveat.',
      data: {
        style: 'critical',
        title: 'Correction',
        text: 'An earlier version of this story gave the May figure as 14.2 TWh. The correct figure is 12.9 TWh.',
      },
    },
    {
      id: 'untitled',
      label: 'Untitled',
      description: 'A callout with no heading, so the text carries it alone.',
      data: {
        style: 'info',
        text: 'Two of the four sites filed on a different calendar from the rest, so their quarterly figures are not directly comparable. Their data is included throughout, and flagged wherever it is.',
      },
    },
  ],
};
