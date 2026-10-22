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
        layout: 'sticky',
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
    {
      id: 'figures',
      label: 'A story told in figures',
      description: 'Every step shows a number, with the text beside it.',
      data: {
        layout: 'sticky',
        title: 'The programme, in four numbers',
        steps: [
          {
            id: 'figure-1',
            heading: '£86 million was committed',
            body: 'The improvement fund was set at £86 million over three years.',
            visual: {
              kind: 'stat',
              value: '£86m',
              label: 'Committed to the programme',
              delta: 'over three financial years',
            },
          },
          {
            id: 'figure-2',
            heading: 'Only 13% of it was independently checked',
            body: 'Verification was scheduled for a quarter of sites, and skipped more often than not.',
            visual: {
              kind: 'stat',
              value: '13%',
              label: 'of filings independently checked',
              delta: 'down from 31% the year before',
            },
          },
          {
            id: 'figure-3',
            heading: 'The gap reached 165%',
            body: 'At its worst, the reported figure was more than double the verified one.',
            visual: {
              kind: 'stat',
              value: '165%',
              label: 'overstatement at the worst site',
              delta: 'Harbour East, Q2 2026',
            },
          },
          {
            id: 'figure-4',
            heading: 'The review made four recommendations',
            body: 'Continuous verification, published meter data, an open correction log and an independent sign-off.',
            visual: {
              kind: 'stat',
              value: '4',
              label: 'recommendations in the review',
              delta: 'one accepted in full',
            },
          },
        ],
        showProgress: true,
        sourceAttribution: 'GlobalPulse investigations',
      },
    },
    {
      id: 'photographs',
      label: 'A story told in pictures',
      description: 'Each step shows a photograph and the words that go with it.',
      data: {
        layout: 'stacked',
        title: 'The day the meters were read by hand',
        steps: [
          {
            id: 'photo-1',
            heading: 'A reading takes four minutes',
            body: 'Every meter at the older sites was read by hand, once a quarter.',
            visual: {
              kind: 'image',
              url: 'https://picsum.photos/seed/meter-read/1200/800',
              alt: 'An engineer reading a meter on a wall inside a plant room.',
              caption: 'The Northfield plant room, during the February reading.',
            },
          },
          {
            id: 'photo-2',
            heading: 'Then the readings were keyed in by hand',
            body: 'Four people typed the numbers in twice, which is how the error got in.',
            visual: {
              kind: 'image',
              url: 'https://picsum.photos/seed/keying-in/1200/800',
              alt: 'A desk with printed meter readings and a keyboard.',
              caption: 'The forms the readings arrived on.',
            },
          },
          {
            id: 'photo-3',
            heading: 'And nothing checked them',
            body: 'No one compared the typed figures with the meters until the review began.',
            visual: {
              kind: 'image',
              url: 'https://picsum.photos/seed/archive/1200/800',
              alt: 'Rows of filed paper records on a shelf.',
              caption: 'Two years of returns, in filing order.',
            },
          },
        ],
        showProgress: true,
        sourceAttribution: 'GlobalPulse investigations',
      },
    },
    {
      id: 'stacked',
      label: 'Stacked, not sticky',
      description: 'The same narrative, with every step carrying its own picture.',
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
            heading: 'What the review concluded',
            body: 'The overstatement was not deliberate, but it was not accidental either: nobody was required to check.',
            visual: {
              kind: 'text',
              text: 'The review found a reporting process that allowed a single site to diverge for two years without a single reading being independently checked. It recommended that verification become continuous rather than periodic.',
            },
          },
        ],
        layout: 'stacked',
        showProgress: true,
        caption: 'Every step carries its own picture, so the narrative reads the same on a phone.',
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
    {
      id: 'sweep',
      label: 'Turning into the pie',
      description: 'The whole picture turns once and settles.',
      data: {
        title: 'What the complaints were about',
        chart: {
          chartType: 'donut',
          title: 'What the complaints were about',
          xAxis: { key: 'cause', label: 'Cause' },
          yAxis: { label: 'Share of cases', unit: '%' },
          series: [{ name: 'Share', key: 'share' }],
          values: [
            { cause: 'Measurement', share: 41 },
            { cause: 'Classification', share: 24 },
            { cause: 'Timing', share: 15 },
            { cause: 'Other', share: 20 },
          ],
        },
        animation: 'sweep',
        durationMs: 1000,
        sourceAttribution: 'GlobalPulse investigations',
      },
    },
    {
      id: 'fade',
      label: 'Fading in',
      description: 'Every mark arrives together.',
      data: {
        title: 'The overstatement, by site',
        chart: {
          chartType: 'grouped_bar',
          title: 'The overstatement, by site',
          xAxis: { key: 'site', label: 'Reporting site' },
          yAxis: { label: 'Overstatement', unit: '%' },
          series: [
            { name: 'Reported', key: 'reported' },
            { name: 'Verified', key: 'verified' },
          ],
          values: [
            { site: 'Northfield', reported: 12.1, verified: 11.6 },
            { site: 'Harbour East', reported: 9.4, verified: 8.2 },
            { site: 'Ridgeway', reported: 7.8, verified: 7.4 },
            { site: 'Coastal', reported: 5.1, verified: 4.9 },
          ],
        },
        animation: 'fade',
        durationMs: 700,
        staggerMs: 40,
        sourceAttribution: 'GlobalPulse investigations',
      },
    },
    {
      id: 'looping',
      label: 'On a loop',
      description: 'The animation starts again when it finishes.',
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
        durationMs: 800,
        staggerMs: 70,
        loop: true,
        respectReducedMotion: true,
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
    {
      id: 'markup-only',
      label: 'Markup on its own',
      description: 'A frame with no script in it at all.',
      data: {
        title: 'A note from the desk',
        html: `<div style="font-family: system-ui, sans-serif; padding: 8px; line-height: 1.5">
  <p style="margin: 0 0 12px; font-size: 15px; color: #0f172a">
    The figures in this piece are taken from the published returns and from
    independent meter checks carried out between January and June.
  </p>
  <p style="margin: 0; font-size: 13px; color: #64748b">
    Where a return could not be checked, it is marked as unverified and left out
    of every total.
  </p>
</div>`,
        height: 180,
        allowScripts: false,
        accessibilityText:
          'A note from the desk explaining where the figures came from and what was left out.',
        sourceAttribution: 'GlobalPulse investigations',
      },
    },
    {
      id: 'reading-the-data',
      label: 'Reading the data',
      description: 'A frame that draws itself from the block’s own data.',
      data: {
        title: 'A bespoke visual',
        html: `<div id="bars" style="display: flex; gap: 10px; align-items: flex-end; height: 140px; padding: 8px"></div>`,
        script: `const data = window.__blockData;
const bars = document.getElementById('bars');
const peak = Math.max(...data.series.map(function (entry) { return entry.value; }));
data.series.forEach(function (entry, index) {
  const bar = document.createElement('div');
  bar.style.flex = '1';
  bar.style.height = (entry.value / peak) * 100 + '%';
  bar.style.background = entry.color;
  bar.style.borderRadius = '4px 4px 0 0';
  bar.style.transition = 'height 600ms ease';
  bar.style.transitionDelay = index * 120 + 'ms';
  bar.title = entry.label + ': ' + entry.value;
  bars.appendChild(bar);
});`,
        data: {
          series: [
            { label: 'Northfield', value: 412, color: '#3b82f6' },
            { label: 'Harbour East', value: 388, color: '#10b981' },
            { label: 'Ridgeway', value: 274, color: '#f59e0b' },
            { label: 'Coastal', value: 166, color: '#ec4899' },
          ],
        },
        height: 200,
        allowScripts: true,
        caption: 'The frame is given the block’s own data and draws the bars from it.',
        accessibilityText:
          'Four bars: Northfield 412, Harbour East 388, Ridgeway 274, Coastal 166.',
        sourceAttribution: 'GlobalPulse investigations',
      },
    },
    {
      id: 'a-chart',
      label: 'A chart in the frame',
      description: 'The newsroom’s own drawing, rather than the platform’s.',
      data: {
        title: 'A bespoke chart',
        html: `<canvas id="c" width="720" height="260" style="width: 100%; height: auto"></canvas>`,
        script: `const canvas = document.getElementById('c');
const ctx = canvas.getContext('2d');
const values = window.__blockData.values;
const peak = Math.max(...values.map(function (v) { return v.value; }));
const width = canvas.width / values.length;
ctx.strokeStyle = '#cbd5e1';
ctx.beginPath();
ctx.moveTo(0, canvas.height - 20);
ctx.lineTo(canvas.width, canvas.height - 20);
ctx.stroke();
values.forEach(function (entry, index) {
  const height = (entry.value / peak) * (canvas.height - 40);
  ctx.fillStyle = entry.color;
  ctx.fillRect(index * width + 4, canvas.height - 20 - height, width - 8, height);
});`,
        data: {
          values: [
            { label: 'Q1', value: 34, color: '#3b82f6' },
            { label: 'Q2', value: 41, color: '#3b82f6' },
            { label: 'Q3', value: 52, color: '#3b82f6' },
            { label: 'Q4', value: 58, color: '#3b82f6' },
            { label: 'Q5', value: 71, color: '#3b82f6' },
          ],
        },
        height: 280,
        allowScripts: true,
        accessibilityText: 'Five columns rising from 34 to 71 across five quarters.',
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
    {
      id: 'points',
      label: 'A cloud of points',
      description: 'Every measurement is a point in the space.',
      data: {
        title: 'Every case, placed',
        subtitle: 'One point per site and quarter',
        scene: 'points',
        points: [
          { lat: 53.5, lon: -2.4, value: 12, label: 'Northfield' },
          { lat: 51.5, lon: -0.1, value: 18, label: 'Harbour East' },
          { lat: 52.9, lon: -1.9, value: 7, label: 'Ridgeway' },
          { lat: 50.8, lon: -0.7, value: 21, label: 'Coastal' },
          { lat: 51.9, lon: -2.6, value: 4, label: 'Westmarsh' },
          { lat: 51.4, lon: -0.9, value: 15, label: 'Kestrel' },
          { lat: 52.2, lon: -1.4, value: 9, label: 'Draycott' },
          { lat: 50.4, lon: -1.1, value: 25, label: 'Elmsworth' },
        ],
        autoRotate: true,
        cameraDistance: 7,
        height: 440,
        background: '#0f172a',
        alt: 'A cloud of coloured points, further from the centre where the case counts are higher.',
        sourceAttribution: 'GlobalPulse investigations',
      },
    },
    {
      id: 'a-model',
      label: 'A model',
      description: 'A three-dimensional model the reader can turn.',
      data: {
        title: 'The turbine, as built',
        scene: 'model',
        modelUrl: 'https://threejs.org/examples/models/gltf/DamagedHelmet/glTF/DamagedHelmet.gltf',
        autoRotate: true,
        cameraDistance: 5,
        height: 460,
        background: '#f8fafc',
        posterUrl: 'https://picsum.photos/seed/turbine-model/1200/800',
        alt: 'A three-dimensional model of a turbine, which the reader can turn.',
        caption: 'The model is loaded from a .glb file the newsroom hosts.',
        sourceAttribution: 'GlobalPulse investigations',
      },
    },
    {
      id: 'poster-only',
      label: 'A poster, not a scene',
      description: 'The picture that stands in for the scene where it cannot be drawn.',
      data: {
        title: 'The reviewed network',
        scene: 'globe',
        points: [
          { lat: 53.5, lon: -2.4, value: 412, label: 'Northfield' },
          { lat: 51.5, lon: -0.1, value: 388, label: 'Harbour East' },
        ],
        autoRotate: false,
        cameraDistance: 5,
        height: 360,
        posterUrl: 'https://picsum.photos/seed/network-poster/1200/675',
        alt: 'A photograph of the overhead lines the review covered.',
        caption: 'Where the scene cannot be drawn, this picture is shown instead.',
        sourceAttribution: 'GlobalPulse investigations',
      },
    },
  ],
};
