'use client';

import React from 'react';
import type { ScrollyBlock } from '@ai-news/schemas';
import { D3ChartRenderer } from '@ai-news/media';

/**
 * A scroll-driven narrative.
 *
 * The picture stays put while the reader moves through the steps, and each
 * step draws its own picture. The step that is in view is the one that is
 * shown, so the reader is never looking at two things at once.
 *
 * On a screen too narrow to show the picture beside the text, the steps are
 * simply stacked and each one carries its own picture — the narrative still
 * reads, it just does not scroll away.
 */
export const ScrollyBlockView: React.FC<{
  data: ScrollyBlock['data'];
  theme?: 'dark' | 'light';
}> = ({ data, theme = 'light' }) => {
  const steps = data.steps;
  const [activeIndex, setActiveIndex] = React.useState(0);
  const stepRefs = React.useRef<Array<HTMLLIElement | null>>([]);

  // The step in the middle of the viewport is the one that is shown. The
  // observer is what tells us when that changes.
  React.useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible.length === 0) return;
        const index = Number((visible[0].target as HTMLElement).dataset.stepIndex ?? 0);
        setActiveIndex((current) => (Number.isFinite(index) ? index : current));
      },
      { threshold: [0.35, 0.6, 0.9], rootMargin: '-10% 0px -30% 0px' }
    );

    for (const element of stepRefs.current) {
      if (element) observer.observe(element);
    }
    return () => observer.disconnect();
  }, [steps.length]);

  const activeStep = steps[activeIndex] ?? steps[0];

  return (
    <section
      aria-label={data.title ?? 'Scrollytelling'}
      className="my-10 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 shadow-sm overflow-hidden"
    >
      {data.title && (
        <header className="px-5 py-4 border-b border-slate-200 dark:border-slate-800">
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">{data.title}</h3>
        </header>
      )}

      <div className="md:grid md:grid-cols-[1.1fr_1fr] md:gap-0">
        {/* The picture, which stays put while the steps go past it. */}
        <div className="md:sticky md:top-0 md:h-[560px] flex items-center justify-center p-4 bg-slate-50/60 dark:bg-slate-950/30 border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-800">
          <ScrollyVisualView visual={activeStep?.visual} theme={theme} />
        </div>

        {/* The steps. */}
        <ol className="divide-y divide-slate-200 dark:divide-slate-800">
          {steps.map((step, index) => (
            <li
              key={step.id}
              data-step-index={index}
              ref={(element) => {
                stepRefs.current[index] = element;
              }}
              className={`px-5 py-8 transition-opacity duration-300 ${
                index === activeIndex ? 'opacity-100' : 'opacity-60'
              }`}
            >
              {step.heading && (
                <h4 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-2">
                  {step.heading}
                </h4>
              )}
              {step.body && (
                <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                  {step.body}
                </p>
              )}
              {/* On a narrow screen the picture travels with its step. */}
              <div className="md:hidden mt-4">
                <ScrollyVisualView visual={step.visual} theme={theme} />
              </div>
            </li>
          ))}
        </ol>
      </div>

      {data.showProgress !== false && (
        <div className="px-5 py-3 border-t border-slate-200 dark:border-slate-800">
          <div className="h-1 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full transition-[width] duration-300"
              style={{
                width: `${((activeIndex + 1) / Math.max(1, steps.length)) * 100}%`,
              }}
            />
          </div>
          <p className="mt-1.5 text-[11px] text-slate-500 dark:text-slate-400">
            Step {activeIndex + 1} of {steps.length}
          </p>
        </div>
      )}

      {data.caption && (
        <p className="px-5 pb-3 text-sm text-slate-600 dark:text-slate-400">{data.caption}</p>
      )}

      <footer className="px-5 py-3 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 space-y-1">
        {data.sourceAttribution && <p>Source: {data.sourceAttribution}</p>}
        {data.methodology && <p>Methodology: {data.methodology}</p>}
      </footer>
    </section>
  );
};

/** Draws the picture one step shows. */
const ScrollyVisualView: React.FC<{
  visual: ScrollyBlock['data']['steps'][number]['visual'];
  theme: 'dark' | 'light';
}> = ({ visual, theme }) => {
  if (visual.kind === 'chart') {
    const svg = D3ChartRenderer.renderToSvg(visual.chart, {
      theme,
      width: 760,
      height: 440,
    });
    return (
      <div className="[&_svg]:w-full [&_svg]:h-auto" dangerouslySetInnerHTML={{ __html: svg }} />
    );
  }

  if (visual.kind === 'image') {
    return (
      <figure className="w-full">
        <img
          src={visual.url}
          alt={visual.alt}
          className="w-full rounded-lg object-contain"
          loading="lazy"
        />
        {visual.caption && (
          <figcaption className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            {visual.caption}
          </figcaption>
        )}
      </figure>
    );
  }

  if (visual.kind === 'stat') {
    return (
      <div className="text-center">
        <p className="text-5xl sm:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          {visual.value}
        </p>
        <p className="mt-2 text-sm font-semibold text-slate-600 dark:text-slate-300">
          {visual.label}
        </p>
        {visual.delta && (
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{visual.delta}</p>
        )}
      </div>
    );
  }

  return (
    <p className="text-base leading-relaxed text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
      {visual.text}
    </p>
  );
};
