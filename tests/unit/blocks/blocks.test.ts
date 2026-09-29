import { describe, it, expect } from 'vitest';
import { validateBlock, validateBlocks, sanitizeText, extractTextContent } from '@ai-news/content';
import { ValidationError } from '@ai-news/shared';

describe('Block Model & Validation (Unit Tests)', () => {
  it('validates a heading block', () => {
    const raw = {
      id: 'blk_1',
      blockType: 'heading',
      sortOrder: 0,
      data: { level: 1, text: 'BRICS 2026 Summit Concludes' },
    };
    const block = validateBlock(raw);
    expect(block.blockType).toBe('heading');
    if (block.blockType === 'heading') {
      expect(block.data.text).toBe('BRICS 2026 Summit Concludes');
    }
  });

  it('validates a chart block with D3 numeric series data', () => {
    const raw = {
      id: 'blk_chart_1',
      blockType: 'chart',
      sortOrder: 1,
      data: {
        chartType: 'bar',
        title: 'Bilateral Trade Growth (2020-2026)',
        xAxis: { key: 'year', label: 'Year', type: 'category' },
        yAxis: { label: 'Billion USD', format: '$' },
        series: [{ name: 'Trade Volume', key: 'volume', color: '#3b82f6' }],
        values: [
          { year: '2024', volume: 140 },
          { year: '2025', volume: 185 },
          { year: '2026', volume: 240 },
        ],
        sourceAttribution: 'IMF / Trade Secretariat',
      },
    };
    const block = validateBlock(raw);
    expect(block.blockType).toBe('chart');
    if (block.blockType === 'chart') {
      expect(block.data.values.length).toBe(3);
      expect(block.data.chartType).toBe('bar');
    }
  });

  it('validates an interactive MapLibre map block', () => {
    const raw = {
      id: 'blk_map_1',
      blockType: 'map',
      sortOrder: 2,
      data: {
        title: 'BRICS Member State Geography',
        center: [77.209, 28.6139], // New Delhi [lng, lat]
        zoom: 3,
        style: 'dark',
        markers: [{ coordinates: [77.209, 28.6139], title: 'Summit Host Venue' }],
      },
    };
    const block = validateBlock(raw);
    expect(block.blockType).toBe('map');
  });

  it('validates timeline and what-changed blocks', () => {
    const timelineRaw = {
      id: 'blk_tl_1',
      blockType: 'timeline',
      sortOrder: 3,
      data: {
        title: 'Key Milestones',
        items: [
          { date: '2026-09-24', headline: 'Opening Session', body: 'Delegates arrive.' },
          { date: '2026-09-26', headline: 'Joint Declaration', body: 'Accords ratified.' },
        ],
      },
    };
    const timeline = validateBlock(timelineRaw);
    expect(timeline.blockType).toBe('timeline');

    const whatChangedRaw = {
      id: 'blk_wc_1',
      blockType: 'what_changed',
      sortOrder: 0,
      data: {
        previousVersionNumber: 1,
        updatedAt: '2026-09-26T20:00:00Z',
        items: [
          { changeType: 'added', description: 'Added official joint statement excerpts.' },
          { changeType: 'updated', description: 'Updated final delegate count from 18 to 22.' },
        ],
      },
    };
    const whatChanged = validateBlock(whatChangedRaw);
    expect(whatChanged.blockType).toBe('what_changed');
  });

  it('rejects invalid or malformed block structures', () => {
    const invalidBlock = {
      id: 'bad_block',
      blockType: 'heading',
      sortOrder: 0,
      data: { level: 99, text: '' }, // invalid level and empty text
    };
    expect(() => validateBlock(invalidBlock)).toThrow(ValidationError);
  });

  it('sanitizes malicious script tags from text inputs', () => {
    const malicious = '<script>alert("hacked")</script>This is safe reporting.';
    const cleaned = sanitizeText(malicious);
    expect(cleaned).toBe('This is safe reporting.');
  });

  it('extracts text fragments for search indexing', () => {
    const blocks = validateBlocks([
      {
        id: 'h1',
        blockType: 'heading',
        sortOrder: 0,
        data: { level: 1, text: 'Breaking Story' },
      },
      {
        id: 'p1',
        blockType: 'paragraph',
        sortOrder: 1,
        data: { text: 'Detailed article content here.' },
      },
    ]);
    const extracted = extractTextContent(blocks);
    expect(extracted).toContain('Breaking Story');
    expect(extracted).toContain('Detailed article content here.');
  });

  it('validates an image_diff before/after block', () => {
    const raw = {
      id: 'blk_diff_1',
      blockType: 'image_diff',
      sortOrder: 4,
      data: {
        beforeUrl: 'https://images.unsplash.com/photo-1?auto=format',
        afterUrl: 'https://images.unsplash.com/photo-2?auto=format',
        beforeLabel: 'Pre-Disaster',
        afterLabel: 'Post-Restoration',
        caption: 'Satellite analysis reveals coastal regeneration.',
        orientation: 'horizontal',
        defaultSplitPercent: 45,
      },
    };
    const block = validateBlock(raw);
    expect(block.blockType).toBe('image_diff');
    if (block.blockType === 'image_diff') {
      expect(block.data.beforeLabel).toBe('Pre-Disaster');
      expect(block.data.defaultSplitPercent).toBe(45);
    }
  });

  it('validates a live_ticker metric block with sparklines', () => {
    const raw = {
      id: 'blk_tick_1',
      blockType: 'live_ticker',
      sortOrder: 5,
      data: {
        title: 'Global Energy Pulse',
        refreshIntervalSeconds: 15,
        items: [
          {
            symbol: 'BRENT',
            label: 'Brent Crude Oil',
            value: 82.4,
            delta: 1.85,
            unit: '$',
            sparkline: [80, 81.2, 80.8, 82.4],
          },
        ],
      },
    };
    const block = validateBlock(raw);
    expect(block.blockType).toBe('live_ticker');
    if (block.blockType === 'live_ticker') {
      expect(block.data.items[0].symbol).toBe('BRENT');
      expect(block.data.items[0].sparkline).toEqual([80, 81.2, 80.8, 82.4]);
    }
  });

  it('validates a reader poll block with choices and vote counts', () => {
    const raw = {
      id: 'blk_pol_1',
      blockType: 'poll',
      sortOrder: 6,
      data: {
        pollId: 'pol_summit_1',
        question: 'Should the treaty be ratified by year-end?',
        options: [
          { id: 'opt_1', text: 'Yes, unanimously', voteCount: 140 },
          { id: 'opt_2', text: 'No, needs amendment', voteCount: 45 },
        ],
        totalVotes: 185,
        closed: false,
      },
    };
    const block = validateBlock(raw);
    expect(block.blockType).toBe('poll');
    if (block.blockType === 'poll') {
      expect(block.data.totalVotes).toBe(185);
      expect(block.data.options.length).toBe(2);
    }
  });

  it('validates an audio block with synchronized read-along cue points', () => {
    const raw = {
      id: 'blk_aud_1',
      blockType: 'audio',
      sortOrder: 7,
      data: {
        url: 'https://example.com/briefing.mp3',
        title: 'Morning Briefing',
        durationSeconds: 180,
        transcript: 'Welcome to GlobalPulse. Today the summit reached consensus.',
        cuePoints: [
          { timeMs: 0, text: 'Welcome to GlobalPulse.' },
          { timeMs: 3200, text: 'Today the summit reached consensus.' },
        ],
      },
    };
    const block = validateBlock(raw);
    expect(block.blockType).toBe('audio');
    if (block.blockType === 'audio') {
      expect(block.data.cuePoints?.length).toBe(2);
      expect(block.data.cuePoints?.[1].timeMs).toBe(3200);
    }
  });
});
