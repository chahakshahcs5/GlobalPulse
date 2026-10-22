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
    {
      id: 'story-title',
      label: 'Story title',
      description: 'A level-one heading, for the top of the story.',
      data: {
        level: 1,
        text: 'Four reporting sites, and three of them checked nothing',
      },
    },
    {
      id: 'minor-heading',
      label: 'Minor heading',
      description: 'A level-four heading, for the smallest step in an argument.',
      data: {
        level: 4,
        text: 'What we cannot yet say',
      },
    },
    {
      id: 'title-and-deck',
      label: 'Title and deck',
      description: 'A level-one heading with a standfirst under it.',
      data: {
        level: 1,
        text: 'The gap was never a rounding error',
        subtext:
          'Across 1,240 filings the reported figures ran a median of 9.4 per cent above the independently verified ones — and at three of the four sites, no second person had ever looked at the numbers before they were published.',
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
    {
      id: 'plain',
      label: 'Plain paragraph',
      description: 'Body copy shown exactly as typed, with no emphasis.',
      data: {
        text: 'The revised figures landed on a Tuesday, and with them a question the ministry had spent four months hoping would not be asked: how much of the reported decline was real, and how much was a change in how the cases were counted?',
        format: 'plain',
      },
    },
    {
      id: 'code-and-link',
      label: 'With code and a link',
      description: 'Markdown with a code span and a link in it.',
      data: {
        text: 'Where a filing has no `second_signoff` field, the site is counted as unreported rather than as accurate — which is why the sample is 1,240 filings and not 1,240 plus the gaps. The [published dataset](https://example.org/datasets/grid-review-2026) has the fields.',
        format: 'markdown',
      },
    },
    {
      id: 'emphasised',
      label: 'With emphasis',
      description: 'Markdown bold, italic, code and a link in one paragraph.',
      data: {
        text: 'The review team re-checked every filing against **meter data**, and found a median gap of *9.4 per cent*. The finding is not in dispute: the [full dataset](https://example.org/datasets/grid-review-2026) is published, and each site can run the same comparison against its own records. Where the `overstatement` field is absent from a filing, the site is counted as unreported rather than as accurate.',
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
    {
      id: 'neutral',
      label: 'Neutral summary',
      description: 'Key takeaways with no sentiment cue at all.',
      data: {
        headline: 'What the review covered',
        bulletPoints: [
          'Four reporting sites and two years of filings.',
          'Every filing re-checked against meter data by two analysts.',
          'One site carried a verification step for the whole period.',
        ],
      },
    },
    {
      id: 'positive',
      label: 'Positive summary',
      description: 'Key takeaways that read as good news.',
      data: {
        headline: 'The published gap closed faster than forecast',
        bulletPoints: [
          'Overstatement fell from 19 to 3.9 percentage points in two years.',
          'Two of the three delayed sites are back online.',
          'Quarterly public reporting begins in January.',
        ],
        sentiment: 'positive',
      },
    },
    {
      id: 'critical',
      label: 'Critical summary',
      description: 'Key takeaways that flag a serious problem.',
      data: {
        headline: 'One site is still publishing unverified figures',
        bulletPoints: [
          'Coastal has not filed a verification step since 2023.',
          'Its figures are the only ones the review could not confirm.',
          'The authority says it cannot compel a change before the deadline.',
        ],
        sentiment: 'critical',
      },
    },
    {
      id: 'no-sentiment',
      label: 'No sentiment',
      description: 'Key takeaways with no sentiment chip at all.',
      data: {
        headline: 'What the review covered',
        bulletPoints: [
          'Four reporting sites and two years of filings.',
          'Every filing re-checked against meter data by two analysts.',
          'One site carried a verification step for the whole period.',
        ],
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
    {
      id: 'attribution-only',
      label: 'Attribution only',
      description: 'A quote with a name and nothing else.',
      data: {
        quote: 'We followed the guidance as it was written at the time.',
        attribution: 'Harbour East reporting desk',
      },
    },
    {
      id: 'with-avatar',
      label: 'With portrait and link',
      description: 'A quote with a portrait and a link to the source.',
      data: {
        quote:
          'An optional step is not a step. Until someone is required to do the work, it will not be done.',
        attribution: 'Dr. Amara Okafor',
        title: 'Director, Independent Grid Review',
        avatarUrl: 'https://i.pravatar.cc/300?img=47',
        sourceUrl: 'https://example.org/independent-grid-review-2026',
      },
    },
    {
      id: 'avatar-only',
      label: 'With a portrait',
      description: 'A quote with a portrait beside it, and no link.',
      data: {
        quote:
          'An optional step is not a step. Until someone is required to do the work, it will not be done.',
        attribution: 'Dr. Amara Okafor',
        title: 'Director, Independent Grid Review',
        avatarUrl: 'https://i.pravatar.cc/300?img=47',
      },
    },
    {
      id: 'linked',
      label: 'With a source link',
      description: 'A quote that links out to where it came from.',
      data: {
        quote: 'Nobody was hiding anything. That was never the problem.',
        attribution: 'Dr. Amara Okafor',
        title: 'Director, Independent Grid Review',
        sourceUrl: 'https://example.org/independent-grid-review-2026',
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
