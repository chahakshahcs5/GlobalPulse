'use client';

import { useEffect, useState } from 'react';
import { Play, Pause, RotateCw, Radio } from 'lucide-react';
import type { StudioPayload } from '@ai-news/block-studio';

export interface LiveSimulatorControlsProps {
  blockType: string;
  payload: StudioPayload;
  onChange: (newPayload: StudioPayload) => void;
  darkClass: string;
}

const SUPPORTED_REALTIME_BLOCKS = new Set([
  'live_ticker',
  'live_data',
  'financial',
  'election',
  'disaster',
  'live_comments',
  'poll',
]);

export function isRealtimeBlock(blockType: string): boolean {
  return SUPPORTED_REALTIME_BLOCKS.has(blockType);
}

export function LiveSimulatorControls({
  blockType,
  payload,
  onChange,
  darkClass,
}: LiveSimulatorControlsProps) {
  const [active, setActive] = useState(false);
  const [tickCount, setTickCount] = useState(0);

  const simulateStep = () => {
    const data = { ...payload.data };

    // 1. Financial updates (stock price, crypto, indices)
    if (blockType === 'financial') {
      if (Array.isArray(data.items)) {
        data.items = (data.items as Array<Record<string, unknown>>).map((item) => {
          const price = typeof item.price === 'number' ? item.price : 100;
          const delta = (Math.random() - 0.48) * (price * 0.015);
          const newPrice = Math.round((price + delta) * 100) / 100;
          const change = Math.round(((newPrice - 100) / 100) * 100 * 100) / 100;
          return {
            ...item,
            price: newPrice,
            change: change > 0 ? `+${change}%` : `${change}%`,
            trend: delta >= 0 ? 'up' : 'down',
          };
        });
      } else if (typeof data.price === 'number') {
        const delta = (Math.random() - 0.48) * (data.price * 0.015);
        data.price = Math.round((data.price + delta) * 100) / 100;
      }
    }

    // 2. Live Ticker / News feed
    else if (blockType === 'live_ticker') {
      const headlines = [
        'Breaking: UN General Assembly initiates extraordinary climate pact session',
        'Market update: Global semiconductor index rises 1.4% in morning trade',
        'Seismic monitoring: Minor aftershock recorded at 4.2 magnitude off northern coast',
        'Central Bank issues statement affirming stable liquidity reserves',
        'Clean energy breakthrough: High-efficiency solar perovskite cell certified',
      ];
      const nextHeadline = headlines[Math.floor(Math.random() * headlines.length)];
      const items = Array.isArray(data.items) ? [...data.items] : [];
      items.unshift({
        id: `tick_${Date.now()}`,
        text: nextHeadline,
        timestamp: new Date().toLocaleTimeString(),
        urgent: Math.random() > 0.6,
      });
      data.items = items.slice(0, 10);
    }

    // 3. Election / Poll updates
    else if (blockType === 'election' || blockType === 'poll') {
      if (Array.isArray(data.options)) {
        const idx = Math.floor(Math.random() * data.options.length);
        const options = [...(data.options as Array<Record<string, unknown>>)];
        if (options[idx]) {
          const currentVotes = typeof options[idx].votes === 'number' ? options[idx].votes : 10;
          options[idx] = { ...options[idx], votes: (currentVotes as number) + 1 };
          data.options = options;
        }
      }
    }

    // 4. Live Data / Disaster Metrics
    else if (blockType === 'disaster' || blockType === 'live_data') {
      if (typeof data.evacuated === 'number') {
        data.evacuated += Math.floor(Math.random() * 50) + 10;
      }
      if (typeof data.activeCount === 'number') {
        data.activeCount += Math.floor(Math.random() * 5) - 2;
      }
      data.lastUpdated = new Date().toLocaleTimeString();
    }

    setTickCount((prev) => prev + 1);
    onChange({ ...payload, data });
  };

  useEffect(() => {
    if (!active) return;
    const interval = setInterval(simulateStep, 2500);
    return () => clearInterval(interval);
  }, [active, payload, blockType]);

  if (!isRealtimeBlock(blockType)) return null;

  return (
    <div
      className={`flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs shadow-sm dark:border-slate-800 dark:bg-slate-900 ${darkClass}`}
    >
      <div className="flex items-center gap-1.5">
        <Radio
          className={`h-3.5 w-3.5 ${active ? 'animate-pulse text-emerald-500' : 'text-slate-400'}`}
        />
        <span className="font-semibold text-slate-700 dark:text-slate-300">Live Simulator</span>
      </div>

      {active && (
        <span className="flex items-center gap-1 rounded bg-emerald-100 px-1.5 py-0.5 font-mono text-[10px] font-bold text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
          Pulse #{tickCount}
        </span>
      )}

      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => setActive(!active)}
          title={active ? 'Pause simulated updates' : 'Start live SSE streaming simulation'}
          className={`flex items-center gap-1 rounded-md px-2 py-0.5 font-semibold transition-colors ${
            active
              ? 'bg-amber-100 text-amber-800 hover:bg-amber-200 dark:bg-amber-500/20 dark:text-amber-300'
              : 'bg-emerald-600 text-white hover:bg-emerald-500'
          }`}
        >
          {active ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
          <span>{active ? 'Pause' : 'Start'}</span>
        </button>

        <button
          type="button"
          onClick={simulateStep}
          title="Trigger a single simulated tick"
          className="rounded p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
        >
          <RotateCw className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}
