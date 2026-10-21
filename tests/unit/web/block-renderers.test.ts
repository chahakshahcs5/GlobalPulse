import React from 'react';
import { describe, it, expect } from 'vitest';
import { renderToString } from 'react-dom/server';
import {
  EvidenceBlockView,
  PerspectiveBlockView,
  InterviewBlockView,
  LiveDataBlockView,
  FactCheckBlockView,
} from '../../../libs/blocks-ui/src/blocks/IntelligenceBlockViews';
import {
  DataExplorerBlockView,
  RankingBlockView,
  CalculatorBlockView,
  FinancialBlockView,
  ElectionBlockView,
  DisasterBlockView,
  ScienceBlockView,
} from '../../../libs/blocks-ui/src/blocks/DataBlockViews';
import {
  AnnotatedImageBlockView,
  VideoGalleryBlockView,
  PodcastBlockView,
  WaveformBlockView,
  TranscriptBlockView,
  DatasetBlockView,
} from '../../../libs/blocks-ui/src/blocks/MediaExpansionViews';

/**
 * Render smoke tests for the block views that were previously unrendered.
 *
 * A renderer that returns `null` (or throws) silently removes content from the
 * published article, so these assert the actual text reaches the HTML.
 */
describe('Block renderer smoke tests', () => {
  it('renders claims, evidence, stance, and the confidence methodology', () => {
    const html = renderToString(
      React.createElement(EvidenceBlockView, {
        data: {
          title: 'Evidence trail',
          summary: 'What we could verify.',
          claims: [
            {
              text: 'The fine totalled 4.2 million.',
              status: 'SUPPORTED',
              confidence: 0.8,
              confidenceMethodology: 'Regulator filing',
            },
          ],
          evidence: [
            {
              title: 'Regulator decision',
              stance: 'SUPPORTS',
              url: 'https://example.org/decision',
              excerpt: 'A total of 4.2 million was assessed.',
            },
          ],
          methodology: 'Primary documents only',
          sourceAttribution: 'Regulator',
        },
      })
    );

    expect(html).toContain('The fine totalled 4.2 million.');
    expect(html).toContain('SUPPORTED');
    expect(html).toContain('Regulator filing');
    expect(html).toContain('SUPPORTS');
    expect(html).toContain('Regulator decision');
    expect(html).toContain('Primary documents only');
  });

  it('renders attributed perspectives with their sources', () => {
    const html = renderToString(
      React.createElement(PerspectiveBlockView, {
        data: {
          title: 'Who says what',
          perspectives: [
            {
              label: 'Ministry',
              summary: 'The scheme will be reviewed in March.',
              stance: 'NEUTRAL',
              sourceIds: ['src_ministry'],
              quoteExcerpt: 'We will publish the review.',
            },
          ],
          methodology: 'Documented statements only',
        },
      })
    );

    expect(html).toContain('Ministry');
    expect(html).toContain('The scheme will be reviewed in March.');
    expect(html).toContain('src_ministry');
    expect(html).toContain('We will publish the review.');
  });

  it('renders interview questions and answers with timestamps', () => {
    const html = renderToString(
      React.createElement(InterviewBlockView, {
        data: {
          title: 'Interview with the commissioner',
          interviewee: { name: 'A. Commissioner', role: 'Insurance regulator' },
          format: 'video',
          mediaUrl: 'https://media.example.com/interview.mp4',
          segments: [
            { question: 'What changed?', answer: 'Premiums were re-rated.', timestampSeconds: 75 },
          ],
        },
      })
    );

    expect(html).toContain('What changed?');
    expect(html).toContain('Premiums were re-rated.');
    expect(html).toContain('1:15');
  });

  it('renders live data values with their change', () => {
    const html = renderToString(
      React.createElement(LiveDataBlockView, {
        data: {
          title: 'Markets',
          refreshIntervalSeconds: 60,
          items: [
            {
              id: 'nifty',
              label: 'NIFTY',
              provider: 'Exchange',
              value: '25,430',
              change: 1.2,
              asOf: '2026-10-20T10:00:00.000Z',
            },
          ],
        },
      })
    );

    expect(html).toContain('NIFTY');
    expect(html).toContain('25,430');
    // React separates adjacent text nodes with comment markers.
    expect(html.replace(/<!--.*?-->/g, '')).toContain('1.20%');
  });

  it('renders a fact check with its verdict and methodology', () => {
    const html = renderToString(
      React.createElement(FactCheckBlockView, {
        data: {
          claim: 'The scheme was shut down.',
          claimant: 'Viral post',
          status: 'CONTRADICTED',
          confidence: 0.95,
          confidenceMethodology: 'Two official statements',
          summary: 'The scheme is still operating.',
          sources: ['src_a', 'src_b'],
          reviewer: 'Verification desk',
        },
      })
    );

    expect(html).toContain('CONTRADICTED');
    expect(html).toContain('Two official statements');
    expect(html).toContain('The scheme is still operating.');
  });

  it('renders the data explorer with its dataset values', () => {
    const html = renderToString(
      React.createElement(DataExplorerBlockView, {
        data: {
          title: 'Global GDP',
          subtitle: 'Constant 2015 USD',
          dataset: {
            name: 'World GDP',
            sourceAttribution: 'World Bank',
            methodology: 'Constant prices',
            license: 'CC BY 4.0',
          },
          dimensions: [{ key: 'region', label: 'Region', type: 'category' }],
          metrics: [{ key: 'gdp', label: 'GDP', unit: 'USD', format: 'currency' }],
          defaultDimension: 'region',
          defaultMetric: 'gdp',
          rows: [
            { region: 'World', gdp: 3.9 },
            { region: 'Europe', gdp: 1.2 },
          ],
          downloadableFormats: ['csv'],
        },
      })
    );

    expect(html).toContain('Global GDP');
    expect(html).toContain('World');
    expect(html).toContain('3.9');
    expect(html).toContain('Download CSV');
    expect(html).toContain('CC BY 4.0');
  });

  it('renders a ranking with rank movement and methodology', () => {
    const html = renderToString(
      React.createElement(RankingBlockView, {
        data: {
          title: 'Largest economies',
          items: [
            { rank: 1, previousRank: 3, name: 'Country A', value: 25, unit: 'T' },
            { rank: 2, previousRank: 2, name: 'Country B', value: 20, unit: 'T' },
          ],
          methodology: 'Nominal GDP',
          sourceAttribution: 'IMF',
        },
      })
    );

    expect(html).toContain('Country A');
    expect(html).toContain('↑2');
    expect(html).toContain('Nominal GDP');
  });

  it('renders calculator inputs and outputs', () => {
    const html = renderToString(
      React.createElement(CalculatorBlockView, {
        data: {
          title: 'Monthly payment',
          description: 'Amortized loan payment',
          inputs: [
            { id: 'principal', label: 'Principal', type: 'number', defaultValue: 200000 },
            { id: 'rate', label: 'Rate', type: 'number', defaultValue: 5 },
          ],
          outputs: [
            { id: 'payment', label: 'Payment', expression: 'principal * rate', unit: 'USD' },
          ],
          assumptions: ['Constant rate'],
          methodology: 'Standard amortization',
        },
      })
    );

    expect(html).toContain('Monthly payment');
    expect(html).toContain('Principal');
    expect(html).toContain('Constant rate');
  });

  it('renders financial metrics with currency and as-of date', () => {
    const html = renderToString(
      React.createElement(FinancialBlockView, {
        data: {
          title: 'Acme Corp results',
          currency: 'USD',
          asOf: '2026-09-30',
          metrics: [{ label: 'Revenue', value: 4200, change: 7.2, changePeriod: 'YoY' }],
        },
      })
    );

    expect(html).toContain('Acme Corp results');
    expect(html).toContain('4,200');
    expect(html).toContain('2026-09-30');
  });

  it('renders election results with seat change', () => {
    const html = renderToString(
      React.createElement(ElectionBlockView, {
        data: {
          title: 'Regional election',
          electionType: 'Legislative',
          region: 'North District',
          electionDate: '2026-11-02',
          results: [
            { party: 'Party A', votes: 1000, voteShare: 52, seats: 24, seatChange: 3 },
            { party: 'Party B', votes: 900, voteShare: 46, seats: 20, seatChange: -3 },
          ],
        },
      })
    );

    expect(html).toContain('North District');
    expect(html).toContain('52%');
    expect(html).toContain('+3');
  });

  it('renders disaster metrics and affected areas', () => {
    const html = renderToString(
      React.createElement(DisasterBlockView, {
        data: {
          title: 'Earthquake',
          disasterType: 'earthquake',
          status: 'ACTIVE',
          occurredAt: '2026-10-20T04:12:00.000Z',
          location: 'Northern Coast',
          metrics: [{ label: 'Magnitude', value: 6.4, unit: 'Mw' }],
          affectedAreas: ['Coast City'],
          updates: [{ timestamp: '2026-10-20T05:00:00.000Z', title: 'Aftershock recorded' }],
        },
      })
    );

    expect(html).toContain('6.4');
    expect(html).toContain('Mw');
    expect(html).toContain('Coast City');
    expect(html).toContain('Aftershock recorded');
  });

  it('renders science findings and measurements', () => {
    const html = renderToString(
      React.createElement(ScienceBlockView, {
        data: {
          title: 'Ice core analysis',
          field: 'Climate',
          findings: ['CO2 levels are 280 ppm'],
          measurements: [{ label: 'CO2', value: 280, unit: 'ppm', uncertainty: 2 }],
          equation: 'y = ax + b',
          authors: ['A. Researcher'],
          institutions: ['Institute'],
        },
      })
    );

    expect(html).toContain('CO2 levels are 280 ppm');
    expect(html).toContain('280');
    expect(html).toContain('ppm');
    expect(html).toContain('y = ax + b');
  });

  it('renders an annotated image with its annotations', () => {
    const html = renderToString(
      React.createElement(AnnotatedImageBlockView, {
        data: {
          url: 'https://media.example.com/map.png',
          altText: 'Annotated map of the affected area',
          caption: 'Damage assessment',
          credit: 'Field team',
          annotations: [
            { id: 'a1', xPercent: 25, yPercent: 40, label: 'Bridge', description: 'Closed' },
          ],
        },
      })
    );

    expect(html).toContain('Annotated map of the affected area');
    expect(html).toContain('Bridge');
    expect(html).toContain('Damage assessment');
  });

  it('renders a video gallery with chapters and transcripts', () => {
    const html = renderToString(
      React.createElement(VideoGalleryBlockView, {
        data: {
          title: 'Field reports',
          videos: [
            {
              id: 'v1',
              url: 'https://media.example.com/one.mp4',
              title: 'Day one',
              durationSeconds: 95,
              chapters: [{ startSeconds: 10, title: 'Arrival' }],
              transcriptSegments: [{ startSeconds: 0, text: 'We are on the ground.' }],
            },
          ],
        },
      })
    );

    expect(html).toContain('Day one');
    expect(html).toContain('1:35');
    expect(html).toContain('Arrival');
    expect(html).toContain('We are on the ground.');
  });

  it('renders a podcast with episode metadata and speakers', () => {
    const html = renderToString(
      React.createElement(PodcastBlockView, {
        data: {
          title: 'The Daily Briefing',
          episodes: [
            {
              showTitle: 'The Daily Briefing',
              episodeTitle: 'Rate decision special',
              episodeNumber: 42,
              seasonNumber: 3,
              audioUrl: 'https://media.example.com/ep42.mp3',
              durationSeconds: 1800,
              speakers: [{ id: 'sp1', name: 'Alex Reporter', role: 'Economics' }],
            },
          ],
        },
      })
    );

    expect(html).toContain('Rate decision special');
    expect(html).toContain('S3');
    expect(html).toContain('E42');
    expect(html).toContain('Alex Reporter');
    expect(html).toContain('30:00');
  });

  it('renders a waveform with its amplitude samples and segments', () => {
    const html = renderToString(
      React.createElement(WaveformBlockView, {
        data: {
          title: 'Briefing audio',
          mediaUrl: 'https://media.example.com/briefing.mp3',
          mediaType: 'audio',
          durationSeconds: 90,
          peaks: [0.2, 0.8, 0.4],
          segments: [{ startSeconds: 15, label: 'Key number', blockRefId: 'blk_kpi' }],
        },
      })
    );

    expect(html).toContain('Briefing audio');
    expect(html).toContain('3 amplitude samples');
    expect(html).toContain('Key number');
  });

  it('renders a transcript with speakers and timestamps', () => {
    const html = renderToString(
      React.createElement(TranscriptBlockView, {
        data: {
          title: 'Interview transcript',
          mediaType: 'video',
          mediaUrl: 'https://media.example.com/interview.mp4',
          language: 'en',
          segments: [{ startSeconds: 65, speaker: 'Reporter', text: 'What happened next?' }],
          speakers: [{ id: 'sp1', name: 'Reporter' }],
        },
      })
    );

    expect(html).toContain('1:05');
    expect(html).toContain('What happened next?');
    expect(html).toContain('Reporter');
  });

  it('renders a dataset with columns, rows, and license', () => {
    const html = renderToString(
      React.createElement(DatasetBlockView, {
        data: {
          title: 'Global GDP series',
          description: 'Annual totals',
          downloadUrl: 'https://data.example.com/gdp.csv',
          formats: ['csv'],
          columns: [{ key: 'year', label: 'Year', type: 'number' }],
          previewRows: [{ year: 2025 }],
          license: 'CC BY 4.0',
          methodology: 'Constant 2015 USD',
        },
      })
    );

    expect(html).toContain('Global GDP series');
    expect(html).toContain('Year');
    expect(html).toContain('2025');
    expect(html).toContain('CC BY 4.0');
  });
});
