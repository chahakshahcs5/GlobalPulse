import type { KnowledgeGraphBlock } from '@ai-news/schemas';
import { escapeXml } from '@ai-news/shared';

export interface RenderKnowledgeGraphOptions {
  width?: number;
  height?: number;
  theme?: 'dark' | 'light';
}

interface PositionedNode {
  id: string;
  label: string;
  type: string;
  /** Distance from the centre, in rings. 0 is the focus node. */
  ring: number;
  x: number;
  y: number;
}

/** A distinct colour per node type, so the eye can group by kind. */
const TYPE_COLORS: Record<string, string> = {
  person: '#3b82f6',
  organization: '#8b5cf6',
  company: '#6366f1',
  country: '#10b981',
  location: '#14b8a6',
  source: '#f59e0b',
  story: '#ec4899',
  event: '#ef4444',
  product: '#06b6d4',
  publication: '#f97316',
  agency: '#eab308',
};

const FALLBACK_COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ec4899', '#06b6d4'];

/**
 * Radial graph renderer.
 *
 * The layout is deterministic rather than force-directed: the focus node sits
 * in the centre, its direct relationships form the first ring, and theirs the
 * second. A reader can therefore compare two stories' graphs, and the picture
 * does not shuffle between renders.
 */
export class KnowledgeGraphRenderer {
  /**
   * Place the nodes.
   *
   * Nodes are reached by breadth-first search from the focus node, so the
   * first ring is what the focus is directly connected to. Anything not
   * reachable still appears, on the outermost ring, rather than vanishing.
   */
  static layout(
    blockData: KnowledgeGraphBlock['data'],
    centerX: number,
    centerY: number,
    radius: number
  ): PositionedNode[] {
    const nodes = blockData.nodes;
    const nodeIds = new Set(nodes.map((n) => n.id));

    // Only edges between nodes that are actually present are drawn.
    const edges = blockData.edges.filter((e) => nodeIds.has(e.from) && nodeIds.has(e.to));

    const degree = new Map<string, number>();
    for (const edge of edges) {
      degree.set(edge.from, (degree.get(edge.from) ?? 0) + 1);
      degree.set(edge.to, (degree.get(edge.to) ?? 0) + 1);
    }

    // The focus is the requested node, or the most connected one.
    const focusId =
      blockData.focusNodeId && nodeIds.has(blockData.focusNodeId)
        ? blockData.focusNodeId
        : (Array.from(degree.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] ?? nodes[0]?.id);

    const adjacency = new Map<string, Set<string>>();
    for (const edge of edges) {
      if (!adjacency.has(edge.from)) adjacency.set(edge.from, new Set());
      if (!adjacency.has(edge.to)) adjacency.set(edge.to, new Set());
      adjacency.get(edge.from)!.add(edge.to);
      adjacency.get(edge.to)!.add(edge.from);
    }

    // Breadth-first search from the focus.
    const ring = new Map<string, number>();
    if (focusId) {
      ring.set(focusId, 0);
      let frontier = [focusId];
      let depth = 0;
      while (frontier.length > 0 && depth < 3) {
        depth += 1;
        const next: string[] = [];
        for (const current of frontier) {
          for (const neighbour of adjacency.get(current) ?? []) {
            if (ring.has(neighbour)) continue;
            ring.set(neighbour, depth);
            next.push(neighbour);
          }
        }
        frontier = next;
      }
    }

    // Anything unreachable is parked on the outer ring.
    const maxRing = 3;
    const groups = new Map<number, typeof nodes>();
    for (const node of nodes) {
      const nodeRing = ring.get(node.id) ?? maxRing;
      const group = groups.get(nodeRing) ?? [];
      group.push(node);
      groups.set(nodeRing, group);
    }

    const positioned: PositionedNode[] = [];

    for (const [nodeRing, group] of groups.entries()) {
      if (nodeRing === 0) {
        const node = group[0];
        positioned.push({
          id: node.id,
          label: node.label,
          type: node.type,
          ring: 0,
          x: centerX,
          y: centerY,
        });
        continue;
      }

      // The rings are spaced so the first ring is far enough out for the
      // focus node's label to breathe.
      const ringRadius = radius * (0.5 + (nodeRing - 1) * 0.26);
      // Offset each ring so the nodes do not line up into spokes.
      const offset = nodeRing % 2 === 0 ? 0 : Math.PI / group.length;

      group.forEach((node, index) => {
        const angle = (Math.PI * 2 * index) / group.length + offset;
        positioned.push({
          id: node.id,
          label: node.label,
          type: node.type,
          ring: nodeRing,
          x: centerX + ringRadius * Math.cos(angle),
          y: centerY + ringRadius * Math.sin(angle),
        });
      });
    }

    return positioned;
  }

