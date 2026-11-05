'use client';

import Link from 'next/link';
import { ShieldAlert } from 'lucide-react';
import { useAuth } from '../../../lib/auth-context';

const NEWSROOM_ROLES = new Set(['admin', 'editor', 'journalist', 'ai_agent']);

/**
 * Client-side gate for the newsroom surfaces.
 *
 * The API enforces roles on every mutation; this guard keeps the editorial
 * shell (staff lists, draft counts, the composer) from being shown to a
 * signed-out visitor or a plain reader.
 */
export function AdminGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-20 text-center text-sm text-slate-500">
        Checking your newsroom session…
      </div>
    );
  }

  if (!user || !NEWSROOM_ROLES.has(user.role)) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-20 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500">
          <ShieldAlert className="h-6 w-6" />
        </div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">
          Newsroom access required
        </h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          Sign in with an editor, journalist, or administrator account to open the newsroom.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
        >
          Return to the portal
        </Link>
      </div>
    );
  }

  return <>{children}</>;
}
