import type { SankeyBlock } from '@ai-news/schemas';
import { escapeXml } from '@ai-news/shared';
import {
  sankey,
  sankeyJustify,
  sankeyLinkHorizontal,
  type SankeyGraph,
  type SankeyLink,
  type SankeyNode,
} from 'd3-sankey';

/**
 * Flow diagram renderer.
 *
 * The width of each ribbon is proportional to the quantity it carries, so the
 * reader can see at a glance which flows matter. The links are ordered to
 * cross as little as possible, and every ribbon and column carries its
 * identifier so the reader can be shown what it means when they point at it.
 */

export interface RenderSankeyOptions {
  width?: number;
  height?: number;
  theme?: 'dark' | 'light';
  /** Whether to draw the title inside the SVG. */
  showTitle?: boolean;
}

interface FlowNode {
  id: string;
  label: string;
  color?: string;
}

interface FlowLink {
  source: string;
  target: string;
  value: number;
  label?: string;
}

const PALETTE = [
  '#3b82f6',
  '#10b981',
  '#f59e0b',
  '#ec4899',
  '#8b5cf6',
  '#06b6d4',
  '#ef4444',
  '#64748b',
];

export class SankeyRenderer {
  /**
   * Draws the flow as ribbons between columns.
   */
  static renderToSvg(blockData: SankeyBlock['data'], options: RenderSankeyOptions = {}): string {
    const width = options.width ?? 800;
    const height = options.height ?? 450;
    const isDark = options.theme !== 'light';
    const showTitle = options.showTitle ?? false;

    const textColor = isDark ? '#f8fafc' : '#0f172a';
    const subtextColor = isDark ? '#94a3b8' : '#64748b';
    const titleColor = isDark ? '#ffffff' : '#0f172a';

    const titleHeight = showTitle && blockData.title ? 44 : 0;
    const captionHeight = blockData.caption ? 26 : 0;
    const plotHeight = height - titleHeight - captionHeight;

    const nodeIds = new Set(blockData.nodes.map((node) => node.id));
    const nodes: FlowNode[] = blockData.nodes.map((node) => ({
      id: node.id,
      label: node.label,
      color: node.color,
    }));
    // A link to a node that is not in the diagram would be drawn as a ribbon
    // to nowhere, so it is left out.
    const links: FlowLink[] = blockData.links
      .filter((link) => nodeIds.has(link.source) && nodeIds.has(link.target))
      .map((link) => ({
        source: link.source,
        target: link.target,
        value: link.value,
        label: link.label,
      }));

    if (nodes.length === 0 || links.length === 0) {
      return `<svg viewBox="0 0 ${width} ${height}" role="img" xmlns="http://www.w3.org/2000/svg"></svg>`;
    }

    const graph = sankey<FlowNode, FlowLink>()
      .nodeId((node) => node.id)
      .nodeWidth(16)
      .nodePadding(14)
      .nodeAlign(sankeyJustify)
      .extent([
        [0, titleHeight],
        [width - 110, titleHeight + plotHeight],
      ])({ nodes, links } as SankeyGraph<FlowNode, FlowLink>);

    const parts: string[] = [];
    parts.push(
      `<svg viewBox="0 0 ${width} ${height}" width="100%" height="100%" preserveAspectRatio="xMidYMid meet" role="img" xmlns="http://www.w3.org/2000/svg" aria-label="${escapeXml(blockData.title ?? 'Flow diagram')}">`
    );

    const linkPath = sankeyLinkHorizontal<FlowNode, FlowLink>();

    for (const link of graph.links as Array<SankeyLink<FlowNode, FlowLink>>) {
      const source = link.source as SankeyNode<FlowNode, FlowLink>;
      const target = link.target as SankeyNode<FlowNode, FlowLink>;
      const path = linkPath(link) ?? '';
      const gradientId = `sankey-${source.index ?? 0}-${target.index ?? 0}`;
      parts.push(
        `<g data-link="${escapeXml(String(source.id))}-${escapeXml(String(target.id))}">` +
          `<defs><linearGradient id="${gradientId}" gradientUnits="userSpaceOnUse" x1="${source.x1}" x2="${target.x0}">` +
          `<stop offset="0%" stop-color="${source.color ?? PALETTE[(source.index ?? 0) % PALETTE.length]}" stop-opacity="0.55"/>` +
          `<stop offset="100%" stop-color="${target.color ?? PALETTE[(target.index ?? 0) % PALETTE.length]}" stop-opacity="0.55"/>` +
          `</linearGradient></defs>` +
          `<path d="${path}" fill="none" stroke="url(#${gradientId})" stroke-width="${Math.max(1, link.width ?? 1).toFixed(2)}" stroke-opacity="0.75"/>` +
          `</g>`
      );

      if ((blockData.showValues ?? false) && (link.width ?? 0) > 18) {
        const midX = ((source.x1 ?? 0) + (target.x0 ?? 0)) / 2;
        const midY =
          ((source.y0 ?? 0) + (source.y1 ?? 0) + (target.y0 ?? 0) + (target.y1 ?? 0)) / 4;
        parts.push(
          `<text x="${midX.toFixed(2)}" y="${(midY - 4).toFixed(2)}" font-size="10" text-anchor="middle" fill="${subtextColor}" pointer-events="none">${escapeXml(
            formatValue(link.value, blockData.unit)
          )}</text>`
        );
      }
    }

    for (const node of graph.nodes as Array<SankeyNode<FlowNode, FlowLink>>) {
      const nodeHeight = Math.max(2, (node.y1 ?? 0) - (node.y0 ?? 0));
      const fill = node.color ?? PALETTE[(node.index ?? 0) % PALETTE.length];
      const onRight = (node.x0 ?? 0) > width / 2 - 120;
      const labelX = onRight ? (node.x1 ?? 0) + 8 : (node.x0 ?? 0) - 8;
      const anchor = onRight ? 'start' : 'end';

      parts.push(
        `<g data-node-id="${escapeXml(node.id)}">` +
          `<rect x="${(node.x0 ?? 0).toFixed(2)}" y="${(node.y0 ?? 0).toFixed(2)}" width="${Math.max(2, (node.x1 ?? 0) - (node.x0 ?? 0)).toFixed(2)}" height="${nodeHeight.toFixed(2)}" fill="${fill}" rx="2"/>` +
          `<text x="${labelX.toFixed(2)}" y="${((node.y0 ?? 0) + nodeHeight / 2).toFixed(2)}" font-size="12" font-weight="600" text-anchor="${anchor}" fill="${textColor}" dominant-baseline="middle">${escapeXml(node.label)}</text>` +
          `</g>`
      );
    }

    if (showTitle && blockData.title) {
      parts.push(
        `<text x="0" y="26" font-size="16" font-weight="700" fill="${titleColor}">${escapeXml(blockData.title)}</text>`
      );
    }
    if (blockData.caption) {
      parts.push(
        `<text x="0" y="${height - 6}" font-size="11" fill="${subtextColor}">${escapeXml(blockData.caption)}</text>`
      );
    }

    parts.push('</svg>');
    return parts.join('');
  }
}

function formatValue(value: number, unit?: string): string {
  if (!Number.isFinite(value)) return '—';
  const rounded = Math.abs(value) >= 100 ? Math.round(value) : Math.round(value * 10) / 10;
  return unit ? `${rounded.toLocaleString('en-GB')} ${unit}` : rounded.toLocaleString('en-GB');
}
