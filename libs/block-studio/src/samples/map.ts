/**
 * Sample payloads for the maps & process blocks.
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

export const MAP_SAMPLES: Record<string, StudioVariant[]> = {
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
};
