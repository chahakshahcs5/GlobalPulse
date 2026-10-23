import { NUMBER_LOCALE } from '../format';
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
 *
 * The same numbers read very differently depending on how they are dressed,
 * so the block carries a `style`:
 *
 * - `classic` — wide ribbons between filled columns, the plainest read.
 * - `vertical` — the same flow from the top down, which reads like a list.
 * - `minimal` — hairlines and names only, for when the shape of the network
 *   is the point and its weights are not.
 * - `organic` — curved links and rounded ends, for when the crossings are
 *   the story.
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
    const style = blockData.style ?? 'classic';
    const vertical = style === 'vertical';

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

    /*
     * A vertical flow is the same layout turned on its side.
     *
     * The extent is swapped, and the positions are swapped again as they are
     * written out, which keeps the arithmetic identical and changes only how
     * the picture reads: from left to right, or from the top down.
     *
     * The horizontal layout leaves a margin at each end for the names, so a
     * column at either edge is not drawn with its label off the page.
     */
    const graph = sankey<FlowNode, FlowLink>()
      .nodeId((node) => node.id)
      .nodeWidth(style === 'minimal' ? 0 : 16)
      .nodePadding(14)
      .nodeAlign(sankeyJustify)
      .extent(
        vertical
          ? [
              [0, 0],
              [plotHeight, width - 110],
            ]
          : [
              [110, titleHeight],
              [width - 130, titleHeight + plotHeight],
            ]
      )({ nodes, links } as SankeyGraph<FlowNode, FlowLink>);

    /** Where a layout coordinate ends up on the page. */
    const place = (x: number, y: number): [number, number] =>
      vertical ? [y, x + titleHeight] : [x, y];

    const parts: string[] = [];
    parts.push(
      `<svg viewBox="0 0 ${width} ${height}" width="100%" height="100%" preserveAspectRatio="xMidYMid meet" role="img" xmlns="http://www.w3.org/2000/svg" aria-label="${escapeXml(blockData.title ?? 'Flow diagram')}">`
    );

    const linkPath = sankeyLinkHorizontal<FlowNode, FlowLink>();

    for (const link of graph.links as Array<SankeyLink<FlowNode, FlowLink>>) {
      const source = link.source as SankeyNode<FlowNode, FlowLink>;
      const target = link.target as SankeyNode<FlowNode, FlowLink>;
      const sourceColor = source.color ?? PALETTE[(source.index ?? 0) % PALETTE.length];
      const targetColor = target.color ?? PALETTE[(target.index ?? 0) % PALETTE.length];
      const gradientId = `sankey-${source.index ?? 0}-${target.index ?? 0}`;

      // The link leaves the source at one end of its band and arrives at the
      // target at the other, which is what puts the two together.
      const [fromX, fromY] = place(source.x1 ?? 0, link.y0 ?? 0);
      const [toX, toY] = place(target.x0 ?? 0, link.y1 ?? 0);

      if (style === 'minimal') {
        // A hairline, with no fill: the shape of the network, not its weight.
        parts.push(
          `<g data-link="${escapeXml(String(source.id))}-${escapeXml(String(target.id))}">` +
            `<path d="M${fromX.toFixed(2)},${fromY.toFixed(2)} L${toX.toFixed(2)},${toY.toFixed(2)}" fill="none" stroke="${sourceColor}" stroke-width="1.5" stroke-opacity="0.65"/>` +
            `</g>`
        );
        continue;
      }

      if (style === 'organic') {
        // A curve rather than a band, so crossings read as crossings.
        const bend = (toX - fromX) / 2;
        parts.push(
          `<g data-link="${escapeXml(String(source.id))}-${escapeXml(String(target.id))}">` +
            `<path d="M${fromX.toFixed(2)},${fromY.toFixed(2)} Q${(fromX + bend).toFixed(2)},${fromY.toFixed(2)} ${toX.toFixed(2)},${toY.toFixed(2)}" fill="none" stroke="${sourceColor}" stroke-width="${Math.max(1.5, Math.min(10, (link.width ?? 1) / 4)).toFixed(2)}" stroke-opacity="0.5" stroke-linecap="round"/>` +
            `</g>`
        );
        continue;
      }

      const path = linkPath(link) ?? '';
      parts.push(
        `<g data-link="${escapeXml(String(source.id))}-${escapeXml(String(target.id))}">` +
          `<defs><linearGradient id="${gradientId}" gradientUnits="userSpaceOnUse" x1="${source.x1}" x2="${target.x0}">` +
          `<stop offset="0%" stop-color="${sourceColor}" stop-opacity="0.55"/>` +
          `<stop offset="100%" stop-color="${targetColor}" stop-opacity="0.55"/>` +
          `</linearGradient></defs>` +
          `<path d="${path}" fill="none" stroke="url(#${gradientId})" stroke-width="${Math.max(1, link.width ?? 1).toFixed(2)}" stroke-opacity="0.75"/>` +
          `</g>`
      );

      if ((blockData.showValues ?? false) && (link.width ?? 0) > 18) {
        const midX = ((source.x1 ?? 0) + (target.x0 ?? 0)) / 2;
        const midY =
          ((source.y0 ?? 0) + (source.y1 ?? 0) + (target.y0 ?? 0) + (target.y1 ?? 0)) / 4;
        const [labelX, labelY] = place(midX, midY);
        parts.push(
          `<text x="${labelX.toFixed(2)}" y="${(labelY - 4).toFixed(2)}" font-size="10" text-anchor="middle" fill="${subtextColor}" pointer-events="none">${escapeXml(
            formatValue(link.value, blockData.unit)
          )}</text>`
        );
      }
    }

    for (const node of graph.nodes as Array<SankeyNode<FlowNode, FlowLink>>) {
      const fill = node.color ?? PALETTE[(node.index ?? 0) % PALETTE.length];

      if (style === 'minimal') {
        // The name sits on the node's own line, half a node's width along.
        const nodeWidth = Math.max(2, (node.x1 ?? 0) - (node.x0 ?? 0));
        const [labelX, labelY] = place(
          (node.x0 ?? 0) + nodeWidth / 2,
          (node.y0 ?? 0) + ((node.y1 ?? 0) - (node.y0 ?? 0)) / 2
        );
        parts.push(
          `<g data-node-id="${escapeXml(node.id)}">` +
            `<text x="${labelX.toFixed(2)}" y="${labelY.toFixed(2)}" font-size="12" font-weight="600" text-anchor="middle" fill="${textColor}" dominant-baseline="middle">${escapeXml(node.label)}</text>` +
            `</g>`
        );
        continue;
      }

      if (vertical) {
        /*
         * The column becomes a bar across the flow.
         *
         * The bar is as wide as the quantity it carries, so the name goes
         * inside it when there is room, and above it when there is not.
         */
        const barWidth = Math.max(2, (node.y1 ?? 0) - (node.y0 ?? 0));
        const barHeight = Math.max(2, (node.x1 ?? 0) - (node.x0 ?? 0));
        const [barX, barY] = place(node.x0 ?? 0, node.y0 ?? 0);
        const inside = barWidth > 70;
        parts.push(
          `<g data-node-id="${escapeXml(node.id)}">` +
            `<rect x="${barX.toFixed(2)}" y="${barY.toFixed(2)}" width="${barWidth.toFixed(2)}" height="${barHeight.toFixed(2)}" fill="${fill}" rx="2"/>` +
            (inside
              ? `<text x="${(barX + barWidth / 2).toFixed(2)}" y="${(barY + barHeight / 2 + 4).toFixed(2)}" font-size="12" font-weight="600" text-anchor="middle" fill="#ffffff" dominant-baseline="middle">${escapeXml(node.label)}</text>`
              : `<text x="${(barX + barWidth / 2).toFixed(2)}" y="${Math.max(12, barY - 6).toFixed(2)}" font-size="12" font-weight="600" text-anchor="middle" fill="${textColor}">${escapeXml(node.label)}</text>`) +
            `</g>`
        );
        continue;
      }

      const nodeHeight = Math.max(2, (node.y1 ?? 0) - (node.y0 ?? 0));
      // A column at either edge has its name drawn on the side that has room.
      const onRight = (node.x0 ?? 0) > width / 2 - 120;
      const labelX = onRight ? (node.x1 ?? 0) + 8 : (node.x0 ?? 0) - 8;
      const anchor = onRight ? 'start' : 'end';
      parts.push(
        `<g data-node-id="${escapeXml(node.id)}">` +
          `<rect x="${(node.x0 ?? 0).toFixed(2)}" y="${(node.y0 ?? 0).toFixed(2)}" width="${Math.max(2, (node.x1 ?? 0) - (node.x0 ?? 0)).toFixed(2)}" height="${nodeHeight.toFixed(2)}" fill="${fill}" rx="${style === 'organic' ? 999 : 2}"/>` +
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
  return unit
    ? `${rounded.toLocaleString(NUMBER_LOCALE)} ${unit}`
    : rounded.toLocaleString(NUMBER_LOCALE);
}
