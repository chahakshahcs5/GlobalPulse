'use client';

import React from 'react';
import type { Comment, PollTally } from '@ai-news/schemas';

/**
 * Runtime adapter for the shared block renderers.
 *
 * The renderers are used by two very different hosts: the newsroom web app,
 * where blocks talk to a live API, and the Block Studio, which renders the
 * very same components offline. Rather than letting the components reach for
 * a global API client, the host injects one through a context.
 *
 * The default runtime is offline: every call fails, and the blocks fall back
 * to the snapshot stored in their payload. That is exactly what a preview
 * should do.
 */

export interface LiveFeedItem {
  id: string;
  label: string;
  value: number | string;
  previousValue?: number | string;
  change?: number;
  unit?: string;
  provider?: string;
  asOf?: string;
  sparkline?: number[];
}

export interface LiveFeed {
  key: string;
  title: string;
  provider?: string;
  items: LiveFeedItem[];
  asOf: string;
  refreshIntervalSeconds: number;
  license?: string;
  methodology?: string;
  sourceAttribution?: string;
}

export interface RealtimeEvent {
  type: string;
  data: unknown;
  id?: string;
}

export type Unsubscribe = () => void;

export interface BlockRuntime {
  /** Authoritative poll tally (server votes merged with the payload baseline). */
  getPollTally(storyId: string, blockId: string): Promise<PollTally>;
  /** Cast (or change) the reader's vote on a poll block. */
  castPollVote(storyId: string, blockId: string, optionId: string): Promise<PollTally>;
  /** Reader comments attached to a story. */
  getStoryComments(storyId: string): Promise<Comment[]>;
  /** Current values for a live feed key. */
  getLiveFeed(key: string): Promise<LiveFeed>;
  /** Subscribe to realtime events on the given channels. */
  subscribeToRealtimeEvents(
    channels: string[],
    onEvent: (event: RealtimeEvent) => void
  ): Unsubscribe;
}

/** Thrown by the offline runtime so callers can tell it apart from a real failure. */
export class BlockRuntimeOfflineError extends Error {
  constructor(operation: string) {
    super(`Block runtime is offline: ${operation} is unavailable.`);
    this.name = 'BlockRuntimeOfflineError';
  }
}

const offlineRuntime: BlockRuntime = {
  getPollTally: () => Promise.reject(new BlockRuntimeOfflineError('getPollTally')),
  castPollVote: () => Promise.reject(new BlockRuntimeOfflineError('castPollVote')),
  getStoryComments: () => Promise.reject(new BlockRuntimeOfflineError('getStoryComments')),
  getLiveFeed: () => Promise.reject(new BlockRuntimeOfflineError('getLiveFeed')),
  subscribeToRealtimeEvents: () => () => undefined,
};

const BlockRuntimeContext = React.createContext<BlockRuntime>(offlineRuntime);

export interface BlockRuntimeProviderProps {
  runtime?: Partial<BlockRuntime>;
  children: React.ReactNode;
}

/**
 * Provide the host's API bindings to the block renderers.
 *
 * Anything not supplied falls back to the offline runtime, so a host can
 * wire up only the parts of the API it actually supports.
 */
export function BlockRuntimeProvider({
  runtime,
  children,
}: BlockRuntimeProviderProps): React.JSX.Element {
  const value = React.useMemo<BlockRuntime>(
    () => ({ ...offlineRuntime, ...(runtime ?? {}) }),
    [runtime]
  );
  return <BlockRuntimeContext.Provider value={value}>{children}</BlockRuntimeContext.Provider>;
}

/** The runtime bound to the current host. Offline unless a provider says otherwise. */
export function useBlockRuntime(): BlockRuntime {
  return React.useContext(BlockRuntimeContext);
}

// ---------------------------------------------------------------------------
// Internal links
// ---------------------------------------------------------------------------

export interface BlockLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
  children?: React.ReactNode;
}

export type BlockLinkComponent = React.ComponentType<BlockLinkProps>;

const BlockLinkContext = React.createContext<BlockLinkComponent | null>(null);

export interface BlockLinkProviderProps {
  /** The host's link component (e.g. Next.js `next/link`). */
  component: BlockLinkComponent;
  children: React.ReactNode;
}

/**
 * Let a host supply its own link component so internal navigation keeps the
 * host's client-side routing behaviour.
 */
export function BlockLinkProvider({
  component,
  children,
}: BlockLinkProviderProps): React.JSX.Element {
  return <BlockLinkContext.Provider value={component}>{children}</BlockLinkContext.Provider>;
}

/**
 * A link that works in any host.
 *
 * Without a provider it renders a plain anchor, which is the right behaviour
 * for a preview surface that has no router of its own.
 */
export function BlockLink({ href, children, ...rest }: BlockLinkProps): React.JSX.Element {
  const Component = React.useContext(BlockLinkContext);
  if (Component) {
    return (
      <Component href={href} {...rest}>
        {children}
      </Component>
    );
  }
  return (
    <a href={href} {...rest}>
      {children}
    </a>
  );
}
