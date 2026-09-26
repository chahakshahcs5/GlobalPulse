import type { Metadata } from 'next';
import './globals.css';
import { Navigation } from '../components/Navigation';
import { BreakingTicker } from '../components/BreakingTicker';

export const metadata: Metadata = {
  title: 'GlobalPulse — AI-Operable Multimedia News Platform',
  description: 'A modern, AI-agnostic multimedia publishing platform operated by human journalists and remote MCP AI agents.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen flex flex-col bg-[#090d16] text-slate-100 selection:bg-blue-500/30 selection:text-blue-200">
        <BreakingTicker />
        <Navigation />
        <main className="flex-1">{children}</main>
        <footer className="border-t border-slate-800/80 bg-slate-950 py-10 mt-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-slate-500">
            <div className="flex items-center gap-3">
              <span className="font-extrabold text-slate-400">GLOBALPULSE NEWSROOM</span>
              <span>•</span>
              <span>Model Context Protocol (MCP) Streamable HTTP Provider</span>
            </div>
            <div className="flex items-center gap-6 font-mono text-[11px]">
              <span>Remote MCP: <strong className="text-emerald-400">ONLINE (Port 4001)</strong></span>
              <span>Architecture: <strong className="text-blue-400">AI Is Not The App</strong></span>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
