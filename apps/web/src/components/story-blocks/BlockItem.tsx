'use client';

import React from 'react';
import type { StoryBlock } from '@ai-news/schemas';
import { D3ChartRenderer, MapRenderer, VisualDiffRenderer } from '@ai-news/media';
import { AudioBlockView } from './AudioBlockView';
import { VideoBlockView } from './VideoBlockView';
import { DiagramBlockView } from './DiagramBlockView';
import { TimelineBlockView } from './TimelineBlockView';
import { DocumentViewerBlockView } from './DocumentViewerBlockView';
import { PollBlockView, LiveTickerBlockView, ComparisonBlockView } from './InteractiveBlockViews';
import {
  GalleryBlockView,
  FlowBlockView,
  SlideDeckBlockView,
  ImageDiffBlockView,
  EmbedBlockView,
} from './MediaBlockViews';
import {
  SourceBlockView,
  EntityBlockView,
  RelatedStoriesBlockView,
} from './EntitySourceBlockViews';

export const BlockItem: React.FC<{ block: StoryBlock; theme: 'dark' | 'light' }> = ({
  block,
  theme,
}) => {
  switch (block.blockType) {
    case 'heading': {
      const { level, text, subtext } = block.data;
      return (
        <div className="my-3">
          {level === 1 && (
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white mt-8 mb-3">
              {text}
            </h1>
          )}
          {level === 2 && (
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white mt-6 mb-2">
              {text}
            </h2>
          )}
          {level === 3 && (
            <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mt-5 mb-2">
              {text}
            </h3>
          )}
          {level === 4 && (
            <h4 className="text-lg font-bold text-slate-800 dark:text-slate-200 mt-4 mb-1">
              {text}
            </h4>
          )}
          {subtext && (
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 mt-1">
              {subtext}
            </p>
          )}
        </div>
      );
    }

    case 'paragraph': {
      return (
        <p className="text-base sm:text-lg text-slate-800 dark:text-slate-200 leading-relaxed font-normal my-4">
          {block.data.text}
        </p>
      );
    }

    case 'summary': {
      return (
        <div className="rounded-2xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/70 dark:bg-blue-950/30 p-5 sm:p-6 my-6 shadow-xs">
          <div className="flex items-center gap-2 mb-2 text-blue-700 dark:text-blue-400 font-bold uppercase tracking-wider text-xs">
            <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
            Executive Briefing
          </div>
          <h4 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white mb-3">
            {block.data.headline}
          </h4>
          <ul className="space-y-2.5">
            {block.data.bulletPoints.map((pt: string, idx: number) => (
              <li
                key={idx}
                className="flex items-start gap-2.5 text-slate-800 dark:text-slate-200 text-sm sm:text-base font-medium"
              >
                <span className="text-blue-600 dark:text-blue-400 font-bold mt-0.5">•</span>
                <span>{pt}</span>
              </li>
            ))}
          </ul>
        </div>
      );
    }

    case 'quote': {
      return (
        <figure className="rounded-r-2xl border-l-4 border-blue-600 bg-slate-100/70 dark:bg-slate-800/40 p-5 my-6">
          <blockquote className="text-lg sm:text-xl font-medium font-serif-headline text-slate-900 dark:text-slate-100 italic leading-snug">
            "{block.data.quote}"
          </blockquote>
          <figcaption className="mt-2 text-sm text-slate-600 dark:text-slate-400 not-italic font-sans">
            —{' '}
            <span className="font-bold text-slate-800 dark:text-slate-200">
              {block.data.attribution}
            </span>
            {block.data.title && <span className="text-slate-500">, {block.data.title}</span>}
          </figcaption>
        </figure>
      );
    }

    case 'chart': {
      const svg = D3ChartRenderer.renderToSvg(block.data, { theme, width: 800, height: 440 });
      return (
        <figure className="my-8 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm transition-all hover:shadow-md">
          <div className="p-3 sm:p-4">
            <div dangerouslySetInnerHTML={{ __html: svg }} />
          </div>
          {(block.data.subtitle || block.data.sourceAttribution) && (
            <figcaption className="px-5 py-2.5 bg-slate-50 dark:bg-slate-950/40 border-t border-slate-100 dark:border-slate-800/80 text-xs text-slate-500 dark:text-slate-400 flex flex-wrap justify-between items-center gap-2">
              <span>{block.data.subtitle || block.data.title}</span>
              {block.data.sourceAttribution && (
                <span className="font-mono text-[11px]">
                  Source: {block.data.sourceAttribution}
                </span>
              )}
            </figcaption>
          )}
        </figure>
      );
    }

    case 'map': {
      const svg = MapRenderer.renderSvgFallback(block.data, 800, 420, theme);
      return (
        <div className="my-8 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-3">
          <div dangerouslySetInnerHTML={{ __html: svg }} />
        </div>
      );
    }

    case 'timeline': {
      return <TimelineBlockView data={block.data} />;
    }

    case 'diagram': {
      return <DiagramBlockView data={block.data} theme={theme} />;
    }

    case 'what_changed': {
      const html = VisualDiffRenderer.renderHtml(block.data, theme === 'dark');
      return <div dangerouslySetInnerHTML={{ __html: html }} />;
    }

    case 'statistic': {
      const { value, label, trend, trendValue, context } = block.data;
      return (
        <div className="my-6 p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {label}
            </span>
            <div className="text-4xl sm:text-5xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight mt-1">
              {value}
            </div>
            {context && (
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">{context}</p>
            )}
          </div>
          {trend && (
            <div
              className={`px-3 py-1.5 rounded-lg text-sm font-bold flex items-center gap-1 self-start sm:self-center border ${
                trend === 'up'
                  ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20'
                  : 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-500/20'
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
        info: 'border-blue-200 dark:border-blue-500/30 bg-blue-50 dark:bg-blue-950/20 text-blue-900 dark:text-blue-200',
        warning:
          'border-amber-200 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-950/20 text-amber-900 dark:text-amber-200',
        tip: 'border-emerald-200 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-900 dark:text-emerald-200',
        critical:
          'border-rose-200 dark:border-rose-500/30 bg-rose-50 dark:bg-rose-950/20 text-rose-900 dark:text-rose-200',
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
            className="w-full rounded-xl object-cover border border-slate-200 dark:border-slate-800 max-h-[500px]"
            loading="lazy"
          />
          {(block.data.caption || block.data.credit) && (
            <figcaption className="text-xs text-slate-500 dark:text-slate-400 mt-2 flex justify-between px-1">
              <span>{block.data.caption}</span>
              {block.data.credit && <span className="font-mono">Credit: {block.data.credit}</span>}
            </figcaption>
          )}
        </figure>
      );
    }

    case 'gallery': {
      return <GalleryBlockView data={block.data} />;
    }

    case 'flow': {
      return <FlowBlockView data={block.data} />;
    }

    case 'video': {
      return <VideoBlockView data={block.data} />;
    }

    case 'audio': {
      return <AudioBlockView data={block.data} theme={theme} />;
    }

    case 'slide_deck': {
      return <SlideDeckBlockView data={block.data} />;
    }

    case 'comparison': {
      return <ComparisonBlockView data={block.data} />;
    }

    case 'source': {
      return <SourceBlockView data={block.data} />;
    }

    case 'entity': {
      return <EntityBlockView data={block.data} />;
    }

    case 'related_stories': {
      return <RelatedStoriesBlockView data={block.data} />;
    }

    case 'embed': {
      return <EmbedBlockView data={block.data} />;
    }

    case 'image_diff': {
      return <ImageDiffBlockView data={block.data} />;
    }

    case 'live_ticker': {
      return <LiveTickerBlockView data={block.data} />;
    }

    case 'poll': {
      return <PollBlockView data={block.data} blockId={block.id} />;
    }

    case 'document_viewer': {
      return <DocumentViewerBlockView data={block.data} />;
    }

    case 'citation': {
      return (
        <div className="my-3 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/30 text-xs text-slate-600 dark:text-slate-400 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-800 dark:text-slate-300">
              Verified Claim:
            </span>
            <span className="text-slate-700 dark:text-slate-300">"{block.data.claim}"</span>
          </div>
          <span className="font-mono text-indigo-600 dark:text-indigo-400">
            Sources: {block.data.sourceIds.length}
          </span>
        </div>
      );
    }

    case 'table': {
      return (
        <div className="my-6 overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 shadow-sm">
          {block.data.title && (
            <div className="p-3 font-bold text-sm text-slate-800 dark:text-slate-200 border-b border-slate-200 dark:border-slate-800">
              {block.data.title}
            </div>
          )}
          <table className="w-full text-left text-sm text-slate-700 dark:text-slate-300">
            <thead className="bg-slate-100 dark:bg-slate-800/60 text-slate-900 dark:text-slate-200 font-semibold border-b border-slate-200 dark:border-slate-700">
              <tr>
                {block.data.headers.map((h: string, i: number) => (
                  <th key={i} className="px-4 py-3">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {block.data.rows.map((row: string[], rIdx: number) => (
                <tr
                  key={rIdx}
                  className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors"
                >
                  {row.map((cell: string, cIdx: number) => (
                    <td key={cIdx} className="px-4 py-2.5">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          {block.data.footer && (
            <div className="p-2.5 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-500 italic text-right">
              {block.data.footer}
            </div>
          )}
        </div>
      );
    }

    default:
      return null;
  }
};
