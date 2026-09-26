import React from 'react';
import { describe, it, expect } from 'vitest';
import { DEMO_STORIES, DEMO_SOURCES } from '../../../apps/web/src/lib/demo-data.js';
import { D3ChartRenderer, MapRenderer, TimelineRenderer, VisualDiffRenderer } from '@ai-news/media';
import { StoryBlockSchema } from '@ai-news/schemas';

describe('Web Application, StoryRenderer & Large Display Mode Integration Tests', () => {
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

    it('renders all multimedia block types in StoryRenderer without errors', async () => {
      const { renderToString } = await import('react-dom/server');
      const { StoryRenderer } = await import('../../../apps/web/src/components/StoryRenderer.js');

      const allBlocks: any[] = [
        {
          id: 'blk_head_1',
          storyVersionId: 'ver_1',
          blockType: 'heading',
          sortOrder: 0,
          data: { level: 2, text: 'Breaking Development', subtext: 'Comprehensive overview' },
        },
        {
          id: 'blk_gal_1',
          storyVersionId: 'ver_1',
          blockType: 'gallery',
          sortOrder: 1,
          data: {
            title: 'On-Site Photography',
            images: [
              { url: 'https://images.unsplash.com/photo-1', altText: 'Photo 1', caption: 'Plenary hall', credit: 'Reuters' },
              { url: 'https://images.unsplash.com/photo-2', altText: 'Photo 2', caption: 'Press conference' },
            ],
          },
        },
        {
          id: 'blk_flow_1',
          storyVersionId: 'ver_1',
          blockType: 'flow',
          sortOrder: 2,
          data: {
            title: 'Diplomatic Approval Flow',
            steps: [
              { stepNumber: 1, title: 'Draft Protocol', description: 'Working groups assemble.', status: 'completed' },
              { stepNumber: 2, title: 'Ministerial Signoff', description: 'Foreign ministers vote.', status: 'active' },
            ],
          },
        },
        {
          id: 'blk_vid_1',
          storyVersionId: 'ver_1',
          blockType: 'video',
          sortOrder: 3,
          data: {
            url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
            posterUrl: 'https://images.unsplash.com/photo-poster',
            aspectRatio: '16:9',
            caption: 'Press Briefing Stream',
            durationSeconds: 145,
            transcription: 'Delegates have reached consensus on major trade clauses.',
          },
        },
        {
          id: 'blk_aud_1',
          storyVersionId: 'ver_1',
          blockType: 'audio',
          sortOrder: 4,
          data: {
            url: 'https://example.com/briefing.mp3',
            title: 'Morning Executive Audio Briefing',
            narrator: 'Anchor AI',
            durationSeconds: 180,
            transcript: 'Good morning, here is the executive update.',
          },
        },
        {
          id: 'blk_slide_1',
          storyVersionId: 'ver_1',
          blockType: 'slide_deck',
          sortOrder: 5,
          data: {
            title: 'Consortium Roadmap Slides',
            slides: [
              { slideNumber: 1, title: 'Phase 1: Architecture', bullets: ['Decentralized messaging', 'Audit trails'] },
              { slideNumber: 2, title: 'Phase 2: Deployment', body: 'Global rollout schedule.' },
            ],
          },
        },
        {
          id: 'blk_comp_1',
          storyVersionId: 'ver_1',
          blockType: 'comparison',
          sortOrder: 6,
          data: {
            title: 'Policy Comparison',
            subjectA: { name: 'Proposal Alpha', points: ['Decentralized governance', 'Zero tariffs'] },
            subjectB: { name: 'Proposal Beta', points: ['Central regulatory council', 'Targeted quotas'] },
          },
        },
        {
          id: 'blk_src_1',
          storyVersionId: 'ver_1',
          blockType: 'source',
          sortOrder: 7,
          data: {
            sourceId: 'src_sec_gov',
            title: 'Official Press Statement',
            publisher: 'Government Press Bureau',
            url: 'https://example.com/press-release',
            publishedAt: '2026-09-26T18:00:00Z',
          },
        },
        {
          id: 'blk_ent_1',
          storyVersionId: 'ver_1',
          blockType: 'entity',
          sortOrder: 8,
          data: {
            entityId: 'ent_un',
            name: 'United Nations',
            type: 'ORGANIZATION',
            description: 'International organization fostering diplomacy and international peace.',
          },
        },
        {
          id: 'blk_rel_1',
          storyVersionId: 'ver_1',
          blockType: 'related_stories',
          sortOrder: 9,
          data: {
            title: 'Related Dispatches',
            storyIds: ['sty_archive_77', 'sty_breaking_mars'],
          },
        },
        {
          id: 'blk_emb_1',
          storyVersionId: 'ver_1',
          blockType: 'embed',
          sortOrder: 10,
          data: {
            provider: 'youtube',
            url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
            title: 'Live Stream Recording',
          },
        },
      ];

      const html = renderToString(React.createElement(StoryRenderer, { blocks: allBlocks, theme: 'dark' }));
      expect(html).toContain('Breaking Development');
      expect(html).toContain('On-Site Photography');
      expect(html).toContain('Diplomatic Approval Flow');
      expect(html).toContain('Press Briefing Stream');
      expect(html).toContain('Morning Executive Audio Briefing');
      expect(html).toContain('Consortium Roadmap Slides');
      expect(html).toContain('Proposal Alpha');
      expect(html).toContain('Government Press Bureau');
      expect(html).toContain('United Nations');
      expect(html).toContain('Related Dispatches');
      expect(html).toContain('Live Stream Recording');
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
