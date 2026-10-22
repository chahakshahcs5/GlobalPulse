/**
 * Sample payloads for the immersive & motion blocks.
 *
 * Each entry is a named, ready-made treatment of one block type — a
 * scroll-driven narrative, a chart that draws itself in, a bespoke visual
 * drawn by the newsroom's own code, and a three-dimensional scene.
 *
 * Every variant is validated against its block's schema by
 * `tests/unit/blocks/block-studio-samples.test.ts`, so a sample can never
 * drift away from the block it demonstrates.
 */
import type { StudioVariant } from '../types';

export const IMMERSIVE_SAMPLES: Record<string, StudioVariant[]> = {
  scrolly: [
    {
      id: 'explainer',
      label: 'A stepped explainer',
      description: 'A picture that changes as the reader moves through the steps.',
      data: {
        title: 'How the overstatement happened',
        steps: [
          {
            id: 'step-1',
            heading: 'It started with a single site',
            body: 'Harbour East reported figures that did not match the meters. The gap was small at first.',
            visual: {
              kind: 'chart',
              chart: {
                chartType: 'line',
                title: 'Reported against verified, 2024–2026',
                xAxis: { key: 'quarter', label: 'Quarter', type: 'time' },
                yAxis: { label: 'GWh', unit: 'GWh' },
                series: [
                  { name: 'Reported', key: 'reported' },
                  { name: 'Verified', key: 'verified' },
                ],
                values: [
                  { quarter: '2024 Q1', reported: 9.4, verified: 9.1 },
                  { quarter: '2024 Q2', reported: 9.8, verified: 9.3 },
                  { quarter: '2024 Q3', reported: 10.2, verified: 9.4 },
                  { quarter: '2024 Q4', reported: 10.9, verified: 9.5 },
                  { quarter: '2025 Q1', reported: 11.6, verified: 9.6 },
                  { quarter: '2025 Q2', reported: 12.9, verified: 9.7 },
                  { quarter: '2025 Q3', reported: 14.8, verified: 9.8 },
                  { quarter: '2025 Q4', reported: 17.4, verified: 9.9 },
                  { quarter: '2026 Q1', reported: 21.1, verified: 10.0 },
                  { quarter: '2026 Q2', reported: 26.7, verified: 10.1 },
                ],
              },
            },
          },
          {
            id: 'step-2',
            heading: 'Nobody checked the meters',
            body: 'Verification had been happening, but only every third quarter, and never at this site.',
            visual: {
              kind: 'stat',
              value: '1 in 4',
              label: 'sites were checked each quarter',
              delta: 'down from 1 in 3 the year before',
            },
          },
          {
            id: 'step-3',
            heading: 'The gap kept widening',
            body: 'By the time the audit reached Harbour East, the reported figures were more than double the verified ones.',
            visual: {
              kind: 'chart',
              chart: {
                chartType: 'area',
                title: 'The gap, in gigawatt-hours',
                xAxis: { key: 'quarter', label: 'Quarter', type: 'time' },
                yAxis: { label: 'Gap', unit: 'GWh' },
                series: [{ name: 'Gap', key: 'gap' }],
                values: [
                  { quarter: '2024 Q1', gap: 0.3 },
                  { quarter: '2024 Q2', gap: 0.5 },
                  { quarter: '2024 Q3', gap: 0.8 },
                  { quarter: '2024 Q4', gap: 1.4 },
                  { quarter: '2025 Q1', gap: 2.0 },
                  { quarter: '2025 Q2', gap: 3.2 },
                  { quarter: '2025 Q3', gap: 5.0 },
                  { quarter: '2025 Q4', gap: 7.5 },
                  { quarter: '2026 Q1', gap: 11.1 },
                  { quarter: '2026 Q2', gap: 16.6 },
                ],
              },
            },
          },
          {
            id: 'step-4',
            heading: 'What the review concluded',
            body: 'The overstatement was not deliberate, but it was not accidental either: nobody was required to check.',
            visual: {
              kind: 'text',
              text: 'The review found a reporting process that allowed a single site to diverge for two years without a single reading being independently checked. It recommended that verification become continuous rather than periodic.',
            },
          },
        ],
        showProgress: true,
        caption: 'Figures taken from the published returns and the independent meter checks.',
        sourceAttribution: 'GlobalPulse investigations',
      },
    },
  ],

  motion_chart: [
    {
      id: 'grow',
      label: 'Bars growing in',
      description: 'The bars rise from the baseline, one after another.',
      data: {
        title: 'Cases opened each month',
        chart: {
          chartType: 'bar',
          title: 'Cases opened each month',
          xAxis: { key: 'month', label: 'Month' },
          yAxis: { label: 'Cases', unit: 'cases' },
          series: [{ name: 'Cases', key: 'cases' }],
          values: [
            { month: 'Jan', cases: 112 },
            { month: 'Feb', cases: 134 },
            { month: 'Mar', cases: 158 },
            { month: 'Apr', cases: 176 },
            { month: 'May', cases: 149 },
            { month: 'Jun', cases: 191 },
            { month: 'Jul', cases: 204 },
            { month: 'Aug', cases: 188 },
          ],
        },
        animation: 'grow',
        durationMs: 900,
        staggerMs: 70,
        respectReducedMotion: true,
        sourceAttribution: 'GlobalPulse investigations',
      },
    },
    {
      id: 'draw',
      label: 'The line drawing on',
      description: 'The line draws itself from left to right.',
      data: {
        title: 'Demand against forecast',
        chart: {
          chartType: 'line',
          title: 'Demand against forecast',
          xAxis: { key: 'month', label: 'Month', type: 'time' },
          yAxis: { label: 'Demand', unit: 'TWh' },
          series: [
            { name: 'Actual', key: 'actual' },
            { name: 'Forecast', key: 'forecast' },
          ],
          values: [
            { month: 'Jan', actual: 41.2, forecast: 42.0 },
            { month: 'Feb', actual: 39.8, forecast: 41.4 },
            { month: 'Mar', actual: 43.1, forecast: 42.8 },
            { month: 'Apr', actual: 40.4, forecast: 41.9 },
            { month: 'May', actual: 44.9, forecast: 43.2 },
            { month: 'Jun', actual: 47.3, forecast: 44.6 },
            { month: 'Jul', actual: 49.1, forecast: 46.0 },
            { month: 'Aug', actual: 48.4, forecast: 47.4 },
          ],
        },
        animation: 'draw',
        durationMs: 1200,
        staggerMs: 120,
        sourceAttribution: 'National Grid Authority',
      },
    },
    {
      id: 'count',
      label: 'The number counting up',
      description: 'A figure that counts up to where it is going.',
      data: {
        title: 'How many cases were substantiated',
        chart: {
          chartType: 'kpi',
          title: 'Substantiated cases',
          xAxis: { key: 'name', label: 'Measure' },
          yAxis: { label: 'Cases', unit: 'cases' },
          series: [{ name: 'Cases', key: 'value' }],
          values: [{ name: 'Substantiated cases', value: 863 }],
        },
        animation: 'count',
        durationMs: 1400,
        sourceAttribution: 'GlobalPulse investigations',
      },
    },
  ],

  sandbox: [
    {
      id: 'custom-chart',
      label: 'A custom visual',
      description: 'HTML, CSS and JavaScript, run in a sandboxed frame.',
      data: {
        title: 'A bespoke visual',
        html: `<div class="cards">
  <div class="card" style="--tone: #3b82f6"><span class="n">1,840</span><span class="l">Complaints received</span></div>
  <div class="card" style="--tone: #f59e0b"><span class="n">863</span><span class="l">Substantiated</span></div>
  <div class="card" style="--tone: #10b981"><span class="n">447</span><span class="l">Corrected</span></div>
</div>`,
        script: `document.querySelectorAll('.card').forEach((card, index) => {
  card.style.opacity = '0';
  card.style.transform = 'translateY(8px)';
  setTimeout(() => {
    card.style.transition = 'opacity 500ms ease, transform 500ms ease';
    card.style.opacity = '1';
    card.style.transform = 'translateY(0)';
  }, index * 140);
});`,
        data: { total: 1840, substantiated: 863, corrected: 447 },
        height: 220,
        allowScripts: true,
        caption: 'Drawn by the newsroom’s own code, in a frame that cannot read the page.',
        accessibilityText:
          'Three figures: 1,840 complaints received, 863 substantiated, 447 records corrected.',
        sourceAttribution: 'GlobalPulse investigations',
      },
    },
  ],

  scene_3d: [
    {
      id: 'globe',
      label: 'A globe',
      description: 'A three-dimensional globe with the marked places on it.',
      data: {
        title: 'Where the reviewed sites are',
        subtitle: 'Drag to turn the globe',
        scene: 'globe',
        points: [
          { lat: 53.5, lon: -2.4, value: 412, label: 'Northfield' },
          { lat: 51.5, lon: -0.1, value: 388, label: 'Harbour East' },
          { lat: 52.9, lon: -1.9, value: 274, label: 'Ridgeway' },
          { lat: 50.8, lon: -0.7, value: 166, label: 'Coastal' },
          { lat: 51.9, lon: -2.6, value: 208, label: 'Westmarsh' },
          { lat: 51.4, lon: -0.9, value: 97, label: 'Kestrel' },
        ],
        autoRotate: true,
        cameraDistance: 5,
        height: 480,
        background: '#0f172a',
        alt: 'A globe showing six reviewed sites across the region, each marked with a coloured point.',
        caption: 'The six sites covered by the review.',
        sourceAttribution: 'GlobalPulse investigations',
      },
    },
    {
      id: 'bars',
      label: 'Three-dimensional bars',
      description: 'Columns in a scene you can turn.',
      data: {
        title: 'Substantiated complaints by site',
        scene: 'bars',
        bars: [
          { label: 'Northfield', value: 412 },
          { label: 'Harbour East', value: 388 },
          { label: 'Ridgeway', value: 274 },
          { label: 'Westmarsh', value: 208 },
          { label: 'Coastal', value: 166 },
          { label: 'Kestrel', value: 97 },
        ],
        autoRotate: false,
        cameraDistance: 6,
        height: 420,
        alt: 'Six columns in three dimensions, the tallest being Northfield at 412 complaints.',
        sourceAttribution: 'GlobalPulse investigations',
      },
    },
  ],
};
