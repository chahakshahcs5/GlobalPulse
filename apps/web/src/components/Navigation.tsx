'use client';

import React from 'react';
import Link from 'next/link';

export const Navigation: React.FC = () => {
  return (
    <header className="sticky top-0 z-50 glass-panel border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center font-extrabold text-white text-lg shadow-lg shadow-blue-500/30">
              N
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-lg tracking-tight text-white leading-none">
                GLOBAL<span className="text-blue-500">PULSE</span>
              </span>
              <span className="text-[10px] font-mono text-slate-400 tracking-wider uppercase">AI-Operable Newsroom</span>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 text-sm font-medium text-slate-300">
            <Link href="/" className="px-3 py-1.5 rounded-lg hover:text-white hover:bg-slate-800/60 transition">
              Feed
            </Link>
            <Link href="/topics/brics-2026" className="px-3 py-1.5 rounded-lg hover:text-white hover:bg-slate-800/60 transition">
              BRICS 2026
            </Link>
            <Link href="/topics/semiconductors" className="px-3 py-1.5 rounded-lg hover:text-white hover:bg-slate-800/60 transition">
              Semiconductors
            </Link>
            <Link href="/topics/ai-policy" className="px-3 py-1.5 rounded-lg hover:text-white hover:bg-slate-800/60 transition">
              AI Policy
            </Link>
            <Link href="/sources" className="px-3 py-1.5 rounded-lg hover:text-white hover:bg-slate-800/60 transition">
              Sources
            </Link>
            <Link href="/settings/integrations" className="px-3 py-1.5 rounded-lg hover:text-white hover:bg-slate-800/60 transition">
              AI Integrations
            </Link>
          </nav>
        </div>

        {/* Action Buttons: Display Wall & CMS */}
        <div className="flex items-center gap-3">
          <Link
            href="/display"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-purple-500/30 bg-purple-500/10 text-purple-300 text-xs font-bold tracking-wide hover:bg-purple-500/20 transition"
          >
            <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse"></span>
            4K DISPLAY WALL
          </Link>
          <Link
            href="/admin"
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-blue-500/30 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition shadow-sm"
          >
            EDITORIAL CMS
          </Link>
        </div>
      </div>
    </header>
  );
};
