'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { AuthProvider } from '../lib/auth-context';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { BlockLinkProvider, BlockRuntimeProvider, type BlockLinkProps } from '@ai-news/blocks-ui';
import {
  castPollVote,
  getLiveFeed,
  getPollTally,
  getStoryComments,
  subscribeToRealtimeEvents,
} from '@ai-news/api-client';

/**
 * The site router, handed to the shared block renderers so internal links
 * inside blocks keep client-side navigation.
 */
function NextBlockLink({ href, children, ...rest }: BlockLinkProps) {
  return (
    <Link href={href} {...rest}>
      {children}
    </Link>
  );
}

/**
 * Client-side providers wrapper for the root layout.
 *
 * Combines AuthProvider (session management) and ErrorBoundary (crash
 * isolation) with the block runtime bindings — the shared renderers reach the
 * newsroom API through these, and fall back to their offline behaviour when a
 * capability is not wired up.
 */
export function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <ErrorBoundary name="root">
        <BlockLinkProvider component={NextBlockLink}>
          <BlockRuntimeProvider
            runtime={{
              getPollTally,
              castPollVote,
              getStoryComments,
              getLiveFeed,
              subscribeToRealtimeEvents,
            }}
          >
            {children}
          </BlockRuntimeProvider>
        </BlockLinkProvider>
      </ErrorBoundary>
    </AuthProvider>
  );
}
