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
        markers: [
          { coordinates: [77.209, 28.6139], title: 'Summit Host Venue' },
        ],
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
});
