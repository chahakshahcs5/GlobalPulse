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

    if (chartData.chartType === 'heatmap') {
      return this.renderHeatmap(chartData, width, height, isDark);
    }

    if (chartData.chartType === 'histogram') {
      return this.renderHistogram(chartData, width, height, isDark);
    }

    if (chartData.chartType === 'waterfall') {
      return this.renderWaterfall(chartData, width, height, isDark);
    }

    if (chartData.chartType === 'comparison') {
      return this.renderComparisonChart(chartData, width, height, isDark);
    }

    if (chartData.chartType === 'slope') {
      return this.renderSlope(chartData, width, height, isDark);
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
    series
      .slice()
      .reverse()
      .forEach((s) => {
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

  private static renderHeatmap(
    chartData: ChartBlock['data'],
    width: number,
    height: number,
    isDark: boolean
  ): string {
    const bgColor = isDark ? '#0f172a' : '#ffffff';
    const textColor = isDark ? '#f8fafc' : '#0f172a';
    const subtextColor = isDark ? '#94a3b8' : '#64748b';
    const cellBorder = isDark ? '#0f172a' : '#ffffff';

    const padding = { top: 80, right: 60, bottom: 80, left: 140 };
    const chartW = width - padding.left - padding.right;
    const chartH = height - padding.top - padding.bottom;

    const xKey = chartData.xAxis.key;
    const columns = chartData.values.map((v) => String(v[xKey] ?? ''));
    const rows = chartData.series;

    let minVal = Infinity;
    let maxVal = -Infinity;
    rows.forEach((r) => {
      chartData.values.forEach((v) => {
        const val = Number(v[r.key] ?? 0);
        if (val < minVal) minVal = val;
        if (val > maxVal) maxVal = val;
      });
    });
    if (maxVal === minVal) maxVal = minVal + 1;

    const colWidth = chartW / Math.max(1, columns.length);
    const rowHeight = chartH / Math.max(1, rows.length);

    let cellsSvg = '';

    rows.forEach((r, rIdx) => {
      const y = padding.top + rIdx * rowHeight;
      cellsSvg += `<text x="${padding.left - 14}" y="${y + rowHeight / 2 + 4}" text-anchor="end" font-size="12" font-weight="600" fill="${textColor}" font-family="system-ui, sans-serif">${escapeXml(r.name)}</text>`;

      chartData.values.forEach((v, cIdx) => {
        const x = padding.left + cIdx * colWidth;
        const val = Number(v[r.key] ?? 0);
        const ratio = Math.max(0, Math.min(1, (val - minVal) / (maxVal - minVal)));

        const rColor = Math.round(isDark ? 15 + ratio * (59 - 15) : 241 - ratio * (241 - 37));
        const gColor = Math.round(isDark ? 23 + ratio * (130 - 23) : 245 - ratio * (245 - 99));
        const bColor = Math.round(isDark ? 42 + ratio * (246 - 42) : 249 - ratio * (249 - 235));
        const cellFill = `rgb(${rColor}, ${gColor}, ${bColor})`;
        const textFill = ratio > 0.5 ? '#ffffff' : textColor;

        cellsSvg += `
          <rect x="${x + 2}" y="${y + 2}" width="${colWidth - 4}" height="${rowHeight - 4}" rx="4" fill="${cellFill}" stroke="${cellBorder}" stroke-width="1.5" />
          <text x="${x + colWidth / 2}" y="${y + rowHeight / 2 + 4}" text-anchor="middle" font-size="11" font-weight="700" fill="${textFill}" font-family="system-ui, sans-serif">${val.toLocaleString()}</text>
        `;
      });
    });

    columns.forEach((col, cIdx) => {
      const x = padding.left + cIdx * colWidth + colWidth / 2;
      cellsSvg += `<text x="${x}" y="${padding.top - 12}" text-anchor="middle" font-size="12" font-weight="600" fill="${subtextColor}" font-family="system-ui, sans-serif">${escapeXml(col)}</text>`;
    });

    const legW = 160;
    const legH = 12;
    const legX = width - padding.right - legW;
    const legY = height - 32;

    return `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="100%" height="100%" style="background-color: ${bgColor}; border-radius: 12px;" role="img" aria-label="${escapeXml(chartData.title)}">
        <defs>
          <linearGradient id="heatmapGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="${isDark ? '#0f172a' : '#f1f5f9'}" />
            <stop offset="100%" stop-color="#3b82f6" />
          </linearGradient>
        </defs>
        <text x="40" y="36" font-size="20" font-weight="700" fill="${textColor}" font-family="system-ui, sans-serif">${escapeXml(chartData.title)}</text>
        ${chartData.subtitle ? `<text x="40" y="56" font-size="13" fill="${subtextColor}" font-family="system-ui, sans-serif">${escapeXml(chartData.subtitle)}</text>` : ''}
        ${cellsSvg}
        <text x="${legX - 10}" y="${legY + 10}" text-anchor="end" font-size="10" fill="${subtextColor}" font-family="system-ui, sans-serif">${minVal.toLocaleString()}</text>
        <rect x="${legX}" y="${legY}" width="${legW}" height="${legH}" rx="3" fill="url(#heatmapGrad)" stroke="${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}" />
        <text x="${legX + legW + 10}" y="${legY + 10}" text-anchor="start" font-size="10" fill="${subtextColor}" font-family="system-ui, sans-serif">${maxVal.toLocaleString()}</text>
        ${chartData.sourceAttribution ? `<text x="40" y="${height - 20}" font-size="11" fill="${subtextColor}" font-style="italic" font-family="system-ui, sans-serif">Source: ${escapeXml(chartData.sourceAttribution)}</text>` : ''}
      </svg>
    `;
  }

  private static renderHistogram(
    chartData: ChartBlock['data'],
    width: number,
    height: number,
    isDark: boolean
  ): string {
    const bgColor = isDark ? '#0f172a' : '#ffffff';
    const textColor = isDark ? '#f8fafc' : '#0f172a';
    const subtextColor = isDark ? '#94a3b8' : '#64748b';
    const gridColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';

    const padding = { top: 70, right: 40, bottom: 60, left: 60 };
    const chartW = width - padding.left - padding.right;
    const chartH = height - padding.top - padding.bottom;

    const xKey = chartData.xAxis.key;
    const bins = chartData.values.map((v) => String(v[xKey] ?? ''));
    const seriesKey = chartData.series[0]?.key || 'count';
    const barColor = chartData.series[0]?.color || '#3b82f6';

    const counts = chartData.values.map((v) => Number(v[seriesKey] ?? 0));
    const maxCount = Math.max(...counts, 1) * 1.15;

    const binW = chartW / Math.max(1, bins.length);
    const scaleY = (val: number) => padding.top + chartH - (val / maxCount) * chartH;

    let elements = '';
    elements += `<text x="${padding.left}" y="32" font-size="20" font-weight="700" fill="${textColor}" font-family="system-ui, sans-serif">${escapeXml(chartData.title)}</text>`;
    if (chartData.subtitle) {
      elements += `<text x="${padding.left}" y="52" font-size="13" fill="${subtextColor}" font-family="system-ui, sans-serif">${escapeXml(chartData.subtitle)}</text>`;
    }

    for (let i = 0; i <= 4; i++) {
      const val = (i / 4) * maxCount;
      const y = scaleY(val);
      elements += `<line x1="${padding.left}" y1="${y}" x2="${width - padding.right}" y2="${y}" stroke="${gridColor}" stroke-dasharray="3,3" />`;
      elements += `<text x="${padding.left - 10}" y="${y + 4}" text-anchor="end" font-size="11" fill="${subtextColor}" font-family="system-ui, sans-serif">${val.toFixed(0)}</text>`;
    }

    bins.forEach((bin, idx) => {
      const count = counts[idx];
      const bx = padding.left + idx * binW;
      const by = scaleY(count);
      const bh = padding.top + chartH - by;

      elements += `
        <rect x="${bx + 1}" y="${by}" width="${binW - 2}" height="${Math.max(1, bh)}" fill="${barColor}" rx="2" fill-opacity="0.85" stroke="${barColor}" stroke-width="1" />
        <text x="${bx + binW / 2}" y="${by - 6}" text-anchor="middle" font-size="11" font-weight="700" fill="${textColor}" font-family="system-ui, sans-serif">${count}</text>
        <text x="${bx + binW / 2}" y="${padding.top + chartH + 20}" text-anchor="middle" font-size="11" fill="${subtextColor}" font-family="system-ui, sans-serif">${escapeXml(bin)}</text>
      `;
    });

    if (chartData.sourceAttribution) {
      elements += `<text x="${width - padding.right}" y="${height - 12}" text-anchor="end" font-size="11" fill="${subtextColor}" font-style="italic" font-family="system-ui, sans-serif">Source: ${escapeXml(chartData.sourceAttribution)}</text>`;
    }

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="100%" height="100%" style="background-color: ${bgColor}; border-radius: 12px;" role="img" aria-label="${escapeXml(chartData.title)}">${elements}</svg>`;
  }

  private static renderWaterfall(
    chartData: ChartBlock['data'],
    width: number,
    height: number,
    isDark: boolean
  ): string {
    const bgColor = isDark ? '#0f172a' : '#ffffff';
    const textColor = isDark ? '#f8fafc' : '#0f172a';
    const subtextColor = isDark ? '#94a3b8' : '#64748b';
    const gridColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';

    const padding = { top: 70, right: 40, bottom: 60, left: 70 };
    const chartW = width - padding.left - padding.right;
    const chartH = height - padding.top - padding.bottom;

    const xKey = chartData.xAxis.key;
    const seriesKey = chartData.series[0]?.key || 'value';
    const steps = chartData.values.map((v) => ({
      name: String(v[xKey] ?? ''),
      val: Number(v[seriesKey] ?? 0),
      isTotal: Boolean(v.isTotal || false),
    }));

    let running = 0;
    let minBound = 0;
    let maxBound = 0;

    const calcSteps = steps.map((s, idx) => {
      const isFirst = idx === 0;
      const isLast = idx === steps.length - 1;
      const isTot = s.isTotal || isFirst || isLast;

      let start = running;
      let end = isTot && !isFirst ? s.val : running + s.val;
      if (isFirst) {
        start = 0;
        end = s.val;
        running = s.val;
      } else if (!isTot) {
        running += s.val;
      } else {
        running = s.val;
      }

      minBound = Math.min(minBound, start, end);
      maxBound = Math.max(maxBound, start, end);

      return { ...s, start, end, isTot };
    });

    maxBound = Math.max(10, maxBound * 1.15);
    minBound = Math.min(0, minBound * 1.15);

    const scaleY = (val: number) =>
      padding.top + chartH - ((val - minBound) / (maxBound - minBound)) * chartH;
    const stepW = chartW / Math.max(1, steps.length);
    const barW = stepW * 0.65;

    let elements = '';
    elements += `<text x="${padding.left}" y="32" font-size="20" font-weight="700" fill="${textColor}" font-family="system-ui, sans-serif">${escapeXml(chartData.title)}</text>`;
    if (chartData.subtitle) {
      elements += `<text x="${padding.left}" y="52" font-size="13" fill="${subtextColor}" font-family="system-ui, sans-serif">${escapeXml(chartData.subtitle)}</text>`;
    }

    const zeroY = scaleY(0);
    elements += `<line x1="${padding.left}" y1="${zeroY}" x2="${width - padding.right}" y2="${zeroY}" stroke="${textColor}" stroke-opacity="0.3" stroke-width="1.5" />`;

    calcSteps.forEach((s, idx) => {
      const bx = padding.left + idx * stepW + (stepW - barW) / 2;
      const topY = scaleY(Math.max(s.start, s.end));
      const bottomY = scaleY(Math.min(s.start, s.end));
      const bh = Math.max(2, bottomY - topY);

      const color = s.isTot ? '#3b82f6' : s.val >= 0 ? '#10b981' : '#ef4444';
      elements += `<rect x="${bx}" y="${topY}" width="${barW}" height="${bh}" rx="3" fill="${color}" />`;

      const labelText = `${s.val > 0 && !s.isTot ? '+' : ''}${s.val.toLocaleString()}`;
      const labelY = topY - 6;
      elements += `<text x="${bx + barW / 2}" y="${labelY}" text-anchor="middle" font-size="11" font-weight="700" fill="${textColor}" font-family="system-ui, sans-serif">${labelText}</text>`;

      elements += `<text x="${bx + barW / 2}" y="${padding.top + chartH + 20}" text-anchor="middle" font-size="11" fill="${subtextColor}" font-family="system-ui, sans-serif">${escapeXml(s.name)}</text>`;

      if (idx < calcSteps.length - 1) {
        const nextStartX = padding.left + (idx + 1) * stepW + (stepW - barW) / 2;
        const connY = scaleY(s.end);
        elements += `<line x1="${bx + barW}" y1="${connY}" x2="${nextStartX}" y2="${connY}" stroke="${gridColor}" stroke-dasharray="3,3" stroke-width="1.5" />`;
      }
    });

    if (chartData.sourceAttribution) {
      elements += `<text x="${width - padding.right}" y="${height - 12}" text-anchor="end" font-size="11" fill="${subtextColor}" font-style="italic" font-family="system-ui, sans-serif">Source: ${escapeXml(chartData.sourceAttribution)}</text>`;
    }

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="100%" height="100%" style="background-color: ${bgColor}; border-radius: 12px;" role="img" aria-label="${escapeXml(chartData.title)}">${elements}</svg>`;
  }

  private static renderComparisonChart(
    chartData: ChartBlock['data'],
    width: number,
    height: number,
    isDark: boolean
  ): string {
    const bgColor = isDark ? '#0f172a' : '#ffffff';
    const textColor = isDark ? '#f8fafc' : '#0f172a';
    const subtextColor = isDark ? '#94a3b8' : '#64748b';
    const gridColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';

    const padding = { top: 80, right: 50, bottom: 40, left: 50 };
    const chartW = width - padding.left - padding.right;
    const chartH = height - padding.top - padding.bottom;

    const xKey = chartData.xAxis.key;
    const categories = chartData.values.map((v) => String(v[xKey] ?? ''));
    const seriesA = chartData.series[0] || { name: 'Subject A', key: 'a', color: '#3b82f6' };
    const seriesB = chartData.series[1] || { name: 'Subject B', key: 'b', color: '#ec4899' };
    const colorA = seriesA.color || '#3b82f6';
    const colorB = seriesB.color || '#ec4899';

    let maxVal = 0;
    chartData.values.forEach((v) => {
      maxVal = Math.max(maxVal, Number(v[seriesA.key] ?? 0), Number(v[seriesB.key] ?? 0));
    });
    if (maxVal === 0) maxVal = 100;
    maxVal *= 1.1;

    const centerX = width / 2;
    const halfW = chartW / 2 - 70;
    const rowH = chartH / Math.max(1, categories.length);
    const barH = Math.min(22, rowH * 0.6);

    let elements = '';
    elements += `<text x="40" y="32" font-size="20" font-weight="700" fill="${textColor}" font-family="system-ui, sans-serif">${escapeXml(chartData.title)}</text>`;
    if (chartData.subtitle) {
      elements += `<text x="40" y="52" font-size="13" fill="${subtextColor}" font-family="system-ui, sans-serif">${escapeXml(chartData.subtitle)}</text>`;
    }

    elements += `<text x="${centerX - 80}" y="${padding.top - 14}" text-anchor="end" font-size="13" font-weight="700" fill="${colorA}" font-family="system-ui, sans-serif">${escapeXml(seriesA.name)}</text>`;
    elements += `<text x="${centerX + 80}" y="${padding.top - 14}" text-anchor="start" font-size="13" font-weight="700" fill="${colorB}" font-family="system-ui, sans-serif">${escapeXml(seriesB.name)}</text>`;

    elements += `<line x1="${centerX}" y1="${padding.top}" x2="${centerX}" y2="${padding.top + chartH}" stroke="${gridColor}" stroke-width="2" />`;

    categories.forEach((cat, idx) => {
      const y = padding.top + idx * rowH + (rowH - barH) / 2;
      const valA = Number(chartData.values[idx][seriesA.key] ?? 0);
      const valB = Number(chartData.values[idx][seriesB.key] ?? 0);

      const lenA = (valA / maxVal) * halfW;
      const lenB = (valB / maxVal) * halfW;

      elements += `<text x="${centerX}" y="${y + barH / 2 + 4}" text-anchor="middle" font-size="11" font-weight="600" fill="${subtextColor}" font-family="system-ui, sans-serif">${escapeXml(cat)}</text>`;

      const ax = centerX - 60 - lenA;
      elements += `<rect x="${ax}" y="${y}" width="${lenA}" height="${barH}" rx="3" fill="${colorA}" />`;
      elements += `<text x="${ax - 8}" y="${y + barH / 2 + 4}" text-anchor="end" font-size="11" font-weight="700" fill="${textColor}" font-family="system-ui, sans-serif">${valA.toLocaleString()}</text>`;

      const bx = centerX + 60;
      elements += `<rect x="${bx}" y="${y}" width="${lenB}" height="${barH}" rx="3" fill="${colorB}" />`;
      elements += `<text x="${bx + lenB + 8}" y="${y + barH / 2 + 4}" text-anchor="start" font-size="11" font-weight="700" fill="${textColor}" font-family="system-ui, sans-serif">${valB.toLocaleString()}</text>`;
    });

    if (chartData.sourceAttribution) {
      elements += `<text x="${width - padding.right}" y="${height - 12}" text-anchor="end" font-size="11" fill="${subtextColor}" font-style="italic" font-family="system-ui, sans-serif">Source: ${escapeXml(chartData.sourceAttribution)}</text>`;
    }

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="100%" height="100%" style="background-color: ${bgColor}; border-radius: 12px;" role="img" aria-label="${escapeXml(chartData.title)}">${elements}</svg>`;
  }

  private static renderSlope(
    chartData: ChartBlock['data'],
    width: number,
    height: number,
    isDark: boolean
  ): string {
    const bgColor = isDark ? '#0f172a' : '#ffffff';
    const textColor = isDark ? '#f8fafc' : '#0f172a';
    const subtextColor = isDark ? '#94a3b8' : '#64748b';
    const gridColor = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)';

    const padding = { top: 90, right: 120, bottom: 40, left: 120 };
    const chartH = height - padding.top - padding.bottom;

    const leftX = padding.left + 40;
    const rightX = width - padding.right - 40;

    const seriesA = chartData.series[0] || { name: 'Period 1', key: 'start' };
    const seriesB = chartData.series[1] || { name: 'Period 2', key: 'end' };

    const items = chartData.values.map((v) => {
      const name = String(v[chartData.xAxis.key] ?? '');
      const startVal = Number(v[seriesA.key] ?? 0);
      const endVal = Number(v[seriesB.key] ?? 0);
      return { name, startVal, endVal };
    });

    let minVal = Infinity;
    let maxVal = -Infinity;
    items.forEach((item) => {
      minVal = Math.min(minVal, item.startVal, item.endVal);
      maxVal = Math.max(maxVal, item.startVal, item.endVal);
    });
    if (maxVal === minVal) maxVal = minVal + 10;
    const pad = (maxVal - minVal) * 0.1;
    minVal -= pad;
    maxVal += pad;

    const scaleY = (val: number) =>
      padding.top + chartH - ((val - minVal) / (maxVal - minVal)) * chartH;

    let elements = '';
    elements += `<text x="40" y="32" font-size="20" font-weight="700" fill="${textColor}" font-family="system-ui, sans-serif">${escapeXml(chartData.title)}</text>`;
    if (chartData.subtitle) {
      elements += `<text x="40" y="52" font-size="13" fill="${subtextColor}" font-family="system-ui, sans-serif">${escapeXml(chartData.subtitle)}</text>`;
    }

    elements += `<line x1="${leftX}" y1="${padding.top - 10}" x2="${leftX}" y2="${padding.top + chartH + 10}" stroke="${gridColor}" stroke-width="2" />`;
    elements += `<line x1="${rightX}" y1="${padding.top - 10}" x2="${rightX}" y2="${padding.top + chartH + 10}" stroke="${gridColor}" stroke-width="2" />`;

    elements += `<text x="${leftX}" y="${padding.top - 24}" text-anchor="middle" font-size="13" font-weight="700" fill="${textColor}" font-family="system-ui, sans-serif">${escapeXml(seriesA.name)}</text>`;
    elements += `<text x="${rightX}" y="${padding.top - 24}" text-anchor="middle" font-size="13" font-weight="700" fill="${textColor}" font-family="system-ui, sans-serif">${escapeXml(seriesB.name)}</text>`;

    items.forEach((item) => {
      const y1 = scaleY(item.startVal);
      const y2 = scaleY(item.endVal);
      const isPositive = item.endVal >= item.startVal;
      const lineColor = isPositive ? '#10b981' : '#ef4444';
      const diff = item.endVal - item.startVal;
      const diffText = `${diff > 0 ? '+' : ''}${diff.toFixed(0)}`;

      elements += `<line x1="${leftX}" y1="${y1}" x2="${rightX}" y2="${y2}" stroke="${lineColor}" stroke-width="2.5" stroke-linecap="round" />`;
      elements += `<circle cx="${leftX}" cy="${y1}" r="4.5" fill="${bgColor}" stroke="${lineColor}" stroke-width="2" />`;
      elements += `<circle cx="${rightX}" cy="${y2}" r="4.5" fill="${bgColor}" stroke="${lineColor}" stroke-width="2" />`;

      elements += `<text x="${leftX - 12}" y="${y1 + 4}" text-anchor="end" font-size="11" font-weight="600" fill="${textColor}" font-family="system-ui, sans-serif">${escapeXml(item.name)} <tspan fill="${subtextColor}">${item.startVal.toLocaleString()}</tspan></text>`;
      elements += `<text x="${rightX + 12}" y="${y2 + 4}" text-anchor="start" font-size="11" font-weight="600" fill="${textColor}" font-family="system-ui, sans-serif">${item.endVal.toLocaleString()} <tspan fill="${lineColor}" font-weight="700">(${diffText})</tspan></text>`;
    });

    if (chartData.sourceAttribution) {
      elements += `<text x="${width - padding.right}" y="${height - 12}" text-anchor="end" font-size="11" fill="${subtextColor}" font-style="italic" font-family="system-ui, sans-serif">Source: ${escapeXml(chartData.sourceAttribution)}</text>`;
    }

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="100%" height="100%" style="background-color: ${bgColor}; border-radius: 12px;" role="img" aria-label="${escapeXml(chartData.title)}">${elements}</svg>`;
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
