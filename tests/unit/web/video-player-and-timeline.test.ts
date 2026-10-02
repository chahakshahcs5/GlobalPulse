import { describe, it, expect } from 'vitest';
import {
  VideoBlockSchema,
  TimelineBlockSchema,
  DiagramBlockSchema,
  type TimelineBlock,
  type DiagramBlock,
} from '@ai-news/schemas';
import { TimelineRenderer, DiagramRenderer } from '@ai-news/media';

describe('Video Player & Timeline Renderer Unit Tests', () => {
  describe('Video Block Schema & URL Resolution', () => {
    it('validates a properly structured VideoBlock with telemetry transcription and poster', () => {
      const rawBlock = {
        id: 'blk_starship_video_test',
        blockType: 'video',
        sortOrder: 2,
        data: {
          url: '/videos/starship-downlink.mp4',
          posterUrl:
            'https://images.unsplash.com/photo-1517976487502-5f79b47e2c90?auto=format&fit=crop&w=1600&q=80',
          aspectRatio: '16:9',
          caption:
            'Live downlink footage: Super Heavy booster separation and catch maneuver telemetry.',
          durationSeconds: 195,
          transcription:
            'Flight Director: All 33 Raptor engines nominal during stage separation. Booster hot staging verified at T+2 minutes 42 seconds.',
        },
      };

      const parsed = VideoBlockSchema.safeParse(rawBlock);
      expect(parsed.success).toBe(true);
      if (parsed.success) {
        expect(parsed.data.blockType).toBe('video');
        expect(parsed.data.data.url).toBe('/videos/starship-downlink.mp4');
        expect(parsed.data.data.aspectRatio).toBe('16:9');
        expect(parsed.data.data.durationSeconds).toBe(195);
        expect(parsed.data.data.transcription).toContain('All 33 Raptor engines nominal');
      }
    });

    it('correctly resolves 403 Google Storage and broken placeholder video URLs to local assets', () => {
      function resolveVideoUrl(rawUrl?: string): string {
        if (!rawUrl) return '/videos/starship-downlink.mp4';
        const lower = rawUrl.toLowerCase();
        if (
          lower.includes('gtv-videos-bucket') ||
          lower.includes('commondatastorage.googleapis.com') ||
          lower.includes('example.com') ||
          lower.includes('placeholder')
        ) {
          return '/videos/starship-downlink.mp4';
        }
        return rawUrl;
      }

      // Legacy BigBuckBunny Google storage URL that returns 403
      expect(
        resolveVideoUrl(
          'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'
        )
      ).toBe('/videos/starship-downlink.mp4');

      // Example placeholder URL
      expect(resolveVideoUrl('https://example.com/video.mp4')).toBe(
        '/videos/starship-downlink.mp4'
      );

      // Undefined or empty URL
      expect(resolveVideoUrl(undefined)).toBe('/videos/starship-downlink.mp4');
      expect(resolveVideoUrl('')).toBe('/videos/starship-downlink.mp4');

      // Direct local route preserved
      expect(resolveVideoUrl('/videos/sample-video.mp4')).toBe('/videos/sample-video.mp4');

      // Legitimate third-party URL preserved
      expect(resolveVideoUrl('https://media.w3.org/2010/05/sintel/trailer.mp4')).toBe(
        'https://media.w3.org/2010/05/sintel/trailer.mp4'
      );
    });

    it('formats duration badge and aspect ratio classes correctly', () => {
      const getAspectClass = (aspect?: string) => {
        if (aspect === '9:16') return 'aspect-[9/16] max-w-sm mx-auto';
        if (aspect === '1:1') return 'aspect-square max-w-lg mx-auto';
        return 'aspect-video w-full';
      };

      const formatDuration = (seconds?: number) => {
        if (!seconds || seconds < 0) return '0:00';
        const m = Math.floor(seconds / 60);
        const s = (seconds % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
      };

      expect(getAspectClass('16:9')).toBe('aspect-video w-full');
      expect(getAspectClass('9:16')).toBe('aspect-[9/16] max-w-sm mx-auto');
      expect(getAspectClass('1:1')).toBe('aspect-square max-w-lg mx-auto');
      expect(getAspectClass(undefined)).toBe('aspect-video w-full');

      expect(formatDuration(195)).toBe('3:15');
      expect(formatDuration(60)).toBe('1:00');
      expect(formatDuration(9)).toBe('0:09');
      expect(formatDuration(0)).toBe('0:00');
      expect(formatDuration(undefined)).toBe('0:00');
    });
  });

  describe('Timeline Renderer & Dynamic Height Calculations', () => {
    const summitTimeline: TimelineBlock['data'] = {
      title: 'Summit Progression & Ratification Milestones',
      items: [
        {
          date: '07:30 UTC',
          headline: 'Ministerial Legal Drafting Finalized',
          body: 'Diplomatic envoys reconciled treaty text across all delegate parties.',
        },
        {
          date: '08:45 UTC',
          headline: 'Central Bank Governors Endorse Framework',
          body: 'The heads of member central banks ratified the liquidity backstop facility.',
        },
        {
          date: '10:00 UTC',
          headline: 'Heads of State Ratify New Accord',
          body: 'Unanimous signing ceremony concluded with immediate ratification timeline.',
        },
      ],
    };

    it('validates a TimelineBlock schema correctly', () => {
      const block = {
        id: 'blk_timeline_summit',
        blockType: 'timeline',
        sortOrder: 1,
        data: summitTimeline,
      };

      const parsed = TimelineBlockSchema.safeParse(block);
      expect(parsed.success).toBe(true);
      if (parsed.success) {
        expect(parsed.data.data.items).toHaveLength(3);
        expect(parsed.data.data.items[0].date).toBe('07:30 UTC');
        expect(parsed.data.data.items[1].headline).toContain('Central Bank Governors');
      }
    });

    it('renders horizontal SVG track without dead whitespace gap using dynamic card height', () => {
      const svg = TimelineRenderer.renderSvgTrack(summitTimeline, 'horizontal');

      expect(svg).toContain('<svg');
      expect(svg).toContain('Summit Progression &amp; Ratification Milestones');
      expect(svg).toContain('07:30 UTC');
      expect(svg).toContain('08:45 UTC');
      expect(svg).toContain('10:00 UTC');

      // Verify dynamic viewBox height eliminates empty void (effectiveHeight <= 220)
      const viewBoxMatch = svg.match(/viewBox="0 0 (\d+) (\d+)"/);
      expect(viewBoxMatch).not.toBeNull();
      if (viewBoxMatch) {
        const height = parseInt(viewBoxMatch[2], 10);
        expect(height).toBeGreaterThan(150);
        expect(height).toBeLessThanOrEqual(230);
      }

      // Check card rounded rects and base track line
      expect(svg).toContain('stroke-width="4"');
      expect(svg).toContain('rx="10"');
    });

    it('renders vertical chronology spine with node index badges and connecting track line', () => {
      const svg = TimelineRenderer.renderSvgTrack(summitTimeline, 'vertical');

      expect(svg).toContain('<svg');
      expect(svg).toContain('Ministerial Legal Drafting Finalized');
      expect(svg).toContain('Central Bank Governors Endorse Framework');
      expect(svg).toContain('Heads of State Ratify New Accord');

      // Check vertical node numbering (1, 2, 3)
      expect(svg).toContain('>1<');
      expect(svg).toContain('>2<');
      expect(svg).toContain('>3<');
    });
  });

  describe('Diagram Block Schema & Architecture Visuals', () => {
    const qkdDiagram: DiagramBlock['data'] = {
      title: 'Satellite-to-Ground Entangled QKD Architecture',
      format: 'mermaid',
      definition:
        'graph LR\n  SAT[LEO QKD Satellite] -->|Downlink Beam 1| GS1[Frankfurt Ground Station]\n  SAT -->|Downlink Beam 2| GS2[London Ground Station]\n  GS1 -->|Encrypted Session Key| BB1[Bundesbank Node]\n  GS2 -->|Encrypted Session Key| BB2[Bank of England Node]\n  BB1 <-->|Post-Quantum Interbank Corridor| BB2',
      caption:
        'Synchronized photon-entanglement distribution downlinks establishing cryptographic one-time pad verification between Frankfurt and London clearing nodes.',
    };

    it('validates a DiagramBlock with Mermaid definition and architecture topology', () => {
      const block = {
        id: 'blk_qkd_diagram',
        blockType: 'diagram',
        sortOrder: 3,
        data: qkdDiagram,
      };

      const parsed = DiagramBlockSchema.safeParse(block);
      expect(parsed.success).toBe(true);
      if (parsed.success) {
        expect(parsed.data.data.format).toBe('mermaid');
        expect(parsed.data.data.title).toContain('Satellite-to-Ground Entangled QKD Architecture');
        expect(parsed.data.data.definition).toContain('graph LR');
        expect(parsed.data.data.definition).toContain('LEO QKD Satellite');
      }
    });

    it('correctly validates valid and invalid Mermaid diagram definitions', () => {
      expect(DiagramRenderer.validateMermaidDefinition(qkdDiagram.definition)).toBe(true);
      expect(DiagramRenderer.validateMermaidDefinition('flowchart TD\nA-->B')).toBe(true);
      expect(DiagramRenderer.validateMermaidDefinition('sequenceDiagram\nA->>B: ping')).toBe(true);
      expect(DiagramRenderer.validateMermaidDefinition('not-a-diagram random text')).toBe(false);
    });
  });
});
