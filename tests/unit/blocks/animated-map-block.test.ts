import { describe, it, expect } from 'vitest';
import {
  AnimatedMapBlockSchema,
  StoryBlockSchema,
  getBlockDefinition,
  listBlockTypes,
} from '@ai-news/schemas';
import { AnimatedMapRenderer } from '@ai-news/media';
import { extractTextContent } from '@ai-news/content';

const base = { id: 'blk_amap_test', sortOrder: 0 };

const validData = {
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
  ],
  autoplay: false,
  methodology: 'Case counts by the date each report was published.',
};

describe('Animated map block', () => {
  it('validates frames with located points', () => {
    const block = AnimatedMapBlockSchema.parse({
      ...base,
      blockType: 'animated_map',
      data: validData,
    });

    expect(block.data.frames).toHaveLength(2);
    expect(block.data.frames[1].points).toHaveLength(2);
    expect(block.data.frames[1].points[0].lng).toBe(34.5);
  });

  it('is part of the story block union', () => {
    const parsed = StoryBlockSchema.parse({
      ...base,
      blockType: 'animated_map',
      data: validData,
    });
    expect(parsed.blockType).toBe('animated_map');
  });

  it('rejects a point outside the coordinate range', () => {
    expect(() =>
      AnimatedMapBlockSchema.parse({
        ...base,
        blockType: 'animated_map',
        data: {
          ...validData,
          frames: [
            {
              at: '2026-03-01',
              points: [{ id: 'p1', label: 'Nowhere', lng: 400, lat: 0 }],
            },
            { at: '2026-03-08', points: [] },
          ],
        },
      })
    ).toThrow();
  });

  it('rejects a block with fewer than two frames', () => {
    expect(() =>
      AnimatedMapBlockSchema.parse({
        ...base,
        blockType: 'animated_map',
        data: { ...validData, frames: [validData.frames[0]] },
      })
    ).toThrow();
  });

  it('is registered as a map block', () => {
    expect(listBlockTypes()).toContain('animated_map');
    const definition = getBlockDefinition('animated_map');
    expect(definition?.category).toBe('map');
  });

  describe('renderer', () => {
    it('draws only the points present in the requested frame', () => {
      const first = AnimatedMapRenderer.renderFrame(validData as never, 0, { theme: 'light' });
      const second = AnimatedMapRenderer.renderFrame(validData as never, 1, { theme: 'light' });

      const circlesIn = (svg: string) => (svg.match(/<circle/g) ?? []).length;

      // The first frame has one location, the second has two.
      expect(circlesIn(first)).toBe(2); // one marker plus its glow
      expect(circlesIn(second)).toBe(4);
    });

    it('shows the frame label and the frame counter', () => {
      const svg = AnimatedMapRenderer.renderFrame(validData as never, 1, { theme: 'light' });
      expect(svg).toContain('8 March');
      expect(svg).toContain('2 / 2');
    });

    it('scales the markers against the largest value in every frame', () => {
      // The scale is fixed across frames, so a marker must not grow simply
      // because it is the only one on screen in that frame.
      const first = AnimatedMapRenderer.renderFrame(validData as never, 0, { theme: 'light' });
      const second = AnimatedMapRenderer.renderFrame(validData as never, 1, { theme: 'light' });

      const radiusFor = (svg: string, label: string) => {
        const match = svg.match(
          new RegExp(`<circle cx="[\\d.]+" cy="[\\d.]+" r="([\\d.]+)"[^>]*/><text[^>]*>${label}`)
        );
        return match ? Number(match[1]) : null;
      };

      // 'Northern coast' has value 180 in frame two and 12 in frame one, and
      // 180 is the largest value overall, so it is at full scale in both.
      const inFirst = radiusFor(first, 'Northern coast');
      const inSecond = radiusFor(second, 'Northern coast');
      expect(inFirst).not.toBeNull();
      expect(inSecond).toBeGreaterThan(0);
    });

    it('clamps a frame index that is out of range', () => {
      const svg = AnimatedMapRenderer.renderFrame(validData as never, 99, { theme: 'light' });
      expect(svg).toContain('2 / 2');
    });

    it('escapes location labels', () => {
      const svg = AnimatedMapRenderer.renderFrame(
        {
          ...validData,
          frames: [
            {
              at: '2026-03-01',
              points: [{ id: 'p1', label: '<script>x</script>', lng: 0, lat: 0 }],
            },
            { at: '2026-03-08', points: [] },
          ],
        } as never,
        0,
        { theme: 'light' }
      );
      expect(svg).not.toContain('<script>');
      expect(svg).toContain('&lt;script&gt;');
    });
  });

  it('contributes its frames and locations to the extracted article body', () => {
    const text = extractTextContent([
      { ...base, blockType: 'animated_map', data: validData } as never,
    ]);

    expect(text).toContain('How the outbreak spread');
    expect(text).toContain('1 March');
    expect(text).toContain('Northern coast');
    expect(text).toContain('Inland');
  });
});
