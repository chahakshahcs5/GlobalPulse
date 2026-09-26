import { describe, it, expect } from 'vitest';
import {
  D3ChartRenderer,
  MapRenderer,
  TimelineRenderer,
  DiagramRenderer,
  VisualDiffRenderer,
} from '@ai-news/media';
import type { ChartBlock, MapBlock, TimelineBlock, WhatChangedBlock } from '@ai-news/schemas';

describe('Phase 3: Multimedia & Visual Story Engines', () => {
  describe('D3 Programmatic Chart Engine', () => {
    it('renders a multi-series line chart SVG with axes and source attribution', () => {
      const chartData: ChartBlock['data'] = {
        chartType: 'line',
        title: 'Global Chip Revenue Growth',
        subtitle: 'Billion USD by Region',
        xAxis: { key: 'year', label: 'Year', type: 'category' },
        yAxis: { label: 'Billion USD', format: '$' },
        series: [
          { name: 'North America', key: 'na', color: '#3b82f6' },
          { name: 'Asia Pacific', key: 'apac', color: '#10b981' },
        ],
        values: [
          { year: '2024', na: 120, apac: 190 },
          { year: '2025', na: 145, apac: 240 },
          { year: '2026', na: 180, apac: 310 },
        ],
        sourceAttribution: 'Semiconductor Industry Association',
      };

      const svg = D3ChartRenderer.renderToSvg(chartData, { width: 800, height: 450 });
      expect(svg).toContain('<svg');
      expect(svg).toContain('Global Chip Revenue Growth');
      expect(svg).toContain('polyline');
      expect(svg).toContain('North America');
      expect(svg).toContain('Asia Pacific');
      expect(svg).toContain('Source: Semiconductor Industry Association');
    });

    it('renders an area chart with shaded translucent gradients', () => {
      const chartData: ChartBlock['data'] = {
        chartType: 'area',
        title: 'Renewable Generation',
        xAxis: { key: 'month', label: 'Month' },
        yAxis: { label: 'GWh' },
        series: [{ name: 'Solar', key: 'solar', color: '#f59e0b' }],
        values: [
          { month: 'Q1', solar: 45 },
          { month: 'Q2', solar: 80 },
          { month: 'Q3', solar: 110 },
        ],
      };

      const svg = D3ChartRenderer.renderToSvg(chartData);
      expect(svg).toContain('polygon');
      expect(svg).toContain('fill-opacity="0.18"');
    });

    it('renders grouped and stacked bar charts', () => {
      const barData: ChartBlock['data'] = {
        chartType: 'bar',
        title: 'EV Production Deliveries',
        xAxis: { key: 'quarter', label: 'Quarter' },
        yAxis: { label: 'Units (Thousands)' },
        series: [{ name: 'Model A', key: 'a' }, { name: 'Model B', key: 'b' }],
        values: [
          { quarter: 'Q1', a: 50, b: 70 },
          { quarter: 'Q2', a: 65, b: 90 },
        ],
      };

      const svg = D3ChartRenderer.renderToSvg(barData);
      expect(svg).toContain('<rect');
      expect(svg).toContain('data-val="50"');
      expect(svg).toContain('data-val="90"');
    });

    it('renders radial donut charts with percentage breakdowns and total center stat', () => {
      const donutData: ChartBlock['data'] = {
        chartType: 'donut',
        title: 'Energy Grid Fuel Mix',
        xAxis: { key: 'fuel', label: 'Fuel Source' },
        yAxis: { label: 'Percentage' },
        series: [{ name: 'Share', key: 'share' }],
        values: [
          { fuel: 'Nuclear', share: 40 },
          { fuel: 'Wind & Solar', share: 35 },
          { fuel: 'Hydro', share: 25 },
        ],
      };

      const svg = D3ChartRenderer.renderToSvg(donutData);
      expect(svg).toContain('Energy Grid Fuel Mix');
      expect(svg).toContain('<path d="M');
      expect(svg).toContain('Total Volume');
      expect(svg).toContain('Nuclear (40%)');
    });

    it('renders high-impact KPI statistic cards with delta trends', () => {
      const kpiData: ChartBlock['data'] = {
        chartType: 'kpi',
        title: 'Quarterly Net Free Cash Flow',
        xAxis: { key: 'quarter', label: 'Quarter' },
        yAxis: { label: 'Million USD' },
        series: [{ name: 'FCF', key: 'fcf' }],
        values: [
          { quarter: 'Q1', fcf: 350 },
          { quarter: 'Q2', fcf: 480 },
        ],
      };

      const svg = D3ChartRenderer.renderToSvg(kpiData);
      expect(svg).toContain('Quarterly Net Free Cash Flow');
      expect(svg).toContain('480');
      expect(svg).toContain('+37.1%');
      expect(svg).toContain('vs prior period');
    });
  });

  describe('MapLibre Geo Engine', () => {
    const mapData: MapBlock['data'] = {
      title: 'Diplomatic Summit Venues',
      center: [77.209, 28.6139],
      zoom: 5,
      style: 'dark',
      markers: [
        { coordinates: [77.209, 28.6139], title: 'Main Plenary Hall' },
        { coordinates: [72.8777, 19.076], title: 'Financial Forum' },
      ],
    };

    it('builds valid MapLibre GL configuration options', () => {
      const config = MapRenderer.buildMapLibreOptions(mapData, 'map-div');
      expect(config.container).toBe('map-div');
      expect(config.center).toEqual([77.209, 28.6139]);
      expect(config.zoom).toBe(5);
      expect(config.markers?.length).toBe(2);
      expect(config.style).toContain('dark-matter');
    });

    it('renders vector SVG map fallback with projected markers', () => {
      const svg = MapRenderer.renderSvgFallback(mapData);
      expect(svg).toContain('<svg');
      expect(svg).toContain('Main Plenary Hall');
      expect(svg).toContain('Financial Forum');
      expect(svg).toContain('Coordinates: 28.61°N, 77.21°E');
    });
  });

  describe('Interactive Timeline Engine', () => {
    const timelineData: TimelineBlock['data'] = {
      title: 'Summit Timeline',
      items: [
        { date: 'Day 1', headline: 'Opening Address', body: 'Heads of state arrive.' },
        { date: 'Day 2', headline: 'Ministerial Roundtables', body: 'Trade accords finalized.' },
        { date: 'Day 3', headline: 'Declaration Adopted', body: 'Joint communiqué issued.' },
      ],
    };

    it('transforms raw items into structured milestone steps', () => {
      const items = TimelineRenderer.transformItems(timelineData);
      expect(items.length).toBe(3);
      expect(items[0].stepNumber).toBe(1);
      expect(items[0].headline).toBe('Opening Address');
    });

    it('renders horizontal SVG track with nodes and date badges', () => {
      const svg = TimelineRenderer.renderSvgTrack(timelineData, 'horizontal');
      expect(svg).toContain('Summit Timeline');
      expect(svg).toContain('Day 1');
      expect(svg).toContain('Day 2');
      expect(svg).toContain('Declaration Adopted');
      expect(svg).toContain('stroke-width="4"');
    });
  });

  describe('Diagram Engine', () => {
    it('validates Mermaid grammar prefixes', () => {
      expect(DiagramRenderer.validateMermaidDefinition('graph TD\nA-->B')).toBe(true);
      expect(DiagramRenderer.validateMermaidDefinition('sequenceDiagram\nAlice->>Bob: Hello')).toBe(true);
      expect(DiagramRenderer.validateMermaidDefinition('invalid gibberish text')).toBe(false);
    });

    it('renders declarative SVG diagram preview', () => {
      const svg = DiagramRenderer.renderDeclarativeSvg({
        title: 'Consortium Architecture',
        format: 'mermaid',
        definition: 'graph TD\nCentralBank-->Node1\nCentralBank-->Node2',
        caption: 'Inter-bank settlement topology',
      });
      expect(svg).toContain('Consortium Architecture');
      expect(svg).toContain('MERMAID');
      expect(svg).toContain('CentralBank--&gt;Node1');
      expect(svg).toContain('Inter-bank settlement topology');
    });
  });

  describe('Visual Diff Engine', () => {
    it('generates structured revision markup for WhatChangedBlock', () => {
      const whatChangedData: WhatChangedBlock['data'] = {
        previousVersionNumber: 2,
        updatedAt: '2026-09-26T21:00:00Z',
        items: [
          { changeType: 'added', description: 'Added official joint statement excerpts.', affectedSection: 'quote' },
          { changeType: 'updated', description: 'Updated bilateral trade chart with final 2026 numbers.', affectedSection: 'chart' },
          { changeType: 'corrected', description: 'Corrected ministerial delegation count from 18 to 22.' },
          { changeType: 'retracted', description: 'Removed unverified early report.' },
        ],
      };

      const html = VisualDiffRenderer.renderHtml(whatChangedData);
      expect(html).toContain('What Changed in this Revision');
      expect(html).toContain('Updates vs Version 2');
      expect(html).toContain('ADDED');
      expect(html).toContain('UPDATED');
      expect(html).toContain('CORRECTION');
      expect(html).toContain('RETRACTED');
      expect(html).toContain('(chart)');
    });
  });
});
