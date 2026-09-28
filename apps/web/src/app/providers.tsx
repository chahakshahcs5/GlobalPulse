'use client';

import type { ReactNode } from 'react';
import { AuthProvider } from '../lib/auth-context';
import { ErrorBoundary } from '../components/ErrorBoundary';

/**
 * Client-side providers wrapper for the root layout.
 * Combines AuthProvider (session management) and ErrorBoundary (crash isolation).
 */
export function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <ErrorBoundary name="root">{children}</ErrorBoundary>
    </AuthProvider>
  );
}
