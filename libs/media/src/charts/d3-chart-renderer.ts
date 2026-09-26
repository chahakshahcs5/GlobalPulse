import type { ChartBlock } from '@ai-news/schemas';

export interface RenderChartOptions {
  width?: number;
  height?: number;
  theme?: 'dark' | 'light';
}

const DEFAULT_PALETTE = ['#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4'];

export class D3ChartRenderer {
  /**
   * Programmatically renders a structured ChartBlock data specification into an accessible, responsive SVG string.
   */
  static renderToSvg(chartData: ChartBlock['data'], options: RenderChartOptions = {}): string {
    const width = options.width || 800;
    const height = options.height || 450;
    const isDark = options.theme !== 'light';

    const bgColor = isDark ? '#0f172a' : '#ffffff';
    const textColor = isDark ? '#f8fafc' : '#0f172a';
    const subtextColor = isDark ? '#94a3b8' : '#64748b';
    const gridColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';

    const padding = { top: 70, right: 40, bottom: 60, left: 70 };
    const chartW = width - padding.left - padding.right;
    const chartH = height - padding.top - padding.bottom;

    if (chartData.chartType === 'donut') {
      return this.renderDonut(chartData, width, height, isDark);
    }

    if (chartData.chartType === 'kpi') {
      return this.renderKpi(chartData, width, height, isDark);
    }

    // Extract values
    const xKey = chartData.xAxis.key;
    const xCategories = chartData.values.map((v) => String(v[xKey] ?? ''));
    const series = chartData.series.map((s, idx) => ({
      ...s,
      color: s.color || DEFAULT_PALETTE[idx % DEFAULT_PALETTE.length],
    }));

    // Find numeric Y bounds
    let minY = chartData.yAxis.min ?? 0;
    let maxY = chartData.yAxis.max ?? -Infinity;
    for (const row of chartData.values) {
      for (const s of series) {
        const val = Number(row[s.key] ?? 0);
        if (val > maxY) maxY = val;
        if (val < minY) minY = val;
      }
    }
    if (maxY <= minY) maxY = minY + 10;
    // Add 10% headroom
    maxY = maxY * 1.1;

    // Helper scales
    const scaleX = (index: number) => padding.left + (index + 0.5) * (chartW / xCategories.length);
    const scaleXBand = (index: number) => padding.left + index * (chartW / xCategories.length);
    const bandWidth = chartW / xCategories.length;
    const scaleY = (val: number) => padding.top + chartH - ((val - minY) / (maxY - minY)) * chartH;

    let svgElements = '';

    // Title & Subtitle Header
    svgElements += `<text x="${padding.left}" y="32" font-size="20" font-weight="700" fill="${textColor}" font-family="system-ui, -apple-system, sans-serif">${escapeXml(chartData.title)}</text>`;
    if (chartData.subtitle) {
      svgElements += `<text x="${padding.left}" y="52" font-size="13" fill="${subtextColor}" font-family="system-ui, -apple-system, sans-serif">${escapeXml(chartData.subtitle)}</text>`;
    }

    // Y Grid lines & Labels (5 ticks)
    const ticks = 5;
    for (let i = 0; i <= ticks; i++) {
      const tickVal = minY + (i / ticks) * (maxY - minY);
      const y = scaleY(tickVal);
      svgElements += `<line x1="${padding.left}" y1="${y}" x2="${width - padding.right}" y2="${y}" stroke="${gridColor}" stroke-dasharray="3,3" />`;
      const formattedVal = chartData.yAxis.format
        ? `${chartData.yAxis.format}${tickVal.toFixed(0)}`
        : tickVal.toFixed(0);
      svgElements += `<text x="${padding.left - 12}" y="${y + 4}" text-anchor="end" font-size="11" fill="${subtextColor}" font-family="system-ui, -apple-system, sans-serif">${formattedVal}</text>`;
    }

    // X Axis ticks & Labels
    xCategories.forEach((cat, idx) => {
      const x = scaleX(idx);
      svgElements += `<text x="${x}" y="${padding.top + chartH + 24}" text-anchor="middle" font-size="12" fill="${subtextColor}" font-family="system-ui, -apple-system, sans-serif">${escapeXml(cat)}</text>`;
    });

    // Render chart type specific data elements
    if (chartData.chartType === 'line' || chartData.chartType === 'area') {
      series.forEach((s) => {
        const points = chartData.values.map((v, idx) => {
          const val = Number(v[s.key] ?? 0);
          return `${scaleX(idx)},${scaleY(val)}`;
        });

        if (chartData.chartType === 'area') {
          const firstPoint = `${scaleX(0)},${scaleY(minY)}`;
          const lastPoint = `${scaleX(chartData.values.length - 1)},${scaleY(minY)}`;
          const areaPoints = `${firstPoint} ${points.join(' ')} ${lastPoint}`;
          svgElements += `<polygon points="${areaPoints}" fill="${s.color}" fill-opacity="0.18" />`;
        }

        // Line path
        svgElements += `<polyline points="${points.join(' ')}" fill="none" stroke="${s.color}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />`;

        // Data dots
        chartData.values.forEach((v, idx) => {
          const val = Number(v[s.key] ?? 0);
          const cx = scaleX(idx);
          const cy = scaleY(val);
          svgElements += `<circle cx="${cx}" cy="${cy}" r="5" fill="${bgColor}" stroke="${s.color}" stroke-width="2.5" data-val="${val}" />`;
        });
      });
    } else if (chartData.chartType === 'bar' || chartData.chartType === 'grouped_bar') {
      const barGroupPadding = 0.2;
      const barWidth = (bandWidth * (1 - barGroupPadding)) / series.length;

      chartData.values.forEach((v, rowIdx) => {
        const groupX = scaleXBand(rowIdx) + (bandWidth * barGroupPadding) / 2;
        series.forEach((s, sIdx) => {
          const val = Number(v[s.key] ?? 0);
          const bx = groupX + sIdx * barWidth;
          const by = scaleY(val);
          const bh = scaleY(minY) - by;
          svgElements += `<rect x="${bx}" y="${by}" width="${barWidth - 2}" height="${Math.max(2, bh)}" rx="3" fill="${s.color}" data-val="${val}" />`;
        });
      });
    } else if (chartData.chartType === 'stacked_bar') {
      const barW = bandWidth * 0.6;
      chartData.values.forEach((v, rowIdx) => {
        const bx = scaleX(rowIdx) - barW / 2;
        let cumulativeVal = 0;
        series.forEach((s) => {
          const val = Number(v[s.key] ?? 0);
          const by = scaleY(cumulativeVal + val);
          const bh = scaleY(cumulativeVal) - by;
          svgElements += `<rect x="${bx}" y="${by}" width="${barW}" height="${Math.max(1, bh)}" fill="${s.color}" data-val="${val}" />`;
          cumulativeVal += val;
        });
      });
    } else if (chartData.chartType === 'scatter') {
      series.forEach((s) => {
        chartData.values.forEach((v, idx) => {
          const val = Number(v[s.key] ?? 0);
          const cx = scaleX(idx);
          const cy = scaleY(val);
          svgElements += `<circle cx="${cx}" cy="${cy}" r="6" fill="${s.color}" fill-opacity="0.8" stroke="#ffffff" stroke-width="1.5" />`;
        });
      });
    }

    // Legend
    let legendX = width - padding.right;
    series.slice().reverse().forEach((s) => {
      legendX -= 120;
      svgElements += `
        <g transform="translate(${legendX}, 30)">
          <rect width="12" height="12" rx="2" fill="${s.color}" />
          <text x="18" y="10" font-size="12" fill="${subtextColor}" font-family="system-ui, -apple-system, sans-serif">${escapeXml(s.name)}</text>
        </g>
      `;
    });

    // Source Attribution Footnote
    if (chartData.sourceAttribution) {
      svgElements += `<text x="${width - padding.right}" y="${height - 12}" text-anchor="end" font-size="11" fill="${subtextColor}" font-style="italic" font-family="system-ui, -apple-system, sans-serif">Source: ${escapeXml(chartData.sourceAttribution)}</text>`;
    }

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="100%" height="100%" style="background-color: ${bgColor}; border-radius: 12px; overflow: hidden;" role="img" aria-label="${escapeXml(chartData.title)}">${svgElements}</svg>`;
  }

  private static renderDonut(
    chartData: ChartBlock['data'],
    width: number,
    height: number,
    isDark: boolean
  ): string {
    const bgColor = isDark ? '#0f172a' : '#ffffff';
    const textColor = isDark ? '#f8fafc' : '#0f172a';
    const subtextColor = isDark ? '#94a3b8' : '#64748b';

    const cx = width / 2;
    const cy = height / 2 + 10;
    const outerRadius = Math.min(width, height) * 0.32;
    const innerRadius = outerRadius * 0.62;

    const values = chartData.values.map((v) => ({
      name: String(v[chartData.xAxis.key] ?? 'Category'),
      val: Number(v[chartData.series[0]?.key || 'value'] ?? 1),
    }));
    const total = values.reduce((acc, curr) => acc + curr.val, 0);

    let startAngle = 0;
    let paths = '';
    let legend = '';

    values.forEach((v, idx) => {
      const sliceAngle = (v.val / total) * 2 * Math.PI;
      const endAngle = startAngle + sliceAngle;
      const color = DEFAULT_PALETTE[idx % DEFAULT_PALETTE.length];

      const x1 = cx + outerRadius * Math.cos(startAngle);
      const y1 = cy + outerRadius * Math.sin(startAngle);
      const x2 = cx + outerRadius * Math.cos(endAngle);
      const y2 = cy + outerRadius * Math.sin(endAngle);
      const x3 = cx + innerRadius * Math.cos(endAngle);
      const y3 = cy + innerRadius * Math.sin(endAngle);
      const x4 = cx + innerRadius * Math.cos(startAngle);
      const y4 = cy + innerRadius * Math.sin(startAngle);

      const largeArc = sliceAngle > Math.PI ? 1 : 0;
      const d = `M ${x1} ${y1} A ${outerRadius} ${outerRadius} 0 ${largeArc} 1 ${x2} ${y2} L ${x3} ${y3} A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${x4} ${y4} Z`;

      paths += `<path d="${d}" fill="${color}" stroke="${bgColor}" stroke-width="2" />`;

      // Legend items
      const legY = 70 + idx * 24;
      legend += `
        <g transform="translate(${width - 180}, ${legY})">
          <circle cx="6" cy="6" r="5" fill="${color}" />
          <text x="18" y="10" font-size="12" fill="${textColor}" font-family="system-ui, -apple-system, sans-serif">${escapeXml(v.name)} (${((v.val / total) * 100).toFixed(0)}%)</text>
        </g>
      `;

      startAngle = endAngle;
    });

    return `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="100%" height="100%" style="background-color: ${bgColor}; border-radius: 12px;" role="img" aria-label="${escapeXml(chartData.title)}">
        <text x="40" y="36" font-size="20" font-weight="700" fill="${textColor}" font-family="system-ui, -apple-system, sans-serif">${escapeXml(chartData.title)}</text>
        ${paths}
        <text x="${cx}" y="${cy - 4}" text-anchor="middle" font-size="24" font-weight="800" fill="${textColor}" font-family="system-ui, -apple-system, sans-serif">${total.toLocaleString()}</text>
        <text x="${cx}" y="${cy + 18}" text-anchor="middle" font-size="12" fill="${subtextColor}" font-family="system-ui, -apple-system, sans-serif">Total Volume</text>
        ${legend}
      </svg>
    `;
  }

  private static renderKpi(
    chartData: ChartBlock['data'],
    width: number,
    height: number,
    isDark: boolean
  ): string {
    const bgColor = isDark ? '#0f172a' : '#ffffff';
    const textColor = isDark ? '#f8fafc' : '#0f172a';
    const subtextColor = isDark ? '#94a3b8' : '#64748b';

    const latest = chartData.values[chartData.values.length - 1];
    const prev = chartData.values.length > 1 ? chartData.values[chartData.values.length - 2] : null;
    const key = chartData.series[0]?.key || 'val';
    const val = latest ? Number(latest[key] ?? 0) : 0;
    const prevVal = prev ? Number(prev[key] ?? 0) : 0;

    let delta = 0;
    if (prevVal !== 0) {
      delta = ((val - prevVal) / prevVal) * 100;
    }
    const isUp = delta >= 0;
    const deltaColor = isUp ? '#10b981' : '#ef4444';
    const deltaText = `${isUp ? '+' : ''}${delta.toFixed(1)}%`;

    return `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="100%" height="100%" style="background-color: ${bgColor}; border-radius: 12px;" role="img" aria-label="${escapeXml(chartData.title)}">
        <text x="40" y="50" font-size="16" font-weight="600" fill="${subtextColor}" font-family="system-ui, -apple-system, sans-serif">${escapeXml(chartData.title)}</text>
        <text x="40" y="130" font-size="64" font-weight="900" fill="${textColor}" font-family="system-ui, -apple-system, sans-serif">${val.toLocaleString()}</text>
        <rect x="40" y="160" width="80" height="28" rx="6" fill="${deltaColor}" fill-opacity="0.15" />
        <text x="80" y="179" text-anchor="middle" font-size="14" font-weight="700" fill="${deltaColor}" font-family="system-ui, -apple-system, sans-serif">${deltaText}</text>
        <text x="132" y="180" font-size="13" fill="${subtextColor}" font-family="system-ui, -apple-system, sans-serif">vs prior period</text>
      </svg>
    `;
  }
}

function escapeXml(unsafe?: string): string {
  if (!unsafe) return '';
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
