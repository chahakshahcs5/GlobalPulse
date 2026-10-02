'use client';

import React from 'react';
import { Clock } from 'lucide-react';
import type { TimelineBlock } from '@ai-news/schemas';

export const TimelineBlockView: React.FC<{ data: TimelineBlock['data'] }> = ({ data }) => {
  const items = data.items || [];
  const [layoutMode, setLayoutMode] = React.useState<'flow' | 'chronology'>(
    items.length <= 4 ? 'flow' : 'chronology'
  );

  return (
    <div className="my-8 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 shadow-sm overflow-hidden transition-all hover:shadow-md">
      {/* Header Bar */}
      <div className="px-5 py-4 bg-slate-50/80 dark:bg-slate-950/40 border-b border-slate-200/80 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-bold text-base text-slate-900 dark:text-slate-100 tracking-tight">
              {data.title || 'Chronology of Milestones'}
            </h4>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {items.length} key event{items.length === 1 ? '' : 's'} recorded
            </span>
          </div>
        </div>
        {items.length > 2 && (
          <div className="flex items-center bg-slate-200/60 dark:bg-slate-800/80 p-0.5 rounded-lg text-xs font-semibold">
            <button
              type="button"
              onClick={() => setLayoutMode('flow')}
              className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                layoutMode === 'flow'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              Horizontal Steps
            </button>
            <button
              type="button"
              onClick={() => setLayoutMode('chronology')}
              className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                layoutMode === 'chronology'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              Detailed Timeline
            </button>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div className="p-5 sm:p-6">
        {layoutMode === 'flow' ? (
          /* Responsive Horizontal Flow */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 relative">
            {items.map((item, idx) => (
              <div
                key={idx}
                className="relative rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/30 p-4.5 flex flex-col justify-between transition-all hover:border-blue-500/40 hover:shadow-xs group"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2.5">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold font-mono bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-500/20">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400" />
                      {item.date}
                    </span>
                    <span className="text-[11px] font-mono font-bold text-slate-400 dark:text-slate-500">
                      Step {idx + 1}
                    </span>
                  </div>

                  <h5 className="font-bold text-sm text-slate-900 dark:text-slate-100 leading-snug group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {item.headline}
                  </h5>

                  <p className="mt-2 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    {item.body}
                  </p>
                </div>

                {item.mediaUrl && (
                  <div className="mt-3 pt-2.5 border-t border-slate-200/60 dark:border-slate-800">
                    <img
                      src={item.mediaUrl}
                      alt={item.headline}
                      className="w-full h-24 object-cover rounded-lg"
                      loading="lazy"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          /* Vertical Connected Chronology Spine */
          <div className="relative pl-6 sm:pl-8 border-l-2 border-blue-500/30 dark:border-blue-500/20 space-y-6 sm:space-y-8 my-2">
            {items.map((item, idx) => (
              <div key={idx} className="relative group">
                {/* Connected Node Dot */}
                <div className="absolute -left-[31px] sm:-left-[39px] top-1 w-6 h-6 rounded-full bg-blue-600 dark:bg-blue-500 text-white font-bold text-xs flex items-center justify-center ring-4 ring-white dark:ring-slate-900 shadow-xs">
                  {idx + 1}
                </div>

                <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/30 p-4 sm:p-5 transition-all hover:border-blue-500/40 hover:shadow-xs">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold font-mono bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-500/20">
                      <Clock className="w-3 h-3" />
                      {item.date}
                    </span>
                  </div>

                  <h5 className="text-base font-bold text-slate-900 dark:text-slate-100 leading-snug">
                    {item.headline}
                  </h5>

                  <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                    {item.body}
                  </p>

                  {item.mediaUrl && (
                    <div className="mt-3">
                      <img
                        src={item.mediaUrl}
                        alt={item.headline}
                        className="max-h-56 object-cover rounded-lg border border-slate-200 dark:border-slate-800"
                        loading="lazy"
                      />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
