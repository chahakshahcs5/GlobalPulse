'use client';

import React from 'react';
import Link from 'next/link';
import type {
  StoryBlock,
  GalleryBlock,
  FlowBlock,
  VideoBlock,
  AudioBlock,
  SlideDeckBlock,
  ComparisonBlock,
  SourceBlock,
  EntityBlock,
  RelatedStoriesBlock,
  EmbedBlock,
} from '@ai-news/schemas';
import {
  D3ChartRenderer,
  MapRenderer,
  TimelineRenderer,
  DiagramRenderer,
  VisualDiffRenderer,
} from '@ai-news/media';
import { formatDeterministicDate } from '../lib/date-utils';

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
      const svg = D3ChartRenderer.renderToSvg(block.data, { theme, width: 800, height: 420 });
      return (
        <div className="my-8 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-3">
          <div dangerouslySetInnerHTML={{ __html: svg }} />
        </div>
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
      const svg = TimelineRenderer.renderSvgTrack(block.data, 'horizontal', 800, 240, theme);
      return (
        <div className="my-8 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-3">
          <div dangerouslySetInnerHTML={{ __html: svg }} />
        </div>
      );
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
        <div className="my-6 p-6 rounded-xl border border-slate-800 bg-slate-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              {label}
            </span>
            <div className="text-4xl sm:text-5xl font-extrabold text-slate-100 tracking-tight mt-1">
              {value}
            </div>
            {context && <p className="text-xs text-slate-400 mt-1">{context}</p>}
          </div>
          {trend && (
            <div
              className={`px-3 py-1.5 rounded-lg text-sm font-bold flex items-center gap-1 self-start sm:self-center ${
                trend === 'up'
                  ? 'bg-emerald-500/10 text-emerald-400'
                  : 'bg-rose-500/10 text-rose-400'
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
      return <AudioBlockView data={block.data} />;
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
          {block.data.title && (
            <div className="p-3 font-bold text-sm text-slate-200 border-b border-slate-800">
              {block.data.title}
            </div>
          )}
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-800/60 text-slate-200 font-semibold border-b border-slate-700">
              <tr>
                {block.data.headers.map((h: string, i: number) => (
                  <th key={i} className="px-4 py-3">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {block.data.rows.map((row: string[], rIdx: number) => (
                <tr key={rIdx} className="hover:bg-slate-800/30">
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
            <div className="p-2.5 border-t border-slate-800 text-xs text-slate-500 italic text-right">
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
      {data.title && <h4 className="text-xl font-bold text-slate-100 mb-4">{data.title}</h4>}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {data.images.map((img, idx) => (
          <figure
            key={idx}
            className="group relative rounded-xl overflow-hidden border border-slate-800 bg-slate-900/40 hover:border-indigo-500/50 transition-all"
          >
            <img
              src={img.url}
              alt={img.altText}
              className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
            />
            {(img.caption || img.credit) && (
              <figcaption className="p-3 text-xs bg-slate-900/90 text-slate-300 border-t border-slate-800/60">
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
          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            COMPLETED
          </span>
        );
      case 'active':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-ping" />
            IN PROGRESS
          </span>
        );
      case 'blocked':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
            BLOCKED
          </span>
        );
      case 'pending':
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-500/10 text-slate-400 border border-slate-500/20">
            PENDING
          </span>
        );
    }
  };

  return (
    <div className="my-8 rounded-xl border border-slate-800 bg-slate-900/40 p-6">
      {data.title && <h4 className="text-xl font-bold text-slate-100 mb-6">{data.title}</h4>}
      <div className="relative pl-6 border-l-2 border-slate-700/60 space-y-6">
        {data.steps.map((s, idx) => (
          <div key={idx} className="relative">
            <div className="absolute -left-[31px] top-0.5 w-6 h-6 rounded-full bg-slate-800 border-2 border-indigo-500 text-indigo-400 font-bold text-xs flex items-center justify-center">
              {s.stepNumber}
            </div>
            <div className="flex items-center gap-3 mb-1">
              <h5 className="font-bold text-base text-slate-100">{s.title}</h5>
              {statusBadge(s.status)}
            </div>
            <p className="text-sm text-slate-300 leading-relaxed">{s.description}</p>
          </div>
        ))}
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

const AudioBlockView: React.FC<{ data: AudioBlock['data'] }> = ({ data }) => {
  return (
    <div className="my-6 rounded-xl border border-slate-800 bg-gradient-to-r from-slate-900 via-slate-900/80 to-indigo-950/40 p-5 shadow-lg">
      <div className="flex items-center justify-between gap-4 mb-3">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
            Audio Dispatch
          </span>
          <h4 className="text-lg font-bold text-slate-100 mt-0.5">{data.title}</h4>
        </div>
        {data.durationSeconds && (
          <span className="text-xs font-mono font-medium text-slate-400 bg-slate-800/80 px-2 py-1 rounded">
            {Math.floor(data.durationSeconds / 60)}:
            {(data.durationSeconds % 60).toString().padStart(2, '0')}
          </span>
        )}
      </div>
      {data.narrator && (
        <div className="text-xs text-slate-400 mb-3 flex items-center gap-1.5">
          <span>Narrated by:</span>
          <span className="font-semibold text-slate-200">{data.narrator}</span>
        </div>
      )}
      <audio src={data.url} controls className="w-full rounded-lg" />
      {data.transcript && (
        <details className="mt-3 pt-3 border-t border-slate-800 text-xs text-slate-400">
          <summary className="font-semibold text-slate-300 cursor-pointer hover:text-indigo-400 transition-colors">
            Audio Briefing Transcript
          </summary>
          <p className="mt-2 text-slate-300 whitespace-pre-line leading-relaxed font-sans">
            {data.transcript}
          </p>
        </details>
      )}
    </div>
  );
};

const SlideDeckBlockView: React.FC<{ data: SlideDeckBlock['data'] }> = ({ data }) => {
  const [currentSlide, setCurrentSlide] = React.useState(0);
  const slide = data.slides[currentSlide] || data.slides[0];
  if (!slide) return null;

  return (
    <div className="my-8 rounded-xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-md shadow-xl">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400">
            Interactive Slide Deck
          </span>
          <h4 className="text-xl font-bold text-slate-100">{data.title}</h4>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentSlide((prev) => Math.max(0, prev - 1))}
            disabled={currentSlide === 0}
            className="p-1.5 rounded-lg border border-slate-700 bg-slate-800/80 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-slate-300 transition-colors"
            aria-label="Previous slide"
          >
            ‹
          </button>
          <span className="text-xs font-mono font-medium text-slate-400 px-1">
            {currentSlide + 1} / {data.slides.length}
          </span>
          <button
            onClick={() => setCurrentSlide((prev) => Math.min(data.slides.length - 1, prev + 1))}
            disabled={currentSlide === data.slides.length - 1}
            className="p-1.5 rounded-lg border border-slate-700 bg-slate-800/80 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-slate-300 transition-colors"
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
          className="w-full h-56 sm:h-72 object-cover rounded-lg mb-4 border border-slate-800"
          loading="lazy"
        />
      )}
      <h5 className="text-lg font-bold text-slate-100 mb-2">{slide.title}</h5>
      {slide.body && <p className="text-slate-300 text-sm leading-relaxed mb-3">{slide.body}</p>}
      {slide.bullets && slide.bullets.length > 0 && (
        <ul className="space-y-1.5 mb-4">
          {slide.bullets.map((b, idx) => (
            <li key={idx} className="flex items-start gap-2 text-sm text-slate-300">
              <span className="text-indigo-400 font-bold">•</span>
              <span>{b}</span>
            </li>
          ))}
        </ul>
      )}
      {slide.sourceAttribution && (
        <div className="text-xs text-slate-500 italic mt-3 pt-3 border-t border-slate-800/60">
          Source: {slide.sourceAttribution}
        </div>
      )}
    </div>
  );
};

const ComparisonBlockView: React.FC<{ data: ComparisonBlock['data'] }> = ({ data }) => {
  return (
    <div className="my-8 rounded-xl border border-slate-800 bg-slate-900/40 p-6">
      {data.title && <h4 className="text-xl font-bold text-slate-100 mb-5">{data.title}</h4>}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-xl border border-blue-500/20 bg-blue-950/10 p-5">
          <h5 className="font-bold text-base text-blue-400 border-b border-blue-500/20 pb-2 mb-3">
            {data.subjectA.name}
          </h5>
          <ul className="space-y-2">
            {data.subjectA.points.map((pt, idx) => (
              <li key={idx} className="flex items-start gap-2 text-sm text-slate-300">
                <span className="text-blue-400 font-bold mt-0.5">•</span>
                <span>{pt}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-xl border border-purple-500/20 bg-purple-950/10 p-5">
          <h5 className="font-bold text-base text-purple-400 border-b border-purple-500/20 pb-2 mb-3">
            {data.subjectB.name}
          </h5>
          <ul className="space-y-2">
            {data.subjectB.points.map((pt, idx) => (
              <li key={idx} className="flex items-start gap-2 text-sm text-slate-300">
                <span className="text-purple-400 font-bold mt-0.5">•</span>
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
  return (
    <div className="my-4 p-4 rounded-xl border border-slate-800 bg-slate-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-slate-700 transition-colors">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-800 text-indigo-400 border border-indigo-500/20">
            {data.publisher}
          </span>
          {data.publishedAt && (
            <span className="text-xs text-slate-500 font-mono" suppressHydrationWarning>
              {formatDeterministicDate(data.publishedAt)}
            </span>
          )}
        </div>
        <h5 className="font-semibold text-sm text-slate-100">{data.title}</h5>
      </div>
      <a
        href={data.url}
        target="_blank"
        rel="noopener noreferrer"
        className="self-start sm:self-center px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-xs font-semibold text-slate-200 flex items-center gap-1.5 transition-colors"
      >
        <span>View Primary Source</span>
        <span className="text-slate-400">↗</span>
      </a>
    </div>
  );
};

const EntityBlockView: React.FC<{ data: EntityBlock['data'] }> = ({ data }) => {
  return (
    <div className="my-4 p-4 rounded-xl border border-slate-800 bg-slate-900/40 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3.5">
        {data.avatarUrl ? (
          <img
            src={data.avatarUrl}
            alt={data.name}
            className="w-12 h-12 rounded-full object-cover border border-slate-700"
          />
        ) : (
          <div className="w-12 h-12 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold text-lg">
            {data.name.slice(0, 2).toUpperCase()}
          </div>
        )}
        <div>
          <div className="flex items-center gap-2">
            <h5 className="font-bold text-base text-slate-100">{data.name}</h5>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              {data.type}
            </span>
          </div>
          {data.description && (
            <p className="text-xs text-slate-400 mt-0.5 line-clamp-2 max-w-xl">
              {data.description}
            </p>
          )}
        </div>
      </div>
      <Link
        href={`/entities/${data.entityId}`}
        className="px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800/60 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition-colors whitespace-nowrap"
      >
        Dossier →
      </Link>
    </div>
  );
};

const RelatedStoriesBlockView: React.FC<{ data: RelatedStoriesBlock['data'] }> = ({ data }) => {
  return (
    <div className="my-8 rounded-xl border border-slate-800 bg-slate-900/30 p-5">
      <h5 className="font-bold text-sm uppercase tracking-wider text-slate-400 mb-3">
        {data.title || 'Related Coverage'}
      </h5>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {data.storyIds.map((sId, idx) => (
          <Link
            key={idx}
            href={`/stories/${sId}`}
            className="p-3 rounded-lg border border-slate-800 bg-slate-900/80 hover:border-indigo-500/40 hover:bg-slate-800/40 transition-all flex items-center justify-between group"
          >
            <span className="text-sm font-medium text-slate-200 group-hover:text-indigo-400 transition-colors">
              Story Dispatch: {sId}
            </span>
            <span className="text-slate-500 group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all text-sm">
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
