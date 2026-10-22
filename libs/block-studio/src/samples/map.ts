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
    {
      id: 'heatmap',
      label: 'Heatmap',
      description: 'Intensity laid over the map, rather than a value per region.',
      data: {
        title: 'Where the overstatement is concentrated',
        mapType: 'heatmap',
        center: [34.5, 41.2],
        zoom: 5,
        style: 'light',
        layers: [
          {
            id: 'overstatement-heat',
            type: 'heatmap',
            geojson: {
              type: 'FeatureCollection',
              features: [
                {
                  type: 'Feature',
                  properties: { name: 'North', intensity: 4.2 },
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
                  properties: { name: 'South', intensity: 7.1 },
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
                {
                  type: 'Feature',
                  properties: { name: 'East', intensity: 2.4 },
                  geometry: {
                    type: 'Polygon',
                    coordinates: [
                      [
                        [37, 38],
                        [40, 38],
                        [40, 41],
                        [37, 41],
                      ],
                    ],
                  },
                },
              ],
            },
            property: 'intensity',
            colorScale: ['#fef3c7', '#b45309'],
          },
        ],
        methodology: 'Intensity is the median overstatement in each region.',
      },
    },
    {
      id: 'comparison',
      label: 'Comparison',
      description: 'Two regions set against each other on the same map.',
      data: {
        title: 'Northfield against Harbour East',
        mapType: 'comparison',
        center: [34.5, 41.2],
        zoom: 6,
        style: 'dark',
        markers: [
          {
            coordinates: [34.1, 41.4],
            title: 'Northfield',
            description: 'Median overstatement 9.4 per cent. A second sign-off throughout.',
            severity: 'low',
            entityIds: ['ent_northfield'],
          },
          {
            coordinates: [35.2, 40.8],
            title: 'Harbour East',
            description: 'Median overstatement 14.2 per cent. No second sign-off.',
            severity: 'high',
            entityIds: ['ent_harbour_east'],
          },
        ],
        comparisonRegionIds: ['Northfield', 'Harbour East'],
        sourceAttribution: 'GlobalPulse investigations',
      },
    },
    {
      id: 'streets',
      label: 'A street map',
      description: 'The same markers, drawn on a street-style map.',
      data: {
        title: 'The four reporting sites',
        mapType: 'points',
        center: [34.5, 41.2],
        zoom: 9,
        style: 'streets',
        markers: [
          {
            coordinates: [34.1, 41.4],
            title: 'Northfield',
            description: 'Largest site by filing volume.',
            icon: 'building',
            severity: 'low',
          },
          {
            coordinates: [35.2, 40.8],
            title: 'Harbour East',
            description: 'Highest overstatement.',
            icon: 'alert',
            severity: 'high',
          },
          {
            coordinates: [33.4, 39.6],
            title: 'Ridgeway',
            description: 'Cleanest verification record.',
            icon: 'check',
            severity: 'low',
          },
          {
            coordinates: [32.4, 38.7],
            title: 'Coastal',
            description: 'No verification step at all.',
            icon: 'alert',
            severity: 'high',
          },
        ],
        sourceAttribution: 'GlobalPulse investigations',
      },
    },
  ],

  animated_map: [
    {
      id: 'scrubber',
      label: 'Scrubber',
      description: 'The frames with a scrubber the reader drags.',
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
    {
      id: 'slideshow',
      label: 'Slideshow',
      description: 'The frames playing on their own.',
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
    {
      id: 'static',
      label: 'Static',
      description: 'One frame, with no scrubber.',
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
      id: 'vertical',
      label: 'Vertical',
      description: 'The events down the page.',
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
    {
      id: 'horizontal',
      label: 'Horizontal',
      description: 'The events across the page.',
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
    {
      id: 'compact',
      label: 'Compact',
      description: 'The events as a compact list.',
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
    {
      id: 'sequence',
      label: 'Sequence diagram',
      description: 'A sequence diagram, showing who says what to whom.',
      data: {
        title: 'How a value is checked',
        format: 'sequence',
        definition:
          'sequenceDiagram\n  participant S as Reporting site\n  participant A as Second analyst\n  participant P as The authority\n  S->>A: Value submitted for publication\n  A->>S: Second signature requested\n  S-->>A: Value signed\n  A->>P: Signed value filed\n  P-->>S: Published with methodology',
        caption:
          'The step that was missing at three of the four sites is the second request, between the site and the second analyst.',
      },
    },
    {
      id: 'class',
      label: 'Class diagram',
      description: 'A class diagram, showing the shape of the records.',
      data: {
        title: 'The records behind a filing',
        format: 'mermaid',
        definition:
          'classDiagram\n  class Filing {\n    +string filingId\n    +number reported\n    +number verified\n    +boolean secondSignoff\n  }\n  class Site {\n    +string name\n    +string guidanceStatus\n  }\n  class Analyst {\n    +string name\n    +bool sign(Filing)\n  }\n  Filing --> Site : filed by\n  Analyst --> Filing : signs',
        caption:
          'A filing belongs to a site, and is signed by an analyst who is not the one who produced it.',
      },
    },
    {
      id: 'state',
      label: 'State diagram',
      description: 'A state diagram, showing the states a value moves through.',
      data: {
        title: 'The life of a reported value',
        format: 'mermaid',
        definition:
          'stateDiagram-v2\n  [*] --> Measured\n  Measured --> Submitted\n  Submitted --> Signed : second sign-off\n  Submitted --> Flagged : no sign-off\n  Flagged --> Checked : third-party check\n  Checked --> Signed\n  Signed --> Published\n  Published --> [*]',
        caption:
          'The three sites without a second sign-off never left the Flagged state in the review period.',
      },
    },
    {
      id: 'gantt',
      label: 'Gantt chart',
      description: 'A Gantt chart, showing the work over time.',
      data: {
        title: 'How the review was carried out',
        format: 'mermaid',
        definition:
          'gantt\n  title The review, by phase\n  dateFormat YYYY-MM-DD\n  section Preparation\n  Sample selection      :done, p1, 2026-04-04, 2026-04-25\n  Guidance obtained     :done, p2, 2026-04-20, 2026-05-19\n  section Re-checking\n  Northfield filings    :done, r1, 2026-05-01, 2026-06-12\n  Harbour East filings  :done, r2, 2026-05-08, 2026-06-19\n  Ridgeway filings      :done, r3, 2026-05-08, 2026-06-19\n  section Writing\n  Findings drafted       :done, w1, 2026-06-22, 2026-09-18\n  Publication           :milestone, w2, 2026-10-01, 0d',
        caption: 'Eleven weeks of re-checking, and three months of writing.',
      },
    },
    {
      id: 'captions',
      label: 'With a caption',
      description: 'A flowchart with a caption underneath it.',
      data: {
        title: 'The verification chain',
        format: 'flowchart',
        definition:
          'flowchart TD\n  A[Site reports value] --> B{Second sign-off?}\n  B -->|Yes| C[Value published]\n  B -->|No| D[Value flagged for review]\n  D --> E[Third-party check]\n  E --> C',
        caption:
          'Only two of four sites had a second sign-off in place. The other two reached publication by way of a third-party check, which is slower and more expensive.',
      },
    },
  ],

  flow: [
    {
      id: 'steps',
      label: 'Steps',
      description: 'The steps as numbered steps.',
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
    {
      id: 'timeline',
      label: 'Timeline',
      description: 'The steps as a timeline.',
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
    {
      id: 'cards',
      label: 'Cards',
      description: 'The steps as a card each.',
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
