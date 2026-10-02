'use client';

import { useState, useEffect } from 'react';
import { X, Sliders, Sparkles, BookOpen, Compass, ShieldCheck, Check } from 'lucide-react';
import type { AlgorithmTuning, DepthPreference } from '@ai-news/schemas';

interface AlgorithmTunerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply?: (tuning: AlgorithmTuning) => void;
}

export function AlgorithmTunerModal({ isOpen, onClose, onApply }: AlgorithmTunerModalProps) {
  const [depth, setDepth] = useState<DepthPreference>('balanced');
  const [serendipity, setSerendipity] = useState<number>(35);
  const [localVsGlobal, setLocalVsGlobal] = useState<number>(50);
  const [strictness, setStrictness] = useState<number>(75);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('globalpulse_algorithm_tuning');
      if (stored) {
        try {
          const parsed = JSON.parse(stored) as AlgorithmTuning;
          if (parsed.depthPreference) setDepth(parsed.depthPreference);
          if (typeof parsed.serendipityWeight === 'number')
            setSerendipity(parsed.serendipityWeight);
          if (typeof parsed.localVsGlobalWeight === 'number')
            setLocalVsGlobal(parsed.localVsGlobalWeight);
          if (typeof parsed.editorialStrictness === 'number')
            setStrictness(parsed.editorialStrictness);
        } catch {
          // Ignore parse errors
        }
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    const tuning: AlgorithmTuning = {
      depthPreference: depth,
      serendipityWeight: serendipity,
      localVsGlobalWeight: localVsGlobal,
      editorialStrictness: strictness,
    };
    if (typeof window !== 'undefined') {
      localStorage.setItem('globalpulse_algorithm_tuning', JSON.stringify(tuning));
    }
    setSaved(true);
    if (onApply) onApply(tuning);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 dark:bg-black/75 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-xl rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-6 sm:p-8 shadow-2xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-500/20">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
                Tune Your Algorithm
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Direct algorithmic transparency. Control how your reading feed is curated.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sliders & Controls */}
        <div className="space-y-6 text-xs">
          {/* Depth Preference */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 font-mono uppercase text-[11px]">
                <BookOpen className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" /> Reading Depth
                Mode
              </span>
              <span className="text-[11px] font-mono text-blue-600 dark:text-blue-400 uppercase font-bold">
                {depth.replace('_', ' ')}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {(
                [
                  { id: 'quick', label: 'Quick', desc: '≤3 min briefs & TL;DR' },
                  { id: 'balanced', label: 'Balanced', desc: 'Standard dispatches' },
                  { id: 'deep_dive', label: 'Deep Dive', desc: 'Investigative longform' },
                ] as const
              ).map((tier) => (
                <button
                  key={tier.id}
                  onClick={() => setDepth(tier.id)}
                  className={`p-3 rounded-2xl border text-left transition flex flex-col justify-between space-y-1 cursor-pointer ${
                    depth === tier.id
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-white shadow-xs'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/40 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <span className="font-bold text-xs text-slate-900 dark:text-white">
                    {tier.label}
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
                    {tier.desc}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Serendipity Slider */}
          <div className="space-y-2 p-4 rounded-2xl border border-slate-200 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-900/40">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 font-mono uppercase text-[11px]">
                <Compass className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />{' '}
                Serendipity &amp; Discovery
              </span>
              <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                {serendipity}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={serendipity}
              onChange={(e) => setSerendipity(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
            <div className="flex justify-between text-[10px] font-mono text-slate-500 dark:text-slate-400">
              <span>Pure Followed Beats</span>
              <span>Exploratory &amp; Unexpected</span>
            </div>
          </div>

          {/* Local vs Global Slider */}
          <div className="space-y-2 p-4 rounded-2xl border border-slate-200 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-900/40">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 font-mono uppercase text-[11px]">
                <Sparkles className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" /> Regional vs.
                Global Horizon
              </span>
              <span className="font-mono text-amber-600 dark:text-amber-400 font-bold">
                {localVsGlobal}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={localVsGlobal}
              onChange={(e) => setLocalVsGlobal(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
            />
            <div className="flex justify-between text-[10px] font-mono text-slate-500 dark:text-slate-400">
              <span>Local Edition First</span>
              <span>Global Geopolitics</span>
            </div>
          </div>

          {/* Editorial Strictness Slider */}
          <div className="space-y-2 p-4 rounded-2xl border border-slate-200 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-900/40">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 font-mono uppercase text-[11px]">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" /> Source
                Consensus Strictness
              </span>
              <span className="font-mono text-indigo-600 dark:text-indigo-400 font-bold">
                {strictness}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={strictness}
              onChange={(e) => setStrictness(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
            />
            <div className="flex justify-between text-[10px] font-mono text-slate-500 dark:text-slate-400">
              <span>Fast Developing Wire</span>
              <span>Multi-Wire Verified</span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <button
            onClick={() => {
              setDepth('balanced');
              setSerendipity(35);
              setLocalVsGlobal(50);
              setStrictness(75);
            }}
            className="text-xs font-mono text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition cursor-pointer"
          >
            Reset Defaults
          </button>

          <button
            onClick={handleSave}
            disabled={saved}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition shadow-md disabled:opacity-80 cursor-pointer"
          >
            {saved ? (
              <>
                <Check className="w-4 h-4 text-white" />
                <span>Algorithm Updated!</span>
              </>
            ) : (
              <span>Apply Algorithm Weights</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
