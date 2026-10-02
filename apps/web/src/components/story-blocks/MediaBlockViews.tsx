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

export const FlowBlockView: React.FC<{ data: FlowBlock['data'] }> = ({ data }) => {
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

export const SlideDeckBlockView: React.FC<{ data: SlideDeckBlock['data'] }> = ({ data }) => {
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

export const ImageDiffBlockView: React.FC<{ data: ImageDiffBlock['data'] }> = ({ data }) => {
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

export const EmbedBlockView: React.FC<{ data: EmbedBlock['data'] }> = ({ data }) => {
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