  static renderToSvg(
    blockData: KnowledgeGraphBlock['data'],
    options: RenderKnowledgeGraphOptions = {}
  ): string {
    const width = options.width || 800;
    const height = options.height || 620;
    const isDark = options.theme !== 'light';

    const bgColor = isDark ? '#0f172a' : '#ffffff';
    const textColor = isDark ? '#f8fafc' : '#0f172a';
    const subtextColor = isDark ? '#94a3b8' : '#64748b';
    const gridColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';

    const centerX = width / 2;
    const centerY = height / 2 + 18;
    const radius = Math.min(width / 2 - 130, height / 2 - 54);

    const positioned = KnowledgeGraphRenderer.layout(blockData, centerX, centerY, radius);
    const byId = new Map(positioned.map((node) => [node.id, node]));
    const nodeIds = new Set(blockData.nodes.map((n) => n.id));

    // Colour by type, consistently.
    const types = Array.from(new Set(blockData.nodes.map((n) => n.type)));
    const colorFor = (type: string) => {
      if (TYPE_COLORS[type]) return TYPE_COLORS[type];
      const index = types.indexOf(type);
      return FALLBACK_COLORS[(index < 0 ? 0 : index) % FALLBACK_COLORS.length];
    };

    let elements = '';
    elements += `<text x="24" y="30" font-size="17" font-weight="700" fill="${textColor}" font-family="system-ui, -apple-system, sans-serif">${escapeXml(blockData.title)}</text>`;
    if (blockData.description) {
      elements += `<text x="24" y="50" font-size="12" fill="${subtextColor}" font-family="system-ui, -apple-system, sans-serif">${escapeXml(blockData.description)}</text>`;
    }

    // The rings, so the distance from the focus is readable.
    for (const ring of [0.5, 0.76, 1]) {
      const ringRadius = radius * ring;
      elements += `<circle cx="${centerX}" cy="${centerY}" r="${ringRadius}" fill="none" stroke="${gridColor}" stroke-width="1" stroke-dasharray="3,5" />`;
    }

    // Edges first, so the nodes sit on top of them.
    for (const edge of blockData.edges) {
      if (!nodeIds.has(edge.from) || !nodeIds.has(edge.to)) continue;
      const from = byId.get(edge.from);
      const to = byId.get(edge.to);
      if (!from || !to) continue;

      const weight = Math.max(1, Math.min(6, edge.weight ?? 2));
      elements += `<line x1="${from.x}" y1="${from.y}" x2="${to.x}" y2="${to.y}" stroke="${subtextColor}" stroke-opacity="0.4" stroke-width="${weight * 0.7}" />`;

      // The relationship label, pushed off the line it belongs to.
      const label = edge.label ?? edge.relation;
      if (label) {
        const midX = (from.x + to.x) / 2;
        const midY = (from.y + to.y) / 2;
        // Perpendicular offset, away from the line.
        const dx = to.x - from.x;
        const dy = to.y - from.y;
        const length = Math.hypot(dx, dy) || 1;
        const offset = 11;
        const labelX = midX + (-dy / length) * offset;
        const labelY = midY + (dx / length) * offset + 3;

        elements += `<text x="${labelX}" y="${labelY}" text-anchor="middle" font-size="9" font-style="italic" fill="${subtextColor}" stroke="${bgColor}" stroke-width="3" paint-order="stroke" font-family="system-ui, -apple-system, sans-serif">${escapeXml(label)}</text>`;
      }
    }

    // Nodes.
    for (const node of positioned) {
      const color = colorFor(node.type);
      const isFocus = node.ring === 0;
      const radiusNode = isFocus ? 16 : 11;

      if (isFocus) {
        elements += `<circle cx="${node.x}" cy="${node.y}" r="${radiusNode + 6}" fill="${color}" fill-opacity="0.15" />`;
      }
      elements += `<circle cx="${node.x}" cy="${node.y}" r="${radiusNode}" fill="${color}" stroke="${bgColor}" stroke-width="2" />`;

      // The label points away from the centre, so it never sits on the graph.
      let labelX = node.x;
      let labelY = node.y + radiusNode + 22;
      let anchor = 'middle';

      if (!isFocus) {
        const angle = Math.atan2(node.y - centerY, node.x - centerX);
        const distance = radiusNode + 11;
        labelX = node.x + Math.cos(angle) * distance;
        labelY = node.y + Math.sin(angle) * distance + 4;
        anchor =
          Math.abs(Math.cos(angle)) < 0.35 ? 'middle' : Math.cos(angle) > 0 ? 'start' : 'end';
      }

      elements += `<text x="${labelX}" y="${labelY}" text-anchor="${anchor}" font-size="10" font-weight="${isFocus ? 700 : 500}" fill="${isFocus ? textColor : subtextColor}" stroke="${bgColor}" stroke-width="3" paint-order="stroke" font-family="system-ui, -apple-system, sans-serif">${escapeXml(truncate(node.label, 20))}</text>`;
    }

    // Legend of node types.
    let legendX = 24;
    const legendY = height - 18;
    for (const type of types.slice(0, 8)) {
      elements += `<circle cx="${legendX}" cy="${legendY - 4}" r="5" fill="${colorFor(type)}" />`;
      elements += `<text x="${legendX + 11}" y="${legendY}" font-size="10" fill="${subtextColor}" font-family="system-ui, -apple-system, sans-serif">${escapeXml(type)}</text>`;
      legendX += 26 + type.length * 6;
    }

    if (blockData.sourceAttribution) {
      elements += `<text x="${width - 24}" y="${legendY}" text-anchor="end" font-size="10" fill="${subtextColor}" font-style="italic" font-family="system-ui, -apple-system, sans-serif">Source: ${escapeXml(blockData.sourceAttribution)}</text>`;
    }

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="100%" height="100%" style="background-color: ${bgColor}; border-radius: 12px; overflow: hidden;" role="img" aria-label="${escapeXml(blockData.title)}">${elements}</svg>`;
  }
}

function truncate(value: string, max: number): string {
  return value.length > max ? `${value.slice(0, max - 1)}…` : value;
}
