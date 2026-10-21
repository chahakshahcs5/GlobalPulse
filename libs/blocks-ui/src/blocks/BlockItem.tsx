'use client';

import React from 'react';
import type { StoryBlock } from '@ai-news/schemas';
import { MapRenderer, VisualDiffRenderer } from '@ai-news/media';
import { renderInlineMarkdown } from './inline-markdown';
import { TableBlockView } from './TableBlockView';
import { ChartBlockView } from './ChartBlockView';
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
import {
  EvidenceBlockView,
  PerspectiveBlockView,
  InterviewBlockView,
  LiveDataBlockView,
  FactCheckBlockView,
} from './IntelligenceBlockViews';
import {
  DataExplorerBlockView,
  RankingBlockView,
  CalculatorBlockView,
  FinancialBlockView,
  ElectionBlockView,
  DisasterBlockView,
  ScienceBlockView,
} from './DataBlockViews';
import { UncertaintyBlockView } from './UncertaintyBlockView';
import { SensitivityBlockView } from './SensitivityBlockView';
import { CorrelationBlockView } from './CorrelationBlockView';
import { QuizBlockView } from './QuizBlockView';
import { KnowledgeGraphBlockView } from './KnowledgeGraphBlockView';
import { AnimatedMapBlockView } from './AnimatedMapBlockView';
import { PredictionLeaderboardBlockView } from './PredictionLeaderboardBlockView';
import { WhatIfBlockView } from './WhatIfBlockView';
import { LiveCommentsBlockView } from './LiveCommentsBlockView';
import {
  AnnotatedImageBlockView,
  VideoGalleryBlockView,
  PodcastBlockView,
  WaveformBlockView,
  TranscriptBlockView,
  DatasetBlockView,
} from './MediaExpansionViews';

