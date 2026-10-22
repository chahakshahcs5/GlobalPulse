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
      id: 'section-heading',
      label: 'Section heading',
      description: 'A level-two heading with a standfirst.',
      data: {
        level: 2,
        text: 'What the new figures actually show',
        subtext: 'Three years of data, and the trend is not the one you would expect.',
      },
    },
    {
      id: 'sub-heading',
      label: 'Sub heading',
      description: 'A level-three heading, no standfirst.',
      data: {
        level: 3,
        text: 'Where the money went',
      },
    },
  ],

  paragraph: [
    {
      id: 'body',
      label: 'Body paragraph',
      description: 'Ordinary body copy in Markdown.',
      data: {
        text: 'The revised figures landed on a Tuesday, and with them a question the ministry had spent four months hoping would not be asked: how much of the reported decline was real, and how much was a change in how the cases were counted?',
        format: 'markdown',
      },
    },
  ],

  summary: [
    {
      id: 'briefing',
      label: 'Executive briefing',
      description: 'Key takeaways with a sentiment cue.',
      data: {
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
      id: 'pull-quote',
      label: 'Pull quote',
      description: 'A quote with attribution and a role.',
      data: {
        quote:
          'We were told the problem was technical. It was never technical. It was a decision about who was allowed to build what.',
        attribution: 'Dr. Amara Okafor',
        title: 'Director, Independent Grid Review',
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
  ],
};
