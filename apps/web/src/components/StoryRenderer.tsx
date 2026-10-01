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
  ImageDiffBlock,
  LiveTickerBlock,
  PollBlock,
  DocumentViewerBlock,
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

  // Filter blocks based on selected depth
  let effectiveBlocks = blocks;
  if (depth === 'quick') {
    const quickTypes = new Set([
      'heading',
      'summary',
      'quote',
      'statistic',
      'chart',
      'live_ticker',
      'poll',
      'callout',
    ]);
    const filtered = blocks.filter(
      (b) => quickTypes.has(b.blockType) || (b.blockType === 'paragraph' && b.sortOrder <= 2)
    );
    effectiveBlocks = filtered.length > 0 ? filtered : blocks;
  }

  // Sort blocks by sortOrder
  const sortedBlocks = [...effectiveBlocks].sort((a, b) => a.sortOrder - b.sortOrder);

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
  const audioRef = React.useRef<HTMLAudioElement>(null);
  const [currentTimeMs, setCurrentTimeMs] = React.useState(0);
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [readAlongMode, setReadAlongMode] = React.useState(
    Boolean(data.cuePoints && data.cuePoints.length > 0)
  );

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTimeMs(audioRef.current.currentTime * 1000);
    }
  };

  const seekToCue = (timeMs: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = timeMs / 1000;
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const hasCuePoints = Boolean(data.cuePoints && data.cuePoints.length > 0);

  return (
    <div className="my-6 rounded-xl border border-slate-800 bg-gradient-to-r from-slate-900 via-slate-900/80 to-indigo-950/40 p-5 shadow-lg">
      <div className="flex items-center justify-between gap-4 mb-3">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
            <span
              className={`w-2 h-2 rounded-full bg-indigo-500 ${isPlaying ? 'animate-ping' : ''}`}
            />
            Audio Dispatch
          </span>
          <h4 className="text-lg font-bold text-slate-100 mt-0.5">{data.title}</h4>
        </div>
        <div className="flex items-center gap-2">
          {hasCuePoints && (
            <button
              onClick={() => setReadAlongMode(!readAlongMode)}
              className={`px-2.5 py-1 rounded text-xs font-semibold border transition-all ${
                readAlongMode
                  ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
              }`}
            >
              {readAlongMode ? 'Read-Along Active' : 'Enable Read-Along'}
            </button>
          )}
          {data.durationSeconds && (
            <span className="text-xs font-mono font-medium text-slate-400 bg-slate-800/80 px-2 py-1 rounded">
              {Math.floor(data.durationSeconds / 60)}:
              {(data.durationSeconds % 60).toString().padStart(2, '0')}
            </span>
          )}
        </div>
      </div>

      {data.narrator && (
        <div className="text-xs text-slate-400 mb-3 flex items-center gap-1.5">
          <span>Narrated by:</span>
          <span className="font-semibold text-slate-200">{data.narrator}</span>
        </div>
      )}

      <audio
        ref={audioRef}
        src={data.url}
        controls
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onTimeUpdate={handleTimeUpdate}
        className="w-full rounded-lg"
      />

      {/* Synchronized Read-Along Karaoke Container */}
      {hasCuePoints && readAlongMode && data.cuePoints && (
        <div className="mt-4 pt-3 border-t border-slate-800">
          <div className="text-[11px] font-bold uppercase tracking-wider text-indigo-400 mb-2 flex items-center justify-between">
            <span>Synchronized Script (Click any phrase to jump)</span>
            <span className="font-mono text-slate-500">{Math.floor(currentTimeMs / 1000)}s</span>
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
                  className={`p-2 rounded-lg cursor-pointer transition-all flex items-start gap-2 ${
                    isActive
                      ? 'bg-indigo-500/20 text-indigo-100 border-l-3 border-indigo-400 font-medium pl-3'
                      : 'text-slate-300 hover:bg-slate-800/50 hover:text-white'
                  }`}
                >
                  <span className="text-[10px] font-mono text-slate-500 pt-0.5 select-none shrink-0">
                    {Math.floor(cue.timeMs / 1000)}s
                  </span>
                  <span>{cue.text}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {data.transcript && !hasCuePoints && (
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
  const pubSlug = data.publisher
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

  return (
    <div className="my-4 p-4 rounded-xl border border-slate-800 bg-slate-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-slate-700 transition-colors">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Link
            href={`/sources/${pubSlug}`}
            className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-800 text-indigo-400 hover:text-white hover:bg-indigo-600/30 border border-indigo-500/20 transition-colors"
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
    <div className="my-8 rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900/90 to-slate-950 p-5 shadow-xl">
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 mb-4">
        <div className="flex items-center gap-2.5">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
            Live Market & Numerical Ticker
          </span>
          {data.title && (
            <span className="text-xs font-medium text-slate-400 border-l border-slate-700 pl-2.5">
              {data.title}
            </span>
          )}
        </div>
        <span className="text-[11px] font-mono text-slate-500">
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
                  ? 'border-indigo-500 bg-indigo-950/20 shadow-lg ring-1 ring-indigo-500/50'
                  : 'border-slate-800 bg-slate-900/50 hover:border-slate-700 hover:bg-slate-800/40'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-mono font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                  {item.symbol}
                </span>
                <span
                  className={`text-xs font-bold flex items-center gap-0.5 px-2 py-0.5 rounded ${
                    isPositive
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                  }`}
                >
                  <span>{isPositive ? '↑' : '↓'}</span>
                  <span>
                    {isPositive ? '+' : ''}
                    {item.delta.toFixed(2)}%
                  </span>
                </span>
              </div>

              <div className="text-xs text-slate-400 line-clamp-1 mb-1">{item.label}</div>

              <div className="flex items-baseline justify-between gap-2">
                <span className="text-2xl font-black text-slate-100 tracking-tight font-mono">
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
    <div className="my-8 rounded-2xl border border-indigo-900/40 bg-gradient-to-br from-slate-900 via-slate-900/80 to-indigo-950/20 p-6 shadow-xl">
      <div className="flex items-center justify-between gap-3 mb-3 border-b border-slate-800 pb-3">
        <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
          Interactive Reader Poll
        </span>
        <div className="flex items-center gap-2">
          {data.closed && (
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-800 text-slate-400 border border-slate-700">
              Poll Closed
            </span>
          )}
          <span className="text-xs font-mono text-slate-400">
            {totalVotes.toLocaleString()} {totalVotes === 1 ? 'vote' : 'votes'}
          </span>
        </div>
      </div>

      <h4 className="text-lg sm:text-xl font-bold text-slate-100 mb-4">{data.question}</h4>

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
                    ? 'border-indigo-500 bg-indigo-950/40 text-slate-100 ring-1 ring-indigo-500'
                    : 'border-slate-800 bg-slate-900/40 text-slate-300'
                }`}
              >
                {/* Progress bar background fill */}
                <div
                  className={`absolute inset-y-0 left-0 transition-all duration-700 ease-out ${
                    isSelected ? 'bg-indigo-600/30' : 'bg-slate-800/40'
                  }`}
                  style={{ width: `${percentage}%` }}
                />

                <div className="relative z-10 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    {isSelected && (
                      <span className="w-4 h-4 rounded-full bg-indigo-500 text-white flex items-center justify-center text-[10px] font-bold">
                        ✓
                      </span>
                    )}
                    <span className="text-sm font-medium">{opt.text}</span>
                  </div>
                  <div className="flex items-baseline gap-2 font-mono text-xs">
                    <span className="font-bold">{percentage}%</span>
                    <span className="text-slate-400">({opt.voteCount})</span>
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
              className="w-full text-left p-3.5 rounded-xl border border-slate-800 bg-slate-900/60 hover:border-indigo-500/60 hover:bg-slate-800/80 transition-all flex items-center justify-between group cursor-pointer text-slate-200"
            >
              <div className="flex items-center gap-3">
                <span className="w-4 h-4 rounded-full border border-slate-600 group-hover:border-indigo-400 group-hover:scale-110 transition-all" />
                <span className="text-sm font-medium group-hover:text-white transition-colors">
                  {opt.text}
                </span>
              </div>
              <span className="text-xs text-slate-500 group-hover:text-indigo-400 transition-colors">
                Vote →
              </span>
            </button>
          );
        })}
      </div>

      {hasVoted && (
        <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-400">
          <span>
            {votedOptionId
              ? 'Thank you for contributing your perspective.'
              : 'Voting is now closed.'}
          </span>
          <span className="font-mono text-[11px] text-slate-500">Live consensus tally</span>
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
    <div className="my-8 rounded-2xl border border-slate-800 bg-gradient-to-b from-slate-900 via-slate-900/90 to-slate-950 p-6 shadow-xl text-slate-100 overflow-hidden">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <span
            className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 ${config.badgeClass}`}
          >
            <span>{config.icon}</span>
            <span>{config.label}</span>
          </span>
          <span className="text-xs font-mono text-slate-400">
            {data.pageCount} {data.pageCount === 1 ? 'Page' : 'Pages'}
          </span>
        </div>

        <a
          href={data.documentUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium border border-slate-700 transition"
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
        <h4 className="text-lg font-bold text-slate-100 leading-snug">{data.title}</h4>
        {data.description && (
          <p className="mt-1 text-sm text-slate-400 leading-relaxed">{data.description}</p>
        )}
        {data.sourceAttribution && (
          <div className="mt-2 text-xs text-slate-500 font-mono">
            Source Attribution: {data.sourceAttribution}
          </div>
        )}
      </div>

      {/* Highlights / Evidence Section */}
      {data.highlights && data.highlights.length > 0 && (
        <div className="mt-6 pt-5 border-t border-slate-800/60">
          <div className="flex items-center justify-between mb-3">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Verified Highlight Excerpts ({data.highlights.length})
            </div>
            {activeHighlight && (
              <button
                onClick={() => handleCopy(activeHighlight.excerpt)}
                className="text-xs text-indigo-400 hover:text-indigo-300 transition flex items-center gap-1"
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
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                  activeHighlightIndex === idx
                    ? 'bg-indigo-600 text-white font-bold shadow-md shadow-indigo-600/30'
                    : 'bg-slate-800/80 hover:bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                P. {hl.page} {hl.tag ? `• ${hl.tag}` : ''}
              </button>
            ))}
          </div>

          {/* Active Highlight Excerpt Card */}
          {activeHighlight && (
            <div className="mt-4 p-4 rounded-xl border border-indigo-500/20 bg-indigo-950/20 relative">
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-indigo-500/20 text-indigo-300">
                  Page {activeHighlight.page}
                </span>
                {activeHighlight.tag && (
                  <span className="text-xs font-semibold text-slate-300">
                    {activeHighlight.tag}
                  </span>
                )}
              </div>

              <blockquote className="text-sm font-serif italic text-slate-200 pl-3 border-l-2 border-indigo-400 my-2 leading-relaxed">
                "{activeHighlight.excerpt}"
              </blockquote>

              {activeHighlight.note && (
                <div className="mt-3 pt-2 border-t border-indigo-500/10 text-xs text-slate-400 flex items-start gap-1.5">
                  <span className="text-indigo-400 font-bold">Annotation:</span>
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
