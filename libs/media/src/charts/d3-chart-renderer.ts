import { NUMBER_LOCALE } from '../format';
import type { ChartBlock } from '@ai-news/schemas';
import { escapeXml } from '@ai-news/shared';
import { DEFAULT_PALETTE, formatChartValue, getNiceTicks, safeColor } from './chart-helpers';
import { AdvancedChartRenderer, isAdvancedChartType } from './advanced-chart-renderer';

export interface RenderChartOptions {
  width?: number;
  height?: number;
  theme?: 'dark' | 'light';
}

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

    // The newer chart types live in their own renderer, so that this file
    // does not have to carry every drawing routine there is.
    if (isAdvancedChartType(chartData.chartType)) {
      return AdvancedChartRenderer.renderToSvg(chartData, options);
    }

    if (chartData.chartType === 'donut') {
      return this.renderDonut(chartData, width, height, isDark);
    }

    if (chartData.chartType === 'pie') {
      return this.renderPie(chartData, width, height, isDark);
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

    if (chartData.chartType === 'dot_plot') {
      return this.renderDotPlot(chartData, width, height, isDark);
    }

    if (chartData.chartType === 'lollipop') {
      return this.renderLollipop(chartData, width, height, isDark);
    }

    if (chartData.chartType === 'diverging_bar') {
      return this.renderDivergingBar(chartData, width, height, isDark);
    }

    if (chartData.chartType === 'sparkline') {
      return this.renderSparkline(chartData, width, height, isDark);
    }

    if (chartData.chartType === 'bump') {
      return this.renderBump(chartData, width, height, isDark);
    }

    if (chartData.chartType === 'radar') {
      return this.renderRadar(chartData, width, height, isDark);
    }

    if (chartData.chartType === 'small_multiples') {
      return this.renderSmallMultiples(chartData, width, height, isDark);
    }

    // Extract values
    const xKey = chartData.xAxis.key;
    const xCategories = chartData.values.map((v) => String(v[xKey] ?? ''));
    const series = chartData.series.map((s, idx) => ({
      ...s,
      color: safeColor(s.color, DEFAULT_PALETTE[idx % DEFAULT_PALETTE.length]),
    }));

    // Find numeric Y bounds
    let minY = chartData.yAxis.min ?? 0;
    let rawMaxY = chartData.yAxis.max ?? -Infinity;
    for (const row of chartData.values) {
      for (const s of series) {
        const val = Number(row[s.key] ?? 0);
        if (val > rawMaxY) rawMaxY = val;
        if (val < minY) minY = val;
      }
    }
    if (rawMaxY <= minY) rawMaxY = minY + 10;

    // Use nice ticks algorithm for clean, readable steps
    const niceTickInfo = getNiceTicks(minY, rawMaxY, 5);
    const maxY = niceTickInfo.max;
    minY = niceTickInfo.min;
    const ticksList = niceTickInfo.ticks;
    const range = maxY - minY;

    const hasYLabel = Boolean(chartData.yAxis?.label);
    const hasXLabel = Boolean(chartData.xAxis?.label);
    const hasFootnote = Boolean(chartData.sourceAttribution);

    // The legend can be turned off and placed by the block's payload. Left
    // to the renderer, a single-series chart would keep a legend the author
    // asked to hide.
    const legendPosition = chartData.legend?.position ?? 'top';
    const legendEnabled = chartData.legend?.show !== false;
    const hasLegendData = series.length > 1 || (series.length === 1 && Boolean(series[0].name));
    const showLegend = legendEnabled && hasLegendData;
    const legendAtBottom = showLegend && legendPosition === 'bottom';
    const legendAtRight = showLegend && legendPosition === 'right';

    // Dynamic top padding to prevent title, subtitle, and legend from colliding
    const paddingLeft = hasYLabel ? 82 : 65;
    let paddingRight = 40;
    const hasSubtitle = Boolean(chartData.subtitle);

    // Calculate dynamic legend row positions
    let legendSvg = '';
    let currentLegendX = paddingLeft;
    let currentLegendY = hasSubtitle ? 66 : 50;

    if (showLegend) {
      if (legendAtRight) {
        // A right-hand legend is a single vertical column.
        let y = 30;
        series.forEach((s) => {
          legendSvg += `
            <g transform="translate(${width - 150}, ${y})">
              <rect width="12" height="12" rx="2.5" fill="${s.color}" />
              <text x="18" y="10" font-size="11" font-weight="600" fill="${textColor}" font-family="system-ui, -apple-system, sans-serif">${escapeXml(s.name)}</text>
            </g>
          `;
          y += 20;
        });
        paddingRight = 165;
      } else if (!legendAtBottom) {
        // A top legend flows across, wrapping when it runs out of room.
        series.forEach((s) => {
          const itemWidth = Math.max(90, Math.ceil(s.name.length * 7.2) + 36);
          if (currentLegendX + itemWidth > width - paddingRight && currentLegendX > paddingLeft) {
            currentLegendX = paddingLeft;
            currentLegendY += 22;
          }
          legendSvg += `
            <g transform="translate(${currentLegendX}, ${currentLegendY})">
              <rect width="12" height="12" rx="2.5" fill="${s.color}" />
              <text x="18" y="10" font-size="11" font-weight="600" fill="${textColor}" font-family="system-ui, -apple-system, sans-serif">${escapeXml(s.name)}</text>
            </g>
          `;
          currentLegendX += itemWidth;
        });
      }
    }

    const paddingTop =
      showLegend && !legendAtBottom && !legendAtRight ? currentLegendY + 24 : hasSubtitle ? 68 : 50;
    const paddingBottom =
      (hasXLabel ? 55 : 38) + (hasFootnote ? 18 : 0) + (legendAtBottom ? 30 : 0);

    const padding = {
      top: paddingTop,
      right: paddingRight,
      bottom: paddingBottom,
      left: paddingLeft,
    };
    const chartW = width - padding.left - padding.right;
    const chartH = height - padding.top - padding.bottom;

    // Helper scales
    const scaleX = (index: number) => padding.left + (index + 0.5) * (chartW / xCategories.length);
    const scaleXBand = (index: number) => padding.left + index * (chartW / xCategories.length);
    const bandWidth = chartW / xCategories.length;
    const scaleY = (val: number) => padding.top + chartH - ((val - minY) / (maxY - minY)) * chartH;

    let svgElements = '';

    // Title & Subtitle Header
    svgElements += `<text x="${padding.left}" y="28" font-size="17" font-weight="700" fill="${textColor}" font-family="system-ui, -apple-system, sans-serif">${escapeXml(chartData.title)}</text>`;
    if (chartData.subtitle) {
      svgElements += `<text x="${padding.left}" y="46" font-size="12" fill="${subtextColor}" font-family="system-ui, -apple-system, sans-serif">${escapeXml(chartData.subtitle)}</text>`;
    }

    // Legend
    if (showLegend) {
      if (legendAtBottom) {
        // A bottom legend is laid out after the plot, so it is built at the
        // foot of the chart rather than reused from the top.
        let x = padding.left;
        const y = height - padding.bottom + 12;
        series.forEach((s) => {
          const itemWidth = Math.max(90, Math.ceil(s.name.length * 7.2) + 36);
          if (x + itemWidth > width - padding.right && x > padding.left) {
            x = padding.left;
          }
          legendSvg += `
            <g transform="translate(${x}, ${y})">
              <rect width="12" height="12" rx="2.5" fill="${s.color}" />
              <text x="18" y="10" font-size="11" font-weight="600" fill="${textColor}" font-family="system-ui, -apple-system, sans-serif">${escapeXml(s.name)}</text>
            </g>
          `;
          x += itemWidth;
        });
      }
      if (legendSvg) svgElements += legendSvg;
    }

    // Y Axis Label
    if (chartData.yAxis.label) {
      svgElements += `<text transform="rotate(-90)" x="${-(padding.top + chartH / 2)}" y="${22}" text-anchor="middle" font-size="11" font-weight="600" fill="${subtextColor}" font-family="system-ui, -apple-system, sans-serif">${escapeXml(chartData.yAxis.label)}</text>`;
    }

    // Y Grid lines & Labels
    for (const tickVal of ticksList) {
      const y = scaleY(tickVal);
      svgElements += `<line x1="${padding.left}" y1="${y}" x2="${width - padding.right}" y2="${y}" stroke="${gridColor}" stroke-dasharray="3,3" />`;
      const numStr = formatChartValue(tickVal, range);
      const formattedVal = chartData.yAxis.format ? `${chartData.yAxis.format}${numStr}` : numStr;
      svgElements += `<text x="${padding.left - 10}" y="${y + 4}" text-anchor="end" font-size="11" fill="${subtextColor}" font-family="system-ui, -apple-system, sans-serif">${escapeXml(formattedVal)}</text>`;
    }

    // X Axis ticks & Labels
    xCategories.forEach((cat, idx) => {
      const x = scaleX(idx);
      svgElements += `<text x="${x}" y="${padding.top + chartH + 20}" text-anchor="middle" font-size="12" fill="${subtextColor}" font-family="system-ui, -apple-system, sans-serif">${escapeXml(cat)}</text>`;
    });

    // X Axis Title
    if (chartData.xAxis.label) {
      svgElements += `<text x="${padding.left + chartW / 2}" y="${padding.top + chartH + 44}" text-anchor="middle" font-size="12" font-weight="600" fill="${subtextColor}" font-family="system-ui, -apple-system, sans-serif">${escapeXml(chartData.xAxis.label)}</text>`;
    }

    // Baseline axis line
    svgElements += `<line x1="${padding.left}" y1="${padding.top + chartH}" x2="${width - padding.right}" y2="${padding.top + chartH}" stroke="${subtextColor}" stroke-opacity="0.3" stroke-width="1.5" />`;

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
        // Trendline / guide curve
        const points = chartData.values.map((v, idx) => {
          const val = Number(v[s.key] ?? 0);
          return `${scaleX(idx)},${scaleY(val)}`;
        });
        svgElements += `<polyline points="${points.join(' ')}" fill="none" stroke="${s.color}" stroke-width="2" stroke-dasharray="4,4" opacity="0.45" />`;

        chartData.values.forEach((v, idx) => {
          const val = Number(v[s.key] ?? 0);
          const cx = scaleX(idx);
          const cy = scaleY(val);

          // Subtle glow ring
          svgElements += `<circle cx="${cx}" cy="${cy}" r="12" fill="${s.color}" fill-opacity="0.16" />`;
          // Main core point
          svgElements += `<circle cx="${cx}" cy="${cy}" r="6" fill="${s.color}" stroke="#ffffff" stroke-width="2" />`;

          // Value callout badge text above point
          const valText = formatChartValue(val, range);
          svgElements += `<text x="${cx}" y="${cy - 12}" text-anchor="middle" font-size="11" font-weight="700" fill="${s.color}" font-family="system-ui, -apple-system, sans-serif">${valText}</text>`;
        });
      });
    }

    // Annotation markers, anchored to the data points they explain.
    svgElements += this.renderAnnotations(chartData, {
      scaleX,
      scaleY,
      xKey,
      series,
    });

    // Source Attribution Footnote
    if (chartData.sourceAttribution) {
      svgElements += `<text x="${width - padding.right}" y="${height - 12}" text-anchor="end" font-size="10" fill="${subtextColor}" font-style="italic" font-family="system-ui, -apple-system, sans-serif">Source: ${escapeXml(chartData.sourceAttribution)}</text>`;
    }

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="100%" height="100%" style="background-color: ${bgColor}; border-radius: 12px; overflow: hidden;" role="img" aria-label="${escapeXml(chartData.title)}">${svgElements}</svg>`;
  }

  /**
   * Draw a numbered marker at each annotated data point.
   *
   * The marker carries the annotation id so the client can open it. An
   * annotation that does not match any data point is skipped rather than
   * drawn at a wrong position — a mis-anchored marker would be worse than no
   * marker at all.
   */
  private static renderAnnotations(
    chartData: ChartBlock['data'],
    ctx: {
      scaleX: (index: number) => number;
      scaleY: (value: number) => number;
      xKey: string;
      series: Array<{ key: string; color: string }>;
    }
  ): string {
    const annotations = chartData.annotations ?? [];
    if (annotations.length === 0) return '';

    let svg = '';
    annotations.forEach((annotation, idx) => {
      const rowIdx = chartData.values.findIndex(
        (row) => String(row[ctx.xKey] ?? '') === annotation.xValue
      );
      if (rowIdx === -1) return;

      const seriesKey = annotation.seriesKey ?? ctx.series[0]?.key;
      if (!seriesKey) return;

      const rawValue = chartData.values[rowIdx][seriesKey];
      const value = Number(rawValue ?? 0);
      if (!Number.isFinite(value)) return;

      const cx = ctx.scaleX(rowIdx);
      const cy = ctx.scaleY(value);
      const number = idx + 1;

      svg += `<g class="chart-annotation" data-annotation-id="${escapeXml(annotation.id)}" data-annotation-index="${idx}" role="button" tabindex="0" aria-label="${escapeXml(`${number}. ${annotation.label}`)}" style="cursor:pointer">`;
      svg += `<circle cx="${cx}" cy="${cy}" r="13" fill="#f59e0b" fill-opacity="0.25" />`;
      svg += `<circle cx="${cx}" cy="${cy}" r="9" fill="#f59e0b" stroke="#0f172a" stroke-width="2" />`;
      svg += `<text x="${cx}" y="${cy + 4}" text-anchor="middle" font-size="11" font-weight="800" fill="#0f172a" font-family="system-ui, -apple-system, sans-serif">${number}</text>`;
      svg += `</g>`;
    });

    return svg;
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
        <text x="${cx}" y="${cy - 4}" text-anchor="middle" font-size="24" font-weight="800" fill="${textColor}" font-family="system-ui, -apple-system, sans-serif">${total.toLocaleString(NUMBER_LOCALE)}</text>
        <text x="${cx}" y="${cy + 18}" text-anchor="middle" font-size="12" fill="${subtextColor}" font-family="system-ui, -apple-system, sans-serif">Total Volume</text>
        ${legend}
      </svg>
    `;
  }

  /**
   * A pie chart.
   *
   * The same slices as the donut, drawn to the centre rather than around a
   * hole. A pie says "one of these is the whole"; a donut says "this part
   * of the whole".
   */
  private static renderPie(
    chartData: ChartBlock['data'],
    width: number,
    height: number,
    isDark: boolean
  ): string {
    const bgColor = isDark ? '#0f172a' : '#ffffff';
    const textColor = isDark ? '#f8fafc' : '#0f172a';

    const cx = width / 2;
    const cy = height / 2 + 10;
    const outerRadius = Math.min(width, height) * 0.32;

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

      const largeArc = sliceAngle > Math.PI ? 1 : 0;
      const d = `M ${cx} ${cy} L ${x1} ${y1} A ${outerRadius} ${outerRadius} 0 ${largeArc} 1 ${x2} ${y2} Z`;

      paths += `<path d="${d}" fill="${color}" stroke="${bgColor}" stroke-width="2" />`;

      // The share is printed on the slice, so the reader does not have to
      // measure the angle or cross-reference the legend.
      const midAngle = startAngle + sliceAngle / 2;
      const labelRadius = outerRadius * 0.62;
      const lx = cx + labelRadius * Math.cos(midAngle);
      const ly = cy + labelRadius * Math.sin(midAngle);
      if (sliceAngle > 0.22) {
        paths += `<text x="${lx}" y="${ly + 4}" text-anchor="middle" font-size="12" font-weight="700" fill="#ffffff" font-family="system-ui, -apple-system, sans-serif">${((v.val / total) * 100).toFixed(0)}%</text>`;
      }

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
        <text x="40" y="130" font-size="64" font-weight="900" fill="${textColor}" font-family="system-ui, -apple-system, sans-serif">${val.toLocaleString(NUMBER_LOCALE)}</text>
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
          <text x="${x + colWidth / 2}" y="${y + rowHeight / 2 + 4}" text-anchor="middle" font-size="11" font-weight="700" fill="${textFill}" font-family="system-ui, sans-serif">${val.toLocaleString(NUMBER_LOCALE)}</text>
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
        <text x="${legX - 10}" y="${legY + 10}" text-anchor="end" font-size="10" fill="${subtextColor}" font-family="system-ui, sans-serif">${minVal.toLocaleString(NUMBER_LOCALE)}</text>
        <rect x="${legX}" y="${legY}" width="${legW}" height="${legH}" rx="3" fill="url(#heatmapGrad)" stroke="${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}" />
        <text x="${legX + legW + 10}" y="${legY + 10}" text-anchor="start" font-size="10" fill="${subtextColor}" font-family="system-ui, sans-serif">${maxVal.toLocaleString(NUMBER_LOCALE)}</text>
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
    const barColor = safeColor(chartData.series[0]?.color, '#3b82f6');

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

      const labelText = `${s.val > 0 && !s.isTot ? '+' : ''}${s.val.toLocaleString(NUMBER_LOCALE)}`;
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

    const hasSubtitle = Boolean(chartData.subtitle);
    const padding = { top: hasSubtitle ? 100 : 80, right: 50, bottom: 40, left: 50 };
    const chartW = width - padding.left - padding.right;
    const chartH = height - padding.top - padding.bottom;

    const xKey = chartData.xAxis.key;
    const categories = chartData.values.map((v) => String(v[xKey] ?? ''));
    const seriesA = chartData.series[0] || { name: 'Subject A', key: 'a', color: '#3b82f6' };
    const seriesB = chartData.series[1] || { name: 'Subject B', key: 'b', color: '#ec4899' };
    const colorA = safeColor(seriesA.color, '#3b82f6');
    const colorB = safeColor(seriesB.color, '#ec4899');

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
    elements += `<text x="40" y="28" font-size="18" font-weight="700" fill="${textColor}" font-family="system-ui, sans-serif">${escapeXml(chartData.title)}</text>`;
    if (chartData.subtitle) {
      elements += `<text x="40" y="48" font-size="12" fill="${subtextColor}" font-family="system-ui, sans-serif">${escapeXml(chartData.subtitle)}</text>`;
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
      elements += `<text x="${ax - 8}" y="${y + barH / 2 + 4}" text-anchor="end" font-size="11" font-weight="700" fill="${textColor}" font-family="system-ui, sans-serif">${valA.toLocaleString(NUMBER_LOCALE)}</text>`;

      const bx = centerX + 60;
      elements += `<rect x="${bx}" y="${y}" width="${lenB}" height="${barH}" rx="3" fill="${colorB}" />`;
      elements += `<text x="${bx + lenB + 8}" y="${y + barH / 2 + 4}" text-anchor="start" font-size="11" font-weight="700" fill="${textColor}" font-family="system-ui, sans-serif">${valB.toLocaleString(NUMBER_LOCALE)}</text>`;
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

      elements += `<text x="${leftX - 12}" y="${y1 + 4}" text-anchor="end" font-size="11" font-weight="600" fill="${textColor}" font-family="system-ui, sans-serif">${escapeXml(item.name)} <tspan fill="${subtextColor}">${item.startVal.toLocaleString(NUMBER_LOCALE)}</tspan></text>`;
      elements += `<text x="${rightX + 12}" y="${y2 + 4}" text-anchor="start" font-size="11" font-weight="600" fill="${textColor}" font-family="system-ui, sans-serif">${item.endVal.toLocaleString(NUMBER_LOCALE)} <tspan fill="${lineColor}" font-weight="700">(${diffText})</tspan></text>`;
    });

    if (chartData.sourceAttribution) {
      elements += `<text x="${width - padding.right}" y="${height - 12}" text-anchor="end" font-size="11" fill="${subtextColor}" font-style="italic" font-family="system-ui, sans-serif">Source: ${escapeXml(chartData.sourceAttribution)}</text>`;
    }

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="100%" height="100%" style="background-color: ${bgColor}; border-radius: 12px;" role="img" aria-label="${escapeXml(chartData.title)}">${elements}</svg>`;
  }

  /**
   * Shared layout for the horizontal (category-on-Y) chart types.
   *
   * `dot_plot` and `lollipop` share the same geometry — categories down the
   * left, values across the bottom — and only differ in whether a stem is
   * drawn from the baseline to the marker.
   */
  private static horizontalLayout(
    chartData: ChartBlock['data'],
    width: number,
    height: number,
    isDark: boolean
  ) {
    const bgColor = isDark ? '#0f172a' : '#ffffff';
    const textColor = isDark ? '#f8fafc' : '#0f172a';
    const subtextColor = isDark ? '#94a3b8' : '#64748b';
    const gridColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';

    const padding = { top: 76, right: 76, bottom: 58, left: 130 };
    const chartW = width - padding.left - padding.right;
    const chartH = height - padding.top - padding.bottom;

    const xKey = chartData.xAxis.key;
    const categories = chartData.values.map((v) => String(v[xKey] ?? ''));
    const series = chartData.series.map((s, idx) => ({
      ...s,
      color: safeColor(s.color, DEFAULT_PALETTE[idx % DEFAULT_PALETTE.length]),
    }));

    let minVal = chartData.yAxis.min ?? 0;
    let maxVal = chartData.yAxis.max ?? -Infinity;
    for (const row of chartData.values) {
      for (const s of series) {
        const val = Number(row[s.key] ?? 0);
        if (val > maxVal) maxVal = val;
        if (val < minVal) minVal = val;
      }
    }
    if (maxVal <= minVal) maxVal = minVal + 10;

    const tickInfo = getNiceTicks(minVal, maxVal, 5);
    minVal = tickInfo.min;
    maxVal = tickInfo.max;
    const range = maxVal - minVal;

    const scaleX = (val: number) => padding.left + ((val - minVal) / range) * chartW;
    const rowH = chartH / Math.max(1, categories.length);

    return {
      bgColor,
      textColor,
      subtextColor,
      gridColor,
      padding,
      chartW,
      chartH,
      categories,
      series,
      minVal,
      maxVal,
      range,
      scaleX,
      rowH,
      ticks: tickInfo.ticks,
    };
  }

  /**
   * Cleveland dot plot: one marker per category, no stems.
   *
   * Reads as a ranking rather than a magnitude comparison, which makes it the
   * right default for "top N" style editorial charts.
   */
  private static renderDotPlot(
    chartData: ChartBlock['data'],
    width: number,
    height: number,
    isDark: boolean
  ): string {
    const L = this.horizontalLayout(chartData, width, height, isDark);

    let elements = '';
    elements += `<text x="${L.padding.left}" y="30" font-size="17" font-weight="700" fill="${L.textColor}" font-family="system-ui, -apple-system, sans-serif">${escapeXml(chartData.title)}</text>`;
    if (chartData.subtitle) {
      elements += `<text x="${L.padding.left}" y="50" font-size="12" fill="${L.subtextColor}" font-family="system-ui, -apple-system, sans-serif">${escapeXml(chartData.subtitle)}</text>`;
    }

    // Vertical grid lines + value labels
    for (const tickVal of L.ticks) {
      const x = L.scaleX(tickVal);
      elements += `<line x1="${x}" y1="${L.padding.top}" x2="${x}" y2="${L.padding.top + L.chartH}" stroke="${L.gridColor}" stroke-dasharray="3,3" />`;
      const numStr = formatChartValue(tickVal, L.range);
      elements += `<text x="${x}" y="${L.padding.top + L.chartH + 20}" text-anchor="middle" font-size="11" fill="${L.subtextColor}" font-family="system-ui, -apple-system, sans-serif">${escapeXml(chartData.yAxis.format ? `${chartData.yAxis.format}${numStr}` : numStr)}</text>`;
    }

    // One row per category
    chartData.values.forEach((row, rowIdx) => {
      const cy = L.padding.top + rowIdx * L.rowH + L.rowH / 2;

      elements += `<text x="${L.padding.left - 14}" y="${cy + 4}" text-anchor="end" font-size="12" font-weight="600" fill="${L.textColor}" font-family="system-ui, -apple-system, sans-serif">${escapeXml(L.categories[rowIdx])}</text>`;

      // Stems first, so the value labels always sit on top of them.
      L.series.forEach((s) => {
        const val = Number(row[s.key] ?? 0);
        const cx = L.scaleX(val);

        // Connector from the plot edge to the marker.
        elements += `<line x1="${L.padding.left}" y1="${cy}" x2="${cx}" y2="${cy}" stroke="${s.color}" stroke-opacity="0.28" stroke-width="2" />`;
        elements += `<circle cx="${cx}" cy="${cy}" r="7" fill="${L.bgColor}" stroke="${s.color}" stroke-width="3" data-val="${val}" />`;
      });

      L.series.forEach((s) => {
        const val = Number(row[s.key] ?? 0);
        const cx = L.scaleX(val);
        elements += `<text x="${cx + 14}" y="${cy + 4}" font-size="11" font-weight="700" fill="${s.color}" stroke="${L.bgColor}" stroke-width="3" paint-order="stroke" font-family="system-ui, -apple-system, sans-serif">${formatChartValue(val, L.range)}</text>`;
      });
    });

    elements += this.renderLegend(L.series, L.padding.left, 60, L.textColor);
    elements += this.renderSource(chartData, width, height, L.subtextColor);

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="100%" height="100%" style="background-color: ${L.bgColor}; border-radius: 12px;" role="img" aria-label="${escapeXml(chartData.title)}">${elements}</svg>`;
  }

  /**
   * Lollipop chart: a stem from the baseline out to a marker.
   *
   * Same geometry as a dot plot, but the stem encodes the distance from zero,
   * which keeps the magnitude readable while the circle stays the focal point.
   */
  private static renderLollipop(
    chartData: ChartBlock['data'],
    width: number,
    height: number,
    isDark: boolean
  ): string {
    const L = this.horizontalLayout(chartData, width, height, isDark);

    let elements = '';
    elements += `<text x="${L.padding.left}" y="30" font-size="17" font-weight="700" fill="${L.textColor}" font-family="system-ui, -apple-system, sans-serif">${escapeXml(chartData.title)}</text>`;
    if (chartData.subtitle) {
      elements += `<text x="${L.padding.left}" y="50" font-size="12" fill="${L.subtextColor}" font-family="system-ui, -apple-system, sans-serif">${escapeXml(chartData.subtitle)}</text>`;
    }

    // Baseline (zero) — the stems grow out of it.
    const zeroX = L.scaleX(Math.max(L.minVal, Math.min(0, L.maxVal)));
    elements += `<line x1="${zeroX}" y1="${L.padding.top}" x2="${zeroX}" y2="${L.padding.top + L.chartH}" stroke="${L.subtextColor}" stroke-opacity="0.35" stroke-width="1.5" />`;

    for (const tickVal of L.ticks) {
      const x = L.scaleX(tickVal);
      elements += `<line x1="${x}" y1="${L.padding.top}" x2="${x}" y2="${L.padding.top + L.chartH}" stroke="${L.gridColor}" stroke-dasharray="3,3" />`;
      const numStr = formatChartValue(tickVal, L.range);
      elements += `<text x="${x}" y="${L.padding.top + L.chartH + 20}" text-anchor="middle" font-size="11" fill="${L.subtextColor}" font-family="system-ui, -apple-system, sans-serif">${escapeXml(chartData.yAxis.format ? `${chartData.yAxis.format}${numStr}` : numStr)}</text>`;
    }

    chartData.values.forEach((row, rowIdx) => {
      const cy = L.padding.top + rowIdx * L.rowH + L.rowH / 2;

      elements += `<text x="${L.padding.left - 14}" y="${cy + 4}" text-anchor="end" font-size="12" font-weight="600" fill="${L.textColor}" font-family="system-ui, -apple-system, sans-serif">${escapeXml(L.categories[rowIdx])}</text>`;

      L.series.forEach((s) => {
        const val = Number(row[s.key] ?? 0);
        const cx = L.scaleX(val);

        elements += `<line x1="${zeroX}" y1="${cy}" x2="${cx}" y2="${cy}" stroke="${s.color}" stroke-width="3" stroke-linecap="round" />`;
        elements += `<circle cx="${cx}" cy="${cy}" r="8" fill="${s.color}" stroke="${L.bgColor}" stroke-width="2" data-val="${val}" />`;
      });

      // Labels last, with a background-coloured halo so they stay readable
      // where one series' stem runs under another series' value.
      L.series.forEach((s) => {
        const val = Number(row[s.key] ?? 0);
        const cx = L.scaleX(val);
        elements += `<text x="${cx + 16}" y="${cy + 4}" font-size="11" font-weight="700" fill="${L.textColor}" stroke="${L.bgColor}" stroke-width="3" paint-order="stroke" font-family="system-ui, -apple-system, sans-serif">${formatChartValue(val, L.range)}</text>`;
      });
    });

    elements += this.renderLegend(L.series, L.padding.left, 60, L.textColor);
    elements += this.renderSource(chartData, width, height, L.subtextColor);

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="100%" height="100%" style="background-color: ${L.bgColor}; border-radius: 12px;" role="img" aria-label="${escapeXml(chartData.title)}">${elements}</svg>`;
  }

  /**
   * Diverging bar chart: negative values extend left of a centred zero line,
   * positive values extend right.
   */
  private static renderDivergingBar(
    chartData: ChartBlock['data'],
    width: number,
    height: number,
    isDark: boolean
  ): string {
    const bgColor = isDark ? '#0f172a' : '#ffffff';
    const textColor = isDark ? '#f8fafc' : '#0f172a';
    const subtextColor = isDark ? '#94a3b8' : '#64748b';
    const gridColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';

    const padding = { top: 76, right: 40, bottom: 58, left: 70 };
    const chartW = width - padding.left - padding.right;
    const chartH = height - padding.top - padding.bottom;

    const xKey = chartData.xAxis.key;
    const categories = chartData.values.map((v) => String(v[xKey] ?? ''));
    const series = chartData.series.map((s, idx) => ({
      ...s,
      color: safeColor(s.color, DEFAULT_PALETTE[idx % DEFAULT_PALETTE.length]),
    }));

    let minVal = 0;
    let maxVal = 0;
    for (const row of chartData.values) {
      for (const s of series) {
        const val = Number(row[s.key] ?? 0);
        maxVal = Math.max(maxVal, val);
        minVal = Math.min(minVal, val);
      }
    }
    if (maxVal === 0 && minVal === 0) maxVal = 10;
    if (maxVal === minVal) maxVal = minVal + 10;

    const tickInfo = getNiceTicks(minVal, maxVal, 5);
    const lo = tickInfo.min;
    const hi = tickInfo.max;
    const range = hi - lo;

    const scaleY = (val: number) => padding.top + chartH - ((val - lo) / range) * chartH;
    const zeroY = scaleY(0);

    let elements = '';
    elements += `<text x="${padding.left}" y="30" font-size="17" font-weight="700" fill="${textColor}" font-family="system-ui, -apple-system, sans-serif">${escapeXml(chartData.title)}</text>`;
    if (chartData.subtitle) {
      elements += `<text x="${padding.left}" y="50" font-size="12" fill="${subtextColor}" font-family="system-ui, -apple-system, sans-serif">${escapeXml(chartData.subtitle)}</text>`;
    }

    for (const tickVal of tickInfo.ticks) {
      const y = scaleY(tickVal);
      elements += `<line x1="${padding.left}" y1="${y}" x2="${width - padding.right}" y2="${y}" stroke="${gridColor}" stroke-dasharray="3,3" />`;
      const numStr = formatChartValue(tickVal, range);
      elements += `<text x="${padding.left - 10}" y="${y + 4}" text-anchor="end" font-size="11" fill="${subtextColor}" font-family="system-ui, -apple-system, sans-serif">${escapeXml(chartData.yAxis.format ? `${chartData.yAxis.format}${numStr}` : numStr)}</text>`;
    }

    const bandWidth = chartW / Math.max(1, categories.length);
    const barWidth = Math.max(3, (bandWidth * 0.7) / series.length);

    chartData.values.forEach((row, rowIdx) => {
      const groupX = padding.left + rowIdx * bandWidth + (bandWidth * 0.15) / 2;

      series.forEach((s, sIdx) => {
        const val = Number(row[s.key] ?? 0);
        const bx = groupX + sIdx * barWidth;
        const by = scaleY(Math.max(0, val));
        const bh = Math.max(1, Math.abs(scaleY(val) - zeroY));
        // A negative value hangs below the zero line, so it needs a negative y.
        const top = val >= 0 ? by : zeroY;

        elements += `<rect x="${bx}" y="${top}" width="${Math.max(2, barWidth - 2)}" height="${bh}" rx="2" fill="${s.color}" data-val="${val}" />`;
      });

      elements += `<text x="${padding.left + rowIdx * bandWidth + bandWidth / 2}" y="${padding.top + chartH + 20}" text-anchor="middle" font-size="12" fill="${subtextColor}" font-family="system-ui, -apple-system, sans-serif">${escapeXml(categories[rowIdx])}</text>`;
    });

    // The zero line is drawn last so it sits above the bars.
    elements += `<line x1="${padding.left}" y1="${zeroY}" x2="${width - padding.right}" y2="${zeroY}" stroke="${textColor}" stroke-opacity="0.55" stroke-width="1.5" />`;

    elements += this.renderLegend(series, padding.left, 60, textColor);
    elements += this.renderSource(chartData, width, height, subtextColor);

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="100%" height="100%" style="background-color: ${bgColor}; border-radius: 12px;" role="img" aria-label="${escapeXml(chartData.title)}">${elements}</svg>`;
  }

  /**
   * Sparkline: the trend of a single series with no axes, ticks or legend.
   */
  private static renderSparkline(
    chartData: ChartBlock['data'],
    width: number,
    height: number,
    isDark: boolean
  ): string {
    const bgColor = isDark ? '#0f172a' : '#ffffff';
    const textColor = isDark ? '#f8fafc' : '#0f172a';
    const subtextColor = isDark ? '#94a3b8' : '#64748b';

    const series = chartData.series[0] || { name: 'Trend', key: 'value' };
    const color = safeColor(series.color, DEFAULT_PALETTE[0]);
    const values = chartData.values.map((v) => Number(v[series.key] ?? 0));

    const padding = { top: 14, right: 20, bottom: 14, left: 20 };
    const chartW = width - padding.left - padding.right;
    const chartH = height - padding.top - padding.bottom;

    let elements = '';
    if (chartData.title) {
      elements += `<text x="${padding.left}" y="12" font-size="12" font-weight="700" fill="${textColor}" font-family="system-ui, -apple-system, sans-serif">${escapeXml(chartData.title)}</text>`;
    }

    if (values.length === 0) {
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="100%" height="100%" style="background-color: ${bgColor}; border-radius: 12px;" role="img" aria-label="${escapeXml(chartData.title)}">${elements}</svg>`;
    }

    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;

    const points = values.map((val, idx) => {
      const x = padding.left + (idx / Math.max(1, values.length - 1)) * chartW;
      const y = padding.top + chartH - ((val - min) / range) * chartH;
      return { x, y, val };
    });

    const path = points.map((p) => `${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(' ');
    const areaPath = `${padding.left},${padding.top + chartH} ${path} ${padding.left + chartW},${padding.top + chartH}`;

    elements += `<polygon points="${areaPath}" fill="${color}" fill-opacity="0.14" />`;
    elements += `<polyline points="${path}" fill="none" stroke="${color}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />`;

    const last = points[points.length - 1];
    elements += `<circle cx="${last.x}" cy="${last.y}" r="4" fill="${color}" />`;
    elements += `<text x="${last.x - 8}" y="${last.y - 10}" text-anchor="end" font-size="11" font-weight="700" fill="${textColor}" stroke="${bgColor}" stroke-width="3" paint-order="stroke" font-family="system-ui, -apple-system, sans-serif">${formatChartValue(last.val, range)}</text>`;

    if (chartData.sourceAttribution) {
      elements += `<text x="${padding.left}" y="${height - 4}" font-size="10" fill="${subtextColor}" font-style="italic" font-family="system-ui, -apple-system, sans-serif">Source: ${escapeXml(chartData.sourceAttribution)}</text>`;
    }

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="100%" height="100%" style="background-color: ${bgColor}; border-radius: 12px;" role="img" aria-label="${escapeXml(chartData.title)}">${elements}</svg>`;
  }

  /**
   * Bump chart: how the ranking of a set of entities changes over time.
   *
   * `values` holds one row per time step; each series is an entity and its
   * value is that entity's rank in that step (1 = best).
   */
  private static renderBump(
    chartData: ChartBlock['data'],
    width: number,
    height: number,
    isDark: boolean
  ): string {
    const bgColor = isDark ? '#0f172a' : '#ffffff';
    const textColor = isDark ? '#f8fafc' : '#0f172a';
    const subtextColor = isDark ? '#94a3b8' : '#64748b';
    const gridColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';

    const padding = { top: 80, right: 150, bottom: 56, left: 60 };
    const chartW = width - padding.left - padding.right;
    const chartH = height - padding.top - padding.bottom;

    const xKey = chartData.xAxis.key;
    const steps = chartData.values.map((v) => String(v[xKey] ?? ''));
    const series = chartData.series.map((s, idx) => ({
      ...s,
      color: safeColor(s.color, DEFAULT_PALETTE[idx % DEFAULT_PALETTE.length]),
    }));

    // Rank bounds across every series and step.
    let minRank = Infinity;
    let maxRank = 0;
    for (const row of chartData.values) {
      for (const s of series) {
        const rank = Number(row[s.key] ?? 0);
        if (rank > 0) {
          minRank = Math.min(minRank, rank);
          maxRank = Math.max(maxRank, rank);
        }
      }
    }
    if (!Number.isFinite(minRank) || maxRank === 0) {
      minRank = 1;
      maxRank = Math.max(1, series.length);
    }

    const scaleX = (idx: number) =>
      padding.left + (steps.length > 1 ? (idx / (steps.length - 1)) * chartW : chartW / 2);
    const scaleY = (rank: number) => {
      const span = Math.max(1, maxRank - minRank);
      return padding.top + ((rank - minRank) / span) * chartH;
    };

    let elements = '';
    elements += `<text x="${padding.left}" y="30" font-size="17" font-weight="700" fill="${textColor}" font-family="system-ui, -apple-system, sans-serif">${escapeXml(chartData.title)}</text>`;
    if (chartData.subtitle) {
      elements += `<text x="${padding.left}" y="50" font-size="12" fill="${subtextColor}" font-family="system-ui, -apple-system, sans-serif">${escapeXml(chartData.subtitle)}</text>`;
    }

    // Rank guide lines
    for (let rank = minRank; rank <= maxRank; rank++) {
      const y = scaleY(rank);
      elements += `<line x1="${padding.left}" y1="${y}" x2="${padding.left + chartW}" y2="${y}" stroke="${gridColor}" stroke-dasharray="3,3" />`;
      elements += `<text x="${padding.left - 12}" y="${y + 4}" text-anchor="end" font-size="10" fill="${subtextColor}" font-family="system-ui, -apple-system, sans-serif">#${rank}</text>`;
    }

    // Time step labels
    steps.forEach((step, idx) => {
      elements += `<text x="${scaleX(idx)}" y="${padding.top + chartH + 22}" text-anchor="middle" font-size="11" fill="${subtextColor}" font-family="system-ui, -apple-system, sans-serif">${escapeXml(step)}</text>`;
    });

    series.forEach((s) => {
      const points: string[] = [];
      let lastX = padding.left;
      let lastY = padding.top;
      let hasPoint = false;

      chartData.values.forEach((row, idx) => {
        const rank = Number(row[s.key] ?? 0);
        if (rank <= 0) return;
        const x = scaleX(idx);
        const y = scaleY(rank);
        points.push(`${x.toFixed(2)},${y.toFixed(2)}`);
        lastX = x;
        lastY = y;
        hasPoint = true;
      });

      if (!hasPoint) return;

      elements += `<polyline points="${points.join(' ')}" fill="none" stroke="${s.color}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />`;

      chartData.values.forEach((row, idx) => {
        const rank = Number(row[s.key] ?? 0);
        if (rank <= 0) return;
        elements += `<circle cx="${scaleX(idx)}" cy="${scaleY(rank)}" r="5" fill="${bgColor}" stroke="${s.color}" stroke-width="2.5" />`;
      });

      // Label the entity at its final position.
      elements += `<text x="${lastX + 12}" y="${lastY + 4}" font-size="11" font-weight="700" fill="${s.color}" font-family="system-ui, -apple-system, sans-serif">${escapeXml(s.name)}</text>`;
    });

    elements += this.renderSource(chartData, width, height, subtextColor);

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="100%" height="100%" style="background-color: ${bgColor}; border-radius: 12px;" role="img" aria-label="${escapeXml(chartData.title)}">${elements}</svg>`;
  }

  /**
   * Radar chart: several series compared across a shared set of axes.
   *
   * Each axis is normalised against the series that share it, so the shape
   * shows relative standing rather than raw units.
   */
  private static renderRadar(
    chartData: ChartBlock['data'],
    width: number,
    height: number,
    isDark: boolean
  ): string {
    const bgColor = isDark ? '#0f172a' : '#ffffff';
    const textColor = isDark ? '#f8fafc' : '#0f172a';
    const subtextColor = isDark ? '#94a3b8' : '#64748b';
    const gridColor = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)';

    const padding = { top: 80, right: 60, bottom: 70, left: 60 };
    const chartW = width - padding.left - padding.right;
    const chartH = height - padding.top - padding.bottom;

    const xKey = chartData.xAxis.key;
    const axes = chartData.values.map((v) => String(v[xKey] ?? ''));
    const series = chartData.series.map((s, idx) => ({
      ...s,
      color: safeColor(s.color, DEFAULT_PALETTE[idx % DEFAULT_PALETTE.length]),
    }));

    const cx = padding.left + chartW / 2;
    const cy = padding.top + chartH / 2;
    const radius = Math.min(chartW, chartH) / 2 - 30;

    // Normalise every axis against the values the series share for it.
    const normalized = axes.map((_, axisIdx) => {
      const raw = series.map((s) => Number(chartData.values[axisIdx]?.[s.key] ?? 0));
      const min = Math.min(...raw);
      const max = Math.max(...raw);
      const span = max - min || 1;
      return raw.map((v) => (max === min ? 0.5 : (v - min) / span));
    });

    const angleFor = (axisIdx: number) => {
      const angle = (Math.PI * 2 * axisIdx) / Math.max(1, axes.length) - Math.PI / 2;
      return { x: cx + radius * Math.cos(angle), y: cy + radius * Math.sin(angle) };
    };

    let elements = '';
    elements += `<text x="${padding.left}" y="30" font-size="17" font-weight="700" fill="${textColor}" font-family="system-ui, -apple-system, sans-serif">${escapeXml(chartData.title)}</text>`;
    if (chartData.subtitle) {
      elements += `<text x="${padding.left}" y="50" font-size="12" fill="${subtextColor}" font-family="system-ui, -apple-system, sans-serif">${escapeXml(chartData.subtitle)}</text>`;
    }

    // Concentric rings
    for (let ring = 1; ring <= 4; ring++) {
      const r = (radius * ring) / 4;
      const pts = axes
        .map((_, axisIdx) => {
          const angle = (Math.PI * 2 * axisIdx) / Math.max(1, axes.length) - Math.PI / 2;
          return `${(cx + r * Math.cos(angle)).toFixed(2)},${(cy + r * Math.sin(angle)).toFixed(2)}`;
        })
        .join(' ');
      elements += `<polygon points="${pts}" fill="none" stroke="${gridColor}" stroke-width="1" />`;
    }

    // Radial axes + labels
    axes.forEach((axisLabel, axisIdx) => {
      const end = angleFor(axisIdx);
      elements += `<line x1="${cx}" y1="${cy}" x2="${end.x}" y2="${end.y}" stroke="${gridColor}" stroke-width="1" />`;
      const labelX =
        cx +
        (radius + 18) * Math.cos((Math.PI * 2 * axisIdx) / Math.max(1, axes.length) - Math.PI / 2);
      const labelY =
        cy +
        (radius + 18) * Math.sin((Math.PI * 2 * axisIdx) / Math.max(1, axes.length) - Math.PI / 2);
      elements += `<text x="${labelX}" y="${labelY + 4}" text-anchor="middle" font-size="11" font-weight="600" fill="${subtextColor}" font-family="system-ui, -apple-system, sans-serif">${escapeXml(axisLabel)}</text>`;
    });

    // One polygon per series
    series.forEach((s, sIdx) => {
      const pts = normalized
        .map((axisValues, axisIdx) => {
          const ratio = axisValues[sIdx];
          const angle = (Math.PI * 2 * axisIdx) / Math.max(1, axes.length) - Math.PI / 2;
          const r = radius * ratio;
          return `${(cx + r * Math.cos(angle)).toFixed(2)},${(cy + r * Math.sin(angle)).toFixed(2)}`;
        })
        .join(' ');

      elements += `<polygon points="${pts}" fill="${s.color}" fill-opacity="0.18" stroke="${s.color}" stroke-width="2.5" stroke-linejoin="round" />`;

      normalized.forEach((axisValues, axisIdx) => {
        const ratio = axisValues[sIdx];
        const angle = (Math.PI * 2 * axisIdx) / Math.max(1, axes.length) - Math.PI / 2;
        const r = radius * ratio;
        elements += `<circle cx="${(cx + r * Math.cos(angle)).toFixed(2)}" cy="${(cy + r * Math.sin(angle)).toFixed(2)}" r="4" fill="${s.color}" />`;
      });
    });

    elements += this.renderLegend(series, padding.left, 60, textColor);
    elements += this.renderSource(chartData, width, height, subtextColor);

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="100%" height="100%" style="background-color: ${bgColor}; border-radius: 12px;" role="img" aria-label="${escapeXml(chartData.title)}">${elements}</svg>`;
  }

  /**
   * Small multiples: one mini chart per facet.
   *
   * `facetField` names the column that splits the rows into panels. Every
   * panel gets its own y-scale so a small-value facet is still readable.
   */
  private static renderSmallMultiples(
    chartData: ChartBlock['data'],
    width: number,
    height: number,
    isDark: boolean
  ): string {
    const bgColor = isDark ? '#0f172a' : '#ffffff';
    const textColor = isDark ? '#f8fafc' : '#0f172a';
    const subtextColor = isDark ? '#94a3b8' : '#64748b';
    const gridColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';

    const facetField = chartData.facetField;
    const xKey = chartData.xAxis.key;

    // Without a facet field there is nothing to split on — fall back to one
    // panel per row so the block still renders meaningful output.
    const groups = new Map<string, Array<Record<string, unknown>>>();
    chartData.values.forEach((row) => {
      const key = facetField ? String(row[facetField] ?? '') : String(row[xKey] ?? '');
      const bucket = groups.get(key);
      if (bucket) bucket.push(row);
      else groups.set(key, [row]);
    });

    const panels = Array.from(groups.entries());
    const columns = Math.min(3, Math.max(1, Math.ceil(Math.sqrt(panels.length))));
    const rows = Math.ceil(panels.length / columns);

    const margin = { top: 74, right: 24, bottom: 24, left: 24 };
    const gap = 26;
    const gridW = width - margin.left - margin.right;
    const gridH = height - margin.top - margin.bottom;
    const panelW = (gridW - gap * (columns - 1)) / columns;
    const panelH = (gridH - gap * (rows - 1)) / rows;

    const series = chartData.series.map((s, idx) => ({
      ...s,
      color: safeColor(s.color, DEFAULT_PALETTE[idx % DEFAULT_PALETTE.length]),
    }));

    let elements = '';
    elements += `<text x="${margin.left}" y="30" font-size="17" font-weight="700" fill="${textColor}" font-family="system-ui, -apple-system, sans-serif">${escapeXml(chartData.title)}</text>`;
    if (chartData.subtitle) {
      elements += `<text x="${margin.left}" y="50" font-size="12" fill="${subtextColor}" font-family="system-ui, -apple-system, sans-serif">${escapeXml(chartData.subtitle)}</text>`;
    }

    panels.forEach(([facetName, facetRows], panelIdx) => {
      const col = panelIdx % columns;
      const row = Math.floor(panelIdx / columns);
      const px = margin.left + col * (panelW + gap);
      const py = margin.top + row * (panelH + gap);

      const panelPadding = { top: 24, right: 12, bottom: 22, left: 44 };
      const plotW = panelW - panelPadding.left - panelPadding.right;
      const plotH = panelH - panelPadding.top - panelPadding.bottom;

      elements += `<rect x="${px}" y="${py}" width="${panelW}" height="${panelH}" rx="8" fill="none" stroke="${gridColor}" stroke-width="1" />`;
      elements += `<text x="${px + panelPadding.left}" y="${py + 15}" font-size="11" font-weight="700" fill="${textColor}" font-family="system-ui, -apple-system, sans-serif">${escapeXml(facetName)}</text>`;

      let minVal = Infinity;
      let maxVal = -Infinity;
      for (const facetRow of facetRows) {
        for (const s of series) {
          const val = Number(facetRow[s.key] ?? 0);
          minVal = Math.min(minVal, val);
          maxVal = Math.max(maxVal, val);
        }
      }
      if (!Number.isFinite(minVal) || maxVal === minVal) {
        minVal = Math.min(0, minVal === Infinity ? 0 : minVal);
        maxVal = minVal + 10;
      }

      const scaleY = (val: number) =>
        py + panelPadding.top + plotH - ((val - minVal) / (maxVal - minVal)) * plotH;
      const scaleX = (idx: number) =>
        px +
        panelPadding.left +
        (facetRows.length > 1 ? (idx / (facetRows.length - 1)) * plotW : plotW / 2);

      // Baseline + y labels
      const baseY = scaleY(Math.max(minVal, 0));
      elements += `<line x1="${px + panelPadding.left}" y1="${baseY}" x2="${px + panelPadding.left + plotW}" y2="${baseY}" stroke="${gridColor}" stroke-width="1" />`;
      elements += `<text x="${px + panelPadding.left - 6}" y="${scaleY(maxVal) + 4}" text-anchor="end" font-size="9" fill="${subtextColor}" font-family="system-ui, -apple-system, sans-serif">${formatChartValue(maxVal, maxVal - minVal)}</text>`;
      elements += `<text x="${px + panelPadding.left - 6}" y="${scaleY(minVal) + 4}" text-anchor="end" font-size="9" fill="${subtextColor}" font-family="system-ui, -apple-system, sans-serif">${formatChartValue(minVal, maxVal - minVal)}</text>`;

      series.forEach((s) => {
        const points = facetRows.map((facetRow, idx) => {
          const val = Number(facetRow[s.key] ?? 0);
          return `${scaleX(idx).toFixed(2)},${scaleY(val).toFixed(2)}`;
        });

        if (points.length === 1) {
          const val = Number(facetRows[0][s.key] ?? 0);
          elements += `<circle cx="${scaleX(0)}" cy="${scaleY(val)}" r="4" fill="${s.color}" />`;
        } else {
          elements += `<polyline points="${points.join(' ')}" fill="none" stroke="${s.color}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />`;
          facetRows.forEach((facetRow, idx) => {
            const val = Number(facetRow[s.key] ?? 0);
            elements += `<circle cx="${scaleX(idx)}" cy="${scaleY(val)}" r="3" fill="${s.color}" />`;
          });
        }
      });

      // X labels: first and last category of the panel.
      if (facetRows.length > 0) {
        const firstLabel = String(facetRows[0][xKey] ?? '');
        const lastLabel = String(facetRows[facetRows.length - 1][xKey] ?? '');
        elements += `<text x="${scaleX(0)}" y="${py + panelPadding.top + plotH + 14}" text-anchor="middle" font-size="9" fill="${subtextColor}" font-family="system-ui, -apple-system, sans-serif">${escapeXml(firstLabel)}</text>`;
        if (facetRows.length > 1) {
          elements += `<text x="${scaleX(facetRows.length - 1)}" y="${py + panelPadding.top + plotH + 14}" text-anchor="middle" font-size="9" fill="${subtextColor}" font-family="system-ui, -apple-system, sans-serif">${escapeXml(lastLabel)}</text>`;
        }
      }
    });

    elements += this.renderSource(chartData, width, height, subtextColor);

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="100%" height="100%" style="background-color: ${bgColor}; border-radius: 12px;" role="img" aria-label="${escapeXml(chartData.title)}">${elements}</svg>`;
  }

  /** Legend row shared by the chart types that render their own legend. */
  private static renderLegend(
    series: Array<{ name: string; color: string }>,
    startX: number,
    y: number,
    textColor: string
  ): string {
    if (series.length <= 1) return '';
    let legend = '';
    let x = startX;
    series.forEach((s) => {
      const itemWidth = Math.max(90, Math.ceil(s.name.length * 7.2) + 36);
      legend += `<g transform="translate(${x}, ${y})"><rect width="12" height="12" rx="2.5" fill="${s.color}" /><text x="18" y="10" font-size="11" font-weight="600" fill="${textColor}" font-family="system-ui, -apple-system, sans-serif">${escapeXml(s.name)}</text></g>`;
      x += itemWidth;
    });
    return legend;
  }

  /** Source attribution footnote shared by the chart types that render one. */
  private static renderSource(
    chartData: ChartBlock['data'],
    width: number,
    height: number,
    subtextColor: string
  ): string {
    if (!chartData.sourceAttribution) return '';
    return `<text x="${width - 40}" y="${height - 12}" text-anchor="end" font-size="10" fill="${subtextColor}" font-style="italic" font-family="system-ui, -apple-system, sans-serif">Source: ${escapeXml(chartData.sourceAttribution)}</text>`;
  }
}
