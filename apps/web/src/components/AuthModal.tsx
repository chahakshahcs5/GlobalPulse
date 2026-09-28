'use client';

import React, { useState } from 'react';
import { X, Mail, User, ShieldCheck, LogIn, UserPlus, KeyRound, AlertCircle } from 'lucide-react';

export interface UserSession {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'editor' | 'reader';
  token?: string;
}

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserSession | null;
  onLoginSuccess: (user: UserSession) => void;
  onLogout: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onLoginSuccess,
  onLogout,
}) => {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCustomAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const endpoint = mode === 'signin' ? '/api/auth/login' : '/api/auth/register';
      const body =
        mode === 'signin'
          ? { email, password }
          : { email, password, name, role: 'reader', organizationId: 'org_default' };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        const data = await res.json();
        const user: UserSession = {
          id: data.user.id,
          name: data.user.name,
          email: data.user.email,
          role: data.user.role || 'reader',
          token: data.token,
        };
        onLoginSuccess(user);
        onClose();
        return;
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.message || data.error || 'Authentication failed. Please verify credentials.');
      }
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to reach authentication service. Please check your connection.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const quickLoginAs = (role: 'admin' | 'editor' | 'reader') => {
    const creds: Record<'admin' | 'editor' | 'reader', { email: string; pass: string }> = {
      admin: { email: 'admin@news.platform', pass: 'Admin123!' },
      editor: { email: 'editor@news.platform', pass: 'Editor123!' },
      reader: { email: 'journalist@news.platform', pass: 'Journalist123!' },
    };
    setEmail(creds[role].email);
    setPassword(creds[role].pass);
    setError(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                {currentUser
                  ? 'Your GlobalPulse Account'
                  : mode === 'signin'
                    ? 'Sign In'
                    : 'Create Account'}
              </h3>
              <p className="text-[11px] text-slate-400">
                {currentUser ? 'Role-Based Permissions & Profile' : 'Secure JWT Authentication'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* CURRENT USER SIGNED IN VIEW */}
        {currentUser ? (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 dark:text-white">
                  {currentUser.name}
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                    currentUser.role === 'admin'
                      ? 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300'
                      : currentUser.role === 'editor'
                        ? 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300'
                        : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                  }`}
                >
                  {currentUser.role}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-mono">{currentUser.email}</p>
              <div className="pt-2 text-[11px] text-slate-400 border-t border-slate-200 dark:border-slate-700/50 flex items-center justify-between">
                <span>Access Scope:</span>
                <span className="font-semibold text-slate-600 dark:text-slate-300">
                  {currentUser.role === 'admin'
                    ? 'Full Newsroom CMS + Autonomous MCP AI'
                    : currentUser.role === 'editor'
                      ? 'Story Creation, Editing & Publishing'
                      : 'Personalized Feeds & Reactions'}
                </span>
              </div>
            </div>

            <button
              onClick={() => {
                onLogout();
                onClose();
              }}
              className="w-full py-2.5 rounded-xl border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 font-bold text-xs hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
            >
              Sign Out
            </button>
          </div>
        ) : (
          /* AUTH LOGIN / SIGNUP FORM */
          <div className="space-y-5">
            {error && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                <span>{error}</span>
              </div>
            )}

            {/* Quick Role Fillers */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Prefill Role Credentials:
              </span>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => quickLoginAs('admin')}
                  className="p-2.5 rounded-xl border border-rose-200 dark:border-rose-900 bg-rose-50/50 dark:bg-rose-950/30 hover:bg-rose-100 text-left transition cursor-pointer"
                >
                  <div className="text-[11px] font-extrabold text-rose-700 dark:text-rose-300">
                    Admin
                  </div>
                  <div className="text-[9px] text-slate-500">Full CMS</div>
                </button>
                <button
                  type="button"
                  onClick={() => quickLoginAs('editor')}
                  className="p-2.5 rounded-xl border border-blue-200 dark:border-blue-900 bg-blue-50/50 dark:bg-blue-950/30 hover:bg-blue-100 text-left transition cursor-pointer"
                >
                  <div className="text-[11px] font-extrabold text-blue-700 dark:text-blue-300">
                    Editor
                  </div>
                  <div className="text-[9px] text-slate-500">Editorial</div>
                </button>
                <button
                  type="button"
                  onClick={() => quickLoginAs('reader')}
                  className="p-2.5 rounded-xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50/50 dark:bg-emerald-950/30 hover:bg-emerald-100 text-left transition cursor-pointer"
                >
                  <div className="text-[11px] font-extrabold text-emerald-700 dark:text-emerald-300">
                    Reporter
                  </div>
                  <div className="text-[9px] text-slate-500">Journalist</div>
                </button>
              </div>
            </div>

            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
              <span className="shrink-0 mx-3 text-[10px] uppercase font-bold text-slate-400">
                Or with credentials
              </span>
              <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
            </div>

            <form onSubmit={handleCustomAuth} className="space-y-3">
              {mode === 'signup' && (
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      required
                      placeholder="Jane Doe"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="email"
                    required
                    placeholder="user@news.platform"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Password
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {mode === 'signin' ? (
                  <LogIn className="w-4 h-4" />
                ) : (
                  <UserPlus className="w-4 h-4" />
                )}
                <span>
                  {isLoading
                    ? 'Authenticating...'
                    : mode === 'signin'
                      ? 'Sign In to GlobalPulse'
                      : 'Create Reader Account'}
                </span>
              </button>
            </form>

            <div className="text-center">
              <button
                type="button"
                onClick={() => {
                  setMode(mode === 'signin' ? 'signup' : 'signin');
                  setError(null);
                }}
                className="text-xs text-blue-600 hover:underline font-semibold cursor-pointer"
              >
                {mode === 'signin'
                  ? 'New to GlobalPulse? Create an account'
                  : 'Already registered? Sign in here'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
