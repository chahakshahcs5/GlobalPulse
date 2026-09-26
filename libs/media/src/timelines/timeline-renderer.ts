import type { TimelineBlock } from '@ai-news/schemas';

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
    height = 250,
    theme: 'dark' | 'light' = 'dark'
  ): string {
    const isDark = theme === 'dark';
    const bgColor = isDark ? '#0f172a' : '#ffffff';
    const textColor = isDark ? '#f8fafc' : '#0f172a';
    const subtextColor = isDark ? '#94a3b8' : '#64748b';
    const trackColor = isDark ? '#334155' : '#cbd5e1';
    const activeColor = '#3b82f6';

    const items = this.transformItems(data);
    let elements = '';
    const effectiveHeight = layout === 'vertical' ? Math.max(height, 70 + items.length * 90 + 30) : height;

    if (layout === 'horizontal') {
      const lineY = 80;
      const startX = 60;
      const endX = width - 60;
      const stepX = items.length > 1 ? (endX - startX) / (items.length - 1) : 0;

      // Base Track Line
      elements += `<line x1="${startX}" y1="${lineY}" x2="${endX}" y2="${lineY}" stroke="${trackColor}" stroke-width="4" stroke-linecap="round" />`;

      items.forEach((item, idx) => {
        const cx = items.length === 1 ? width / 2 : startX + idx * stepX;
        // Node circle
        elements += `
          <circle cx="${cx}" cy="${lineY}" r="12" fill="${bgColor}" stroke="${activeColor}" stroke-width="3" />
          <circle cx="${cx}" cy="${lineY}" r="5" fill="${activeColor}" />
          <!-- Date Badge -->
          <rect x="${cx - 45}" y="${lineY - 40}" width="90" height="24" rx="12" fill="${isDark ? 'rgba(59,130,246,0.15)' : 'rgba(59,130,246,0.1)'}" />
          <text x="${cx}" y="${lineY - 24}" text-anchor="middle" font-size="11" font-weight="700" fill="${activeColor}" font-family="system-ui, sans-serif">${escapeXml(item.date)}</text>
          <!-- Headline -->
          <text x="${cx}" y="${lineY + 36}" text-anchor="middle" font-size="13" font-weight="700" fill="${textColor}" font-family="system-ui, sans-serif">${escapeXml(item.headline)}</text>
          <!-- Body snippet -->
          <text x="${cx}" y="${lineY + 54}" text-anchor="middle" font-size="11" fill="${subtextColor}" font-family="system-ui, sans-serif">${escapeXml(item.body.slice(0, 35))}${item.body.length > 35 ? '...' : ''}</text>
        `;
      });
    } else {
      // Vertical Track Layout
      const spineX = 50;
      const startY = 80;
      const endY = startY + (items.length - 1) * 90;

      if (items.length > 1) {
        elements += `<line x1="${spineX}" y1="${startY}" x2="${spineX}" y2="${endY}" stroke="${trackColor}" stroke-width="4" stroke-linecap="round" />`;
      }

      items.forEach((item, idx) => {
        const cy = startY + idx * 90;
        elements += `
          <circle cx="${spineX}" cy="${cy}" r="12" fill="${bgColor}" stroke="${activeColor}" stroke-width="3" />
          <text x="${spineX}" y="${cy + 4}" text-anchor="middle" font-size="10" font-weight="800" fill="${activeColor}" font-family="system-ui, sans-serif">${item.stepNumber}</text>
          
          <!-- Date Badge -->
          <rect x="76" y="${cy - 24}" width="80" height="20" rx="10" fill="${isDark ? 'rgba(59,130,246,0.15)' : 'rgba(59,130,246,0.1)'}" />
          <text x="116" y="${cy - 10}" text-anchor="middle" font-size="10" font-weight="700" fill="${activeColor}" font-family="system-ui, sans-serif">${escapeXml(item.date)}</text>
          
          <!-- Headline -->
          <text x="166" y="${cy - 10}" font-size="13" font-weight="700" fill="${textColor}" font-family="system-ui, sans-serif">${escapeXml(item.headline)}</text>
          
          <!-- Body -->
          <text x="76" y="${cy + 14}" font-size="11" fill="${subtextColor}" font-family="system-ui, sans-serif">${escapeXml(item.body.slice(0, 75))}${item.body.length > 75 ? '...' : ''}</text>
        `;
      });
    }

    return `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${effectiveHeight}" width="100%" height="100%" style="background-color: ${bgColor}; border-radius: 12px; overflow: hidden;" role="img" aria-label="${escapeXml(data.title || 'Timeline')}">
        <text x="30" y="32" font-size="18" font-weight="700" fill="${textColor}" font-family="system-ui, sans-serif">${escapeXml(data.title || 'Chronology of Events')}</text>
        ${elements}
      </svg>
    `;
  }
}

function escapeXml(unsafe?: string): string {
  if (!unsafe) return '';
  return unsafe.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
