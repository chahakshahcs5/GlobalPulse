'use client';

import React from 'react';
import type { StoryBlock } from '@ai-news/schemas';
import { MapRenderer, VisualDiffRenderer } from '@ai-news/media';
import { renderInlineMarkdown } from './inline-markdown';
import { presentationClass } from './presentation';
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

/**
 * Draw the block itself.
 *
 * Every block type has its own view, and the presentation options — how
 * wide it is, how it is aligned, which theme it is drawn in — are applied
 * around that view rather than inside it. That is what lets one set of
 * options apply to all fifty-five block types without each of them having
 * to know about them.
 */
function renderBlock(
  block: StoryBlock,
  theme: 'dark' | 'light',
  storyId?: string
): React.ReactNode {
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
      /*
       * How the paragraph is set.
       *
       * Body copy, a lede set larger to lead the story, or a note set
       * smaller and marked off from the text around it. The words are the
       * same; only the setting changes.
       */
      const layout = block.data.layout ?? 'body';
      const text =
        block.data.format === 'markdown' ? renderInlineMarkdown(block.data.text) : block.data.text;

      if (layout === 'lede') {
        return (
          <p className="my-5 text-xl sm:text-2xl leading-relaxed font-medium text-slate-900 dark:text-slate-100">
            {text}
          </p>
        );
      }

      if (layout === 'note') {
        return (
          <p className="my-5 border-l-2 border-slate-300 dark:border-slate-700 pl-4 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
            {text}
          </p>
        );
      }

      return (
        <p className="text-base sm:text-lg text-slate-800 dark:text-slate-200 leading-relaxed font-normal my-4">
          {text}
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
      /*
       * How the briefing is drawn.
       *
       * A card, a numbered list, or plain text with no furniture at all.
       * The takeaways are the same; only the treatment changes.
       */
      const layout = block.data.layout ?? 'card';

      const points = (numbered: boolean) => (
        <ul className="space-y-2.5">
          {block.data.bulletPoints.map((pt: string, idx: number) => (
            <li
              key={idx}
              className="flex items-start gap-2.5 text-slate-800 dark:text-slate-200 text-sm sm:text-base font-medium"
            >
              {numbered ? (
                <span className="font-mono font-bold text-slate-400 dark:text-slate-500 mt-0.5">
                  {idx + 1}.
                </span>
              ) : (
                <span className="text-blue-600 dark:text-blue-400 font-bold mt-0.5">•</span>
              )}
              <span>{pt}</span>
            </li>
          ))}
        </ul>
      );

      if (layout === 'numbered') {
        return (
          <div className="my-6">
            <h4 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white mb-3">
              {block.data.headline}
            </h4>
            {points(true)}
          </div>
        );
      }

      if (layout === 'plain') {
        return (
          <div className="my-6">
            <h4 className="text-base font-bold text-slate-900 dark:text-white mb-2">
              {block.data.headline}
            </h4>
            {points(false)}
          </div>
        );
      }

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
          {points(false)}
        </div>
      );
    }

    case 'quote': {
      /*
       * How the quote is drawn.
       *
       * A pull quote with a rule down the side, an inline quote that sits
       * in the text, or a card with a border all round. The quotation is
       * the same; only the treatment changes.
       */
      const layout = block.data.layout ?? 'pull';

      if (layout === 'inline') {
        return (
          <p className="my-4 text-base text-slate-700 dark:text-slate-300">
            <span className="italic font-serif-headline">&ldquo;{block.data.quote}&rdquo;</span>
            {block.data.attribution && (
              <span className="text-sm text-slate-500 dark:text-slate-400">
                {' '}
                — {block.data.attribution}
              </span>
            )}
          </p>
        );
      }

      if (layout === 'card') {
        return (
          <figure className="my-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 p-5">
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
                  &ldquo;{block.data.quote}&rdquo;
                </blockquote>
                <figcaption className="mt-2 text-sm text-slate-600 dark:text-slate-400 not-italic font-sans">
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
      /*
       * How the statistic is drawn.
       *
       * A statistic can be a card, a line of text, or a hero figure with
       * the number set large. The number is the same; only the weight it
       * is given changes.
       */
      const layout = block.data.layout ?? 'card';

      if (layout === 'inline') {
        return (
          <p className="my-4 flex flex-wrap items-baseline gap-x-3 gap-y-1 text-slate-800 dark:text-slate-200">
            <span className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
              {value}
              {unit && <span className="text-base font-bold text-slate-500 ml-0.5">{unit}</span>}
            </span>
            <span className="text-sm font-medium">{label}</span>
            {trend && (
              <span
                className={`text-xs font-bold ${
                  trend === 'up'
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : trend === 'down'
                      ? 'text-rose-600 dark:text-rose-400'
                      : 'text-slate-500'
                }`}
              >
                {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'} {trendValue || trend}
              </span>
            )}
            {context && (
              <span className="text-xs text-slate-500 dark:text-slate-400">{context}</span>
            )}
          </p>
        );
      }

      if (layout === 'hero') {
        return (
          <div className="my-8 text-center">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {label}
            </p>
            <p className="mt-2 text-6xl sm:text-7xl font-black tracking-tight text-slate-900 dark:text-white">
              {value}
              {unit && (
                <span className="text-3xl sm:text-4xl font-bold text-slate-400 dark:text-slate-500 ml-2">
                  {unit}
                </span>
              )}
            </p>
            {trend && (
              <p
                className={`mt-3 text-sm font-bold ${
                  trend === 'up'
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : trend === 'down'
                      ? 'text-rose-600 dark:text-rose-400'
                      : 'text-slate-500'
                }`}
              >
                {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'} {trendValue || trend}
              </p>
            )}
            {context && (
              <p className="mt-3 max-w-lg mx-auto text-sm text-slate-600 dark:text-slate-400">
                {context}
              </p>
            )}
            {comparison && (
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{comparison}</p>
            )}
            {(period || block.data.sourceAttribution || block.data.methodology) && (
              <p className="mt-4 flex flex-wrap justify-center gap-x-3 gap-y-0.5 text-[11px] text-slate-500 dark:text-slate-500">
                {period && <span>Period: {period}</span>}
                {block.data.sourceAttribution && (
                  <span>Source: {block.data.sourceAttribution}</span>
                )}
                {block.data.lastUpdated && <span>Updated: {block.data.lastUpdated}</span>}
              </p>
            )}
            {block.data.methodology && (
              <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-500">
                Methodology: {block.data.methodology}
              </p>
            )}
          </div>
        );
      }

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
      return <SensitivityBlockView data={block.data} theme={theme} />;
    }

    case 'correlation': {
      return <CorrelationBlockView data={block.data} theme={theme} />;
    }

    case 'quiz': {
      return <QuizBlockView data={block.data} />;
    }

    case 'knowledge_graph': {
      return <KnowledgeGraphBlockView data={block.data} theme={theme} />;
    }

    case 'animated_map': {
      return <AnimatedMapBlockView data={block.data} theme={theme} />;
    }

    case 'prediction_leaderboard': {
      return <PredictionLeaderboardBlockView data={block.data} theme={theme} />;
    }

    case 'what_if': {
      return <WhatIfBlockView data={block.data} />;
    }

    case 'live_comments': {
      return <LiveCommentsBlockView data={block.data} storyId={storyId} />;
    }

    case 'uncertainty': {
      return <UncertaintyBlockView data={block.data} theme={theme} />;
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
}

/**
 * A block, drawn with its presentation applied.
 *
 * The presentation lives on the block's envelope rather than in its data,
 * because it describes how the block sits in the story rather than what the
 * block says — the same chart can appear at two widths in two stories
 * without its payload changing.
 */
export const BlockItem: React.FC<{
  block: StoryBlock;
  theme: 'dark' | 'light';
  /** Parent story id — required by blocks that talk to the server. */
  storyId?: string;
}> = ({ block, theme, storyId }) => {
  const presentation = block.presentation;

  /*
   * A block that pins its own theme is drawn in that theme, whichever theme
   * the page is in. `inherit` — and a block with no presentation at all —
   * follows the page.
   */
  const effectiveTheme =
    presentation?.theme === 'light' || presentation?.theme === 'dark' ? presentation.theme : theme;

  /*
   * A block with no presentation is drawn exactly as it always was: no
   * wrapper, no classes, nothing that could move it on the page.
   */
  if (!presentation) {
    return <>{renderBlock(block, effectiveTheme, storyId)}</>;
  }

  return (
    <div className={presentationClass(presentation)}>
      {renderBlock(block, effectiveTheme, storyId)}
    </div>
  );
};
