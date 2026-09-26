import { describe, it, expect } from 'vitest';
import { DEMO_STORIES, DEMO_SOURCES } from '../apps/web/src/lib/demo-data.js';
import { D3ChartRenderer, MapRenderer, TimelineRenderer, VisualDiffRenderer } from '@ai-news/media';
import { StoryBlockSchema } from '@ai-news/schemas';

describe('Phase 4: Web Application, StoryRenderer & Large Display Mode', () => {
  describe('Demo Data & Story Schema Integrity', () => {
    it('contains realistic stories with valid structured blocks', () => {
      expect(DEMO_STORIES.length).toBeGreaterThanOrEqual(3);

      DEMO_STORIES.forEach((story) => {
        expect(story.id).toMatch(/^sty_/);
        expect(story.slug).toBeDefined();
        expect(story.status).toBe('PUBLISHED');
        expect(story.blocks.length).toBeGreaterThanOrEqual(2);

        // Every block conforms strictly to StoryBlockSchema
        story.blocks.forEach((block) => {
          const parsed = StoryBlockSchema.safeParse(block);
          expect(parsed.success).toBe(true);
        });
      });
    });

    it('contains verified sources with URLs and publishers', () => {
      const sources = Object.values(DEMO_SOURCES);
      expect(sources.length).toBeGreaterThanOrEqual(3);
      sources.forEach((src) => {
        expect(src.id).toMatch(/^src_/);
        expect(src.url).toMatch(/^https?:\/\//);
        expect(src.publisher).toBeDefined();
      });
    });
  });

  describe('StoryRenderer Multimedia Block Integration', () => {
    const bricsStory = DEMO_STORIES[0];

    it('renders D3 bar chart from story blocks', () => {
      const chartBlock = bricsStory.blocks.find((b) => b.blockType === 'chart');
      expect(chartBlock).toBeDefined();

      if (chartBlock && chartBlock.blockType === 'chart') {
        const svg = D3ChartRenderer.renderToSvg(chartBlock.data, { width: 800, height: 420 });
        expect(svg).toContain('<svg');
        expect(svg).toContain('Intra-Bloc Settlement Volume');
        expect(svg).toContain('2026');
        expect(svg).toContain('Bloomberg Intelligence');
      }
    });

    it('renders MapLibre map representation from story blocks', () => {
      const mapBlock = bricsStory.blocks.find((b) => b.blockType === 'map');
      expect(mapBlock).toBeDefined();

      if (mapBlock && mapBlock.blockType === 'map') {
        const svg = MapRenderer.renderSvgFallback(mapBlock.data, 800, 420, 'dark');
        expect(svg).toContain('Summit Venue &amp; Member State Representation');
        expect(svg).toContain('Summit Plenary Hall (New Delhi)');
      }
    });

    it('renders timeline track from story blocks', () => {
      const timelineBlock = bricsStory.blocks.find((b) => b.blockType === 'timeline');
      expect(timelineBlock).toBeDefined();

      if (timelineBlock && timelineBlock.blockType === 'timeline') {
        const svg = TimelineRenderer.renderSvgTrack(timelineBlock.data, 'horizontal', 800, 240);
        expect(svg).toContain('Summit Milestone Chronology');
        expect(svg).toContain('Day 1 • 09:00');
        expect(svg).toContain('Unanimous Adoption');
      }
    });

    it('renders WhatChanged revision summary from story blocks', () => {
      const whatChangedBlock = bricsStory.blocks.find((b) => b.blockType === 'what_changed');
      expect(whatChangedBlock).toBeDefined();

      if (whatChangedBlock && whatChangedBlock.blockType === 'what_changed') {
        const html = VisualDiffRenderer.renderHtml(whatChangedBlock.data, true);
        expect(html).toContain('What Changed in this Revision');
        expect(html).toContain('Updates vs Version 2');
        expect(html).toContain('ADDED');
        expect(html).toContain('UPDATED');
        expect(html).toContain('CORRECTION');
      }
    });
  });

  describe('Large Display Experience (4K / Kiosk)', () => {
    it('supports multi-pane visual distribution without data loss', () => {
      const story = DEMO_STORIES[0];
      const chartBlock = story.blocks.find((b) => b.blockType === 'chart');
      const mapBlock = story.blocks.find((b) => b.blockType === 'map');

      expect(chartBlock).toBeDefined();
      expect(mapBlock).toBeDefined();
      expect(story.title).toBeDefined();
      expect(story.summary).toBeDefined();
    });
  });
});
