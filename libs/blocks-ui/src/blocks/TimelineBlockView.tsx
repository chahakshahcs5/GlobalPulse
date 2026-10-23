'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import type { TimelineBlock } from '@ai-news/schemas';

export const TimelineBlockView: React.FC<{ data: TimelineBlock['data'] }> = ({ data }) => {
  /*
   * How the timeline is drawn.
   *
   * Down the page, across the page, or as a compact list. The events
   * are the same; only the treatment changes.
   */
  const layout = data.layout ?? 'vertical';

  const items = data.items || [];

  /*
   * Which way the timeline runs.
   *
   * The block's own treatment decides it: a horizontal timeline is a rail
   * the reader moves along, a vertical one is a chronology down the page.
   * Without a stated treatment the shape of the story decides — a short
   * story reads better as a rail, a long one as a chronology.
   */
  const [layoutMode, setLayoutMode] = useState<'flow' | 'chronology'>(
    layout === 'horizontal'
      ? 'flow'
      : layout === 'vertical'
        ? 'chronology'
        : items.length <= 4
          ? 'flow'
          : 'chronology'
  );

  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollLeft(scrollLeft > 6);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 6);
  }, []);

  useEffect(() => {
    if (layoutMode !== 'flow') return;
    checkScroll();
    const el = scrollRef.current;
    if (!el) return;

    window.addEventListener('resize', checkScroll);

    const onWheel = (e: WheelEvent) => {
      if (e.deltaY !== 0 && el.scrollWidth > el.clientWidth) {
        e.preventDefault();
        el.scrollLeft += e.deltaY;
        checkScroll();
      }
    };

    el.addEventListener('wheel', onWheel, { passive: false });

    return () => {
      window.removeEventListener('resize', checkScroll);
      el.removeEventListener('wheel', onWheel);
    };
  }, [checkScroll, layoutMode, items.length]);

  const scroll = (direction: 'left' | 'right') => {
    const el = scrollRef.current;
    if (!el) return;
    const amount = direction === 'left' ? -300 : 300;
    el.scrollBy({ left: amount, behavior: 'smooth' });
    setTimeout(checkScroll, 300);
  };

  /*
   * The timeline as a compact list.
   *
   * One line an event, for a story whose chronology is a footnote rather
   * than the shape of the piece. There is nothing to scroll and nothing
   * to choose, so the list simply runs down the page.
   */
  if (layout === 'compact') {
    return (
      <div className="my-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 shadow-sm overflow-hidden">
        {(data.title || data.description) && (
          <header className="px-5 py-3 bg-slate-50/80 dark:bg-slate-950/40 border-b border-slate-200/80 dark:border-slate-800/80">
            {data.title && (
              <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">{data.title}</h4>
            )}
            {data.description && (
              <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-400">
                {data.description}
              </p>
            )}
          </header>
        )}

        <ol className="divide-y divide-slate-100 dark:divide-slate-800">
          {items.map((item, idx) => (
            <li
              key={idx}
              className="flex items-baseline gap-3 px-5 py-2 text-xs text-slate-700 dark:text-slate-300"
            >
              <span className="w-4 shrink-0 font-mono font-bold text-slate-400 dark:text-slate-500">
                {idx + 1}
              </span>
              <span className="shrink-0 font-mono text-slate-500 dark:text-slate-400">
                {item.date}
              </span>
              <span className="min-w-0 font-semibold text-slate-800 dark:text-slate-200">
                {item.headline}
              </span>
              {item.sourceIds && item.sourceIds.length > 0 && (
                <span className="ml-auto shrink-0 font-mono text-[10px] text-slate-400">
                  {item.sourceIds.join(', ')}
                </span>
              )}
            </li>
          ))}
        </ol>

        {(data.sourceAttribution || data.methodology) && (
          <div className="px-5 py-2.5 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 space-y-0.5">
            {data.sourceAttribution && <p>Source: {data.sourceAttribution}</p>}
            {data.methodology && <p>Methodology: {data.methodology}</p>}
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className={[
        'my-8 rounded-2xl',
        'border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 shadow-sm overflow-hidden transition-all hover:shadow-md',
      ].join(' ')}
    >
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
            {data.description && (
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 max-w-2xl">
                {data.description}
              </p>
            )}
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
          /* Horizontal Stepper Flow Track */
          <div className="relative group/timeline">
            {/* Left Scroll Chevron */}
            {canScrollLeft && (
              <div className="absolute left-0 top-0 bottom-0 z-10 flex items-center pr-8 pl-1 bg-gradient-to-r from-white via-white/90 to-transparent dark:from-slate-900 dark:via-slate-900/90 pointer-events-none transition-opacity">
                <button
                  type="button"
                  onClick={() => scroll('left')}
                  aria-label="Scroll steps left"
                  className="pointer-events-auto p-1.5 rounded-full bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 shadow-md border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 active:scale-95 transition cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Right Scroll Chevron */}
            {canScrollRight && (
              <div className="absolute right-0 top-0 bottom-0 z-10 flex items-center pl-8 pr-1 bg-gradient-to-l from-white via-white/90 to-transparent dark:from-slate-900 dark:via-slate-900/90 pointer-events-none transition-opacity">
                <button
                  type="button"
                  onClick={() => scroll('right')}
                  aria-label="Scroll steps right"
                  className="pointer-events-auto p-1.5 rounded-full bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 shadow-md border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 active:scale-95 transition cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Stepper Track */}
            <div
              ref={scrollRef}
              onScroll={checkScroll}
              className="flex items-stretch gap-4 overflow-x-auto pb-3 pt-1 scrollbar-none scroll-smooth touch-pan-x"
            >
              {items.map((item, idx) => {
                const isLast = idx === items.length - 1;
                return (
                  <div
                    key={idx}
                    className="w-[280px] sm:w-[320px] shrink-0 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/40 p-4.5 flex flex-col justify-between transition-all hover:border-blue-500/40 hover:shadow-sm group"
                  >
                    <div>
                      {/* Step Header with Milestone Connector Bar */}
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs">
                          {idx + 1}
                        </div>
                        <div className="h-0.5 flex-1 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${!isLast ? 'bg-blue-500/70' : 'bg-transparent'}`}
                          />
                        </div>
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold font-mono bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60 whitespace-nowrap shrink-0">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400 shrink-0" />
                          {item.date}
                        </span>
                      </div>

                      {/* Headline */}
                      <h5 className="font-bold text-sm text-slate-900 dark:text-slate-100 leading-snug group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {item.headline}
                      </h5>

                      {/* Body Description */}
                      <p className="mt-2 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                        {item.body}
                      </p>

                      {/*
                        Where it happened, what kind of event it was, and
                        what it rests on. A timeline is only as
                        trustworthy as the sources named on it.
                      */}
                      {(item.location ||
                        item.eventType ||
                        (item.entityIds?.length ?? 0) > 0 ||
                        (item.sourceIds?.length ?? 0) > 0 ||
                        (item.citationIds?.length ?? 0) > 0) && (
                        <p className="mt-1.5 font-mono text-[10px] text-slate-400 dark:text-slate-500">
                          {[
                            item.location,
                            item.eventType,
                            (item.entityIds ?? []).join(', '),
                            [...(item.sourceIds ?? []), ...(item.citationIds ?? [])].join(', '),
                          ]
                            .filter(Boolean)
                            .join(' · ')}
                        </p>
                      )}
                    </div>

                    {(item.location ||
                      item.eventType ||
                      (item.entityIds?.length ?? 0) > 0 ||
                      (item.sourceIds?.length ?? 0) > 0 ||
                      (item.citationIds?.length ?? 0) > 0) && (
                      <p className="mt-1.5 font-mono text-[10px] text-slate-400 dark:text-slate-500">
                        {[
                          item.location,
                          item.eventType,
                          (item.entityIds ?? []).join(', '),
                          [...(item.sourceIds ?? []), ...(item.citationIds ?? [])].join(', '),
                        ]
                          .filter(Boolean)
                          .join(' · ')}
                      </p>
                    )}

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
                );
              })}
            </div>
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
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold font-mono bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-500/20 whitespace-nowrap">
                      <Clock className="w-3 h-3 shrink-0" />
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

      {(data.sourceAttribution || data.methodology) && (
        <div className="px-5 py-2.5 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 space-y-0.5">
          {data.sourceAttribution && <p>Source: {data.sourceAttribution}</p>}
          {data.methodology && <p>Methodology: {data.methodology}</p>}
        </div>
      )}
    </div>
  );
};
