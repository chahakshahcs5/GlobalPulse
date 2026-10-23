'use client';

import React from 'react';
import type {
  GalleryBlock,
  FlowBlock,
  SlideDeckBlock,
  ImageDiffBlock,
  EmbedBlock,
} from '@ai-news/schemas';

export const GalleryBlockView: React.FC<{ data: GalleryBlock['data'] }> = ({ data }) => {
  // The layout is an editorial decision, so the gallery honours it: a grid
  // reads as a set of related images, a carousel reads as a sequence, and a
  // masonry keeps the original proportions.
  const layout = data.layout ?? 'grid';

  const layoutClasses: Record<string, string> = {
    grid: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4',
    carousel: 'flex gap-4 overflow-x-auto snap-x snap-mandatory pb-2',
    masonry: 'columns-1 sm:columns-2 lg:columns-3 gap-4',
  };

  return (
    <div className="my-8">
      {data.title && (
        <h4 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-4">{data.title}</h4>
      )}
      <div className={layoutClasses[layout] ?? layoutClasses.grid}>
        {data.images.map((img, idx) => {
          const inner = (
            <>
              <img
                src={img.url}
                alt={img.altText}
                className={
                  layout === 'masonry'
                    ? 'w-full rounded-xl object-cover border border-slate-200 dark:border-slate-800 group-hover:scale-105 transition-transform duration-300 mb-4 break-inside-avoid'
                    : 'w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300'
                }
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
            </>
          );

          return (
            <figure
              key={idx}
              className={`group relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 hover:border-indigo-500/50 transition-all shadow-sm ${
                layout === 'carousel' ? 'min-w-[280px] sm:min-w-[340px] snap-center shrink-0' : ''
              } ${layout === 'masonry' ? 'block mb-0' : ''}`}
            >
              {inner}
            </figure>
          );
        })}
      </div>
    </div>
  );
};

