import type { TimelineBlock } from '@ai-news/schemas';
import { escapeXml } from '@ai-news/shared';

export interface FormattedTimelineItem {
  id: string;
  date: string;
  headline: string;
  body: string;
  entityIds: string[];
  sourceIds: string[];
  mediaUrl?: string;
  stepNumber: number;
}

export class TimelineRenderer {
  /**
   * Transforms raw TimelineBlock data into formatted chronological milestone nodes.
   */
  static transformItems(data: TimelineBlock['data']): FormattedTimelineItem[] {
    return data.items.map((item, idx) => ({
      id: `tl_item_${idx}`,
      date: item.date,
      headline: item.headline,
      body: item.body,
      entityIds: item.entityIds || [],
      sourceIds: item.sourceIds || [],
      mediaUrl: item.mediaUrl,
      stepNumber: idx + 1,
    }));
  }

  /**
   * Generates responsive HTML/SVG representation for desktop horizontal tracks or mobile vertical tracks.
   */
  static renderSvgTrack(
    data: TimelineBlock['data'],
    layout: 'horizontal' | 'vertical' = 'horizontal',
    width = 800,
    height = 240,
    theme: 'dark' | 'light' = 'dark'
  ): string {
    const isDark = theme === 'dark';
    const bgColor = isDark ? '#0f172a' : '#ffffff';
    const textColor = isDark ? '#f8fafc' : '#0f172a';
    const subtextColor = isDark ? '#94a3b8' : '#64748b';
    const trackColor = isDark ? '#334155' : '#cbd5e1';
    const cardBg = isDark ? 'rgba(30, 41, 59, 0.7)' : 'rgba(248, 250, 252, 0.9)';
    const cardBorder = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)';
    const activeColor = '#3b82f6';

    const items = this.transformItems(data);
    let elements = '';

    const wrapLines = (text: string, maxCharsPerLine: number, maxLines = 2): string[] => {
      if (!text) return [];
      const words = text.trim().split(/\s+/);
      const lines: string[] = [];
      let currentLine = '';

      for (const word of words) {
        if ((currentLine + (currentLine ? ' ' : '') + word).length <= maxCharsPerLine) {
          currentLine += (currentLine ? ' ' : '') + word;
        } else {
          if (currentLine) lines.push(currentLine);
          if (lines.length >= maxLines) break;
          currentLine = word;
        }
      }
      if (currentLine && lines.length < maxLines) {
        lines.push(currentLine);
      }
      return lines;
    };

