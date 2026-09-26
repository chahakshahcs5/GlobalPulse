'use client';

import React from 'react';
import type { StoryBlock } from '@ai-news/schemas';
import {
  D3ChartRenderer,
  MapRenderer,
  TimelineRenderer,
  DiagramRenderer,
  VisualDiffRenderer,
} from '@ai-news/media';

interface StoryRendererProps {
  blocks: StoryBlock[];
  theme?: 'dark' | 'light';
}

export const StoryRenderer: React.FC<StoryRendererProps> = ({ blocks, theme = 'dark' }) => {
  if (!blocks || blocks.length === 0) {
    return (
      <div className="py-12 text-center text-slate-500 font-mono text-sm">
        No content blocks have been published for this revision.
      </div>
    );
  }

  // Sort blocks by sortOrder
  const sortedBlocks = [...blocks].sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <div className="space-y-6 max-w-4xl mx-auto my-8">
      {sortedBlocks.map((block) => (
        <BlockItem key={block.id} block={block} theme={theme} />
      ))}
    </div>
  );
};

const BlockItem: React.FC<{ block: StoryBlock; theme: 'dark' | 'light' }> = ({ block, theme }) => {
  switch (block.blockType) {
    case 'heading': {
      const { level, text, subtext } = block.data;
      return (
        <div className="my-2">
          {level === 1 && <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-100 mt-8 mb-3">{text}</h1>}
          {level === 2 && <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-100 mt-6 mb-2">{text}</h2>}
          {level === 3 && <h3 className="text-xl sm:text-2xl font-semibold text-slate-200 mt-4 mb-2">{text}</h3>}
          {level === 4 && <h4 className="text-lg font-semibold text-slate-300 mt-3 mb-1">{text}</h4>}
          {subtext && <p className="text-sm sm:text-base text-slate-400 mt-1">{subtext}</p>}
        </div>
      );
    }

    case 'paragraph': {
      return (
        <p className="text-base sm:text-lg text-slate-300 leading-relaxed font-normal my-4">
          {block.data.text}
        </p>
      );
    }

    case 'summary': {
      return (
        <div className="rounded-xl border border-indigo-500/20 bg-indigo-950/20 p-5 my-6 backdrop-blur-sm">
          <div className="flex items-center gap-2 mb-2 text-indigo-400 font-bold uppercase tracking-wider text-xs">
            <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse"></span>
            Executive Briefing
          </div>
          <h4 className="text-lg font-bold text-slate-100 mb-3">{block.data.headline}</h4>
          <ul className="space-y-2">
            {block.data.bulletPoints.map((pt: string, idx: number) => (
              <li key={idx} className="flex items-start gap-2.5 text-slate-300 text-sm sm:text-base">
                <span className="text-indigo-400 font-bold mt-0.5">•</span>
                <span>{pt}</span>
              </li>
            ))}
          </ul>
        </div>
      );
    }

    case 'quote': {
      return (
        <figure className="border-l-4 border-blue-500 pl-5 my-6 py-1 italic">
          <blockquote className="text-lg sm:text-xl font-medium text-slate-200">
            "{block.data.quote}"
          </blockquote>
          <figcaption className="mt-2 text-sm text-slate-400 not-italic font-sans">
            — <span className="font-semibold text-slate-300">{block.data.attribution}</span>
            {block.data.title && <span className="text-slate-500">, {block.data.title}</span>}
          </figcaption>
        </figure>
      );
    }

    case 'chart': {
      const svg = D3ChartRenderer.renderToSvg(block.data, { theme, width: 800, height: 420 });
      return (
        <div className="my-8 rounded-xl overflow-hidden border border-slate-800 bg-slate-900/60 shadow-xl">
          <div dangerouslySetInnerHTML={{ __html: svg }} />
        </div>
      );
    }

    case 'map': {
      const svg = MapRenderer.renderSvgFallback(block.data, 800, 420, theme);
      return (
        <div className="my-8 rounded-xl overflow-hidden border border-slate-800 bg-slate-900/60 shadow-xl">
          <div dangerouslySetInnerHTML={{ __html: svg }} />
        </div>
      );
    }

    case 'timeline': {
      const svg = TimelineRenderer.renderSvgTrack(block.data, 'horizontal', 800, 240, theme);
      return (
        <div className="my-8 rounded-xl overflow-hidden border border-slate-800 bg-slate-900/60 shadow-xl">
          <div dangerouslySetInnerHTML={{ __html: svg }} />
        </div>
      );
    }

    case 'diagram': {
      const svg = DiagramRenderer.renderDeclarativeSvg(block.data, 800, 340, theme);
      return (
        <div className="my-8 rounded-xl overflow-hidden border border-slate-800 bg-slate-900/60 shadow-xl">
          <div dangerouslySetInnerHTML={{ __html: svg }} />
        </div>
      );
    }

    case 'what_changed': {
      const html = VisualDiffRenderer.renderHtml(block.data, theme === 'dark');
      return <div dangerouslySetInnerHTML={{ __html: html }} />;
    }

    case 'statistic': {
      const { value, label, trend, trendValue, context } = block.data;
      return (
        <div className="my-6 p-6 rounded-xl border border-slate-800 bg-slate-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">{label}</span>
            <div className="text-4xl sm:text-5xl font-extrabold text-slate-100 tracking-tight mt-1">{value}</div>
            {context && <p className="text-xs text-slate-400 mt-1">{context}</p>}
          </div>
          {trend && (
            <div
              className={`px-3 py-1.5 rounded-lg text-sm font-bold flex items-center gap-1 self-start sm:self-center ${
                trend === 'up' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
              }`}
            >
              <span>{trend === 'up' ? '↑' : '↓'}</span>
              <span>{trendValue || trend}</span>
            </div>
          )}
        </div>
      );
    }

    case 'callout': {
      const stylesMap: Record<string, string> = {
        info: 'border-blue-500/30 bg-blue-950/20 text-blue-200',
        warning: 'border-amber-500/30 bg-amber-950/20 text-amber-200',
        tip: 'border-emerald-500/30 bg-emerald-950/20 text-emerald-200',
        critical: 'border-rose-500/30 bg-rose-950/20 text-rose-200',
      };
      const styles = stylesMap[block.data.style] || stylesMap.info;

      return (
        <div className={`p-4 rounded-xl border ${styles} my-4`}>
          {block.data.title && <h5 className="font-bold text-sm mb-1">{block.data.title}</h5>}
          <p className="text-sm leading-relaxed">{block.data.text}</p>
        </div>
      );
    }

    case 'image': {
      return (
        <figure className="my-6">
          <img
            src={block.data.url}
            alt={block.data.altText}
            className="w-full rounded-xl object-cover border border-slate-800 max-h-[500px]"
            loading="lazy"
          />
          {(block.data.caption || block.data.credit) && (
            <figcaption className="text-xs text-slate-400 mt-2 flex justify-between px-1">
              <span>{block.data.caption}</span>
              {block.data.credit && <span className="font-mono">Credit: {block.data.credit}</span>}
            </figcaption>
          )}
        </figure>
      );
    }

    case 'citation': {
      return (
        <div className="my-3 px-3 py-2 rounded-lg border border-slate-800 bg-slate-900/30 text-xs text-slate-400 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-300">Verified Claim:</span>
            <span>"{block.data.claim}"</span>
          </div>
          <span className="font-mono text-indigo-400">Sources: {block.data.sourceIds.length}</span>
        </div>
      );
    }

    case 'table': {
      return (
        <div className="my-6 overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/40">
          {block.data.title && <div className="p-3 font-bold text-sm text-slate-200 border-b border-slate-800">{block.data.title}</div>}
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-800/60 text-slate-200 font-semibold border-b border-slate-700">
              <tr>
                {block.data.headers.map((h: string, i: number) => (
                  <th key={i} className="px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {block.data.rows.map((row: string[], rIdx: number) => (
                <tr key={rIdx} className="hover:bg-slate-800/30">
                  {row.map((cell: string, cIdx: number) => (
                    <td key={cIdx} className="px-4 py-2.5">{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    default:
      return null;
  }
};
