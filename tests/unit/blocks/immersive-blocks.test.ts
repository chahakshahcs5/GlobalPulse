import { describe, it, expect } from 'vitest';
import {
  MotionChartBlockSchema,
  SandboxBlockSchema,
  Scene3DBlockSchema,
  ScrollyBlockSchema,
  StoryBlockSchema,
  getBlockDefinition,
} from '@ai-news/schemas';
import { extractTextContent } from '@ai-news/content';

const base = { id: 'blk_immersive_test', sortOrder: 0 };

const chartPayload = {
  chartType: 'bar',
  title: 'Cases opened each month',
  xAxis: { key: 'month', label: 'Month' },
  yAxis: { label: 'Cases', unit: 'cases' },
  series: [{ name: 'Cases', key: 'cases' }],
  values: [
    { month: 'Jan', cases: 112 },
    { month: 'Feb', cases: 134 },
  ],
};

const scrollyData = {
  title: 'How the overstatement happened',
  steps: [
    {
      id: 'step-1',
      heading: 'It started with a single site',
      body: 'Harbour East reported figures that did not match the meters.',
      visual: {
        kind: 'stat' as const,
        value: '1 in 4',
        label: 'sites were checked each quarter',
        delta: 'down from 1 in 3',
      },
    },
    {
      id: 'step-2',
      heading: 'The gap kept widening',
      body: 'By the time the audit arrived, the figures were double.',
      visual: { kind: 'chart' as const, chart: chartPayload },
    },
    {
      id: 'step-3',
      body: 'The review concluded that nobody was required to check.',
      visual: { kind: 'text' as const, text: 'Verification should have been continuous.' },
    },
  ],
  showProgress: true,
};

const motionData = {
  title: 'Cases opened each month',
  chart: chartPayload,
  animation: 'grow' as const,
  durationMs: 900,
  staggerMs: 70,
  loop: false,
  respectReducedMotion: true,
};

const sandboxData = {
  title: 'A bespoke visual',
  html: '<div class="card">1,840 complaints</div>',
  script: 'console.log("hello");',
  data: { total: 1840 },
  height: 220,
  allowScripts: true,
  accessibilityText: 'Three figures: 1,840 complaints, 863 substantiated, 447 corrected.',
};

const sceneData = {
  title: 'Where the reviewed sites are',
  scene: 'globe' as const,
  points: [
    { lat: 53.5, lon: -2.4, value: 412, label: 'Northfield' },
    { lat: 51.5, lon: -0.1, value: 388, label: 'Harbour East' },
  ],
  autoRotate: true,
  cameraDistance: 5,
  height: 480,
  alt: 'A globe showing two reviewed sites.',
  posterUrl: 'https://example.org/poster.png',
};

describe('Scrolly block', () => {
  it('validates the steps', () => {
    const block = ScrollyBlockSchema.parse({ ...base, blockType: 'scrolly', data: scrollyData });
    expect(block.data.steps).toHaveLength(3);
  });

  it('is part of the story block union', () => {
    const parsed = StoryBlockSchema.parse({ ...base, blockType: 'scrolly', data: scrollyData });
    expect(parsed.blockType).toBe('scrolly');
  });

  it('rejects a block with no steps', () => {
    expect(() =>
      ScrollyBlockSchema.parse({
        ...base,
        blockType: 'scrolly',
        data: { ...scrollyData, steps: [] },
      })
    ).toThrow();
  });

  it('rejects a visual that names a kind it does not have', () => {
    expect(() =>
      ScrollyBlockSchema.parse({
        ...base,
        blockType: 'scrolly',
        data: {
          ...scrollyData,
          steps: [{ id: 'x', visual: { kind: 'video', url: 'https://example.org/v.mp4' } }],
        },
      })
    ).toThrow();
  });

  it('reaches the text extractor', () => {
    const text = extractTextContent([
      { ...base, blockType: 'scrolly', data: scrollyData } as never,
    ]);
    expect(text).toContain('How the overstatement happened');
    expect(text).toContain('It started with a single site');
    expect(text).toContain('1 in 4');
  });
});

describe('Motion chart block', () => {
  it('validates the chart it animates', () => {
    const block = MotionChartBlockSchema.parse({
      ...base,
      blockType: 'motion_chart',
      data: motionData,
    });
    expect(block.data.chart.values).toHaveLength(2);
  });

  it('rejects an animation it does not have', () => {
    expect(() =>
      MotionChartBlockSchema.parse({
        ...base,
        blockType: 'motion_chart',
        data: { ...motionData, animation: 'explode' },
      })
    ).toThrow();
  });

  it('rejects an animation that is too slow', () => {
    expect(() =>
      MotionChartBlockSchema.parse({
        ...base,
        blockType: 'motion_chart',
        data: { ...motionData, durationMs: 60000 },
      })
    ).toThrow();
  });

  it('reaches the text extractor', () => {
    const text = extractTextContent([
      { ...base, blockType: 'motion_chart', data: motionData } as never,
    ]);
    expect(text).toContain('Cases opened each month');
  });
});

describe('Sandbox block', () => {
  it('validates the payload', () => {
    const block = SandboxBlockSchema.parse({ ...base, blockType: 'sandbox', data: sandboxData });
    expect(block.data.height).toBe(220);
    expect(block.data.data).toEqual({ total: 1840 });
  });

  it('is part of the story block union', () => {
    const parsed = StoryBlockSchema.parse({ ...base, blockType: 'sandbox', data: sandboxData });
    expect(parsed.blockType).toBe('sandbox');
  });

  it('rejects a frame that is too tall', () => {
    expect(() =>
      SandboxBlockSchema.parse({
        ...base,
        blockType: 'sandbox',
        data: { ...sandboxData, height: 100000 },
      })
    ).toThrow();
  });

  it('reaches the text extractor', () => {
    const text = extractTextContent([
      { ...base, blockType: 'sandbox', data: sandboxData } as never,
    ]);
    expect(text).toContain('A bespoke visual');
    expect(text).toContain('863 substantiated');
  });
});

describe('Scene 3D block', () => {
  it('validates the scene', () => {
    const block = Scene3DBlockSchema.parse({ ...base, blockType: 'scene_3d', data: sceneData });
    expect(block.data.points).toHaveLength(2);
  });

  it('rejects a point that is not on the globe', () => {
    expect(() =>
      Scene3DBlockSchema.parse({
        ...base,
        blockType: 'scene_3d',
        data: { ...sceneData, points: [{ lat: 120, lon: 0 }] },
      })
    ).toThrow();
  });

  it('rejects a scene it does not have', () => {
    expect(() =>
      Scene3DBlockSchema.parse({
        ...base,
        blockType: 'scene_3d',
        data: { ...sceneData, scene: 'city' },
      })
    ).toThrow();
  });

  it('reaches the text extractor', () => {
    const text = extractTextContent([{ ...base, blockType: 'scene_3d', data: sceneData } as never]);
    expect(text).toContain('Where the reviewed sites are');
    expect(text).toContain('A globe showing two reviewed sites.');
  });
});

describe('The immersive blocks are registered', () => {
  it('describes every one of them', () => {
    for (const type of ['scrolly', 'motion_chart', 'sandbox', 'scene_3d']) {
      const definition = getBlockDefinition(type);
      expect(definition, type).toBeDefined();
      expect(definition!.description.length).toBeGreaterThan(10);
    }
  });

  it('puts them in their own category', () => {
    for (const type of ['scrolly', 'motion_chart', 'sandbox', 'scene_3d']) {
      expect(getBlockDefinition(type)!.category).toBe('immersive');
    }
  });
});
