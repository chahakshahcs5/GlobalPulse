import { NUMBER_LOCALE } from '../format';
import type { TreemapBlock } from '@ai-news/schemas';
import { escapeXml } from '@ai-news/shared';
import {
  hierarchy,
  treemap,
  treemapBinary,
  treemapDice,
  treemapSlice,
  treemapSquarify,
  type HierarchyRectangularNode,
} from 'd3';

/**
 * Treemap renderer.
 *
 * The hierarchy arrives as a flat list of nodes, each naming the node it
 * sits inside. The tree is rebuilt from that list and the rectangles are laid
 * out so that the area of each one is proportional to what it measures — the
 * one thing a treemap is for.
 */

export interface RenderTreemapOptions {
  width?: number;
  height?: number;
  theme?: 'dark' | 'light';
  /** Whether to draw the title inside the SVG. */
  showTitle?: boolean;
}

interface TreeNode {
  id: string;
  label: string;
  value?: number;
  color?: string;
  children: TreeNode[];
  parent?: TreeNode;
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

/** Rebuilds the tree from the flat list, dropping links to missing parents. */
function buildTree(nodes: TreemapBlock['data']['nodes']): TreeNode | null {
  if (nodes.length === 0) return null;

  const byId = new Map<string, TreeNode>();
  for (const node of nodes) {
    byId.set(node.id, {
      id: node.id,
      label: node.label,
      value: node.value,
      color: node.color,
      children: [],
    });
  }

  const roots: TreeNode[] = [];
  for (const node of nodes) {
    const treeNode = byId.get(node.id)!;
    const parent = node.parentId ? byId.get(node.parentId) : undefined;
    if (parent && parent !== treeNode) {
      parent.children.push(treeNode);
      treeNode.parent = parent;
    } else {
      roots.push(treeNode);
    }
  }

  // A node whose parent is missing entirely is treated as a root rather than
  // being dropped: it carries a measurement the reader was told about.
  for (const node of nodes) {
    const treeNode = byId.get(node.id)!;
    if (node.parentId && !byId.has(node.parentId) && !roots.includes(treeNode)) {
      roots.push(treeNode);
    }
  }

  if (roots.length === 0) return null;

  // More than one root is fine — they are gathered under a parent that is
  // never drawn, so the layout has somewhere to start.
  if (roots.length === 1) return roots[0];

  const container: TreeNode = { id: '__root__', label: '', children: roots };
  for (const root of roots) root.parent = container;
  return container;
}

/**
 * The size of a node.
 *
 * A node that names a value is that size. A node that does not is sized by
 * what it contains, so a branch with no total of its own is still drawn in
 * proportion to its parts.
 */
function effectiveValue(node: TreeNode): number {
  if (node.value !== undefined) return node.value;
  return node.children.reduce((sum, child) => sum + effectiveValue(child), 0);
}

/**
 * The adjustment d3's own summing needs.
 *
 * d3 adds a node's value to the sum of its children's, so a node that names
 * a total *and* has children would be counted twice. Subtracting the
 * children back out leaves the node at the total it was given, and leaves a
 * node with no total at the sum of its parts.
 */
function sumAdjustment(node: TreeNode): number {
  if (node.children.length === 0) return node.value ?? 0;
  const children = node.children.reduce((sum, child) => sum + effectiveValue(child), 0);
  return (node.value ?? children) - children;
}

export class TreemapRenderer {
  /**
   * Draws the hierarchy as nested rectangles.
   */
  static renderToSvg(blockData: TreemapBlock['data'], options: RenderTreemapOptions = {}): string {
    const width = options.width ?? 800;
    const height = options.height ?? 450;
    const isDark = options.theme !== 'light';
    const showTitle = options.showTitle ?? false;

    const subtextColor = isDark ? '#94a3b8' : '#64748b';
    const titleColor = isDark ? '#ffffff' : '#0f172a';

    const root = buildTree(blockData.nodes);
    if (!root) {
      return `<svg viewBox="0 0 ${width} ${height}" role="img" xmlns="http://www.w3.org/2000/svg"></svg>`;
    }

    const titleHeight = showTitle && blockData.title ? 44 : 0;
    const captionHeight = blockData.caption ? 26 : 0;
    const plotHeight = height - titleHeight - captionHeight;

    const rootNode = hierarchy<TreeNode>(root, (node) => node.children).sum((node) =>
      sumAdjustment(node)
    );

    /*
     * The same parts, laid out four ways.
     *
     * Squarified keeps the rectangles as close to squares as it can, which
     * is the easiest to read; slicing and dicing cut the space into strips
     * and a grid; and the binary layout halves the space at each step, which
     * makes the depth of the hierarchy visible.
     */
    const tilings = {
      squarify: treemapSquarify,
      slice: treemapSlice,
      dice: treemapDice,
      binary: treemapBinary,
    } as const;
    const tiling =
      tilings[(blockData.layout ?? 'squarify') as keyof typeof tilings] ?? treemapSquarify;

    treemap<TreeNode>()
      .tile(tiling)
      .size([width, plotHeight])
      .paddingInner(2)
      .paddingOuter(4)
      .round(false)(rootNode);

    const leaves = rootNode.leaves();
    const groups = Array.from(
      new Set(
        leaves
          .map((leaf) => leaf.parent?.data.label)
          .filter((label): label is string => Boolean(label))
      )
    );

    const parts: string[] = [];
    parts.push(
      `<svg viewBox="0 0 ${width} ${height}" width="100%" height="100%" preserveAspectRatio="xMidYMid meet" role="img" xmlns="http://www.w3.org/2000/svg" aria-label="${escapeXml(blockData.title ?? 'Treemap')}">`
    );
    parts.push(`<rect x="0" y="0" width="${width}" height="${height}" fill="none"/>`);

    for (const leaf of leaves) {
      const rectangle = leaf as HierarchyRectangularNode<TreeNode>;
      const x = rectangle.x0;
      const y = rectangle.y0 + titleHeight;
      const w = rectangle.x1 - rectangle.x0;
      const h = rectangle.y1 - rectangle.y0;
      if (w <= 0.5 || h <= 0.5) continue;

      const groupIndex = leaf.parent ? groups.indexOf(leaf.parent.data.label) : -1;
      const fill = leaf.data.color ?? PALETTE[(groupIndex < 0 ? 0 : groupIndex) % PALETTE.length];

      parts.push(
        `<g data-node-id="${escapeXml(leaf.data.id)}">` +
          `<rect x="${x.toFixed(2)}" y="${y.toFixed(2)}" width="${w.toFixed(2)}" height="${h.toFixed(2)}" fill="${fill}" fill-opacity="0.85" rx="2"/>` +
          `</g>`
      );

      // A label is only drawn when there is room for it to be read.
      const showLabel = w > 54 && h > 26;
      const showValue = (blockData.showValues ?? false) && w > 54 && h > 42;
      if (showLabel) {
        parts.push(
          `<text x="${(x + 6).toFixed(2)}" y="${(y + 16).toFixed(2)}" font-size="12" font-weight="600" fill="#ffffff">${escapeXml(
            leaf.data.label.length > Math.floor((w - 12) / 7)
              ? `${leaf.data.label.slice(0, Math.max(1, Math.floor((w - 12) / 7) - 1))}…`
              : leaf.data.label
          )}</text>`
        );
      }
      if (showValue) {
        parts.push(
          `<text x="${(x + 6).toFixed(2)}" y="${(y + 32).toFixed(2)}" font-size="11" fill="#ffffff" fill-opacity="0.9">${escapeXml(
            formatValue(leaf.value ?? 0, blockData.unit)
          )}</text>`
        );
      }
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