export const BlockItem: React.FC<{
  block: StoryBlock;
  theme: 'dark' | 'light';
  /** Parent story id — required by blocks that talk to the server. */
  storyId?: string;
}> = ({ block, theme, storyId }) => {
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
          {block.data.format === 'markdown'
            ? renderInlineMarkdown(block.data.text)
            : block.data.text}
        </p>
      );
    }

    case 'summary': {
      const sentiment = block.data.sentiment;
      const sentimentStyles: Record<string, string> = {
        neutral:
          'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
        positive:
          'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20',
        cautious:
          'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20',
        critical:
          'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20',
      };
      return (
        <div className="rounded-2xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/70 dark:bg-blue-950/30 p-5 sm:p-6 my-6 shadow-xs">
          <div className="flex items-center gap-2 mb-2 text-blue-700 dark:text-blue-400 font-bold uppercase tracking-wider text-xs">
            <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
            Executive Briefing
            {sentiment && (
              <span
                className={`ml-1 rounded-full border px-2 py-0.5 text-[10px] font-bold normal-case tracking-normal ${
                  sentimentStyles[sentiment] ?? sentimentStyles.neutral
                }`}
              >
                {sentiment}
              </span>
            )}
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
          <div className="flex items-start gap-3">
            {block.data.avatarUrl && (
              <img
                src={block.data.avatarUrl}
                alt=""
                aria-hidden="true"
                className="h-11 w-11 shrink-0 rounded-full object-cover border border-slate-200 dark:border-slate-700"
                loading="lazy"
              />
            )}
            <div className="min-w-0">
              <blockquote className="text-lg sm:text-xl font-medium font-serif-headline text-slate-900 dark:text-slate-100 italic leading-snug">
                "{block.data.quote}"
              </blockquote>
              <figcaption className="mt-2 text-sm text-slate-600 dark:text-slate-400 not-italic font-sans">
                —{' '}
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {block.data.attribution}
                </span>
                {block.data.title && <span className="text-slate-500">, {block.data.title}</span>}
                {block.data.sourceUrl && (
                  <a
                    href={block.data.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-2 text-xs font-semibold text-blue-700 underline underline-offset-2 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    Source ↗
                  </a>
                )}
              </figcaption>
            </div>
          </div>
        </figure>
      );
    }

    case 'chart': {
      return <ChartBlockView data={block.data} theme={theme} />;
    }

    case 'map': {
      const svg = MapRenderer.renderSvgFallback(block.data, 800, 420, theme);
      return (
        <figure className="my-8 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
          <div className="p-3">
            <div dangerouslySetInnerHTML={{ __html: svg }} />
          </div>
          {(block.data.sourceAttribution || block.data.methodology || block.data.lastUpdated) && (
            <figcaption className="px-5 py-2.5 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 space-y-1">
              <p className="flex flex-wrap gap-x-4 gap-y-0.5">
                {block.data.sourceAttribution && (
                  <span>Source: {block.data.sourceAttribution}</span>
                )}
                {block.data.lastUpdated && <span>Updated: {block.data.lastUpdated}</span>}
              </p>
              {block.data.methodology && <p>Methodology: {block.data.methodology}</p>}
            </figcaption>
          )}
        </figure>
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
      const { value, label, unit, trend, trendValue, comparison, period, context } = block.data;
      return (
        <div className="my-6 p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {label}
            </span>
            <div className="text-4xl sm:text-5xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight mt-1">
              {value}
              {unit && (
                <span className="text-2xl sm:text-3xl font-bold text-slate-500 dark:text-slate-400 ml-1.5">
                  {unit}
                </span>
              )}
            </div>
            {context && (
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">{context}</p>
            )}
            {comparison && (
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">{comparison}</p>
            )}
            {(period || block.data.sourceAttribution || block.data.methodology) && (
              <p className="text-[11px] text-slate-500 dark:text-slate-500 mt-2 flex flex-wrap gap-x-3 gap-y-0.5">
                {period && <span>Period: {period}</span>}
                {block.data.sourceAttribution && (
                  <span>Source: {block.data.sourceAttribution}</span>
                )}
                {block.data.lastUpdated && <span>Updated: {block.data.lastUpdated}</span>}
              </p>
            )}
            {block.data.methodology && (
              <p className="text-[11px] text-slate-500 dark:text-slate-500 mt-0.5">
                Methodology: {block.data.methodology}
              </p>
            )}
            {block.data.sourceIds && block.data.sourceIds.length > 0 && (
              <p className="text-[10px] font-mono text-slate-400 dark:text-slate-600 mt-1">
                {block.data.sourceIds.length} registered source
                {block.data.sourceIds.length === 1 ? '' : 's'}
              </p>
            )}
          </div>
          {trend && (
            <div
              className={`px-3 py-1.5 rounded-lg text-sm font-bold flex items-center gap-1 self-start sm:self-center border ${
                trend === 'up'
                  ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20'
                  : trend === 'down'
                    ? 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-500/20'
                    : 'bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
              }`}
            >
              {/* A flat trend is not a fall. */}
              <span>{trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'}</span>
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
      // The aspect ratio is a layout decision, so the image is cropped to it
      // rather than the browser guessing from the file.
      const aspectClass =
        block.data.aspectRatio === '9:16'
          ? 'aspect-[9/16] max-w-sm mx-auto'
          : block.data.aspectRatio === '1:1'
            ? 'aspect-square max-w-lg mx-auto'
            : block.data.aspectRatio === '4:3'
              ? 'aspect-[4/3]'
              : block.data.aspectRatio === '21:9'
                ? 'aspect-[21/9]'
                : 'aspect-video';
      return (
        <figure className="my-6">
          <img
            src={block.data.url}
            alt={block.data.altText}
            className={`w-full rounded-xl object-cover border border-slate-200 dark:border-slate-800 max-h-[500px] ${aspectClass}`}
            loading="lazy"
          />
          {(block.data.caption || block.data.credit || block.data.sourceAttribution) && (
            <figcaption className="text-xs text-slate-500 dark:text-slate-400 mt-2 flex flex-wrap justify-between gap-2 px-1">
              <span className="min-w-0">{block.data.caption}</span>
              <span className="flex flex-wrap items-center gap-3">
                {block.data.sourceAttribution && (
                  <span>Source: {block.data.sourceAttribution}</span>
                )}
                {block.data.credit && (
                  <span className="font-mono">Credit: {block.data.credit}</span>
                )}
              </span>
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
      return <PollBlockView data={block.data} blockId={block.id} storyId={storyId} />;
    }

    case 'document_viewer': {
      return <DocumentViewerBlockView data={block.data} />;
    }

    case 'citation': {
      return (
        <div className="my-3 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/30 text-xs text-slate-600 dark:text-slate-400">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-800 dark:text-slate-300">
                Verified Claim:
              </span>
              <span className="text-slate-700 dark:text-slate-300">"{block.data.claim}"</span>
            </div>
            <span className="font-mono text-indigo-600 dark:text-indigo-400 shrink-0">
              Sources: {block.data.sourceIds.length}
            </span>
          </div>
          {block.data.quoteExcerpt && (
            <blockquote className="mt-2 pl-3 border-l-2 border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 italic leading-relaxed">
              {block.data.quoteExcerpt}
            </blockquote>
          )}
        </div>
      );
    }

    case 'table': {
      return <TableBlockView data={block.data} />;
    }

    case 'annotated_image': {
      return <AnnotatedImageBlockView data={block.data} />;
    }

    case 'video_gallery': {
      return <VideoGalleryBlockView data={block.data} />;
    }

    case 'podcast': {
      return <PodcastBlockView data={block.data} />;
    }

    case 'waveform': {
      return <WaveformBlockView data={block.data} />;
    }

    case 'transcript': {
      return <TranscriptBlockView data={block.data} />;
    }

    case 'dataset': {
      return <DatasetBlockView data={block.data} />;
    }

    case 'data_explorer': {
      return <DataExplorerBlockView data={block.data} />;
    }

    case 'ranking': {
      return <RankingBlockView data={block.data} />;
    }

    case 'calculator': {
      return <CalculatorBlockView data={block.data} />;
    }

    case 'financial': {
      return <FinancialBlockView data={block.data} />;
    }

    case 'election': {
      return <ElectionBlockView data={block.data} />;
    }

    case 'disaster': {
      return <DisasterBlockView data={block.data} />;
    }

    case 'science': {
      return <ScienceBlockView data={block.data} />;
    }

    case 'sensitivity': {
      return <SensitivityBlockView data={block.data} />;
    }

    case 'correlation': {
      return <CorrelationBlockView data={block.data} />;
    }

    case 'quiz': {
      return <QuizBlockView data={block.data} />;
    }

    case 'knowledge_graph': {
      return <KnowledgeGraphBlockView data={block.data} />;
    }

    case 'animated_map': {
      return <AnimatedMapBlockView data={block.data} />;
    }

    case 'prediction_leaderboard': {
      return <PredictionLeaderboardBlockView data={block.data} />;
    }

    case 'what_if': {
      return <WhatIfBlockView data={block.data} />;
    }

    case 'live_comments': {
      return <LiveCommentsBlockView data={block.data} storyId={storyId} />;
    }

    case 'uncertainty': {
      return <UncertaintyBlockView data={block.data} />;
    }

    case 'evidence': {
      return <EvidenceBlockView data={block.data} />;
    }

    case 'perspective': {
      return <PerspectiveBlockView data={block.data} />;
    }

    case 'interview': {
      return <InterviewBlockView data={block.data} />;
    }

    case 'live_data': {
      return <LiveDataBlockView data={block.data} />;
    }

    case 'fact_check': {
      return <FactCheckBlockView data={block.data} />;
    }

    default:
      return null;
  }
};
