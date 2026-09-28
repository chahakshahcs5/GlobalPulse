import { describe, it, expect } from 'vitest';
import {
  D3ChartRenderer,
  MapRenderer,
  TimelineRenderer,
  DiagramRenderer,
  VisualDiffRenderer,
} from '@ai-news/media';
import type { ChartBlock, MapBlock, TimelineBlock, WhatChangedBlock } from '@ai-news/schemas';

describe('Multimedia & Visual Story Engines (Unit Tests)', () => {
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
        series: [
          { name: 'Model A', key: 'a' },
          { name: 'Model B', key: 'b' },
        ],
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

    it('renders a 2D heatmap matrix with color scale gradient legend', () => {
      const heatmapData: ChartBlock['data'] = {
        chartType: 'heatmap',
        title: 'Geopolitical Risk Index by Quarter',
        xAxis: { key: 'quarter', label: 'Quarter' },
        yAxis: { label: 'Risk Factor' },
        series: [
          { name: 'Supply Chain', key: 'supply' },
          { name: 'Cyber Warfare', key: 'cyber' },
          { name: 'Sanctions', key: 'sanctions' },
        ],
        values: [
          { quarter: 'Q1', supply: 25, cyber: 60, sanctions: 40 },
          { quarter: 'Q2', supply: 50, cyber: 85, sanctions: 70 },
          { quarter: 'Q3', supply: 80, cyber: 95, sanctions: 65 },
        ],
        sourceAttribution: 'Global Risk Monitor',
      };

      const svg = D3ChartRenderer.renderToSvg(heatmapData);
      expect(svg).toContain('Geopolitical Risk Index by Quarter');
      expect(svg).toContain('Supply Chain');
      expect(svg).toContain('Cyber Warfare');
      expect(svg).toContain('linearGradient id="heatmapGrad"');
      expect(svg).toContain('Source: Global Risk Monitor');
    });

    it('renders a distribution histogram with frequency bins', () => {
      const histData: ChartBlock['data'] = {
        chartType: 'histogram',
        title: 'Voter Age Distribution',
        xAxis: { key: 'bin', label: 'Age Group' },
        yAxis: { label: 'Voters (Thousands)' },
        series: [{ name: 'Count', key: 'count', color: '#8b5cf6' }],
        values: [
          { bin: '18-29', count: 420 },
          { bin: '30-44', count: 680 },
          { bin: '45-64', count: 910 },
          { bin: '65+', count: 750 },
        ],
      };

      const svg = D3ChartRenderer.renderToSvg(histData);
      expect(svg).toContain('Voter Age Distribution');
      expect(svg).toContain('18-29');
      expect(svg).toContain('910');
      expect(svg).toContain('#8b5cf6');
    });

    it('renders a sequential waterfall bridge with positive, negative, and cumulative bars', () => {
      const waterfallData: ChartBlock['data'] = {
        chartType: 'waterfall',
        title: 'Fiscal Deficit Bridge 2026',
        xAxis: { key: 'category', label: 'Item' },
        yAxis: { label: 'Billion USD' },
        series: [{ name: 'Amount', key: 'val' }],
        values: [
          { category: 'Base Revenue', val: 500, isTotal: true },
          { category: 'Tax Reform', val: 120 },
          { category: 'Defense Surge', val: -80 },
          { category: 'Subsidies', val: -40 },
          { category: 'Net Surplus', val: 500, isTotal: true },
        ],
      };

      const svg = D3ChartRenderer.renderToSvg(waterfallData);
      expect(svg).toContain('Fiscal Deficit Bridge 2026');
      expect(svg).toContain('Base Revenue');
      expect(svg).toContain('+120');
      expect(svg).toContain('-80');
      expect(svg).toContain('#10b981');
      expect(svg).toContain('#ef4444');
    });

    it('renders a diverging comparison chart between two subjects across metrics', () => {
      const compData: ChartBlock['data'] = {
        chartType: 'comparison',
        title: 'Defense Capability Comparison',
        xAxis: { key: 'metric', label: 'Metric' },
        yAxis: { label: 'Count' },
        series: [
          { name: 'Allied Forces', key: 'allies', color: '#3b82f6' },
          { name: 'Opposing Coalition', key: 'opposing', color: '#ec4899' },
        ],
        values: [
          { metric: 'Active Aircraft', allies: 1200, opposing: 950 },
          { metric: 'Naval Carriers', allies: 11, opposing: 4 },
          { metric: 'Cyber Battalions', allies: 85, opposing: 90 },
        ],
        sourceAttribution: 'Strategic Studies Institute',
      };

      const svg = D3ChartRenderer.renderToSvg(compData);
      expect(svg).toContain('Defense Capability Comparison');
      expect(svg).toContain('Allied Forces');
      expect(svg).toContain('Opposing Coalition');
      expect(svg).toContain('Active Aircraft');
      expect(svg).toContain('1,200');
    });

    it('renders a slope chart showing bilateral shifts between two periods', () => {
      const slopeData: ChartBlock['data'] = {
        chartType: 'slope',
        title: 'Semiconductor Self-Sufficiency Index',
        xAxis: { key: 'country', label: 'Country' },
        yAxis: { label: 'Percentage' },
        series: [
          { name: '2024', key: 'start' },
          { name: '2026', key: 'end' },
        ],
        values: [
          { country: 'United States', start: 30, end: 45 },
          { country: 'European Union', start: 20, end: 28 },
          { country: 'Japan', start: 25, end: 22 },
        ],
      };

      const svg = D3ChartRenderer.renderToSvg(slopeData);
      expect(svg).toContain('Semiconductor Self-Sufficiency Index');
      expect(svg).toContain('United States');
      expect(svg).toContain('2024');
      expect(svg).toContain('2026');
      expect(svg).toContain('(+15)');
      expect(svg).toContain('(-3)');
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

    it('renders vector SVG map fallback with projected markers and layer badges', () => {
      const mapWithLayers: MapBlock['data'] = {
        ...mapData,
        layers: [
          { id: 'evac-zone', type: 'fill', geojson: {} },
          { id: 'corridor', type: 'line', geojson: {} },
        ],
      };
      const svg = MapRenderer.renderSvgFallback(mapWithLayers);
      expect(svg).toContain('<svg');
      expect(svg).toContain('Main Plenary Hall');
      expect(svg).toContain('Financial Forum');
      expect(svg).toContain('Coordinates: 28.61°N, 77.21°E');
      expect(svg).toContain('Zoom: 5x');
      expect(svg).toContain('evac-zone (fill)');
      expect(svg).toContain('corridor (line)');
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

    it('renders vertical SVG track with numbered node spine and headlines', () => {
      const svg = TimelineRenderer.renderSvgTrack(timelineData, 'vertical');
      expect(svg).toContain('Summit Timeline');
      expect(svg).toContain('Day 1');
      expect(svg).toContain('Opening Address');
      expect(svg).toContain('1');
      expect(svg).toContain('2');
      expect(svg).toContain('3');
    });
  });

  describe('Diagram Engine', () => {
    it('validates Mermaid grammar prefixes', () => {
      expect(DiagramRenderer.validateMermaidDefinition('graph TD\nA-->B')).toBe(true);
      expect(DiagramRenderer.validateMermaidDefinition('sequenceDiagram\nAlice->>Bob: Hello')).toBe(
        true
      );
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
          {
            changeType: 'added',
            description: 'Added official joint statement excerpts.',
            affectedSection: 'quote',
          },
          {
            changeType: 'updated',
            description: 'Updated bilateral trade chart with final 2026 numbers.',
            affectedSection: 'chart',
          },
          {
            changeType: 'corrected',
            description: 'Corrected ministerial delegation count from 18 to 22.',
          },
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
