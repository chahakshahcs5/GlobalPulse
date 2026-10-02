'use client';

import React from 'react';
import Link from 'next/link';
import {
  Play,
  Pause,
  RotateCcw,
  FastForward,
  Volume2,
  VolumeX,
  Sparkles,
  Headphones,
  Copy,
  Check,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Clock,
} from 'lucide-react';
import type {
  StoryBlock,
  GalleryBlock,
  FlowBlock,
  TimelineBlock,
  VideoBlock,
  AudioBlock,
  SlideDeckBlock,
  ComparisonBlock,
  SourceBlock,
  EntityBlock,
  RelatedStoriesBlock,
  EmbedBlock,
  ImageDiffBlock,
  LiveTickerBlock,
  PollBlock,
  DocumentViewerBlock,
} from '@ai-news/schemas';
import { D3ChartRenderer, MapRenderer, DiagramRenderer, VisualDiffRenderer } from '@ai-news/media';
import { formatDeterministicDate } from '../lib/date-utils';

interface StoryRendererProps {
  blocks: StoryBlock[];
  theme?: 'dark' | 'light';
  depth?: 'quick' | 'balanced' | 'deep_dive';
}

export const StoryRenderer: React.FC<StoryRendererProps> = ({
  blocks,
  theme = 'dark',
  depth = 'balanced',
}) => {
  if (!blocks || blocks.length === 0) {
    return (
      <div className="py-12 text-center text-slate-500 font-mono text-sm">
        No content blocks have been published for this revision.
      </div>
    );
  }

  // Sort all blocks by sortOrder first
  const sortedBlocks = [...blocks].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

  // Filter blocks based on selected reading depth
  let effectiveBlocks = sortedBlocks;
  if (depth === 'quick') {
    // In Quick mode: exactly 1 opening lead paragraph + summary/stats/charts/quotes/live tickers/polls/headings
    let paragraphCount = 0;
    effectiveBlocks = sortedBlocks.filter((b) => {
      if (b.blockType === 'paragraph') {
        paragraphCount++;
        return paragraphCount <= 1;
      }
      return (
        b.blockType === 'summary' ||
        b.blockType === 'statistic' ||
        b.blockType === 'quote' ||
        b.blockType === 'callout' ||
        b.blockType === 'chart' ||
        b.blockType === 'live_ticker' ||
        b.blockType === 'poll' ||
        b.blockType === 'heading'
      );
    });
    if (effectiveBlocks.length === 0) {
      effectiveBlocks = sortedBlocks.slice(0, 1);
    }
  } else if (depth === 'balanced') {
    // In Balanced mode: standard editorial flow (exclude deep dive technical diffs & document viewers)
    effectiveBlocks = sortedBlocks.filter(
      (b) => b.blockType !== 'document_viewer' && b.blockType !== 'what_changed'
    );
    if (effectiveBlocks.length === 0) effectiveBlocks = sortedBlocks;
  } else {
    // In Deep Dive mode: unabridged complete blocks including what_changed diffs and archival viewers
    effectiveBlocks = sortedBlocks;
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto my-8">
      {effectiveBlocks.map((block) => (
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
      const svg = DiagramRenderer.renderDeclarativeSvg(block.data, 800, 340, theme);
      return (
        <div className="my-8 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-3">
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

const GalleryBlockView: React.FC<{ data: GalleryBlock['data'] }> = ({ data }) => {
  return (
    <div className="my-8">
      {data.title && (
        <h4 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-4">{data.title}</h4>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {data.images.map((img, idx) => (
          <figure
            key={idx}
            className="group relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 hover:border-indigo-500/50 transition-all shadow-sm"
          >
            <img
              src={img.url}
              alt={img.altText}
              className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
            />
            {(img.caption || img.credit) && (
              <figcaption className="p-3 text-xs bg-slate-50/95 dark:bg-slate-900/90 text-slate-700 dark:text-slate-300 border-t border-slate-200 dark:border-slate-800/60">
                {img.caption && <div className="line-clamp-2">{img.caption}</div>}
                {img.credit && (
                  <div className="text-slate-500 font-mono mt-1">Credit: {img.credit}</div>
                )}
              </figcaption>
            )}
          </figure>
        ))}
      </div>
    </div>
  );
};

const FlowBlockView: React.FC<{ data: FlowBlock['data'] }> = ({ data }) => {
  const statusBadge = (status?: string) => {
    switch (status) {
      case 'completed':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 dark:bg-emerald-500/10 text-emerald-800 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/20">
            COMPLETED
          </span>
        );
      case 'active':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-blue-100 dark:bg-blue-500/10 text-blue-800 dark:text-blue-400 border border-blue-300 dark:border-blue-500/20 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400 animate-ping" />
            IN PROGRESS
          </span>
        );
      case 'blocked':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-rose-100 dark:bg-rose-500/10 text-rose-800 dark:text-rose-400 border border-rose-300 dark:border-rose-500/20">
            BLOCKED
          </span>
        );
      case 'pending':
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 dark:bg-slate-500/10 text-slate-700 dark:text-slate-400 border border-slate-300 dark:border-slate-500/20">
            PENDING
          </span>
        );
    }
  };

  return (
    <div className="my-8 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40 p-6 shadow-sm">
      {data.title && (
        <h4 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-6">{data.title}</h4>
      )}
      <div className="relative pl-6 border-l-2 border-slate-300 dark:border-slate-700/60 space-y-6">
        {data.steps.map((s, idx) => (
          <div key={idx} className="relative">
            <div className="absolute -left-[31px] top-0.5 w-6 h-6 rounded-full bg-white dark:bg-slate-800 border-2 border-indigo-500 text-indigo-600 dark:text-indigo-400 font-bold text-xs flex items-center justify-center shadow-xs">
              {s.stepNumber}
            </div>
            <div className="flex items-center gap-3 mb-1">
              <h5 className="font-bold text-base text-slate-900 dark:text-slate-100">{s.title}</h5>
              {statusBadge(s.status)}
            </div>
            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
              {s.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

const TimelineBlockView: React.FC<{ data: TimelineBlock['data'] }> = ({ data }) => {
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

const VideoBlockView: React.FC<{ data: VideoBlock['data'] }> = ({ data }) => {
  const aspectClass =
    data.aspectRatio === '9:16'
      ? 'aspect-[9/16] max-w-sm mx-auto'
      : data.aspectRatio === '1:1'
        ? 'aspect-square max-w-lg mx-auto'
        : 'aspect-video w-full';

  return (
    <div className="my-8 rounded-xl overflow-hidden border border-slate-800 bg-slate-900/60 shadow-xl">
      <div className={`relative ${aspectClass} bg-black`}>
        <video
          src={data.url}
          poster={data.posterUrl}
          controls
          playsInline
          className="w-full h-full object-contain"
        />
        {data.durationSeconds && (
          <div className="absolute bottom-3 right-3 px-2 py-1 rounded bg-black/80 text-[11px] font-mono text-slate-200 backdrop-blur-sm pointer-events-none">
            {Math.floor(data.durationSeconds / 60)}:
            {(data.durationSeconds % 60).toString().padStart(2, '0')}
          </div>
        )}
      </div>
      {data.caption && (
        <p className="p-3 text-xs text-slate-400 bg-slate-900/80 border-t border-slate-800">
          {data.caption}
        </p>
      )}
      {data.transcription && (
        <details className="p-3 border-t border-slate-800/60 text-xs text-slate-400 bg-slate-900/40">
          <summary className="font-semibold text-slate-300 cursor-pointer hover:text-indigo-400 transition-colors">
            Video Transcript & Subtitles
          </summary>
          <p className="mt-2 text-slate-300 whitespace-pre-line leading-relaxed font-sans">
            {data.transcription}
          </p>
        </details>
      )}
    </div>
  );
};

const AudioBlockView: React.FC<{ data: AudioBlock['data']; theme?: 'dark' | 'light' }> = ({
  data,
  theme: _theme = 'dark',
}) => {
  const audioRef = React.useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [currentTimeSec, setCurrentTimeSec] = React.useState(0);
  const [durationSec, setDurationSec] = React.useState(data.durationSeconds || 0);
  const [playbackRate, setPlaybackRate] = React.useState(1);
  const [isMuted, setIsMuted] = React.useState(false);
  const [hasAudioError, setHasAudioError] = React.useState(false);
  const [isSpeechMode, setIsSpeechMode] = React.useState(false);
  const [showTranscript, setShowTranscript] = React.useState(false);
  const [copiedTranscript, setCopiedTranscript] = React.useState(false);
  const [readAlongMode, setReadAlongMode] = React.useState(
    Boolean(data.cuePoints && data.cuePoints.length > 0)
  );

  // Safe audio URL resolution: Map fictitious or missing URLs to valid static audio
  const resolvedUrl = React.useMemo(() => {
    if (!data.url) return '/audio/sample-briefing.mp3';
    const raw = data.url.toLowerCase();
    const title = (data.title || '').toLowerCase();
    if (
      raw.includes('quantum-topological-qubits') ||
      raw.includes('quantum') ||
      title.includes('quantum') ||
      title.includes('topological')
    ) {
      return '/audio/quantum-topological-qubits-briefing.mp3';
    }
    if (raw.includes('news.platform')) {
      return '/audio/sample-briefing.mp3';
    }
    return data.url;
  }, [data.url, data.title]);

  // Clean up speech synthesis when component unmounts
  React.useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const handleSpeechToggle = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      return;
    }

    if (isSpeechMode && isPlaying) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
      setIsSpeechMode(false);
      return;
    }

    // Stop HTML5 audio if playing
    if (audioRef.current) {
      audioRef.current.pause();
    }

    window.speechSynthesis.cancel();
    const textToSpeak =
      data.transcript || `${data.title}. ${data.narrator ? 'Narrated by ' + data.narrator : ''}`;
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.rate = playbackRate;
    utterance.lang = data.language || 'en-US';

    utterance.onstart = () => {
      setIsPlaying(true);
      setIsSpeechMode(true);
    };

    utterance.onend = () => {
      setIsPlaying(false);
      setIsSpeechMode(false);
    };

    utterance.onerror = () => {
      setIsPlaying(false);
      setIsSpeechMode(false);
    };

    window.speechSynthesis.speak(utterance);
  };

  const togglePlay = () => {
    if (isSpeechMode) {
      handleSpeechToggle();
      return;
    }

    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current
        .play()
        .then(() => {
          setIsPlaying(true);
          setHasAudioError(false);
        })
        .catch((err) => {
          console.warn('HTML5 audio playback failed, falling back to speech synthesis:', err);
          setHasAudioError(true);
          handleSpeechToggle();
        });
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    setCurrentTimeSec(newTime);
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
    }
  };

  const seekDelta = (deltaSec: number) => {
    if (audioRef.current) {
      const target = Math.max(0, Math.min(durationSec, audioRef.current.currentTime + deltaSec));
      audioRef.current.currentTime = target;
      setCurrentTimeSec(target);
    }
  };

  const cycleSpeed = () => {
    const speeds = [1, 1.25, 1.5, 2];
    const nextSpeed = speeds[(speeds.indexOf(playbackRate) + 1) % speeds.length];
    setPlaybackRate(nextSpeed);
    if (audioRef.current) {
      audioRef.current.playbackRate = nextSpeed;
    }
    if (isSpeechMode && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      handleSpeechToggle();
    }
  };

  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const seekToCue = (timeMs: number) => {
    const sec = timeMs / 1000;
    if (audioRef.current) {
      audioRef.current.currentTime = sec;
      setCurrentTimeSec(sec);
      audioRef.current.play().then(() => setIsPlaying(true));
    }
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handleCopyTranscript = () => {
    if (data.transcript && typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(data.transcript);
      setCopiedTranscript(true);
      setTimeout(() => setCopiedTranscript(false), 2000);
    }
  };

  const hasCuePoints = Boolean(data.cuePoints && data.cuePoints.length > 0);
  const currentTimeMs = currentTimeSec * 1000;
  const progressPercent = durationSec > 0 ? (currentTimeSec / durationSec) * 100 : 0;

  return (
    <div className="my-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-gradient-to-br from-slate-50 via-white to-indigo-50/40 dark:from-slate-900 dark:via-slate-900/95 dark:to-indigo-950/40 p-5 sm:p-6 shadow-md dark:shadow-xl transition-all">
      {/* Hidden HTML5 Audio Element */}
      <audio
        ref={audioRef}
        src={resolvedUrl}
        preload="metadata"
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onTimeUpdate={() => {
          if (audioRef.current) {
            setCurrentTimeSec(audioRef.current.currentTime);
          }
        }}
        onLoadedMetadata={() => {
          if (audioRef.current && audioRef.current.duration) {
            setDurationSec(audioRef.current.duration);
          }
        }}
        onEnded={() => {
          setIsPlaying(false);
          setCurrentTimeSec(0);
        }}
        onError={() => {
          setHasAudioError(true);
        }}
        className="hidden"
      />

      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wider uppercase bg-indigo-100 text-indigo-700 dark:bg-indigo-950/80 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/80">
            <span
              className={`w-2 h-2 rounded-full bg-indigo-500 ${isPlaying ? 'animate-ping' : ''}`}
            />
            <Headphones className="w-3 h-3" />
            Audio Briefing
          </span>
          {isSpeechMode && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-violet-100 text-violet-700 dark:bg-violet-950/60 dark:text-violet-300 border border-violet-200 dark:border-violet-800">
              <Sparkles className="w-2.5 h-2.5" />
              AI Speech
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {hasCuePoints && (
            <button
              onClick={() => setReadAlongMode(!readAlongMode)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                readAlongMode
                  ? 'bg-indigo-600 text-white border-indigo-500 shadow-xs'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              {readAlongMode ? 'Read-Along Active' : 'Enable Read-Along'}
            </button>
          )}

          {/* Equalizer Sound Waves */}
          <div className="flex items-end gap-1 h-5 px-2" title={isPlaying ? 'Playing' : 'Paused'}>
            <span
              className={`w-1 rounded-full bg-indigo-500 dark:bg-indigo-400 transition-all ${
                isPlaying ? 'animate-bounce [animation-delay:-0.3s] h-3.5' : 'h-1 opacity-30'
              }`}
            />
            <span
              className={`w-1 rounded-full bg-indigo-600 dark:bg-indigo-300 transition-all ${
                isPlaying ? 'animate-bounce [animation-delay:-0.15s] h-5' : 'h-2 opacity-30'
              }`}
            />
            <span
              className={`w-1 rounded-full bg-violet-500 dark:bg-violet-400 transition-all ${
                isPlaying ? 'animate-bounce [animation-delay:-0.45s] h-4' : 'h-1.5 opacity-30'
              }`}
            />
            <span
              className={`w-1 rounded-full bg-indigo-500 dark:bg-indigo-400 transition-all ${
                isPlaying ? 'animate-bounce [animation-delay:-0.2s] h-2.5' : 'h-2 opacity-30'
              }`}
            />
            <span
              className={`w-1 rounded-full bg-violet-600 dark:bg-violet-300 transition-all ${
                isPlaying ? 'animate-bounce [animation-delay:-0.35s] h-5' : 'h-1 opacity-30'
              }`}
            />
          </div>

          <span className="text-xs font-mono font-medium text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-700/80">
            {formatTime(durationSec)}
          </span>
        </div>
      </div>

      {/* Story Title & Narrator */}
      <div className="mb-4">
        <h4 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100 leading-snug">
          {data.title}
        </h4>
        {data.narrator && (
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1.5 font-medium">
            <span>Narrated by:</span>
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              {data.narrator}
            </span>
          </p>
        )}
      </div>

      {/* Main Player Controller Card */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-950/60 p-4 backdrop-blur-xs shadow-xs space-y-3">
        {/* Timeline Scrubber */}
        <div className="space-y-1.5">
          <div className="relative flex items-center group">
            <input
              type="range"
              min={0}
              max={durationSec > 0 ? durationSec : 100}
              step={0.1}
              value={currentTimeSec}
              onChange={handleSeek}
              aria-label="Seek audio timeline"
              className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600 dark:accent-indigo-400 transition"
              style={{
                background: `linear-gradient(to right, rgb(99, 102, 241) ${progressPercent}%, rgba(148, 163, 184, 0.25) ${progressPercent}%)`,
              }}
            />
          </div>
          <div className="flex justify-between items-center text-[11px] font-mono text-slate-500 dark:text-slate-400">
            <span>{formatTime(currentTimeSec)}</span>
            <span>{formatTime(durationSec)}</span>
          </div>
        </div>

        {/* Buttons Row */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          {/* Left Playback Actions */}
          <div className="flex items-center gap-2">
            {/* Rewind 10s */}
            <button
              onClick={() => seekDelta(-10)}
              title="Rewind 10 seconds"
              className="p-2 rounded-lg text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            {/* Main Play/Pause Button */}
            <button
              onClick={togglePlay}
              aria-label={isPlaying ? 'Pause audio' : 'Play audio'}
              className="w-11 h-11 rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white flex items-center justify-center shadow-md hover:shadow-indigo-500/25 active:scale-95 transition-all cursor-pointer"
            >
              {isPlaying ? (
                <Pause className="w-5 h-5 fill-current" />
              ) : (
                <Play className="w-5 h-5 fill-current ml-0.5" />
              )}
            </button>

            {/* Fast Forward 10s */}
            <button
              onClick={() => seekDelta(10)}
              title="Forward 10 seconds"
              className="p-2 rounded-lg text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition cursor-pointer"
            >
              <FastForward className="w-4 h-4" />
            </button>

            {/* Mute/Unmute */}
            <button
              onClick={toggleMute}
              title={isMuted ? 'Unmute' : 'Mute'}
              className="p-2 rounded-lg text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80 transition cursor-pointer"
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
          </div>

          {/* Right Action Tools */}
          <div className="flex items-center gap-2">
            {/* Speed Multiplier Pill */}
            <button
              onClick={cycleSpeed}
              title="Change playback speed"
              className="px-2.5 py-1 rounded-md text-xs font-mono font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition cursor-pointer"
            >
              {playbackRate}x
            </button>

            {/* AI Speech Narration Toggle */}
            <button
              onClick={handleSpeechToggle}
              title={isSpeechMode && isPlaying ? 'Stop AI Narration' : 'Listen with AI Voice'}
              className={`px-3 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5 border transition cursor-pointer ${
                isSpeechMode && isPlaying
                  ? 'bg-violet-600 text-white border-violet-500 shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-violet-500" />
              <span>{isSpeechMode && isPlaying ? 'Stop AI Voice' : 'AI Voice'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Error Fallback Banner if audio fails */}
      {hasAudioError && !isSpeechMode && (
        <div className="mt-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between text-xs text-amber-700 dark:text-amber-300">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-amber-500" />
            <span>Audio stream preview unavailable — click to use AI Voice Narration instead.</span>
          </div>
          <button
            onClick={handleSpeechToggle}
            className="px-2.5 py-1 rounded-md font-bold bg-amber-600 hover:bg-amber-500 text-white shrink-0 ml-2 transition cursor-pointer"
          >
            Play AI Narration
          </button>
        </div>
      )}

      {/* Synchronized Read-Along Karaoke Container */}
      {hasCuePoints && readAlongMode && data.cuePoints && (
        <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800">
          <div className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 mb-2 flex items-center justify-between">
            <span>Synchronized Script (Click any phrase to jump)</span>
            <span className="font-mono text-slate-500">{formatTime(currentTimeSec)}</span>
          </div>
          <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1 text-sm leading-relaxed">
            {data.cuePoints.map((cue, idx) => {
              const nextCue = data.cuePoints ? data.cuePoints[idx + 1] : undefined;
              const isActive =
                currentTimeMs >= cue.timeMs && (nextCue ? currentTimeMs < nextCue.timeMs : true);

              return (
                <div
                  key={idx}
                  onClick={() => seekToCue(cue.timeMs)}
                  className={`p-2.5 rounded-lg cursor-pointer transition-all flex items-start gap-2.5 ${
                    isActive
                      ? 'bg-indigo-50 dark:bg-indigo-500/20 text-indigo-900 dark:text-indigo-100 border-l-3 border-indigo-600 dark:border-indigo-400 font-medium pl-3'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500 pt-0.5 select-none shrink-0">
                    {formatTime(cue.timeMs / 1000)}
                  </span>
                  <span>{cue.text}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Transcript Collapsible Section */}
      {data.transcript && (
        <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setShowTranscript(!showTranscript)}
              className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition cursor-pointer"
            >
              {showTranscript ? (
                <ChevronUp className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
              <span>Audio Briefing Transcript</span>
            </button>

            {showTranscript && (
              <button
                onClick={handleCopyTranscript}
                className="flex items-center gap-1 text-[11px] text-slate-500 hover:text-slate-900 dark:hover:text-white transition cursor-pointer"
              >
                {copiedTranscript ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-500" />
                    <span className="text-emerald-500 font-medium">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>Copy Text</span>
                  </>
                )}
              </button>
            )}
          </div>

          {showTranscript && (
            <p className="mt-3 text-xs leading-relaxed text-slate-600 dark:text-slate-300 whitespace-pre-line bg-slate-50 dark:bg-slate-950/40 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800/80 font-sans">
              {data.transcript}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

const SlideDeckBlockView: React.FC<{ data: SlideDeckBlock['data'] }> = ({ data }) => {
  const [currentSlide, setCurrentSlide] = React.useState(0);
  const slide = data.slides[currentSlide] || data.slides[0];
  if (!slide) return null;

  return (
    <div className="my-8 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-6 backdrop-blur-md shadow-md">
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4 mb-4">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
            Interactive Slide Deck
          </span>
          <h4 className="text-xl font-bold text-slate-900 dark:text-slate-100">{data.title}</h4>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentSlide((prev) => Math.max(0, prev - 1))}
            disabled={currentSlide === 0}
            className="p-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-slate-700 dark:text-slate-300 transition-colors"
            aria-label="Previous slide"
          >
            ‹
          </button>
          <span className="text-xs font-mono font-medium text-slate-600 dark:text-slate-400 px-1">
            {currentSlide + 1} / {data.slides.length}
          </span>
          <button
            onClick={() => setCurrentSlide((prev) => Math.min(data.slides.length - 1, prev + 1))}
            disabled={currentSlide === data.slides.length - 1}
            className="p-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-slate-700 dark:text-slate-300 transition-colors"
            aria-label="Next slide"
          >
            ›
          </button>
        </div>
      </div>
      {slide.imageUrl && (
        <img
          src={slide.imageUrl}
          alt={slide.title}
          className="w-full h-56 sm:h-72 object-cover rounded-lg mb-4 border border-slate-200 dark:border-slate-800"
          loading="lazy"
        />
      )}
      <h5 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-2">{slide.title}</h5>
      {slide.body && (
        <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed mb-3">
          {slide.body}
        </p>
      )}
      {slide.bullets && slide.bullets.length > 0 && (
        <ul className="space-y-1.5 mb-4">
          {slide.bullets.map((b, idx) => (
            <li
              key={idx}
              className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300"
            >
              <span className="text-indigo-600 dark:text-indigo-400 font-bold">•</span>
              <span>{b}</span>
            </li>
          ))}
        </ul>
      )}
      {slide.sourceAttribution && (
        <div className="text-xs text-slate-500 italic mt-3 pt-3 border-t border-slate-200 dark:border-slate-800/60">
          Source: {slide.sourceAttribution}
        </div>
      )}
    </div>
  );
};

const ComparisonBlockView: React.FC<{ data: ComparisonBlock['data'] }> = ({ data }) => {
  return (
    <div className="my-8 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 p-6 shadow-sm">
      {data.title && (
        <h4 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-5">{data.title}</h4>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-xl border border-blue-200 dark:border-blue-500/20 bg-blue-50/60 dark:bg-blue-950/10 p-5">
          <h5 className="font-bold text-base text-blue-700 dark:text-blue-400 border-b border-blue-200 dark:border-blue-500/20 pb-2 mb-3">
            {data.subjectA.name}
          </h5>
          <ul className="space-y-2">
            {data.subjectA.points.map((pt, idx) => (
              <li
                key={idx}
                className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300"
              >
                <span className="text-blue-600 dark:text-blue-400 font-bold mt-0.5">•</span>
                <span>{pt}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-xl border border-purple-200 dark:border-purple-500/20 bg-purple-50/60 dark:bg-purple-950/10 p-5">
          <h5 className="font-bold text-base text-purple-700 dark:text-purple-400 border-b border-purple-200 dark:border-purple-500/20 pb-2 mb-3">
            {data.subjectB.name}
          </h5>
          <ul className="space-y-2">
            {data.subjectB.points.map((pt, idx) => (
              <li
                key={idx}
                className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300"
              >
                <span className="text-purple-600 dark:text-purple-400 font-bold mt-0.5">•</span>
                <span>{pt}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

const SourceBlockView: React.FC<{ data: SourceBlock['data'] }> = ({ data }) => {
  const pubSlug = data.publisher
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

  return (
    <div className="my-4 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-slate-300 dark:hover:border-slate-700 shadow-sm transition-colors">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Link
            href={`/sources/${pubSlug}`}
            className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-indigo-700 dark:text-indigo-400 hover:text-white hover:bg-indigo-600/80 border border-slate-200 dark:border-indigo-500/20 transition-colors"
            title={`View all coverage & sources from ${data.publisher}`}
          >
            {data.publisher}
          </Link>
          {data.publishedAt && (
            <span className="text-xs text-slate-500 font-mono" suppressHydrationWarning>
              {formatDeterministicDate(data.publishedAt)}
            </span>
          )}
        </div>
        <h5 className="font-semibold text-sm text-slate-900 dark:text-slate-100">{data.title}</h5>
      </div>
      <a
        href={data.url}
        target="_blank"
        rel="noopener noreferrer"
        className="self-start sm:self-center px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 transition-colors"
      >
        <span>View Primary Source</span>
        <span className="text-slate-400">↗</span>
      </a>
    </div>
  );
};

const EntityBlockView: React.FC<{ data: EntityBlock['data'] }> = ({ data }) => {
  return (
    <div className="my-4 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 flex items-center justify-between gap-4 shadow-sm">
      <div className="flex items-center gap-3.5">
        {data.avatarUrl ? (
          <img
            src={data.avatarUrl}
            alt={data.name}
            className="w-12 h-12 rounded-full object-cover border border-slate-200 dark:border-slate-700"
          />
        ) : (
          <div className="w-12 h-12 rounded-full bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-lg">
            {data.name.slice(0, 2).toUpperCase()}
          </div>
        )}
        <div>
          <div className="flex items-center gap-2">
            <h5 className="font-bold text-base text-slate-900 dark:text-slate-100">{data.name}</h5>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20">
              {data.type}
            </span>
          </div>
          {data.description && (
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 line-clamp-2 max-w-xl">
              {data.description}
            </p>
          )}
        </div>
      </div>
      <Link
        href={`/entities/${data.entityId}`}
        className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/60 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors whitespace-nowrap cursor-pointer"
      >
        Profile →
      </Link>
    </div>
  );
};

const RelatedStoriesBlockView: React.FC<{ data: RelatedStoriesBlock['data'] }> = ({ data }) => {
  return (
    <div className="my-8 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 p-5 shadow-sm">
      <h5 className="font-bold text-sm uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-3">
        {data.title || 'Related Coverage'}
      </h5>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {data.storyIds.map((sId, idx) => (
          <Link
            key={idx}
            href={`/stories/${sId}`}
            className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 hover:border-indigo-500/40 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-all flex items-center justify-between group shadow-xs"
          >
            <span className="text-sm font-medium text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
              Story Dispatch: {sId}
            </span>
            <span className="text-slate-400 dark:text-slate-500 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all text-sm">
              →
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
};

const EmbedBlockView: React.FC<{ data: EmbedBlock['data'] }> = ({ data }) => {
  return (
    <div className="my-6 rounded-xl border border-slate-800 bg-slate-900/50 p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-800 text-slate-300 border border-slate-700">
          Embedded {data.provider}
        </span>
        <a
          href={data.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
        >
          <span>Open source URL</span>
          <span>↗</span>
        </a>
      </div>
      {data.title && <h5 className="font-semibold text-sm text-slate-100 mb-2">{data.title}</h5>}
      {data.provider === 'youtube' && data.url.includes('embed') ? (
        <div className="aspect-video w-full rounded-lg overflow-hidden border border-slate-800">
          <iframe
            src={data.url}
            title={data.title || 'YouTube embed'}
            className="w-full h-full"
            allowFullScreen
          />
        </div>
      ) : (
        <div className="p-3 rounded-lg border border-slate-800/80 bg-slate-950/60 font-mono text-xs text-slate-400 break-all">
          {data.url}
        </div>
      )}
    </div>
  );
};

const ImageDiffBlockView: React.FC<{ data: ImageDiffBlock['data'] }> = ({ data }) => {
  const [sliderPos, setSliderPos] = React.useState(data.defaultSplitPercent ?? 50);

  return (
    <figure className="my-8 rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 shadow-xl">
      <div className="relative w-full aspect-[16/9] min-h-[280px] max-h-[550px] overflow-hidden select-none bg-black">
        {/* Layer 2: After image (full background) */}
        <img
          src={data.afterUrl}
          alt={data.afterLabel || 'After'}
          className="absolute inset-0 w-full h-full object-cover"
          loading="lazy"
        />

        {/* Layer 1: Before image with horizontal clip */}
        <div
          className="absolute inset-0 overflow-hidden pointer-events-none"
          style={{
            clipPath:
              data.orientation === 'vertical'
                ? `polygon(0 0, 100% 0, 100% ${sliderPos}%, 0 ${sliderPos}%)`
                : `polygon(0 0, ${sliderPos}% 0, ${sliderPos}% 100%, 0 100%)`,
          }}
        >
          <img
            src={data.beforeUrl}
            alt={data.beforeLabel || 'Before'}
            className="absolute inset-0 w-full h-full object-cover"
            loading="lazy"
          />
        </div>

        {/* Divider line and handle */}
        {data.orientation === 'vertical' ? (
          <div
            className="absolute left-0 right-0 h-1 bg-white shadow-[0_0_12px_rgba(255,255,255,0.8)] pointer-events-none z-10"
            style={{ top: `${sliderPos}%` }}
          >
            <div className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-slate-900/90 border-2 border-white shadow-xl flex items-center justify-center text-white text-xs font-bold">
              ↕
            </div>
          </div>
        ) : (
          <div
            className="absolute top-0 bottom-0 w-1 bg-white shadow-[0_0_12px_rgba(255,255,255,0.8)] pointer-events-none z-10"
            style={{ left: `${sliderPos}%` }}
          >
            <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-slate-900/90 border-2 border-white shadow-xl flex items-center justify-center text-white text-xs font-bold">
              ↔
            </div>
          </div>
        )}

        {/* Glassmorphism badges */}
        <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-black/70 text-white backdrop-blur-md border border-white/20 z-10">
          {data.beforeLabel || 'Before'}
        </span>
        <span className="absolute top-3 right-3 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-black/70 text-white backdrop-blur-md border border-white/20 z-10">
          {data.afterLabel || 'After'}
        </span>

        {/* Transparent accessible range slider for drag & touch & keyboard */}
        <input
          type="range"
          min="0"
          max="100"
          value={sliderPos}
          onChange={(e) => setSliderPos(Number(e.target.value))}
          className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-20"
          aria-label="Image comparison slider"
        />
      </div>

      {(data.caption || data.credit) && (
        <figcaption className="p-3 bg-slate-900/90 text-xs text-slate-400 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
          {data.caption && <span>{data.caption}</span>}
          {data.credit && <span className="font-mono text-slate-500">Credit: {data.credit}</span>}
        </figcaption>
      )}
    </figure>
  );
};

const LiveTickerBlockView: React.FC<{ data: LiveTickerBlock['data'] }> = ({ data }) => {
  const [selectedSymbol, setSelectedSymbol] = React.useState<string | null>(null);

  return (
    <div className="my-8 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-3 mb-4">
        <div className="flex items-center gap-2.5">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
            Live Market & Numerical Ticker
          </span>
          {data.title && (
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 border-l border-slate-200 dark:border-slate-700 pl-2.5">
              {data.title}
            </span>
          )}
        </div>
        <span className="text-[11px] font-mono text-slate-400 dark:text-slate-500">
          Refreshes every {data.refreshIntervalSeconds || 30}s
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {data.items.map((item, idx) => {
          const isPositive = item.delta >= 0;
          const isSelected = selectedSymbol === item.symbol;

          // Build SVG sparkline polyline
          const sparkline =
            item.sparkline && item.sparkline.length > 0 ? item.sparkline : [item.value, item.value];
          const min = Math.min(...sparkline);
          const max = Math.max(...sparkline);
          const range = max - min || 1;
          const points = sparkline
            .map((val, i) => {
              const x = (i / (sparkline.length - 1 || 1)) * 100;
              const y = 28 - ((val - min) / range) * 24;
              return `${x.toFixed(1)},${y.toFixed(1)}`;
            })
            .join(' ');

          return (
            <div
              key={idx}
              onClick={() => setSelectedSymbol(isSelected ? null : item.symbol)}
              className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                isSelected
                  ? 'border-indigo-500 bg-indigo-50/60 dark:bg-indigo-950/20 shadow-xs ring-1 ring-indigo-500/50'
                  : 'border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/50 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-100/50 dark:hover:bg-slate-800/40'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-mono font-bold text-indigo-700 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-200 dark:border-indigo-500/20">
                  {item.symbol}
                </span>
                <span
                  className={`text-xs font-bold flex items-center gap-0.5 px-2 py-0.5 rounded ${
                    isPositive
                      ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20'
                      : 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20'
                  }`}
                >
                  <span>{isPositive ? '↑' : '↓'}</span>
                  <span>
                    {isPositive ? '+' : ''}
                    {item.delta.toFixed(2)}%
                  </span>
                </span>
              </div>

              <div className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 mb-1">
                {item.label}
              </div>

              <div className="flex items-baseline justify-between gap-2">
                <span className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight font-mono">
                  {item.unit && item.unit !== '%' ? item.unit : ''}
                  {item.value.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                  {item.unit === '%' ? '%' : ''}
                </span>
              </div>

              {/* Sparkline track */}
              <div className="mt-2 h-7 w-full overflow-hidden">
                <svg
                  className="w-full h-full overflow-visible"
                  viewBox="0 0 100 30"
                  preserveAspectRatio="none"
                >
                  <polyline
                    fill="none"
                    stroke={isPositive ? '#10b981' : '#f43f5e'}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points={points}
                  />
                </svg>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const PollBlockView: React.FC<{ data: PollBlock['data']; blockId?: string }> = ({ data }) => {
  const storageKey = `globalpulse_poll_${data.pollId}`;
  const [votedOptionId, setVotedOptionId] = React.useState<string | null>(null);
  const [options, setOptions] = React.useState(data.options);
  const [totalVotes, setTotalVotes] = React.useState(data.totalVotes);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  React.useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) setVotedOptionId(saved);
      else if (data.userVotedOptionId) setVotedOptionId(data.userVotedOptionId);
    } catch {}
  }, [storageKey, data.userVotedOptionId]);

  const handleVote = (optionId: string) => {
    if (votedOptionId || data.closed || isSubmitting) return;

    setIsSubmitting(true);
    setVotedOptionId(optionId);
    try {
      localStorage.setItem(storageKey, optionId);
    } catch {}

    setOptions((prev) =>
      prev.map((opt) => (opt.id === optionId ? { ...opt, voteCount: opt.voteCount + 1 } : opt))
    );
    setTotalVotes((prev) => prev + 1);
    setIsSubmitting(false);
  };

  const hasVoted = Boolean(votedOptionId) || data.closed;

  return (
    <div className="my-8 rounded-2xl border border-indigo-200/80 dark:border-indigo-900/50 bg-gradient-to-br from-indigo-50/70 via-white to-purple-50/40 dark:from-slate-900 dark:via-slate-900/90 dark:to-indigo-950/30 p-6 shadow-sm">
      <div className="flex items-center justify-between gap-3 mb-4 border-b border-indigo-100 dark:border-slate-800 pb-3">
        <span className="text-xs font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-400 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-indigo-600 dark:bg-indigo-500 animate-pulse" />
          Interactive Reader Poll
        </span>
        <div className="flex items-center gap-2">
          {data.closed && (
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
              Poll Closed
            </span>
          )}
          <span className="text-xs font-mono font-medium text-slate-500 dark:text-slate-400">
            {totalVotes.toLocaleString()} {totalVotes === 1 ? 'vote' : 'votes'}
          </span>
        </div>
      </div>

      <h4 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mb-4 leading-snug">
        {data.question}
      </h4>

      <div className="space-y-3">
        {options.map((opt) => {
          const isSelected = votedOptionId === opt.id;
          const percentage = totalVotes > 0 ? Math.round((opt.voteCount / totalVotes) * 100) : 0;

          if (hasVoted) {
            return (
              <div
                key={opt.id}
                className={`relative rounded-xl overflow-hidden border p-3.5 transition-all ${
                  isSelected
                    ? 'border-indigo-400 dark:border-indigo-500 bg-indigo-50/60 dark:bg-indigo-950/40 text-slate-900 dark:text-slate-100 ring-1 ring-indigo-400/40 dark:ring-indigo-500/40'
                    : 'border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/40 text-slate-800 dark:text-slate-300'
                }`}
              >
                {/* Progress bar background fill */}
                <div
                  className={`absolute inset-y-0 left-0 transition-all duration-700 ease-out ${
                    isSelected
                      ? 'bg-indigo-200/60 dark:bg-indigo-600/30'
                      : 'bg-slate-100 dark:bg-slate-800/40'
                  }`}
                  style={{ width: `${percentage}%` }}
                />

                <div className="relative z-10 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    {isSelected && (
                      <span className="w-4 h-4 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px] font-bold">
                        ✓
                      </span>
                    )}
                    <span className="text-sm font-semibold">{opt.text}</span>
                  </div>
                  <div className="flex items-baseline gap-2 font-mono text-xs">
                    <span className="font-bold text-slate-900 dark:text-white">{percentage}%</span>
                    <span className="text-slate-500 dark:text-slate-400">({opt.voteCount})</span>
                  </div>
                </div>
              </div>
            );
          }

          return (
            <button
              key={opt.id}
              onClick={() => handleVote(opt.id)}
              disabled={isSubmitting}
              className="w-full text-left p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 hover:border-indigo-500 dark:hover:border-indigo-400 hover:bg-indigo-50/50 dark:hover:bg-slate-800/90 transition-all flex items-center justify-between group cursor-pointer shadow-2xs hover:shadow-xs"
            >
              <div className="flex items-center gap-3">
                <span className="w-4 h-4 rounded-full border-2 border-slate-300 dark:border-slate-600 group-hover:border-indigo-600 dark:group-hover:border-indigo-400 group-hover:scale-110 transition-all shrink-0" />
                <span className="text-sm font-semibold text-slate-800 dark:text-slate-200 group-hover:text-indigo-950 dark:group-hover:text-white transition-colors leading-normal">
                  {opt.text}
                </span>
              </div>
              <span className="text-xs font-bold font-mono text-indigo-600 dark:text-indigo-400 group-hover:text-indigo-700 dark:group-hover:text-indigo-300 group-hover:translate-x-0.5 transition-all shrink-0 ml-3">
                Vote →
              </span>
            </button>
          );
        })}
      </div>

      {hasVoted && (
        <div className="mt-4 pt-3 border-t border-indigo-100 dark:border-slate-800/60 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span>
            {votedOptionId
              ? 'Thank you for contributing your perspective.'
              : 'Voting is now closed.'}
          </span>
          <span className="font-mono text-[11px] text-slate-400 dark:text-slate-500">
            Live consensus tally
          </span>
        </div>
      )}
    </div>
  );
};

const DocumentViewerBlockView: React.FC<{ data: DocumentViewerBlock['data'] }> = ({ data }) => {
  const [activeHighlightIndex, setActiveHighlightIndex] = React.useState<number>(0);
  const [copiedExcerpt, setCopiedExcerpt] = React.useState<boolean>(false);

  const typeConfig: Record<string, { label: string; badgeClass: string; icon: string }> = {
    court_filing: {
      label: 'Court Filing',
      badgeClass: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
      icon: '🏛',
    },
    treaty: {
      label: 'Diplomatic Treaty',
      badgeClass: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30',
      icon: '📜',
    },
    financial_disclosure: {
      label: 'Financial Disclosure',
      badgeClass: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
      icon: '📊',
    },
    leak: {
      label: 'Classified / Leaked Memo',
      badgeClass: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
      icon: '🔒',
    },
    whitepaper: {
      label: 'Research Whitepaper',
      badgeClass: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
      icon: '📑',
    },
    regulatory_directive: {
      label: 'Regulatory Directive',
      badgeClass: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
      icon: '⚖',
    },
  };

  const config = typeConfig[data.documentType] || typeConfig.whitepaper;
  const activeHighlight =
    data.highlights && data.highlights.length > 0 ? data.highlights[activeHighlightIndex] : null;

  const handleCopy = (text: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => {
        setCopiedExcerpt(true);
        setTimeout(() => setCopiedExcerpt(false), 2000);
      });
    }
  };

  return (
    <div className="my-8 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm text-slate-900 dark:text-slate-100 overflow-hidden">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-200/80 dark:border-slate-800/80">
        <div className="flex items-center gap-2">
          <span
            className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 ${config.badgeClass}`}
          >
            <span>{config.icon}</span>
            <span>{config.label}</span>
          </span>
          <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
            {data.pageCount} {data.pageCount === 1 ? 'Page' : 'Pages'}
          </span>
        </div>

        <a
          href={data.documentUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white text-xs font-medium border border-slate-200 dark:border-slate-700 transition cursor-pointer"
        >
          <span>View Source Document</span>
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
            />
          </svg>
        </a>
      </div>

      {/* Document Title & Description */}
      <div className="mt-4">
        <h4 className="text-lg font-bold text-slate-900 dark:text-slate-100 leading-snug">
          {data.title}
        </h4>
        {data.description && (
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            {data.description}
          </p>
        )}
        {data.sourceAttribution && (
          <div className="mt-2 text-xs text-slate-500 font-mono">
            Source Attribution: {data.sourceAttribution}
          </div>
        )}
      </div>

      {/* Highlights / Evidence Section */}
      {data.highlights && data.highlights.length > 0 && (
        <div className="mt-6 pt-5 border-t border-slate-200/80 dark:border-slate-800/60">
          <div className="flex items-center justify-between mb-3">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Verified Highlight Excerpts ({data.highlights.length})
            </div>
            {activeHighlight && (
              <button
                onClick={() => handleCopy(activeHighlight.excerpt)}
                className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline transition flex items-center gap-1 cursor-pointer font-semibold"
              >
                <span>{copiedExcerpt ? '✓ Copied' : 'Copy Excerpt'}</span>
              </button>
            )}
          </div>

          {/* Highlight selector tabs */}
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
            {data.highlights.map((hl, idx) => (
              <button
                key={idx}
                onClick={() => setActiveHighlightIndex(idx)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                  activeHighlightIndex === idx
                    ? 'bg-indigo-600 text-white font-bold shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 border border-slate-200/70 dark:border-slate-700/60'
                }`}
              >
                P. {hl.page} {hl.tag ? `• ${hl.tag}` : ''}
              </button>
            ))}
          </div>

          {/* Active Highlight Excerpt Card */}
          {activeHighlight && (
            <div className="mt-4 p-4 rounded-xl border border-indigo-200 dark:border-indigo-500/20 bg-indigo-50/50 dark:bg-indigo-950/20 relative">
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/30">
                  Page {activeHighlight.page}
                </span>
                {activeHighlight.tag && (
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {activeHighlight.tag}
                  </span>
                )}
              </div>

              <blockquote className="text-sm font-serif italic text-slate-800 dark:text-slate-200 pl-3 border-l-2 border-indigo-500 my-2 leading-relaxed">
                "{activeHighlight.excerpt}"
              </blockquote>

              {activeHighlight.note && (
                <div className="mt-3 pt-2 border-t border-indigo-200/60 dark:border-indigo-500/10 text-xs text-slate-600 dark:text-slate-400 flex items-start gap-1.5">
                  <span className="text-indigo-600 dark:text-indigo-400 font-bold">
                    Annotation:
                  </span>
                  <span>{activeHighlight.note}</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