    if (layout === 'horizontal') {
      const lineY = 82;
      const count = items.length;
      const startX = count <= 2 ? 160 : count === 3 ? 120 : 80;
      const endX = width - startX;
      const stepX = count > 1 ? (endX - startX) / (count - 1) : 0;
      const cardWidth = count <= 2 ? 300 : count === 3 ? 230 : 180;
      const maxHeadlineChars = count <= 2 ? 40 : count === 3 ? 30 : 22;
      const maxBodyChars = count <= 2 ? 46 : count === 3 ? 35 : 26;

      // Base Track Line
      elements += `<line x1="${startX}" y1="${lineY}" x2="${endX}" y2="${lineY}" stroke="${trackColor}" stroke-width="4" stroke-linecap="round" />`;

      const cardH = 110;
      const cardTopY = lineY + 16;

      items.forEach((item, idx) => {
        const cx = count === 1 ? width / 2 : startX + idx * stepX;
        const headlineLines = wrapLines(item.headline, maxHeadlineChars, 2);
        const bodyLines = wrapLines(item.body, maxBodyChars, 2);

        // Date pill badge above track
        const dateBadge = `
          <rect x="${cx - 50}" y="${lineY - 38}" width="100" height="22" rx="11" fill="${isDark ? 'rgba(59,130,246,0.18)' : 'rgba(59,130,246,0.1)'}" stroke="${isDark ? 'rgba(59,130,246,0.3)' : 'rgba(59,130,246,0.2)'}" stroke-width="1" />
          <text x="${cx}" y="${lineY - 23}" text-anchor="middle" font-size="11" font-weight="700" fill="${activeColor}" font-family="system-ui, sans-serif">${escapeXml(item.date)}</text>
        `;

        // Node circle with pulse
        const nodeCircles = `
          <circle cx="${cx}" cy="${lineY}" r="12" fill="${bgColor}" stroke="${activeColor}" stroke-width="3" />
          <circle cx="${cx}" cy="${lineY}" r="5" fill="${activeColor}" />
        `;

        // Milestone card below track
        const cardBox = `
          <rect x="${cx - cardWidth / 2}" y="${cardTopY}" width="${cardWidth}" height="${cardH}" rx="10" fill="${cardBg}" stroke="${cardBorder}" stroke-width="1" />
        `;

        // Headline lines
        const hlTspans = headlineLines
          .map(
            (line, lIdx) =>
              `<tspan x="${cx}" dy="${lIdx === 0 ? 0 : 16}">${escapeXml(line)}</tspan>`
          )
          .join('');
        const headlineY = cardTopY + 22;
        const headlineText = `
          <text x="${cx}" y="${headlineY}" text-anchor="middle" font-size="12.5" font-weight="700" fill="${textColor}" font-family="system-ui, -apple-system, sans-serif">${hlTspans}</text>
        `;

        // Body lines
        const bodyStartY = headlineY + headlineLines.length * 16 + 6;
        const bodyTspans = bodyLines
          .map(
            (line, lIdx) =>
              `<tspan x="${cx}" dy="${lIdx === 0 ? 0 : 14}">${escapeXml(line)}</tspan>`
          )
          .join('');
        const bodyText = `
          <text x="${cx}" y="${bodyStartY}" text-anchor="middle" font-size="11" fill="${subtextColor}" font-family="system-ui, -apple-system, sans-serif">${bodyTspans}</text>
        `;

        elements += `
          <g class="timeline-milestone-node">
            ${dateBadge}
            ${nodeCircles}
            ${cardBox}
            ${headlineText}
            ${bodyText}
          </g>
        `;
      });

      const effectiveHeight = cardTopY + cardH + 16;

      return `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${effectiveHeight}" width="100%" height="100%" style="background-color: ${bgColor}; border-radius: 12px; overflow: hidden;" role="img" aria-label="${escapeXml(data.title || 'Timeline')}">
          <text x="30" y="30" font-size="16" font-weight="700" fill="${textColor}" font-family="system-ui, -apple-system, sans-serif">${escapeXml(data.title || 'Chronology of Events')}</text>
          ${elements}
        </svg>
      `;
    } else {
      // Vertical Track Layout
      const spineX = 45;
      const startY = 70;
      const stepY = 95;
      const endY = startY + (items.length - 1) * stepY;
      const effectiveHeight = Math.max(height, startY + items.length * stepY + 25);

      if (items.length > 1) {
        elements += `<line x1="${spineX}" y1="${startY}" x2="${spineX}" y2="${endY}" stroke="${trackColor}" stroke-width="4" stroke-linecap="round" />`;
      }

      items.forEach((item, idx) => {
        const cy = startY + idx * stepY;
        const bodyLines = wrapLines(item.body, 70, 2);
        const bodyTspans = bodyLines
          .map(
            (line, lIdx) => `<tspan x="72" dy="${lIdx === 0 ? 0 : 15}">${escapeXml(line)}</tspan>`
          )
          .join('');

        elements += `
          <g class="timeline-vertical-node">
            <circle cx="${spineX}" cy="${cy}" r="12" fill="${bgColor}" stroke="${activeColor}" stroke-width="3" />
            <text x="${spineX}" y="${cy + 4}" text-anchor="middle" font-size="10" font-weight="800" fill="${activeColor}" font-family="system-ui, sans-serif">${item.stepNumber}</text>
            
            <!-- Date Badge -->
            <rect x="72" y="${cy - 22}" width="86" height="20" rx="10" fill="${isDark ? 'rgba(59,130,246,0.18)' : 'rgba(59,130,246,0.1)'}" />
            <text x="115" y="${cy - 8}" text-anchor="middle" font-size="10" font-weight="700" fill="${activeColor}" font-family="system-ui, sans-serif">${escapeXml(item.date)}</text>
            
            <!-- Headline -->
            <text x="172" y="${cy - 8}" font-size="13" font-weight="700" fill="${textColor}" font-family="system-ui, -apple-system, sans-serif">${escapeXml(item.headline)}</text>
            
            <!-- Body snippet -->
            <text x="72" y="${cy + 16}" font-size="11" fill="${subtextColor}" font-family="system-ui, -apple-system, sans-serif">${bodyTspans}</text>
          </g>
        `;
      });

      return `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${effectiveHeight}" width="100%" height="100%" style="background-color: ${bgColor}; border-radius: 12px; overflow: hidden;" role="img" aria-label="${escapeXml(data.title || 'Timeline')}">
          <text x="30" y="32" font-size="16" font-weight="700" fill="${textColor}" font-family="system-ui, -apple-system, sans-serif">${escapeXml(data.title || 'Chronology of Events')}</text>
          ${elements}
        </svg>
      `;
    }
  }
}
