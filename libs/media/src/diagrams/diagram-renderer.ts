import type { DiagramBlock } from '@ai-news/schemas';

export class DiagramRenderer {
  /**
   * Validates whether a text string contains valid Mermaid diagram grammar.
   */
  static validateMermaidDefinition(definition: string): boolean {
    const trimmed = definition.trim();
    if (!trimmed) return false;
    const validPrefixes = [
      'graph',
      'flowchart',
      'sequenceDiagram',
      'classDiagram',
      'stateDiagram',
      'erDiagram',
      'gantt',
      'pie',
      'gitGraph',
      'timeline',
      'mindmap',
      'quadrantChart',
    ];
    return validPrefixes.some((prefix) => trimmed.startsWith(prefix));
  }

  /**
   * Renders declarative SVG structure for Mermaid or architecture diagrams.
   */
  static renderDeclarativeSvg(
    diagramData: DiagramBlock['data'],
    width = 800,
    height = 360,
    theme: 'dark' | 'light' = 'dark'
  ): string {
    const isDark = theme === 'dark';
    const bgColor = isDark ? '#0f172a' : '#ffffff';
    const textColor = isDark ? '#f8fafc' : '#0f172a';
    const subtextColor = isDark ? '#94a3b8' : '#64748b';
    const nodeBg = isDark ? '#1e293b' : '#f1f5f9';
    const nodeBorder = isDark ? '#3b82f6' : '#2563eb';

    // Parse simple node definitions or render code preview
    const lines = diagramData.definition.split('\n').filter((l) => l.trim().length > 0);

    return `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="100%" height="100%" style="background-color: ${bgColor}; border-radius: 12px; overflow: hidden;" role="img" aria-label="${escapeXml(diagramData.title || 'Diagram')}">
        <text x="30" y="36" font-size="18" font-weight="700" fill="${textColor}" font-family="system-ui, sans-serif">${escapeXml(diagramData.title || 'Architecture & Flow Diagram')}</text>
        <g transform="translate(30, 60)">
          <rect width="${width - 60}" height="${height - 100}" rx="8" fill="${nodeBg}" stroke="${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}" />
          <!-- Header Badge -->
          <rect x="20" y="20" width="100" height="24" rx="6" fill="${nodeBorder}" />
          <text x="70" y="36" text-anchor="middle" font-size="11" font-weight="700" fill="#ffffff" font-family="system-ui, sans-serif">${diagramData.format.toUpperCase()}</text>
          
          <!-- Code snippet representation -->
          <text x="24" y="80" font-size="13" font-family="ui-monospace, monospace" fill="${isDark ? '#38bdf8' : '#0284c7'}">${escapeXml(lines[0] || 'graph TD')}</text>
          ${lines
            .slice(1, 8)
            .map(
              (line, i) =>
                `<text x="40" y="${104 + i * 22}" font-size="12" font-family="ui-monospace, monospace" fill="${textColor}">${escapeXml(line.trim())}</text>`
            )
            .join('')}
        </g>
        ${
          diagramData.caption
            ? `<text x="30" y="${height - 16}" font-size="11" fill="${subtextColor}" font-style="italic" font-family="system-ui, sans-serif">${escapeXml(diagramData.caption)}</text>`
            : ''
        }
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
    .replace(/"/g, '&quot;');
}
