'use client';

import React from 'react';
import type { MotionChartBlock } from '@ai-news/schemas';
import { D3ChartRenderer } from '@ai-news/media';

/**
 * A chart that draws itself in.
 *
 * The chart itself is the ordinary chart renderer — the same picture a
 * `chart` block draws — and the animation is applied to the marks once they
 * are in the page. Nothing is animated that the reader cannot already see;
 * the finished chart is what a reader with reduced motion is shown.
 *
 * The animations are written with the Web Animations API rather than a
 * library, so the block costs nothing to load for the readers who never see
 * one.
 */
export const MotionChartBlockView: React.FC<{
  data: MotionChartBlock['data'];
  theme?: 'dark' | 'light';
}> = ({ data, theme = 'light' }) => {
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const [reducedMotion, setReducedMotion] = React.useState(false);

  const svg = React.useMemo(
    () => D3ChartRenderer.renderToSvg(data.chart, { theme, width: 800, height: 440 }),
    [data.chart, theme]
  );

  // The reader's system preference is read once, and read again if it
  // changes while the page is open.
  React.useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(query.matches);
    const listener = (event: MediaQueryListEvent) => setReducedMotion(event.matches);
    query.addEventListener('change', listener);
    return () => query.removeEventListener('change', listener);
  }, []);

  const respectReducedMotion = data.respectReducedMotion ?? true;
  const shouldAnimate = !(respectReducedMotion && reducedMotion);

  const duration = data.durationMs ?? 900;
  const stagger = data.staggerMs ?? 60;
  const animation = data.animation ?? 'grow';
  const loop = data.loop ?? false;

  React.useEffect(() => {
    const container = containerRef.current;
    if (!container || !shouldAnimate) return;

    const marks = container.querySelectorAll<SVGElement>('rect, path, circle, line, text');
    if (marks.length === 0) return;

    let frame = 0;

    const play = () => {
      const animations: Animation[] = [];
      const svgElement = container.querySelector('svg');
      const counters: Array<{ element: SVGElement; to: number; decimals: number }> = [];

      if (animation === 'grow') {
        // Bars rise from the baseline. The origin is the bottom of each bar, so
        // the transform has to be relative to the shape's own box.
        marks.forEach((mark, index) => {
          if (mark.tagName.toLowerCase() !== 'rect') return;
          mark.style.transformBox = 'fill-box';
          mark.style.transformOrigin = 'bottom center';
          animations.push(
            mark.animate(
              [
                { transform: 'scaleY(0)', opacity: 0.4 },
                { transform: 'scaleY(1)', opacity: 1 },
              ],
              {
                duration,
                delay: index * stagger,
                easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
                fill: 'both',
              }
            )
          );
        });
      } else if (animation === 'draw') {
        // Lines draw themselves on.
        marks.forEach((mark, index) => {
          if (mark.tagName.toLowerCase() !== 'path') return;
          const length = (mark as SVGPathElement).getTotalLength?.() ?? 0;
          if (!length) return;
          mark.style.strokeDasharray = `${length}`;
          animations.push(
            mark.animate([{ strokeDashoffset: length }, { strokeDashoffset: 0 }], {
              duration,
              delay: index * stagger,
              easing: 'ease-out',
              fill: 'both',
            })
          );
        });
      } else if (animation === 'sweep') {
        // The whole picture turns once and settles.
        if (svgElement) {
          svgElement.style.transformBox = 'view-box';
          svgElement.style.transformOrigin = 'center';
          animations.push(
            svgElement.animate(
              [
                { transform: 'rotate(-14deg) scale(0.94)', opacity: 0.3 },
                { transform: 'rotate(0deg) scale(1)', opacity: 1 },
              ],
              { duration, easing: 'cubic-bezier(0.22, 1, 0.36, 1)', fill: 'both' }
            )
          );
        }
      } else if (animation === 'count') {
        // The numbers count up to where they are going to be.
        marks.forEach((mark) => {
          if (mark.tagName.toLowerCase() !== 'text') return;
          const raw = (mark.textContent ?? '').trim();
          const match = raw.replace(/,/g, '').match(/^-?\d+(\.\d+)?/);
          if (!match) return;
          counters.push({
            element: mark,
            to: Number(match[0]),
            decimals: match[1] ? match[1].length - 1 : 0,
          });
        });
      } else {
        // Fade: every mark arrives together.
        animations.push(
          ...Array.from(marks).map((mark, index) =>
            mark.animate([{ opacity: 0 }, { opacity: 1 }], {
              duration,
              delay: index * stagger,
              easing: 'ease-out',
              fill: 'both',
            })
          )
        );
      }

      if (counters.length > 0) {
        const start = performance.now();
        const step = (now: number) => {
          const progress = Math.min(1, (now - start) / duration);
          const eased = 1 - (1 - progress) ** 3;
          for (const counter of counters) {
            counter.element.textContent = (counter.to * eased).toFixed(counter.decimals);
          }
          if (progress < 1) {
            frame = requestAnimationFrame(step);
          } else {
            for (const counter of counters) {
              counter.element.textContent = counter.to.toFixed(counter.decimals);
            }
          }
        };
        frame = requestAnimationFrame(step);
      }

      return animations;
    };

    let running = play();

    // A looping chart starts again once the animation has finished. The wait
    // is the length of the animation plus the stagger of the last mark.
    const total = duration + stagger * marks.length;
    let timer = 0;
    const schedule = () => {
      timer = window.setTimeout(() => {
        running = play();
        if (loop) schedule();
      }, total + 400);
    };
    if (loop) schedule();

    return () => {
      if (timer) window.clearTimeout(timer);
      cancelAnimationFrame(frame);
      for (const animation of running) animation.cancel();
    };
  }, [svg, animation, duration, stagger, shouldAnimate, loop]);

  return (
    <section
      aria-label={data.title ?? data.chart.title ?? 'Animated chart'}
      className="my-8 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 shadow-sm overflow-hidden"
    >
      {(data.title || data.subtitle) && (
        <header className="px-5 py-4 border-b border-slate-200 dark:border-slate-800">
          {data.title && (
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">{data.title}</h3>
          )}
          {data.subtitle && (
            <p className="text-sm text-slate-600 dark:text-slate-400">{data.subtitle}</p>
          )}
        </header>
      )}

      <div className="p-3 sm:p-4">
        <div
          ref={containerRef}
          className="[&_svg]:w-full [&_svg]:h-auto"
          dangerouslySetInnerHTML={{ __html: svg }}
        />
      </div>

      {data.caption && (
        <p className="px-5 pb-3 text-sm text-slate-600 dark:text-slate-400">{data.caption}</p>
      )}

      <footer className="px-5 py-3 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 space-y-1">
        {shouldAnimate === false && (
          <p>The animation was skipped because the reader has asked for reduced motion.</p>
        )}
        {data.sourceAttribution && <p>Source: {data.sourceAttribution}</p>}
        {data.methodology && <p>Methodology: {data.methodology}</p>}
      </footer>
    </section>
  );
};
