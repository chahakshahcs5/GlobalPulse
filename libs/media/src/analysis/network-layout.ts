import type { NetworkGraphBlock } from '@ai-news/schemas';
import {
  forceCenter,
  forceCollide,
  forceLink,
  forceManyBody,
  forceRadial,
  forceSimulation,
  type SimulationLinkDatum,
  type SimulationNodeDatum,
} from 'd3';

/**
 * The arrangement of a network graph's nodes.
 *
 * The block carries the nodes and the connections; the platform works out
 * where to put them. A layout computed here is deterministic — the simulation
 * is run for a fixed number of steps rather than left to run against a
 * timer — so the same graph is drawn the same way every time, on the server
 * and in the browser.
 */

export interface NetworkLayoutNode extends SimulationNodeDatum {
  id: string;
  label: string;
  group?: string;
  size?: number;
  url?: string;
  x: number;
  y: number;
}

export interface NetworkLayoutLink {
  source: string;
  target: string;
  weight?: number;
  label?: string;
}

export interface NetworkLayout {
  nodes: NetworkLayoutNode[];
  links: NetworkLayoutLink[];
  width: number;
  height: number;
  /** How strongly each node is connected, which is how big it is drawn. */
  degrees: Record<string, number>;
}

export interface NetworkLayoutOptions {
  width?: number;
  height?: number;
  layout?: 'force' | 'radial' | 'circular';
}

/** How many steps the simulation is run for before it is drawn. */
const SIMULATION_STEPS = 300;

export function computeNetworkLayout(
  blockData: NetworkGraphBlock['data'],
  options: NetworkLayoutOptions = {}
): NetworkLayout {
  const width = options.width ?? 800;
  const height = options.height ?? 560;
  const layout = options.layout ?? blockData.layout ?? 'force';

  const nodes: NetworkLayoutNode[] = blockData.nodes.map((node) => ({
    id: node.id,
    label: node.label,
    group: node.group,
    size: node.size,
    url: node.url,
    x: width / 2,
    y: height / 2,
  }));

  const degrees: Record<string, number> = {};
  for (const node of nodes) degrees[node.id] = 0;

  const links: NetworkLayoutLink[] = [];
  for (const link of blockData.links) {
    // A connection to a node that is not in the graph is dropped rather than
    // drawn as a line to nowhere.
    if (degrees[link.source] === undefined || degrees[link.target] === undefined) continue;
    degrees[link.source] += 1;
    degrees[link.target] += 1;
    links.push({
      source: link.source,
      target: link.target,
      weight: link.weight,
      label: link.label,
    });
  }

  if (layout === 'circular') {
    const radius = Math.min(width, height) / 2 - 40;
    const centreX = width / 2;
    const centreY = height / 2;
    nodes.forEach((node, index) => {
      const angle = (index / Math.max(1, nodes.length)) * Math.PI * 2 - Math.PI / 2;
      node.x = centreX + radius * Math.cos(angle);
      node.y = centreY + radius * Math.sin(angle);
    });
    return { nodes, links, width, height, degrees };
  }

  const simulation = forceSimulation(nodes as NetworkLayoutNode[])
    .force(
      'link',
      forceLink<NetworkLayoutNode, SimulationLinkDatum<NetworkLayoutNode>>(links)
        .id((node) => node.id)
        .distance(
          (link) => 90 + 40 / Math.max(1, Number((link as { weight?: number }).weight ?? 1))
        )
        .strength((link) =>
          Math.min(1, 0.3 + Number((link as { weight?: number }).weight ?? 1) * 0.1)
        )
    )
    .force('charge', forceManyBody().strength(-320))
    .force(
      'collide',
      forceCollide<NetworkLayoutNode>().radius((node) => 14 + (node.size ?? 0))
    )
    .stop();

  if (layout === 'radial') {
    simulation.force(
      'radial',
      forceRadial<NetworkLayoutNode>(
        Math.min(width, height) / 2 - 60,
        width / 2,
        height / 2
      ).strength(0.9)
    );
  } else {
    simulation.force('center', forceCenter(width / 2, height / 2));
  }

  // Run the simulation to a fixed point rather than letting it animate.
  simulation.tick(SIMULATION_STEPS);

  // Keep the nodes inside the frame: a node that has drifted off the canvas
  // is a node the reader cannot see.
  const margin = 24;
  for (const node of nodes) {
    node.x = Math.min(width - margin, Math.max(margin, node.x));
    node.y = Math.min(height - margin, Math.max(margin, node.y));
  }

  return { nodes, links, width, height, degrees };
}

/** The groups a graph's nodes fall into, in a stable order. */
export function networkGroups(nodes: NetworkLayoutNode[]): string[] {
  const groups = new Set<string>();
  for (const node of nodes) {
    if (node.group) groups.add(node.group);
  }
  return Array.from(groups).sort();
}

/** A colour for each group, taken from the house palette in order. */
export const NETWORK_PALETTE = ['#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4'];

export function networkGroupColor(groups: string[], group: string | undefined): string {
  if (!group) return '#64748b';
  const index = groups.indexOf(group);
  if (index < 0) return '#64748b';
  return NETWORK_PALETTE[index % NETWORK_PALETTE.length];
}
