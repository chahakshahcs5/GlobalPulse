import type { StudioVariant } from './types';

/**
 * Sample payloads for every block type.
 *
 * These are the payloads the studio previews. They are deliberately
 * realistic — a chart that says "cases" and "year" tells an editor far more
 * about how the block reads in a story than "Category 1 / 42" does.
 *
 * Every sample is validated against its schema by
 * `tests/unit/blocks/block-studio-samples.test.ts`, so a sample can never
 * drift away from the block it demonstrates.
 */

const image = (seed: string, width = 1200, height = 675): string =>
  `https://picsum.photos/seed/${seed}/${width}/${height}`;

export const BLOCK_SAMPLES: Record<string, StudioVariant[]> = {
  // --- Text & editorial ----------------------------------------------------
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
  ],

  // --- Media ---------------------------------------------------------------
  image: [
    {
      id: 'landscape',
      label: 'Landscape 16:9',
      description: 'The default editorial image treatment.',
      data: {
        url: image('solar-array-1'),
        altText: 'Rows of solar panels stretching to the horizon under a low sun',
        caption: 'The Northfield array at first light, six months after commissioning.',
        aspectRatio: '16:9',
        credit: 'Nia Bergman / GlobalPulse',
        sourceAttribution: 'Northfield Energy',
      },
    },
    {
      id: 'square',
      label: 'Square 1:1',
      description: 'A square crop for a sidebar or a social card.',
      data: {
        url: image('turbine-9', 900, 900),
        altText: 'A single wind turbine seen from the control room window',
        caption: 'Turbine 9 is the largest in the Northfield cluster.',
        aspectRatio: '1:1',
        credit: 'Nia Bergman / GlobalPulse',
      },
    },
    {
      id: 'portrait',
      label: 'Portrait 9:16',
      description: 'A vertical crop for mobile-first layouts.',
      data: {
        url: image('grid-repair-4', 675, 1200),
        altText: 'A technician walking a long line of transmission pylons',
        caption: 'Line crews walk the full corridor every six weeks.',
        aspectRatio: '9:16',
        credit: 'Field Desk / GlobalPulse',
      },
    },
  ],

  gallery: [
    {
      id: 'grid',
      label: 'Grid',
      description: 'A two-column grid of images.',
      data: {
        title: 'Inside the Northfield substation',
        layout: 'grid',
        images: [
          {
            url: image('substation-a'),
            altText: 'Transformers and busbars in a substation yard',
            caption: 'The 400 kV yard, seen from the gantry.',
            credit: 'Field Desk',
          },
          {
            url: image('substation-b'),
            altText: 'A control room bank of relay panels',
            caption: 'Protection relays are mirrored to the regional control centre.',
            credit: 'Field Desk',
          },
          {
            url: image('substation-c'),
            altText: 'A high-voltage line disappearing into haze',
            caption: 'The eastern spur, photographed at dawn.',
            credit: 'Field Desk',
          },
          {
            url: image('substation-d'),
            altText: 'Technicians inspecting a transformer bushing',
            caption: 'A routine inspection ahead of the winter peak.',
            credit: 'Field Desk',
          },
        ],
      },
    },
    {
      id: 'carousel',
      label: 'Carousel',
      description: 'A swipeable sequence.',
      data: {
        title: 'A year in the life of the grid',
        layout: 'carousel',
        images: [
          {
            url: image('carousel-spring'),
            altText: 'Blossoming branches against a pylon',
            caption: 'March: the first maintenance window of the year.',
          },
          {
            url: image('carousel-summer'),
            altText: 'A heat haze over a substation',
            caption: 'July: the peak demand test.',
          },
          {
            url: image('carousel-autumn'),
            altText: 'Mist over a line corridor',
            caption: 'October: the storm season begins.',
          },
        ],
      },
    },
    {
      id: 'masonry',
      label: 'Masonry',
      description: 'A mixed-height mosaic.',
      data: {
        title: 'Field photographs',
        layout: 'masonry',
        images: [
          {
            url: image('masonry-a', 800, 1000),
            altText: 'A lineman climbing a pylon',
            caption: 'Climbing the eastern spur.',
          },
          {
            url: image('masonry-b', 800, 600),
            altText: 'A control room at night',
            caption: 'Night shift, regional control.',
          },
          {
            url: image('masonry-c', 800, 800),
            altText: 'Snow on a steel lattice tower',
            caption: 'The line, in February.',
          },
        ],
      },
    },
  ],

  annotated_image: [
    {
      id: 'satellite',
      label: 'Satellite annotations',
      description: 'Percentage-positioned markers on a satellite image.',
      data: {
        url: image('delta-satellite'),
        altText: 'Satellite view of a river delta with a breached embankment',
        caption: 'The breach at kilometre 42 sits where the old channel was.',
        credit: 'Planet / GlobalPulse',
        annotations: [
          {
            id: 'a1',
            xPercent: 41,
            yPercent: 52,
            label: 'Embankment breach',
            description: 'Observed breach point, confirmed on two passes.',
            sourceId: 'src_satellite_pass_2',
          },
          {
            id: 'a2',
            xPercent: 63,
            yPercent: 38,
            label: 'Flood extent',
            description: 'The waterline against the secondary road.',
            sourceId: 'src_satellite_pass_2',
          },
          {
            id: 'a3',
            xPercent: 22,
            yPercent: 71,
            label: 'Levee reinforcement',
            description: 'Emergency fill placed over eight days.',
          },
        ],
      },
    },
  ],

  image_diff: [
    {
      id: 'horizontal',
      label: 'Horizontal split',
      description: 'Before and after, side by side.',
      data: {
        beforeUrl: image('before-harbour'),
        afterUrl: image('after-harbour'),
        beforeLabel: 'June 2024',
        afterLabel: 'June 2026',
        caption: 'The same stretch of shoreline, two years apart.',
        orientation: 'horizontal',
        defaultSplitPercent: 50,
        credit: 'GlobalPulse archive',
      },
    },
    {
      id: 'vertical',
      label: 'Vertical split',
      description: 'A vertical wipe for tall imagery.',
      data: {
        beforeUrl: image('before-city', 800, 1200),
        afterUrl: image('after-city', 800, 1200),
        beforeLabel: '2023',
        afterLabel: '2026',
        caption: 'Redevelopment of the eastern district.',
        orientation: 'vertical',
        defaultSplitPercent: 45,
      },
    },
  ],

  video: [
    {
      id: 'report',
      label: 'Report with chapters',
      description: 'A video with poster art, chapters and a transcript.',
      data: {
        url: '/videos/sample-video.mp4',
        posterUrl: image('video-poster'),
        aspectRatio: '16:9',
        caption: 'A two-minute summary of the review findings.',
        durationSeconds: 15,
        transcription:
          'The review found the reporting failures were systemic rather than isolated. Three of the four sites had no independent verification step at all.',
        chapters: [
          { startSeconds: 0, title: 'Introduction', description: 'What the review covered.' },
          { startSeconds: 5, title: 'The findings', description: 'What went wrong.' },
          { startSeconds: 11, title: 'What changes', description: 'The recommendations.' },
        ],
        transcriptSegments: [
          {
            startSeconds: 0,
            speaker: 'Narrator',
            text: 'The review looked at four reporting sites.',
          },
          { startSeconds: 5, speaker: 'Narrator', text: 'Three of them had no verification step.' },
          {
            startSeconds: 11,
            speaker: 'Narrator',
            text: 'The report recommends a mandatory second sign-off.',
          },
        ],
      },
    },
  ],

  audio: [
    {
      id: 'briefing',
      label: 'Audio briefing',
      description: 'Narration with chapters and cue points.',
      data: {
        url: '/audio/sample-briefing.mp3',
        title: 'The briefing: what the review found',
        narrator: 'Nia Bergman',
        durationSeconds: 30,
        language: 'en',
        transcript:
          'A full recording of the morning briefing, with the numbers from the review read out in sequence.',
        chapters: [
          { startSeconds: 0, title: 'The headline' },
          { startSeconds: 10, title: 'The numbers' },
          { startSeconds: 20, title: 'What happens next' },
        ],
        cuePoints: [
          { timeMs: 4000, text: 'Where the reporting gaps began' },
          { timeMs: 15000, text: 'The three affected sites', blockRefId: 'blk_table_1' },
        ],
        speakers: [
          { id: 'sp1', name: 'Nia Bergman', role: 'Correspondent' },
          { id: 'sp2', name: 'Ravi Menon', role: 'Data editor' },
        ],
      },
    },
  ],

  slide_deck: [
    {
      id: 'findings',
      label: 'Findings deck',
      description: 'Five slides with bullets and attribution.',
      data: {
        title: 'Review findings in five slides',
        slides: [
          {
            slideNumber: 1,
            title: 'What we reviewed',
            body: 'Four reporting sites and two years of filings.',
            bullets: ['Four sites', 'Two years', '1,240 filings'],
            sourceAttribution: 'GlobalPulse investigations',
          },
          {
            slideNumber: 2,
            title: 'The headline finding',
            body: 'Three of the four sites had no independent verification step.',
            bullets: ['No second sign-off at three sites', 'Verification was self-reported'],
          },
          {
            slideNumber: 3,
            title: 'How big the gap was',
            body: 'Reported values ran 8 to 19 per cent above verified values.',
            bullets: ['Median overstatement: 12%', 'Worst case: 19%'],
          },
          {
            slideNumber: 4,
            title: 'What the sites said',
            body: 'Two sites said the guidance was ambiguous. One site said it was never received.',
            bullets: ['Guidance ambiguity', 'One site never received it'],
          },
          {
            slideNumber: 5,
            title: 'What changes',
            body: 'A mandatory second sign-off, published quarterly.',
            bullets: ['Second sign-off required', 'Quarterly public reporting'],
          },
        ],
      },
    },
  ],

  embed: [
    {
      id: 'youtube',
      label: 'YouTube',
      description: 'A video embed.',
      data: {
        provider: 'youtube',
        url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        title: 'Review panel, full session',
      },
    },
    {
      id: 'bluesky',
      label: 'Bluesky',
      description: 'A social post embed.',
      data: {
        provider: 'bluesky',
        url: 'https://bsky.app/profile/globalpulse.bsky.social/post/3k2',
        title: 'Post on the review findings',
      },
    },
    {
      id: 'github',
      label: 'GitHub',
      description: 'A code or dataset repository.',
      data: {
        provider: 'github',
        url: 'https://github.com/globalpulse/grid-review-dataset',
        title: 'The dataset behind this story',
      },
    },
  ],

  // --- Data & visualisation ------------------------------------------------
  chart: [
    {
      id: 'line',
      label: 'Line',
      description: 'A single series over time.',
      data: {
        chartType: 'line',
        title: 'Grid demand against forecast',
        subtitle: 'Monthly average, terawatt-hours',
        xAxis: { key: 'month', label: 'Month', type: 'time' },
        yAxis: { label: 'Demand', unit: 'TWh' },
        series: [{ name: 'Actual demand', key: 'actual' }],
        values: [
          { month: 'Jan', actual: 41.2 },
          { month: 'Feb', actual: 39.8 },
          { month: 'Mar', actual: 43.1 },
          { month: 'Apr', actual: 40.4 },
          { month: 'May', actual: 44.9 },
          { month: 'Jun', actual: 47.3 },
          { month: 'Jul', actual: 49.1 },
          { month: 'Aug', actual: 48.4 },
          { month: 'Sep', actual: 45.2 },
          { month: 'Oct', actual: 42.7 },
          { month: 'Nov', actual: 43.9 },
          { month: 'Dec', actual: 46.8 },
        ],
        methodology: 'Metered supply, monthly average.',
        sourceAttribution: 'National Grid Authority',
      },
    },
    {
      id: 'bar',
      label: 'Bar',
      description: 'One bar per category.',
      data: {
        chartType: 'bar',
        title: 'Verified filings by site',
        xAxis: { key: 'site', label: 'Reporting site' },
        yAxis: { label: 'Filings', unit: 'filings' },
        series: [{ name: 'Verified filings', key: 'value' }],
        values: [
          { site: 'Northfield', value: 412 },
          { site: 'Harbour East', value: 388 },
          { site: 'Ridgeway', value: 274 },
          { site: 'Coastal', value: 166 },
        ],
        sourceAttribution: 'GlobalPulse investigations',
      },
    },
    {
      id: 'stacked_bar',
      label: 'Stacked bar',
      description: 'Composition over time.',
      data: {
        chartType: 'stacked_bar',
        title: 'Where the reporting gap came from',
        subtitle: 'Overstatement by cause, percentage points of total',
        xAxis: { key: 'year', label: 'Year', type: 'time' },
        yAxis: { label: 'Overstatement', unit: 'pp' },
        series: [
          { name: 'Measurement', key: 'measurement' },
          { name: 'Classification', key: 'classification' },
          { name: 'Timing', key: 'timing' },
        ],
        values: [
          { year: '2022', measurement: 4.1, classification: 2.2, timing: 1.4 },
          { year: '2023', measurement: 6.3, classification: 3.1, timing: 2.0 },
          { year: '2024', measurement: 8.9, classification: 4.4, timing: 2.6 },
          { year: '2025', measurement: 11.2, classification: 5.0, timing: 3.1 },
        ],
        methodology: 'Each cause attributed by the independent review team.',
      },
    },
    {
      id: 'donut',
      label: 'Donut',
      description: 'Share of a total.',
      data: {
        chartType: 'donut',
        title: 'Share of the shortfall by cause',
        xAxis: { key: 'cause', label: 'Cause' },
        yAxis: { label: 'Share', unit: '%' },
        series: [{ name: 'Share', key: 'value' }],
        values: [
          { cause: 'Measurement', value: 48 },
          { cause: 'Classification', value: 27 },
          { cause: 'Timing', value: 16 },
          { cause: 'Other', value: 9 },
        ],
      },
    },
    {
      id: 'kpi',
      label: 'KPI',
      description: 'A single headline number with a delta.',
      data: {
        chartType: 'kpi',
        title: 'Verified reduction in reported demand',
        subtitle: 'Against the 2024 baseline',
        xAxis: { key: 'period', label: 'Period', type: 'time' },
        yAxis: { label: 'Reduction', unit: '%' },
        series: [{ name: 'Reduction', key: 'value' }],
        values: [
          { period: 'Q1', value: 2.1 },
          { period: 'Q2', value: 3.4 },
          { period: 'Q3', value: 4.1 },
        ],
        sourceAttribution: 'GlobalPulse data desk',
      },
    },
    {
      id: 'heatmap',
      label: 'Heatmap',
      description: 'A matrix of values.',
      data: {
        chartType: 'heatmap',
        title: 'Overstatement by site and quarter',
        subtitle: 'Percentage above the independently verified figure',
        xAxis: { key: 'quarter', label: 'Quarter' },
        yAxis: { label: 'Site' },
        series: [
          { name: 'Northfield', key: 'northfield' },
          { name: 'Harbour East', key: 'harbour' },
          { name: 'Ridgeway', key: 'ridgeway' },
        ],
        values: [
          { quarter: 'Q1', northfield: 4, harbour: 9, ridgeway: 2 },
          { quarter: 'Q2', northfield: 7, harbour: 14, ridgeway: 5 },
          { quarter: 'Q3', northfield: 11, harbour: 19, ridgeway: 8 },
          { quarter: 'Q4', northfield: 9, harbour: 16, ridgeway: 6 },
        ],
      },
    },
    {
      id: 'scatter',
      label: 'Scatter',
      description: 'A relationship between two variables.',
      data: {
        chartType: 'scatter',
        title: 'Verification effort against overstatement',
        subtitle: 'Each point is one reporting site-month',
        xAxis: { key: 'checks', label: 'Independent checks per month' },
        yAxis: { label: 'Overstatement', unit: '%' },
        series: [{ name: 'Site-month', key: 'overstatement' }],
        values: [
          { checks: 2, overstatement: 18 },
          { checks: 4, overstatement: 14 },
          { checks: 6, overstatement: 11 },
          { checks: 9, overstatement: 8 },
          { checks: 12, overstatement: 6 },
          { checks: 16, overstatement: 4 },
          { checks: 21, overstatement: 3 },
        ],
        methodology:
          'Correlation does not establish causation; the review team did not attempt to separate the two.',
      },
    },
    {
      id: 'waterfall',
      label: 'Waterfall',
      description: 'A contribution to change.',
      data: {
        chartType: 'waterfall',
        title: 'How the reported gap closed',
        subtitle: 'Percentage points of overstatement removed',
        xAxis: { key: 'step', label: 'Step' },
        yAxis: { label: 'Overstatement', unit: 'pp' },
        series: [{ name: 'Change', key: 'value' }],
        values: [
          { step: 'Start', value: 19, isTotal: true },
          { step: 'Second sign-off', value: -6.4 },
          { step: 'Published guidance', value: -3.8 },
          { step: 'Third-party checks', value: -4.9 },
          { step: 'End', value: 3.9, isTotal: true },
        ],
      },
    },
    {
      id: 'comparison',
      label: 'Comparison',
      description: 'Two series compared across categories.',
      data: {
        chartType: 'comparison',
        title: 'Reported against verified',
        subtitle: 'Indexed to 100 at the start of the programme',
        xAxis: { key: 'quarter', label: 'Quarter' },
        yAxis: { label: 'Index' },
        series: [
          { name: 'Reported', key: 'reported' },
          { name: 'Verified', key: 'verified' },
        ],
        values: [
          { quarter: 'Q1', reported: 100, verified: 100 },
          { quarter: 'Q2', reported: 106, verified: 101 },
          { quarter: 'Q3', reported: 114, verified: 102 },
          { quarter: 'Q4', reported: 119, verified: 103 },
        ],
      },
    },
    {
      id: 'small_multiples',
      label: 'Small multiples',
      description: 'One small panel per group.',
      data: {
        chartType: 'small_multiples',
        title: 'Monthly demand by region',
        subtitle: 'Terawatt-hours',
        xAxis: { key: 'month', label: 'Month', type: 'time' },
        yAxis: { label: 'TWh', unit: 'TWh' },
        series: [{ name: 'Demand', key: 'value' }],
        facetField: 'region',
        values: [
          { month: 'Jan', region: 'North', value: 12.1 },
          { month: 'Mar', region: 'North', value: 13.4 },
          { month: 'May', region: 'North', value: 14.8 },
          { month: 'Jan', region: 'South', value: 9.4 },
          { month: 'Mar', region: 'South', value: 10.2 },
          { month: 'May', region: 'South', value: 11.6 },
        ],
      },
    },
    {
      id: 'diverging_bar',
      label: 'Diverging bar',
      description: 'Values either side of a zero line.',
      data: {
        chartType: 'diverging_bar',
        title: 'Change in overstatement by region',
        subtitle: 'Percentage points, year on year',
        xAxis: { key: 'region', label: 'Region' },
        yAxis: { label: 'Change', unit: 'pp' },
        series: [{ name: 'Change', key: 'value' }],
        values: [
          { region: 'North', value: -4.2 },
          { region: 'South', value: -2.8 },
          { region: 'East', value: 1.1 },
          { region: 'West', value: 3.6 },
        ],
      },
    },
  ],

  table: [
    {
      id: 'table',
      label: 'Data table',
      description: 'A sortable table with a caption and a footer.',
      data: {
        title: 'Overstatement by reporting site',
        headers: ['Site', 'Filings', 'Median overstatement', 'Verified'],
        rows: [
          ['Northfield', '412', '9.4%', 'Yes'],
          ['Harbour East', '388', '14.2%', 'Partial'],
          ['Ridgeway', '274', '5.1%', 'Yes'],
          ['Coastal', '166', '11.8%', 'No'],
        ],
        footer: 'Source: GlobalPulse review of 1,240 filings, 2024-2025.',
        sortable: true,
        filterable: true,
        searchable: true,
        downloadable: true,
        caption: 'Overstatement is the gap between the reported and independently verified value.',
        sourceAttribution: 'GlobalPulse investigations',
        methodology: 'Each filing re-checked against meter data by two analysts.',
      },
    },
  ],

  data_explorer: [
    {
      id: 'explorer',
      label: 'Data explorer',
      description: 'Switch dimension, change metric, filter and download.',
      data: {
        title: 'Explore the grid dataset',
        subtitle: 'Every figure used in this story, in one table',
        description: 'Switch between region and quarter, or between demand and overstatement.',
        dataset: {
          name: 'GlobalPulse grid review',
          sourceAttribution: 'GlobalPulse data desk',
          methodology: 'Compiled from 1,240 filings re-checked against meter data.',
          license: 'CC BY-NC 4.0',
          lastUpdated: '2026-10-01',
        },
        dimensions: [
          { key: 'region', label: 'Region', type: 'category' },
          { key: 'quarter', label: 'Quarter', type: 'time' },
        ],
        metrics: [
          { key: 'demand', label: 'Demand', unit: 'TWh' },
          { key: 'overstatement', label: 'Overstatement', unit: '%' },
        ],
        defaultDimension: 'region',
        defaultMetric: 'demand',
        rows: [
          { region: 'North', quarter: 'Q1', demand: 12.1, overstatement: 4.2 },
          { region: 'North', quarter: 'Q2', demand: 13.4, overstatement: 6.8 },
          { region: 'South', quarter: 'Q1', demand: 9.4, overstatement: 7.1 },
          { region: 'South', quarter: 'Q2', demand: 10.2, overstatement: 8.9 },
          { region: 'East', quarter: 'Q1', demand: 7.8, overstatement: 2.4 },
          { region: 'East', quarter: 'Q2', demand: 8.6, overstatement: 3.1 },
          { region: 'West', quarter: 'Q1', demand: 11.9, overstatement: 9.3 },
          { region: 'West', quarter: 'Q2', demand: 12.8, overstatement: 10.6 },
        ],
        filters: [{ key: 'region', label: 'Region', values: ['North', 'South', 'East', 'West'] }],
        downloadableFormats: ['csv', 'json'],
      },
    },
  ],

  statistic: [
    {
      id: 'headline',
      label: 'Headline statistic',
      description: 'A KPI card with a trend and a source.',
      data: {
        value: '19%',
        label: 'Peak overstatement at one site',
        unit: '%',
        trend: 'down',
        trendValue: '-6.4pp since Q3',
        comparison: 'Median across all sites: 9.4%',
        period: '2024-2025',
        context: 'The gap between reported and independently verified values.',
        sourceAttribution: 'GlobalPulse investigations',
        methodology: '1,240 filings re-checked against meter data by two analysts.',
      },
    },
  ],

  ranking: [
    {
      id: 'ranking',
      label: 'Ranking',
      description: 'A ranked list with movement and a methodology.',
      data: {
        title: 'Most transparent reporting sites',
        subtitle: 'Ranked by independently verified filings',
        items: [
          { rank: 1, previousRank: 2, name: 'Ridgeway', value: 99.2, unit: '%' },
          { rank: 2, previousRank: 1, name: 'Northfield', value: 97.8, unit: '%' },
          { rank: 3, previousRank: 4, name: 'Coastal', value: 91.4, unit: '%' },
          { rank: 4, previousRank: 3, name: 'Harbour East', value: 88.6, unit: '%' },
        ],
        methodology: 'Share of filings independently verified with no material discrepancy.',
        sourceAttribution: 'GlobalPulse investigations',
        lastUpdated: '2026-10-01',
      },
    },
  ],

  uncertainty: [
    {
      id: 'estimates',
      label: 'Estimates with intervals',
      description: 'Point estimates with credible intervals and a reference line.',
      data: {
        title: 'Projected demand, 2030',
        subtitle: 'Estimates from four modelling groups',
        unit: 'TWh',
        intervalLabel: '95% credible interval',
        confidenceLevel: 0.95,
        points: [
          {
            id: 'p1',
            label: 'Grid Authority',
            value: 9400,
            low: 8800,
            high: 10100,
            n: 12000,
            sourceId: 'src_grid_model',
          },
          { id: 'p2', label: 'Analyst consensus', value: 9100, low: 8400, high: 9900 },
          { id: 'p3', label: 'Low-carbon scenario', value: 8700, low: 7900, high: 9600 },
        ],
        referenceValue: 9000,
        referenceLabel: 'Current level',
        methodology: 'Ranges reflect the 5th to 95th percentile across 12,000 scenario draws.',
        sourceAttribution: 'GlobalPulse modelling desk',
      },
    },
  ],

  correlation: [
    {
      id: 'matrix',
      label: 'Correlation matrix',
      description: 'Raw observations; the platform derives the coefficients.',
      data: {
        title: 'What moves with what?',
        subtitle: 'Pairwise correlations across the indicators',
        description: 'Four months of site-level data, 24 observations.',
        variables: [
          { key: 'gpu_price', label: 'GPU price', unit: '$' },
          { key: 'power_draw', label: 'Power draw', unit: 'kW' },
          { key: 'tokens_per_sec', label: 'Tokens/sec' },
          { key: 'overstatement', label: 'Overstatement', unit: '%' },
        ],
        observations: [
          { gpu_price: 1200, power_draw: 3.2, tokens_per_sec: 42, overstatement: 9.1 },
          { gpu_price: 1500, power_draw: 4.1, tokens_per_sec: 48, overstatement: 8.4 },
          { gpu_price: 1800, power_draw: 4.9, tokens_per_sec: 53, overstatement: 7.9 },
          { gpu_price: 2100, power_draw: 5.6, tokens_per_sec: 57, overstatement: 6.8 },
          { gpu_price: 2400, power_draw: 6.1, tokens_per_sec: 58, overstatement: 6.1 },
          { gpu_price: 2700, power_draw: 6.8, tokens_per_sec: 62, overstatement: 5.4 },
        ],
        showCoefficients: true,
        significanceThreshold: 0.05,
        methodology:
          "Pearson's r over the observations supplied, with a two-tailed t-test for significance.",
        sourceAttribution: 'GlobalPulse data desk',
      },
    },
  ],

  // --- Interactive ---------------------------------------------------------
  quiz: [
    {
      id: 'comprehension',
      label: 'Comprehension check',
      description: 'Questions with an explanation revealed after answering.',
      data: {
        title: 'Test your understanding',
        description: 'Four questions on what the review actually found.',
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
  ],

  sensitivity: [
    {
      id: 'cost',
      label: 'Sensitivity analysis',
      description: 'Shows which assumption actually drives the result.',
      data: {
        title: 'What drives the cost of a 50 MW solar farm?',
        subtitle: 'Swing in total capital cost when one assumption moves at a time',
        outputLabel: 'Total capital cost',
        outputUnit: '$m',
        baseOutput: 40,
        expression: 'capacity * panel_cost + labour + grid_connection',
        inputs: [
          { id: 'capacity', label: 'Installed capacity', base: 50, low: 45, high: 55, unit: 'MW' },
          { id: 'panel_cost', label: 'Panel cost', base: 0.6, low: 0.5, high: 0.72, unit: '$m/MW' },
          { id: 'labour', label: 'Installation labour', base: 6, low: 4, high: 9, unit: '$m' },
          { id: 'grid_connection', label: 'Grid connection', base: 4, low: 2, high: 7, unit: '$m' },
        ],
        methodology: 'Each input is varied across its range with the others held at base.',
        sourceAttribution: 'GlobalPulse modelling desk',
      },
    },
  ],

  prediction_leaderboard: [
    {
      id: 'leaderboard',
      label: 'Forecast leaderboard',
      description: 'Scored by Brier score, with calibration reported.',
      data: {
        title: 'Who called it? Forecasters on AGI capability',
        subtitle: 'Resolved predictions ranked by Brier score',
        scoringMethod:
          'Brier score: mean squared error between the stated probability and the outcome.',
        predictions: [
          {
            id: 'p1',
            claim: 'A frontier lab announces an AGI-capable system before 2027',
            forecaster: 'Desk A',
            probability: 0.3,
            predictedAt: '2026-01-15',
            resolvesAt: '2027-01-01',
            resolved: true,
            outcome: 0,
            sourceId: 'src_forecast_a',
          },
          {
            id: 'p2',
            claim: 'A frontier lab announces an AGI-capable system before 2027',
            forecaster: 'Desk B',
            probability: 0.6,
            predictedAt: '2026-01-15',
            resolvesAt: '2027-01-01',
            resolved: true,
            outcome: 0,
          },
          {
            id: 'p3',
            claim: 'Regulated emission trading expands to cover shipping',
            forecaster: 'Desk A',
            probability: 0.45,
            predictedAt: '2026-03-02',
            resolvesAt: '2027-03-01',
            resolved: false,
          },
        ],
        methodology:
          'Only resolved predictions count towards a score. An open prediction says nothing about a forecaster yet.',
      },
    },
  ],

  live_comments: [
    {
      id: 'discussion',
      label: 'Reader discussion',
      description: 'Comments load live over the story channel.',
      data: {
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
  ],

  poll: [
    {
      id: 'poll',
      label: 'Reader poll',
      description: 'One vote per reader, counted on the server.',
      data: {
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
  ],

  // --- Maps & process ------------------------------------------------------
  map: [
    {
      id: 'points',
      label: 'Points',
      description: 'Markers on a map.',
      data: {
        title: 'The four reporting sites',
        mapType: 'points',
        center: [34.5, 41.2],
        zoom: 6,
        style: 'dark',
        markers: [
          {
            coordinates: [34.1, 41.4],
            title: 'Northfield',
            description: 'Largest site by filing volume.',
            severity: 'low',
            sourceIds: ['src_review_report'],
          },
          {
            coordinates: [35.2, 40.8],
            title: 'Harbour East',
            description: 'Highest overstatement.',
            severity: 'high',
          },
          {
            coordinates: [33.4, 39.6],
            title: 'Ridgeway',
            description: 'Cleanest verification record.',
            severity: 'low',
          },
        ],
        sourceAttribution: 'GlobalPulse investigations',
      },
    },
    {
      id: 'choropleth',
      label: 'Choropleth',
      description: 'Regions shaded by a value.',
      data: {
        title: 'Overstatement by region',
        mapType: 'choropleth',
        center: [34.5, 41.2],
        zoom: 5,
        style: 'light',
        layers: [
          {
            id: 'regions',
            type: 'fill',
            geojson: {
              type: 'FeatureCollection',
              features: [
                {
                  type: 'Feature',
                  properties: { name: 'North', overstatement: 4.2 },
                  geometry: {
                    type: 'Polygon',
                    coordinates: [
                      [
                        [30, 38],
                        [33, 38],
                        [33, 42],
                        [30, 42],
                      ],
                    ],
                  },
                },
                {
                  type: 'Feature',
                  properties: { name: 'South', overstatement: 7.1 },
                  geometry: {
                    type: 'Polygon',
                    coordinates: [
                      [
                        [33, 38],
                        [37, 38],
                        [37, 41],
                        [33, 41],
                      ],
                    ],
                  },
                },
              ],
            },
            property: 'overstatement',
            colorScale: ['#dbeafe', '#1d4ed8'],
          },
        ],
        methodology: 'Overstatement computed from independently verified filings.',
      },
    },
    {
      id: 'route',
      label: 'Route',
      description: 'A path across the map.',
      data: {
        title: 'The eastern spur',
        mapType: 'route',
        center: [34.8, 40.9],
        zoom: 8,
        style: 'dark',
        routes: [
          {
            id: 'r1',
            name: 'Eastern spur',
            description: 'The corridor walked by the line crews.',
            coordinates: [
              [34.2, 40.4],
              [34.6, 40.7],
              [35.1, 41.0],
              [35.6, 41.4],
            ],
          },
        ],
      },
    },
  ],

  animated_map: [
    {
      id: 'spread',
      label: 'Time scrubber',
      description: 'Frames the reader scrubs through.',
      data: {
        title: 'How the outbreak spread',
        description: 'Confirmed cases by reporting date.',
        valueLabel: 'Confirmed cases',
        unit: 'cases',
        frames: [
          {
            at: '2026-03-01',
            label: '1 March',
            points: [{ id: 'p1', label: 'Northern coast', lng: 34.5, lat: 41.2, value: 12 }],
          },
          {
            at: '2026-03-08',
            label: '8 March',
            points: [
              { id: 'p1', label: 'Northern coast', lng: 34.5, lat: 41.2, value: 180 },
              { id: 'p2', label: 'Inland', lng: 33.2, lat: 39.9, value: 64 },
            ],
          },
          {
            at: '2026-03-15',
            label: '15 March',
            points: [
              {
                id: 'p1',
                label: 'Northern coast',
                lng: 34.5,
                lat: 41.2,
                value: 410,
                highlight: true,
              },
              { id: 'p2', label: 'Inland', lng: 33.2, lat: 39.9, value: 220 },
              { id: 'p3', label: 'Southern valley', lng: 32.4, lat: 38.7, value: 95 },
            ],
          },
        ],
        autoplay: false,
        methodology: 'Case counts by the date each report was published.',
      },
    },
  ],

  timeline: [
    {
      id: 'timeline',
      label: 'Timeline',
      description: 'Milestones with sources and media.',
      data: {
        title: 'How the review unfolded',
        description: 'From the first complaint to the published findings.',
        items: [
          {
            date: '12 Mar 2026',
            headline: 'A site challenges its own figure',
            body: 'An analyst at Harbour East asks for a verification step and is told none exists.',
            eventType: 'Origin',
            sourceIds: ['src_review_report'],
          },
          {
            date: '04 Apr 2026',
            headline: 'The newsroom opens an inquiry',
            body: 'Two analysts and a data editor begin re-checking a full year of filings.',
            eventType: 'Investigation',
          },
          {
            date: '22 Jun 2026',
            headline: '1,240 filings re-checked',
            body: 'The sample is complete. The median overstatement is 9.4 per cent.',
            eventType: 'Finding',
            sourceIds: ['src_review_report'],
          },
          {
            date: '01 Oct 2026',
            headline: 'Findings published',
            body: 'The authority publishes a mandatory second sign-off and quarterly public reporting.',
            eventType: 'Outcome',
          },
        ],
        sourceAttribution: 'GlobalPulse investigations',
      },
    },
  ],

  diagram: [
    {
      id: 'mermaid',
      label: 'Mermaid',
      description: 'A flow diagram drawn from Mermaid.',
      data: {
        title: 'The verification chain',
        format: 'mermaid',
        definition:
          'flowchart TD\n  A[Site reports value] --> B{Second sign-off?}\n  B -->|Yes| C[Value published]\n  B -->|No| D[Value flagged for review]\n  D --> E[Third-party check]\n  E --> C',
        caption: 'Only two of four sites had a second sign-off in place.',
      },
    },
  ],

  flow: [
    {
      id: 'flow',
      label: 'Process steps',
      description: 'Numbered steps with optional branches.',
      data: {
        title: 'How a value gets published',
        description: 'The path from a site measurement to a published figure.',
        steps: [
          {
            stepNumber: 1,
            title: 'Site measures',
            description: 'The value is captured at the site and submitted.',
            status: 'completed',
            sourceIds: ['src_review_report'],
          },
          {
            stepNumber: 2,
            title: 'Second sign-off',
            description:
              'A second analyst signs off. This step was missing at three of four sites.',
            status: 'active',
            branches: [
              { label: 'Missing', description: 'The value is flagged for review.', nextStep: 3 },
            ],
          },
          {
            stepNumber: 3,
            title: 'Third-party check',
            description: 'A meter check confirms or corrects the value.',
            status: 'pending',
          },
          {
            stepNumber: 4,
            title: 'Publication',
            description: 'The confirmed value is published with its methodology.',
            status: 'pending',
          },
        ],
      },
    },
  ],

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

  // --- Context & evidence --------------------------------------------------
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

  interview: [
    {
      id: 'interview',
      label: 'Interview',
      description: 'Structured Q&A with a transcript.',
      data: {
        title: 'An interview with the review director',
        interviewee: {
          name: 'Ada Okafor',
          role: 'Director, Independent Grid Review',
          entityId: 'ent_ada_okafor',
        },
        format: 'text',
        mediaUrl: '/audio/sample-briefing.mp3',
        transcript: 'A full transcript of the interview is available on request.',
        segments: [
          {
            question: 'When did you first suspect the numbers were wrong?',
            answer:
              'A site analyst asked for a verification step and was told none existed. That was the moment.',
            speaker: 'Interviewer',
            timestampSeconds: 12,
          },
          {
            question: 'Was the overstatement deliberate?',
            answer:
              'We found no evidence of intent. What we found was a guidance document that made the check optional.',
            speaker: 'Ada Okafor',
            timestampSeconds: 48,
            sourceId: 'src_review_report',
          },
          {
            question: 'What changes now?',
            answer:
              'A mandatory second sign-off, and quarterly publication so the public can check for themselves.',
            speaker: 'Ada Okafor',
            timestampSeconds: 91,
          },
        ],
        sourceAttribution: 'GlobalPulse interviews',
      },
    },
  ],

  // --- Specialized ---------------------------------------------------------
  financial: [
    {
      id: 'financial',
      label: 'Financial metrics',
      description: 'Timestamped metrics with an optional time series.',
      data: {
        title: 'Northwind Energy',
        entityId: 'ent_northwind',
        currency: 'USD',
        asOf: '2026-09-30',
        metrics: [
          {
            label: 'Revenue',
            value: 1840000000,
            unit: '$',
            change: 4.2,
            changePeriod: 'YoY',
            sourceId: 'src_q3_filing',
          },
          { label: 'Operating margin', value: 21.4, unit: '%', change: -1.8, changePeriod: 'YoY' },
          {
            label: 'Capital expenditure',
            value: 412000000,
            unit: '$',
            change: 12.7,
            changePeriod: 'YoY',
          },
        ],
        series: [
          { period: 'Q3 2025', value: 1765000000, metric: 'Revenue' },
          { period: 'Q4 2025', value: 1798000000, metric: 'Revenue' },
          { period: 'Q1 2026', value: 1812000000, metric: 'Revenue' },
          { period: 'Q2 2026', value: 1824000000, metric: 'Revenue' },
          { period: 'Q3 2026', value: 1840000000, metric: 'Revenue' },
        ],
        sourceAttribution: 'Northwind Energy quarterly filing',
        methodology: 'Figures as reported in the Q3 2026 filing, unadjusted.',
      },
    },
  ],

  election: [
    {
      id: 'election',
      label: 'Election results',
      description: 'Seats, vote share, turnout and a historical comparison.',
      data: {
        title: 'Regional assembly election, 2026',
        electionType: 'Regional assembly',
        region: 'North Province',
        electionDate: '2026-05-14',
        totalSeats: 48,
        turnout: 61.3,
        results: [
          {
            party: 'Reform Alliance',
            candidate: 'A. Okafor',
            votes: 214300,
            voteShare: 41.2,
            seats: 21,
            seatChange: 4,
          },
          {
            party: 'Civic Union',
            candidate: 'R. Menon',
            votes: 182700,
            voteShare: 35.1,
            seats: 17,
            seatChange: -2,
          },
          { party: 'Green Front', votes: 91200, voteShare: 17.5, seats: 8, seatChange: 1 },
          { party: 'Independent', votes: 32100, voteShare: 6.2, seats: 2, seatChange: -3 },
        ],
        historical: [
          {
            year: 2022,
            winner: 'Civic Union',
            turnout: 58.9,
            seats: { 'Reform Alliance': 17, 'Civic Union': 19 },
          },
          {
            year: 2026,
            winner: 'Reform Alliance',
            turnout: 61.3,
            seats: { 'Reform Alliance': 21, 'Civic Union': 17 },
          },
        ],
        sourceAttribution: 'Regional Electoral Commission',
        methodology: 'Final certified results, including overseas and postal votes.',
        lastUpdated: '2026-06-02',
      },
    },
  ],

  disaster: [
    {
      id: 'disaster',
      label: 'Disaster metrics',
      description: 'A live incident with metrics and updates.',
      data: {
        title: 'M7.1 earthquake',
        disasterType: 'earthquake',
        status: 'MONITORING',
        severity: 'MAJOR',
        occurredAt: '2026-10-20T10:42:00Z',
        location: 'Off the coast of Sendai',
        coordinates: [141.5, 38.2],
        metrics: [
          { label: 'Magnitude', value: 7.1, unit: 'Mww', timestamp: '2026-10-20T10:42:00Z' },
          { label: 'Depth', value: 18.2, unit: 'km', timestamp: '2026-10-20T10:42:00Z' },
          {
            label: 'Maximum intensity',
            value: 6,
            unit: 'Shindo',
            timestamp: '2026-10-20T11:05:00Z',
          },
          { label: 'Tsunami advisory', value: 1.1, unit: 'm', timestamp: '2026-10-20T10:50:00Z' },
        ],
        affectedAreas: ['Sendai', 'Miyagi', 'Iwate'],
        updates: [
          {
            timestamp: '2026-10-20T10:42:00Z',
            title: 'Earthquake detected',
            description: 'A magnitude 7.1 earthquake was detected off the coast of Sendai.',
            sourceId: 'src_jma_bulletin',
          },
          {
            timestamp: '2026-10-20T10:50:00Z',
            title: 'Tsunami advisory issued',
            description:
              'A tsunami advisory covering the Sendai coast was issued, then lifted at 13:20.',
            sourceId: 'src_jma_bulletin',
          },
        ],
        sourceAttribution: 'Japan Meteorological Agency',
        methodology: 'Figures as published in the official bulletins.',
      },
    },
  ],

  science: [
    {
      id: 'science',
      label: 'Science findings',
      description: 'Findings, measurements and paper metadata.',
      data: {
        title: 'Room-temperature operation of the topological qubit',
        field: 'Quantum physics',
        findings: [
          'A logical qubit was held for 1.2 milliseconds at 1.2 kelvin.',
          'The coherence time was 40 times the previous platform record.',
          'Readout fidelity reached 99.2 per cent.',
        ],
        measurements: [
          { label: 'Coherence time', value: 1.2, unit: 'ms', uncertainty: 0.08 },
          { label: 'Readout fidelity', value: 99.2, unit: '%', uncertainty: 0.3 },
          { label: 'Operating temperature', value: 1.2, unit: 'K', uncertainty: 0.02 },
        ],
        equation: 'T2 = 1 / (1/T_phi + 1/T_r)',
        paperUrl: 'https://example.org/papers/topological-qubit-2026',
        authors: ['L. Marchetti', 'S. Nakamura', 'A. Bakker'],
        institutions: ['Institute for Quantum Materials'],
        publishedAt: '2026-09-18',
        methodology:
          'Values are the mean of 10,000 repetitions; uncertainty is one standard deviation.',
        sourceAttribution: 'Institute for Quantum Materials',
      },
    },
  ],

  // --- Media expansion -----------------------------------------------------
  video_gallery: [
    {
      id: 'gallery',
      label: 'Video gallery',
      description: 'Several videos with poster art and chapters.',
      data: {
        title: 'Watch: the review in three minutes',
        description: 'The key moments, cut together by the video desk.',
        videos: [
          {
            id: 'v1',
            url: '/videos/sample-video.mp4',
            title: 'The finding in 90 seconds',
            posterUrl: image('video-poster-1'),
            durationSeconds: 95,
            credit: 'GlobalPulse video desk',
            chapters: [{ startSeconds: 0, title: 'The finding' }],
          },
          {
            id: 'v2',
            url: '/videos/sample-video.mp4',
            title: 'The review director explains',
            posterUrl: image('video-poster-2'),
            durationSeconds: 240,
            credit: 'GlobalPulse video desk',
          },
        ],
        sourceAttribution: 'GlobalPulse video desk',
      },
    },
  ],

  podcast: [
    {
      id: 'podcast',
      label: 'Podcast episode',
      description: 'A show with one episode, chapters and speakers.',
      data: {
        title: 'The Grid Review',
        description: 'A weekly conversation about how the numbers are made.',
        episodes: [
          {
            showTitle: 'The Grid Review',
            episodeTitle: 'Who checks the checkers?',
            episodeNumber: 12,
            seasonNumber: 2,
            description: 'Ada Okafor on the review, the guidance, and what changes next.',
            audioUrl: '/audio/sample-briefing.mp3',
            artworkUrl: image('podcast-art'),
            durationSeconds: 2700,
            publishedAt: '2026-10-03',
            chapters: [
              { startSeconds: 0, title: 'Cold open' },
              { startSeconds: 600, title: 'How the gap started' },
              { startSeconds: 1800, title: 'What changes now' },
            ],
            speakers: [
              { id: 'sp1', name: 'Ada Okafor', role: 'Guest' },
              { id: 'sp2', name: 'Nia Bergman', role: 'Host' },
            ],
            explicit: false,
            sourceAttribution: 'GlobalPulse podcasts',
          },
        ],
        sourceAttribution: 'GlobalPulse podcasts',
      },
    },
  ],

  waveform: [
    {
      id: 'waveform',
      label: 'Waveform',
      description: 'Amplitude samples with cue segments.',
      data: {
        title: 'The briefing audio',
        mediaUrl: '/audio/sample-briefing.mp3',
        mediaType: 'audio',
        durationSeconds: 30,
        peaks: [
          0.12, 0.28, 0.44, 0.61, 0.78, 0.92, 0.85, 0.71, 0.55, 0.39, 0.24, 0.15, 0.31, 0.52, 0.74,
          0.88, 0.81, 0.66, 0.48, 0.33, 0.21, 0.36, 0.58, 0.79, 0.94, 0.86, 0.68, 0.5, 0.34, 0.2,
        ],
        segments: [
          { startSeconds: 0, endSeconds: 8, label: 'The headline', blockRefId: 'blk_transcript_1' },
          { startSeconds: 8, endSeconds: 20, label: 'The numbers' },
          { startSeconds: 20, endSeconds: 30, label: 'What happens next' },
        ],
        sourceAttribution: 'GlobalPulse audio desk',
      },
    },
  ],

  transcript: [
    {
      id: 'transcript',
      label: 'Transcript',
      description: 'Timestamped segments with speaker attribution.',
      data: {
        title: 'The briefing transcript',
        mediaType: 'audio',
        mediaUrl: '/audio/sample-briefing.mp3',
        language: 'en',
        segments: [
          {
            startSeconds: 0,
            speaker: 'Nia Bergman',
            text: 'The review covered four reporting sites and two years of filings.',
            confidence: 0.98,
          },
          {
            startSeconds: 7,
            speaker: 'Nia Bergman',
            text: 'Three of the four had no independent verification step at all.',
            confidence: 0.97,
          },
          {
            startSeconds: 15,
            speaker: 'Ravi Menon',
            text: 'And the median overstatement was nine point four per cent.',
            confidence: 0.94,
          },
          {
            startSeconds: 24,
            speaker: 'Nia Bergman',
            text: 'A second sign-off is now mandatory, and reporting is published quarterly.',
            confidence: 0.96,
          },
        ],
        speakers: [
          { id: 'sp1', name: 'Nia Bergman', role: 'Correspondent' },
          { id: 'sp2', name: 'Ravi Menon', role: 'Data editor' },
        ],
        sourceAttribution: 'GlobalPulse audio desk',
        methodology: 'Transcribed automatically and reviewed by the audio desk.',
      },
    },
  ],

  dataset: [
    {
      id: 'dataset',
      label: 'Published dataset',
      description: 'Column definitions, a preview and a download.',
      data: {
        title: 'The grid review dataset',
        description: 'Every filing re-checked against meter data, with the verification outcome.',
        downloadUrl: 'https://example.org/datasets/grid-review-2026.csv',
        formats: ['csv', 'json'],
        columns: [
          { key: 'site', label: 'Reporting site', type: 'string' },
          { key: 'quarter', label: 'Quarter', type: 'date' },
          { key: 'reported', label: 'Reported value', type: 'number' },
          { key: 'verified', label: 'Verified value', type: 'number' },
          { key: 'overstatement', label: 'Overstatement', type: 'number' },
        ],
        previewRows: [
          {
            site: 'Northfield',
            quarter: '2026-Q1',
            reported: 12.1,
            verified: 11.6,
            overstatement: 4.3,
          },
          {
            site: 'Harbour East',
            quarter: '2026-Q1',
            reported: 9.4,
            verified: 8.2,
            overstatement: 14.6,
          },
          {
            site: 'Ridgeway',
            quarter: '2026-Q1',
            reported: 7.8,
            verified: 7.4,
            overstatement: 5.1,
          },
        ],
        license: 'CC BY-NC 4.0',
        methodology: 'Each filing re-checked against meter data by two independent analysts.',
        lastUpdated: '2026-10-01',
        sourceAttribution: 'GlobalPulse data desk',
      },
    },
  ],
};
