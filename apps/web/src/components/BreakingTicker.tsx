'use client';

import React from 'react';
import Link from 'next/link';

interface TickerItem {
  id: string;
  topic: string;
  headline: string;
  slug: string;
  timeAgo: string;
}

const DEFAULT_TICKERS: TickerItem[] = [
  {
    id: 't1',
    topic: 'BRICS 2026',
    headline: 'Summit delegates ratify bilateral settlement accord across 10 member states',
    slug: 'brics-2026-summit-ratifies-landmark-trade-pact',
    timeAgo: '12m ago',
  },
  {
    id: 't2',
    topic: 'SEMICONDUCTORS',
    headline: 'Global Semiconductor Consortium establishes joint 2nm lithography standard',
    slug: 'global-semiconductor-consortium-formed',
    timeAgo: '35m ago',
  },
  {
    id: 't3',
    topic: 'ENERGY',
    headline: 'Magnetic fusion reactor sustains net positive Q-factor for 120 seconds',
    slug: 'fusion-reactor-test-reaches-net-energy-gain',
    timeAgo: '1h ago',
  },
  {
    id: 't4',
    topic: 'MARKETS',
    headline: 'Central Bank Digital Currency cross-border pilot settles 2.4B USD in first tranche',
    slug: 'central-bank-digital-currency-pilot-launched',
    timeAgo: '2h ago',
  },
];

export const BreakingTicker: React.FC<{ items?: TickerItem[] }> = ({ items = DEFAULT_TICKERS }) => {
  return (
    <div className="bg-slate-950 border-b border-slate-800/80 overflow-hidden h-9 flex items-center select-none text-xs">
      {/* Fixed Breaking Badge */}
      <div className="z-10 bg-rose-600 text-white font-extrabold px-3 py-1 uppercase tracking-wider flex items-center gap-1.5 h-full shrink-0 shadow-md">
        <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping"></span>
        BREAKING
      </div>

      {/* Marquee Ticker Track */}
      <div className="overflow-hidden whitespace-nowrap flex-1">
        <div className="ticker-track">
          {[...items, ...items].map((item, idx) => (
            <Link
              key={`${item.id}-${idx}`}
              href={`/stories/${item.slug}`}
              className="inline-flex items-center gap-2 mx-6 text-slate-300 hover:text-blue-400 transition"
            >
              <span className="font-bold text-slate-400 font-mono uppercase tracking-wider text-[11px]">[{item.topic}]</span>
              <span className="font-medium">{item.headline}</span>
              <span className="text-slate-500 font-mono text-[10px]">({item.timeAgo})</span>
              <span className="text-slate-700 ml-4">•</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};
