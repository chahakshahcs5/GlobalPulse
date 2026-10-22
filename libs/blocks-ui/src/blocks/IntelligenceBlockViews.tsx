'use client';

import React, { useMemo, useState } from 'react';
import type {
  EvidenceBlock,
  PerspectiveBlock,
  InterviewBlock,
  LiveDataBlock,
  FactCheckBlock,
} from '@ai-news/schemas';
import { useLiveFeed } from './useLiveFeed';

/**
 * Renderers for the intelligence blocks: claims & evidence, multi-perspective
 * coverage, interviews, live data, and fact-check verdicts.
 *
 * Design rules enforced here:
 * - A confidence value is never shown without its methodology.
 * - Evidence always shows its stance (supports / contradicts / context).
 * - Perspectives are attributed and source-linked; no forced "both sides".
 */

const CLAIM_STATUS_STYLES: Record<string, string> = {
  UNVERIFIED:
    'bg-slate-100 dark:bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-500/20',
  SUPPORTED:
    'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-800 dark:text-emerald-400 border-emerald-300 dark:border-emerald-500/20',
  PARTIALLY_SUPPORTED:
    'bg-amber-100 dark:bg-amber-500/10 text-amber-800 dark:text-amber-400 border-amber-300 dark:border-amber-500/20',
  CONTRADICTED:
    'bg-rose-100 dark:bg-rose-500/10 text-rose-800 dark:text-rose-400 border-rose-300 dark:border-rose-500/20',
  UNSUPPORTED:
    'bg-rose-100 dark:bg-rose-500/10 text-rose-800 dark:text-rose-400 border-rose-300 dark:border-rose-500/20',
  DISPUTED:
    'bg-violet-100 dark:bg-violet-500/10 text-violet-800 dark:text-violet-400 border-violet-300 dark:border-violet-500/20',
};

const STANCE_STYLES: Record<string, string> = {
  SUPPORTS:
    'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20',
  CONTRADICTS:
    'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-500/20',
  CONTEXT:
    'bg-slate-50 dark:bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-500/20',
};

const ClaimStatusBadge: React.FC<{ status: string }> = ({ status }) => (
  <span
    className={`px-2 py-0.5 rounded text-[11px] font-bold border ${CLAIM_STATUS_STYLES[status] ?? CLAIM_STATUS_STYLES.UNVERIFIED}`}
  >
    {status.replace(/_/g, ' ')}
  </span>
);