export const FlowBlockView: React.FC<{ data: FlowBlock['data'] }> = ({ data }) => {
  /*
   * How the process is drawn.
   *
   * As numbered steps, as a timeline, or as a card a step. The steps
   * are the same; only the treatment changes.
   */
  const layout = data.layout ?? 'steps';

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

  /*
   * The branches a step can go.
   *
   * Drawn the same way in every treatment, so a branch reads the same
   * whether the process is a track, a rail or a set of cards.
   */
  const branches = (step: FlowBlock['data']['steps'][number]) =>
    step.branches &&
    step.branches.length > 0 && (
      <ul className="mt-2 space-y-1">
        {step.branches.map((branch, branchIdx) => (
          <li
            key={`${branch.label}-${branchIdx}`}
            className="text-xs text-slate-600 dark:text-slate-400 flex items-start gap-1.5"
          >
            <span className="font-semibold text-amber-600 dark:text-amber-400">{branch.label}</span>
            {branch.description && <span>{branch.description}</span>}
            {branch.nextStep !== undefined && (
              <span className="font-mono text-slate-400">→ step {branch.nextStep}</span>
            )}
          </li>
        ))}
      </ul>
    );

  const sources = (step: FlowBlock['data']['steps'][number]) =>
    (step.sourceIds || step.citationIds) && (
      <p className="mt-2 font-mono text-[10px] text-slate-400 dark:text-slate-500">
        {[...(step.sourceIds ?? []), ...(step.citationIds ?? [])].join(', ')}
      </p>
    );

  const stepHeading = (step: FlowBlock['data']['steps'][number]) => (
    <div className="flex items-center gap-3 mb-1">
      <h5 className="font-bold text-base text-slate-900 dark:text-slate-100">{step.title}</h5>
      {statusBadge(step.status)}
    </div>
  );

  /*
   * The process as a rail.
   *
   * The same steps read left to right, which is how a process that
   * branches reads best: the reader sees the whole shape of it at once.
   */
  if (layout === 'timeline') {
    return (
      <div className="my-8 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40 p-6 shadow-sm">
        {data.title && (
          <h4 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-1">
            {data.title}
          </h4>
        )}
        {data.description && (
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">{data.description}</p>
        )}

        <div className="flex items-stretch gap-4 overflow-x-auto pb-3">
          {data.steps.map((step, idx) => (
            <div key={idx} className="w-64 shrink-0 flex flex-col">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-white dark:bg-slate-800 border-2 border-indigo-500 text-indigo-600 dark:text-indigo-400 font-bold text-xs flex items-center justify-center">
                  {step.stepNumber}
                </span>
                <span className="h-0.5 flex-1 bg-indigo-500/30 rounded-full" />
              </div>

              <div className="mt-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/40 p-4 flex-1">
                {stepHeading(step)}
                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                  {step.description}
                </p>
                {branches(step)}
                {sources(step)}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  /*
   * The process as a set of cards.
   *
   * One card a step, so a reader can take them one at a time rather than
   * following a track.
   */
  if (layout === 'cards') {
    return (
      <div className="my-8 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40 p-6 shadow-sm">
        {data.title && (
          <h4 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-1">
            {data.title}
          </h4>
        )}
        {data.description && (
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">{data.description}</p>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.steps.map((step, idx) => (
            <div
              key={idx}
              className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/40 p-4"
            >
              <span className="inline-flex w-7 h-7 items-center justify-center rounded-full bg-indigo-600 text-white font-bold text-xs mb-2">
                {step.stepNumber}
              </span>
              {stepHeading(step)}
              <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                {step.description}
              </p>
              {branches(step)}
              {sources(step)}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      className={[
        'rounded-xl',
        'my-8 border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40 p-6 shadow-sm',
      ].join(' ')}
    >
      {data.title && (
        <h4 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-1">{data.title}</h4>
      )}
      {data.description && (
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">{data.description}</p>
      )}
      <div className="relative pl-6 border-l-2 border-slate-300 dark:border-slate-700/60 space-y-6">
        {data.steps.map((s, idx) => (
          <div key={idx} className="relative">
            <div className="absolute -left-[31px] top-0.5 w-6 h-6 rounded-full bg-white dark:bg-slate-800 border-2 border-indigo-500 text-indigo-600 dark:text-indigo-400 font-bold text-xs flex items-center justify-center shadow-xs">
              {s.stepNumber}
            </div>
            {stepHeading(s)}
            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
              {s.description}
            </p>
            {branches(s)}
            {sources(s)}
          </div>
        ))}
      </div>
    </div>
  );
};

export const SlideDeckBlockView: React.FC<{ data: SlideDeckBlock['data'] }> = ({ data }) => {
  const [currentSlide, setCurrentSlide] = React.useState(0);
  const slide = data.slides[currentSlide] || data.slides[0];
  if (!slide) return null;

  /*
   * How the deck is drawn.
   *
   * One slide at a time with arrows, every slide stacked so the reader
   * scrolls through them, or every slide as a card in a grid. The slides
   * are the same; only the treatment changes.
   */
  const layout = data.layout ?? 'carousel';

  const slideBody = (content: (typeof data.slides)[number], showImage: boolean) => (
    <>
      {showImage && content.imageUrl && (
        <img
          src={content.imageUrl}
          alt={content.title}
          className="w-full h-56 sm:h-72 object-cover rounded-lg mb-4 border border-slate-200 dark:border-slate-800"
          loading="lazy"
        />
      )}
      <h5 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-2">{content.title}</h5>
      {content.body && (
        <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed mb-3">
          {content.body}
        </p>
      )}
      {content.bullets && content.bullets.length > 0 && (
        <ul className="space-y-1.5 mb-4">
          {content.bullets.map((b, idx) => (
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
      {content.sourceAttribution && (
        <div className="text-xs text-slate-500 italic mt-3 pt-3 border-t border-slate-200 dark:border-slate-800/60">
          Source: {content.sourceAttribution}
        </div>
      )}
    </>
  );

  if (layout === 'scroll') {
    return (
      <div className="my-8">
        <div className="mb-4">
          <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
            Interactive Slide Deck
          </span>
          <h4 className="text-xl font-bold text-slate-900 dark:text-slate-100">{data.title}</h4>
        </div>
        <div className="space-y-4">
          {data.slides.map((content) => (
            <section
              key={content.slideNumber}
              className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-6 shadow-sm"
            >
              <span className="font-mono text-xs text-slate-400 dark:text-slate-500">
                {content.slideNumber}
              </span>
              {slideBody(content, true)}
            </section>
          ))}
        </div>
      </div>
    );
  }

  if (layout === 'grid') {
    return (
      <div className="my-8">
        <div className="mb-4">
          <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
            Interactive Slide Deck
          </span>
          <h4 className="text-xl font-bold text-slate-900 dark:text-slate-100">{data.title}</h4>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {data.slides.map((content) => (
            <section
              key={content.slideNumber}
              className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-5 shadow-sm"
            >
              <span className="font-mono text-xs text-slate-400 dark:text-slate-500">
                {content.slideNumber}
              </span>
              {slideBody(content, true)}
            </section>
          ))}
        </div>
      </div>
    );
  }

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
      {slideBody(slide, true)}
    </div>
  );
};

export const ImageDiffBlockView: React.FC<{ data: ImageDiffBlock['data'] }> = ({ data }) => {
  const [sliderPos, setSliderPos] = React.useState(data.defaultSplitPercent ?? 50);

  /*
   * How the two pictures are drawn.
   *
   * One over the other with a draggable split, side by side, or stacked.
   * The pictures are the same; only the treatment changes.
   */
  const layout = data.layout ?? 'slider';

  if (layout === 'side-by-side' || layout === 'stacked') {
    const stacked = layout === 'stacked';
    return (
      <figure className="my-8">
        <div className={`grid gap-3 ${stacked ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2'}`}>
          <div>
            <img
              src={data.beforeUrl}
              alt={data.beforeLabel || 'Before'}
              className="w-full object-cover rounded-xl border border-slate-200 dark:border-slate-800"
              loading="lazy"
            />
            {data.beforeLabel && (
              <p className="mt-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400">
                {data.beforeLabel}
              </p>
            )}
          </div>
          <div>
            <img
              src={data.afterUrl}
              alt={data.afterLabel || 'After'}
              className="w-full object-cover rounded-xl border border-slate-200 dark:border-slate-800"
              loading="lazy"
            />
            {data.afterLabel && (
              <p className="mt-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400">
                {data.afterLabel}
              </p>
            )}
          </div>
        </div>
        {(data.caption || data.credit) && (
          <figcaption className="mt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs text-slate-500 dark:text-slate-400">
            {data.caption && <span>{data.caption}</span>}
            {data.credit && <span className="font-mono text-slate-500">Credit: {data.credit}</span>}
          </figcaption>
        )}
      </figure>
    );
  }

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

export const EmbedBlockView: React.FC<{ data: EmbedBlock['data'] }> = ({ data }) => {
  /*
   * How the embed is drawn.
   *
   * As a player, as a card that links out, or as a bare link. The embed
   * is the same; only the treatment changes.
   */
  const layout = data.layout ?? 'card';

  if (layout === 'link') {
    return (
      <p className="my-4 text-sm">
        <a
          href={data.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 font-semibold text-indigo-700 dark:text-indigo-400 hover:underline"
        >
          {data.title || 'Embedded content'}
          <span aria-hidden="true">↗</span>
        </a>
        <span className="ml-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
          {data.provider}
        </span>
      </p>
    );
  }

  if (layout === 'iframe') {
    return (
      <figure className="my-6">
        <div className="aspect-video w-full overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-950">
          <iframe
            src={data.url}
            title={data.title || `${data.provider} embed`}
            className="w-full h-full"
            sandbox="allow-scripts allow-same-origin allow-presentation"
            referrerPolicy="no-referrer"
            loading="lazy"
            allowFullScreen
          />
        </div>
        {data.title && (
          <figcaption className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            {data.title}
          </figcaption>
        )}
      </figure>
    );
  }

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
            sandbox="allow-scripts allow-same-origin allow-presentation"
            referrerPolicy="no-referrer"
            loading="lazy"
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
