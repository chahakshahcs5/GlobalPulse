import React from 'react';

export interface MobileBlockProps {
  blocks: any[];
}

export function MobileBlockRenderer({ blocks }: MobileBlockProps) {
  if (!blocks || blocks.length === 0) {
    return <div className="text-slate-500 text-sm italic">No content blocks available.</div>;
  }

  return (
    <div className="space-y-4">
      {blocks.map((block) => {
        const key = block.id || `blk_${Math.random()}`;

        switch (block.blockType) {
          case 'heading': {
            const level = block.data?.level || 2;
            const text = block.data?.text || '';
            if (level === 1) {
              return <h1 key={key} className="text-2xl font-black text-white">{text}</h1>;
            } else if (level === 2) {
              return <h2 key={key} className="text-xl font-bold text-white mt-4">{text}</h2>;
            } else {
              return <h3 key={key} className="text-lg font-bold text-slate-200 mt-3">{text}</h3>;
            }
          }

          case 'paragraph': {
            return (
              <p key={key} className="text-base text-slate-300 leading-relaxed font-normal">
                {block.data?.text}
              </p>
            );
          }

          case 'quote': {
            return (
              <blockquote key={key} className="border-l-4 border-blue-500 pl-4 py-1 italic text-slate-200 my-3">
                <p>"{block.data?.quote}"</p>
                {block.data?.attribution && (
                  <footer className="text-xs text-blue-400 mt-1 not-italic font-bold">
                    — {block.data.attribution}
                  </footer>
                )}
              </blockquote>
            );
          }

          case 'chart': {
            const chartData = block.data || {};
            return (
              <div key={key} className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 my-3 space-y-2">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-blue-400 font-bold uppercase">{chartData.chartType} CHART</span>
                  <span className="text-slate-500">Data Visual</span>
                </div>
                <h4 className="font-bold text-white text-sm">{chartData.title}</h4>
                <div className="text-xs text-slate-400 font-mono">
                  {chartData.values?.length || 0} data points recorded
                </div>
                {chartData.sourceAttribution && (
                  <div className="text-[11px] text-slate-500 font-mono pt-1 border-t border-slate-800">
                    Source: {chartData.sourceAttribution}
                  </div>
                )}
              </div>
            );
          }

          case 'timeline': {
            const items = block.data?.items || [];
            return (
              <div key={key} className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 my-3 space-y-3">
                <div className="text-xs font-mono text-indigo-400 font-bold uppercase">
                  TIMELINE ({items.length} MILESTONES)
                </div>
                <div className="space-y-3 pl-2 border-l-2 border-indigo-500/30">
                  {items.map((item: any, idx: number) => (
                    <div key={idx} className="relative pl-3">
                      <div className="absolute -left-[19px] top-1.5 w-2 h-2 rounded-full bg-indigo-400" />
                      <span className="text-[11px] font-mono text-indigo-300 font-bold">{item.date}</span>
                      <h5 className="font-bold text-white text-sm">{item.headline}</h5>
                      <p className="text-xs text-slate-300 mt-0.5">{item.body}</p>
                    </div>
                  ))}
                </div>
              </div>
            );
          }

          case 'callout': {
            return (
              <div key={key} className="p-3 rounded-xl border border-blue-500/30 bg-blue-950/20 text-blue-200 text-sm my-2">
                {block.data?.title && <strong className="block font-bold">{block.data.title}</strong>}
                <p className="text-xs text-blue-300 mt-0.5">{block.data?.text}</p>
              </div>
            );
          }

          case 'statistic': {
            return (
              <div key={key} className="p-4 rounded-xl border border-slate-800 bg-slate-900 text-center my-3">
                <div className="text-3xl font-extrabold text-blue-400">{block.data?.value}</div>
                <div className="text-xs font-bold text-white mt-1 uppercase">{block.data?.label}</div>
                {block.data?.change && (
                  <span className="text-[11px] font-mono text-emerald-400 block mt-1">
                    {block.data.change}
                  </span>
                )}
              </div>
            );
          }

          default:
            return null;
        }
      })}
    </div>
  );
}