const StanceBadge: React.FC<{ stance: string }> = ({ stance }) => (
  <span
    className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${STANCE_STYLES[stance] ?? STANCE_STYLES.CONTEXT}`}
  >
    {stance}
  </span>
);

/**
 * Confidence is only meaningful with its methodology, so the two are always
 * rendered together.
 */
const ConfidenceLabel: React.FC<{
  confidence?: number;
  methodology?: string;
}> = ({ confidence, methodology }) => {
  if (confidence === undefined || confidence === null) return null;
  return (
    <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
      <span className="font-mono font-bold">Confidence {Math.round(confidence * 100)}%</span>
      {methodology && <span className="ml-1">— {methodology}</span>}
    </div>
  );
};

export const EvidenceBlockView: React.FC<{ data: EvidenceBlock['data'] }> = ({ data }) => {
  /*
   * How the evidence is drawn.
   *
   * The claims above the documents, the documents on their own, or the
   * two side by side. The record is the same; only the treatment changes.
   */
  const layout = data.layout ?? 'claims';

  const claimsList = (
    <ul className="space-y-3">
      {data.claims.map((claim, idx) => (
        <li key={claim.claimId ?? idx} className="text-sm">
          <div className="flex items-start gap-2">
            <ClaimStatusBadge status={claim.status} />
            <p className="text-slate-800 dark:text-slate-200 flex-1">{claim.text}</p>
          </div>
          <ConfidenceLabel
            confidence={claim.confidence}
            methodology={claim.confidenceMethodology}
          />
        </li>
      ))}
    </ul>
  );

  const documentsList = (
    <ul className="space-y-3">
      {data.evidence.map((item, idx) => (
        <li
          key={item.id ?? idx}
          className="rounded-lg border border-slate-200 dark:border-slate-800 p-3 bg-slate-50/50 dark:bg-slate-900/40"
        >
          <div className="flex items-center gap-2 flex-wrap">
            <StanceBadge stance={item.stance} />
            {item.type && (
              <span className="text-[10px] font-mono uppercase text-slate-500 dark:text-slate-400">
                {item.type}
              </span>
            )}
            {item.url ? (
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-semibold text-indigo-700 dark:text-indigo-400 hover:underline"
              >
                {item.title}
              </a>
            ) : (
              <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                {item.title}
              </span>
            )}
          </div>
          {item.excerpt && (
            <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-400 italic">
              “{item.excerpt}”
            </p>
          )}
        </li>
      ))}
    </ul>
  );

  return (
    <section
      aria-label={data.title || 'Evidence'}
      className="my-8 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 shadow-sm overflow-hidden"
    >
      <header className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60">
        <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
          {data.title || 'Evidence'}
        </h3>
        {data.summary && (
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{data.summary}</p>
        )}
      </header>

      {layout === 'split' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-200 dark:divide-slate-800">
          {data.claims.length > 0 && (
            <div className="px-5 py-4">
              <h4 className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-3">
                Claims
              </h4>
              {claimsList}
            </div>
          )}
          {data.evidence.length > 0 && (
            <div className="px-5 py-4">
              <h4 className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-3">
                Supporting material
              </h4>
              {documentsList}
            </div>
          )}
        </div>
      ) : (
        <>
          {layout !== 'documents' && data.claims.length > 0 && (
            <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800">
              <h4 className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-3">
                Claims
              </h4>
              {claimsList}
            </div>
          )}

          {layout !== 'documents' && data.evidence.length > 0 && (
            <div className="px-5 py-4">
              <h4 className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-3">
                Supporting material
              </h4>
              {documentsList}
            </div>
          )}
        </>
      )}

      {(data.methodology || data.sourceAttribution) && (
        <footer className="px-5 py-3 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 space-y-1">
          {data.methodology && <p>Methodology: {data.methodology}</p>}
          {data.sourceAttribution && <p>Source: {data.sourceAttribution}</p>}
        </footer>
      )}
    </section>
  );
};

export const PerspectiveBlockView: React.FC<{ data: PerspectiveBlock['data'] }> = ({ data }) => {
  /*
   * How the positions are drawn.
   *
   * A card each, two plain columns, or a list. The positions are the
   * same; only the treatment changes.
   */
  const layout = data.layout ?? 'cards';

  const stanceClass = (stance: string) =>
    stance === 'SUPPORTS'
      ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20'
      : stance === 'OPPOSES'
        ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20'
        : stance === 'MIXED'
          ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20'
          : 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700';

  if (layout === 'list') {
    return (
      <section aria-label={data.title || 'Perspectives'} className="my-8">
        {data.title && (
          <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-4">
            {data.title}
          </h3>
        )}
        <ul className="divide-y divide-slate-200 dark:divide-slate-800 border-y border-slate-200 dark:border-slate-800">
          {data.perspectives.map((perspective, idx) => (
            <li key={idx} className="py-3">
              <div className="flex items-center justify-between gap-3">
                <h4 className="font-bold text-slate-900 dark:text-slate-100">
                  {perspective.label}
                </h4>
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${stanceClass(
                    perspective.stance
                  )}`}
                >
                  {perspective.stance}
                </span>
              </div>
              <p className="mt-1.5 text-sm text-slate-700 dark:text-slate-300">
                {perspective.summary}
              </p>
              {perspective.quoteExcerpt && (
                <blockquote className="mt-2 border-l-2 border-indigo-400 pl-3 text-sm italic text-slate-600 dark:text-slate-400">
                  “{perspective.quoteExcerpt}”
                </blockquote>
              )}
            </li>
          ))}
        </ul>
        {data.methodology && (
          <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
            Methodology: {data.methodology}
          </p>
        )}
      </section>
    );
  }

  if (layout === 'columns') {
    return (
      <section aria-label={data.title || 'Perspectives'} className="my-8">
        {data.title && (
          <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-4">
            {data.title}
          </h3>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
          {data.perspectives.map((perspective, idx) => (
            <article key={idx} className="border-t-2 border-slate-900 dark:border-slate-100 pt-3">
              <div className="flex items-center justify-between gap-2">
                <h4 className="font-bold text-slate-900 dark:text-slate-100">
                  {perspective.label}
                </h4>
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${stanceClass(
                    perspective.stance
                  )}`}
                >
                  {perspective.stance}
                </span>
              </div>
              <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">
                {perspective.summary}
              </p>
              {perspective.quoteExcerpt && (
                <blockquote className="mt-3 border-l-2 border-indigo-400 pl-3 text-sm italic text-slate-600 dark:text-slate-400">
                  “{perspective.quoteExcerpt}”
                </blockquote>
              )}
              {perspective.sourceIds.length > 0 && (
                <p className="mt-3 text-[11px] font-mono text-slate-500 dark:text-slate-400">
                  Sources: {perspective.sourceIds.join(', ')}
                </p>
              )}
            </article>
          ))}
        </div>
        {data.methodology && (
          <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
            Methodology: {data.methodology}
          </p>
        )}
      </section>
    );
  }

  return (
    <section aria-label={data.title || 'Perspectives'} className="my-8">
      {data.title && (
        <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-4">{data.title}</h3>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {data.perspectives.map((perspective, idx) => (
          <article
            key={idx}
            className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 p-4 shadow-sm"
          >
            <div className="flex items-center justify-between gap-2">
              <h4 className="font-bold text-slate-900 dark:text-slate-100">{perspective.label}</h4>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300">
                {perspective.stance}
              </span>
            </div>
            <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">{perspective.summary}</p>
            {perspective.quoteExcerpt && (
              <blockquote className="mt-3 border-l-2 border-indigo-400 pl-3 text-sm italic text-slate-600 dark:text-slate-400">
                “{perspective.quoteExcerpt}”
              </blockquote>
            )}
            {perspective.sourceIds.length > 0 && (
              <p className="mt-3 text-[11px] font-mono text-slate-500 dark:text-slate-400">
                Sources: {perspective.sourceIds.join(', ')}
              </p>
            )}
          </article>
        ))}
      </div>
      {data.methodology && (
        <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
          Methodology: {data.methodology}
        </p>
      )}
    </section>
  );
};

export const InterviewBlockView: React.FC<{ data: InterviewBlock['data'] }> = ({ data }) => {
  /*
   * How the interview is drawn.
   *
   * As a question-and-answer, as an article the questions head, or as a
   * timeline of what was said and when. The interview is the same; only
   * the treatment changes.
   */
  const layout = data.layout ?? 'qa';

  return (
    <section
      aria-label={data.title}
      className="my-8 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 shadow-sm overflow-hidden"
    >
      <header className="px-5 py-4 border-b border-slate-200 dark:border-slate-800">
        <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">{data.title}</h3>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          {data.interviewee.name}
          {data.interviewee.role ? ` — ${data.interviewee.role}` : ''}
        </p>
        {data.mediaUrl && (
          <a
            href={data.mediaUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-block text-xs font-mono text-indigo-700 dark:text-indigo-400 hover:underline"
          >
            {data.format === 'video' ? 'Watch the interview' : 'Listen to the interview'}
          </a>
        )}
      </header>

      {layout === 'article' && (
        <div className="px-5 py-5 space-y-6">
          {data.segments.map((segment, idx) => (
            <div key={idx}>
              <h4 className="font-bold text-slate-900 dark:text-slate-100">{segment.question}</h4>
              <p className="mt-2 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                {segment.answer}
              </p>
              {segment.speaker && (
                <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                  {segment.speaker}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {layout === 'timeline' && (
        <ol className="px-5 py-4">
          {data.segments.map((segment, idx) => (
            <li key={idx} className="relative pl-8 pb-5 last:pb-0">
              <span className="absolute left-[7px] top-1.5 h-2.5 w-2.5 rounded-full bg-indigo-500" />
              <span className="absolute left-[11px] top-4 bottom-0 w-px bg-slate-200 dark:bg-slate-800" />
              {segment.timestampSeconds !== undefined && (
                <span className="font-mono text-[11px] text-indigo-600 dark:text-indigo-400">
                  {formatTimestamp(segment.timestampSeconds)}
                </span>
              )}
              <p className="mt-0.5 font-semibold text-slate-900 dark:text-slate-100">
                {segment.question}
              </p>
              <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">{segment.answer}</p>
            </li>
          ))}
        </ol>
      )}

      {layout === 'qa' && (
        <div className="divide-y divide-slate-200 dark:divide-slate-800">
          {data.segments.map((segment, idx) => (
            <div key={idx} className="px-5 py-4">
              <div className="flex items-baseline gap-2">
                <span className="text-xs font-bold uppercase tracking-wide text-indigo-600 dark:text-indigo-400">
                  Q
                </span>
                <p className="font-semibold text-slate-900 dark:text-slate-100 flex-1">
                  {segment.question}
                </p>
                {segment.timestampSeconds !== undefined && (
                  <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                    {formatTimestamp(segment.timestampSeconds)}
                  </span>
                )}
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  A
                </span>
                <p className="text-sm text-slate-700 dark:text-slate-300 flex-1">
                  {segment.answer}
                </p>
                {segment.speaker && (
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    {segment.speaker}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {data.sourceAttribution && (
        <footer className="px-5 py-3 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
          Source: {data.sourceAttribution}
        </footer>
      )}
      {data.transcript && (
        <details className="border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40">
          <summary className="px-5 py-3 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400">
            Full transcript
          </summary>
          <p className="px-5 pb-4 pt-1 text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line border-t border-slate-200/50 dark:border-slate-800/40">
            {data.transcript}
          </p>
        </details>
      )}
    </section>
  );
};

export const LiveDataBlockView: React.FC<{ data: LiveDataBlock['data'] }> = ({ data }) => {
  /*
   * How the values are drawn.
   *
   * As cards, as a table, or inline in the text. The values are the
   * same; only the treatment changes.
   */
  const layout = data.layout ?? 'cards';

  const live = useLiveFeed(data.liveKey, data.refreshIntervalSeconds ?? 60);

  // Prefer the live feed when the block is bound to one; otherwise show the
  // snapshot that was stored in the story payload.
  const items = live.items
    ? live.items.map((item) => ({
        id: item.id,
        label: item.label,
        provider: item.provider ?? 'Live',
        value: item.value,
        previousValue: item.previousValue,
        change: item.change,
        unit: item.unit,
        asOf: item.asOf ?? live.asOf ?? new Date().toISOString(),
      }))
    : data.items;

  const sourceAttribution = live.sourceAttribution ?? data.sourceAttribution;
  const lastUpdated = live.asOf;

  return (
    <section
      aria-label={data.title || 'Live data'}
      className={[
        layout === 'inline' ? 'my-3' : 'my-6',
        layout === 'inline' ? 'rounded-lg' : 'rounded-xl',
        'border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50',
        layout === 'inline' ? 'px-3 py-2' : 'p-4',
      ].join(' ')}
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        {data.title && (
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">{data.title}</h3>
        )}
        {live.isLive && (
          <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            Live
          </span>
        )}
      </div>
      <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {items.map((item) => {
          const direction =
            item.change === undefined || item.change === 0
              ? 'flat'
              : item.change > 0
                ? 'up'
                : 'down';
          return (
            <li
              key={item.id}
              className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 px-3 py-2"
            >
              <div className="text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400">
                {item.label}
              </div>
              <div className="text-lg font-bold text-slate-900 dark:text-slate-100">
                {item.value}
              </div>
              {item.change !== undefined && (
                <div
                  className={`text-[11px] font-mono font-bold ${
                    direction === 'up'
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : direction === 'down'
                        ? 'text-rose-600 dark:text-rose-400'
                        : 'text-slate-500'
                  }`}
                >
                  {direction === 'up' ? '↑' : direction === 'down' ? '↓' : '→'}{' '}
                  {Math.abs(item.change).toFixed(2)}%
                  {item.asOf && (
                    <span className="ml-1 font-normal text-slate-400">
                      {item.asOf.slice(0, 16).replace('T', ' ')} UTC
                    </span>
                  )}
                </div>
              )}
              {item.unit && (
                <div className="text-[10px] text-slate-500 dark:text-slate-400">{item.unit}</div>
              )}
            </li>
          );
        })}
      </ul>
      {sourceAttribution && (
        <p className="mt-3 text-[11px] text-slate-500 dark:text-slate-400">
          Source: {sourceAttribution} ·{' '}
          {live.isLive
            ? `refreshes every ${data.refreshIntervalSeconds ?? 60}s`
            : `snapshot as of ${lastUpdated ? lastUpdated.slice(0, 16).replace('T', ' ') : 'publish'}`}
        </p>
      )}
    </section>
  );
};

export const FactCheckBlockView: React.FC<{ data: FactCheckBlock['data'] }> = ({ data }) => {
  /*
   * How the verdict is drawn.
   *
   * The full finding, the verdict alone, or a single line for a mention
   * in the middle of a story. The finding is the same; only the
   * treatment changes.
   */
  const layout = data.layout ?? 'full';

  if (layout === 'inline') {
    return (
      <p className="my-3 flex flex-wrap items-baseline gap-2 text-xs">
        <ClaimStatusBadge status={data.status} />
        <span className="font-semibold text-slate-800 dark:text-slate-200">“{data.claim}”</span>
        <span className="text-slate-600 dark:text-slate-400">{data.summary}</span>
      </p>
    );
  }

  if (layout === 'verdict') {
    return (
      <section
        aria-label="Fact check"
        className="my-6 rounded-xl border border-indigo-200 dark:border-indigo-500/30 bg-indigo-50/50 dark:bg-indigo-500/5 p-4"
      >
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[11px] font-bold uppercase tracking-wide text-indigo-700 dark:text-indigo-400">
            Fact check
          </span>
          <ClaimStatusBadge status={data.status} />
        </div>
        <p className="text-base font-semibold text-slate-900 dark:text-slate-100">“{data.claim}”</p>
        <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">{data.summary}</p>
      </section>
    );
  }

  return (
    <section
      aria-label="Fact check"
      className="my-8 rounded-2xl border border-indigo-200 dark:border-indigo-500/30 bg-indigo-50/50 dark:bg-indigo-500/5 p-5"
    >
      <div className="flex items-center gap-2 mb-2">
        <span className="text-[11px] font-bold uppercase tracking-wide text-indigo-700 dark:text-indigo-400">
          Fact check
        </span>
        <ClaimStatusBadge status={data.status} />
      </div>
      <p className="text-base font-semibold text-slate-900 dark:text-slate-100">“{data.claim}”</p>
      {data.claimant && (
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Claimed by {data.claimant}
        </p>
      )}
      <p className="mt-3 text-sm text-slate-700 dark:text-slate-300">{data.summary}</p>
      {data.evidenceSummary && (
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{data.evidenceSummary}</p>
      )}
      <ConfidenceLabel confidence={data.confidence} methodology={data.confidenceMethodology} />
      {data.sources.length > 0 && (
        <p className="mt-3 text-[11px] font-mono text-slate-500 dark:text-slate-400">
          Sources: {data.sources.join(', ')}
        </p>
      )}
      {(data.reviewer || data.reviewedAt) && (
        <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
          Reviewed by {data.reviewer ?? 'the verification desk'}
          {data.reviewedAt ? ` on ${data.reviewedAt}` : ''}
        </p>
      )}
      {data.methodology && (
        <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
          Methodology: {data.methodology}
        </p>
      )}
    </section>
  );
};

/** `mm:ss` timestamp helper shared by the media/transcript renderers. */
export function formatTimestamp(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * Small helper used by the data renderers to keep table state local.
 */
export function useSortedRows<T extends Record<string, unknown>>(
  rows: T[],
  initialKey: string | null = null
) {
  const [sortKey, setSortKey] = useState<string | null>(initialKey);
  const [ascending, setAscending] = useState(true);

  const sorted = useMemo(() => {
    if (!sortKey) return rows;
    const copy = [...rows];
    copy.sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      if (typeof av === 'number' && typeof bv === 'number') {
        return ascending ? av - bv : bv - av;
      }
      return ascending
        ? String(av ?? '').localeCompare(String(bv ?? ''))
        : String(bv ?? '').localeCompare(String(av ?? ''));
    });
    return copy;
  }, [rows, sortKey, ascending]);

  const toggle = (key: string) => {
    if (key === sortKey) {
      setAscending((prev) => !prev);
      return;
    }
    setSortKey(key);
    setAscending(true);
  };

  return { sorted, sortKey, ascending, toggle };
}
