'use client';

import React from 'react';
import { LogIn, LogOut, UserRound, Loader2 } from 'lucide-react';
import { getCurrentUser, loginUser, logoutUser } from '@ai-news/api-client';

/**
 * The studio's session.
 *
 * The studio is part of the same product as the newsroom portal, and it uses
 * the same session: the API's `HttpOnly` cookie, set when anyone signs in
 * anywhere in the product. There is no token to paste and no second account.
 *
 * The state shown here is read from the API rather than from the browser's
 * storage, because the cookie cannot be read from script and a token kept in
 * one tab says nothing about the others.
 */

/** Where the newsroom portal lives, so the studio can point at it. */
const WEB_URL = process.env.NEXT_PUBLIC_WEB_URL?.replace(/\/$/, '') ?? 'http://localhost:3002';

interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface SessionBadgeProps {
  /** Adds the dark styling to the panel. */
  darkClass: string;
}

export function SessionBadge({ darkClass }: SessionBadgeProps) {
  const [user, setUser] = React.useState<SessionUser | null>(null);
  const [checking, setChecking] = React.useState(true);
  const [open, setOpen] = React.useState(false);
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const panelRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const current = await getCurrentUser();
        if (!cancelled) setUser(current);
      } catch {
        // No session.
      } finally {
        if (!cancelled) setChecking(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // Close on Escape or a click outside, the same way the rest of the studio
  // behaves.
  React.useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    const onPointerDown = (event: MouseEvent) => {
      if (!panelRef.current?.contains(event.target as Node)) setOpen(false);
    };

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('mousedown', onPointerDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('mousedown', onPointerDown);
    };
  }, [open]);

  const signIn = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const result = await loginUser(email, password);
      setUser(result.user);
      setOpen(false);
      setPassword('');
    } catch (cause) {
      setError(
        cause instanceof Error && cause.message
          ? cause.message
          : 'The sign-in could not be completed.'
      );
    } finally {
      setBusy(false);
    }
  };

  const signOut = async () => {
    setBusy(true);
    try {
      await logoutUser();
    } catch {
      // The local state is cleared either way.
    } finally {
      setUser(null);
      setOpen(false);
      setBusy(false);
    }
  };

  if (checking) {
    return (
      <span
        className={`flex items-center gap-1.5 rounded-lg border border-slate-300 bg-slate-100 px-2.5 py-1.5 text-[12px] font-semibold text-slate-400 dark:border-slate-700 dark:bg-slate-900/60 ${darkClass}`}
      >
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        Session
      </span>
    );
  }

  return (
    <div className="relative" ref={panelRef}>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        title={user ? `Signed in as ${user.email}` : 'Sign in to the newsroom'}
        className={`flex cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-lg border px-2.5 py-1.5 text-[12px] font-semibold transition-colors ${
          user
            ? 'border-emerald-300 bg-emerald-50 text-emerald-800 hover:border-emerald-400 dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-300'
            : 'border-amber-300 bg-amber-50 text-amber-800 hover:border-amber-400 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-300'
        } ${darkClass}`}
      >
        {user ? (
          <>
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            <UserRound className="h-3.5 w-3.5" />
            <span className="max-w-[9rem] truncate">{user.name}</span>
          </>
        ) : (
          <>
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
            <LogIn className="h-3.5 w-3.5" />
            Sign in
          </>
        )}
      </button>

      {open && (
        <div
          className={`absolute right-0 top-full z-50 mt-2 w-72 rounded-xl border border-slate-200 bg-white p-3 shadow-xl dark:border-slate-700 dark:bg-[#0d1220] ${darkClass}`}
        >
          {user ? (
            <div className="space-y-3">
              <div>
                <p className="text-[13px] font-semibold text-slate-900 dark:text-white">
                  {user.name}
                </p>
                <p className="truncate text-[11px] text-slate-500">{user.email}</p>
                <p className="mt-1 inline-block rounded bg-slate-100 px-1.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                  {user.role}
                </p>
              </div>
              <p className="text-[11px] leading-relaxed text-slate-500">
                This is the newsroom session — the same one the portal and the API use.
              </p>
              <button
                type="button"
                onClick={signOut}
                disabled={busy}
                className="flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-[12px] font-semibold text-slate-600 transition-colors hover:border-slate-400 hover:text-slate-900 disabled:opacity-60 dark:border-slate-700 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:text-white"
              >
                <LogOut className="h-3.5 w-3.5" />
                Sign out
              </button>
            </div>
          ) : (
            <form onSubmit={signIn} className="space-y-2.5">
              <div>
                <p className="text-[13px] font-semibold text-slate-900 dark:text-white">
                  Sign in to the newsroom
                </p>
                <p className="mt-0.5 text-[11px] leading-relaxed text-slate-500">
                  One account for the portal, the studio and the API. Reading works either way;
                  saving needs a session.
                </p>
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@newsroom.com"
                aria-label="Email address"
                className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-[12px] text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-100 dark:placeholder:text-slate-500"
              />
              <input
                type="password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Your password"
                aria-label="Password"
                className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-[12px] text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-100 dark:placeholder:text-slate-500"
              />
              {error && (
                <p className="rounded-lg bg-rose-50 px-2.5 py-1.5 text-[11px] font-medium text-rose-700 dark:bg-rose-500/10 dark:text-rose-300">
                  {error}
                </p>
              )}
              <button
                type="submit"
                disabled={busy}
                className="flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-[12px] font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-60"
              >
                {busy ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <LogIn className="h-3.5 w-3.5" />
                )}
                Sign in
              </button>
              <a
                href={WEB_URL}
                target="_blank"
                rel="noreferrer"
                className="block cursor-pointer text-center text-[11px] font-medium text-blue-600 hover:underline dark:text-blue-400"
              >
                Or sign in through the portal
              </a>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
