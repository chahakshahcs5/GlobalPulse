'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  BadgeCheck,
  FileText,
  Layers,
  LineChart,
  ShieldQuestion,
  Users,
  Clock,
  AlertTriangle,
} from 'lucide-react';
import type { Story, StoryIntelligence, Entity } from '@ai-news/schemas';
import * as api from '../../lib/api-client';
import { BlockItem } from '../story-blocks/BlockItem';

/**
 * Unified story dashboard.
 *
 * Surfaces the structured intelligence for an evolving story in one place:
 * overview + metrics, timeline, evidence, data, sources, perspectives, and
 * entities. The same payload is available through the REST API, GraphQL, and
 * MCP, so an external agent and a human editor see identical facts.
 */

type TabId =
  'overview' | 'timeline' | 'evidence' | 'data' | 'sources' | 'perspectives' | 'entities';

const TABS: Array<{ id: TabId; label: string; icon: React.ElementType }> = [
  { id: 'overview', label: 'Overview', icon: Layers },
  { id: 'timeline', label: 'Timeline', icon: Clock },
  { id: 'evidence', label: 'Evidence', icon: ShieldQuestion },
  { id: 'data', label: 'Data', icon: LineChart },
  { id: 'sources', label: 'Sources', icon: FileText },
  { id: 'perspectives', label: 'Perspectives', icon: Users },
  { id: 'entities', label: 'Entities', icon: BadgeCheck },
];

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

const DATA_BLOCK_TYPES = new Set([
  'chart',
  'map',
  'table',
  'statistic',
  'data_explorer',
  'ranking',
  'financial',
  'election',
  'disaster',
  'science',
  'calculator',
  'dataset',
]);

export interface StoryIntelligenceDashboardProps {
  story: Story;
}

export const StoryIntelligenceDashboard: React.FC<StoryIntelligenceDashboardProps> = ({
  story,
}) => {
  const [tab, setTab] = useState<TabId>('overview');
  const [intelligence, setIntelligence] = useState<StoryIntelligence | null>(null);
  const [entities, setEntities] = useState<Entity[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setLoading(true);
        const payload = await api.getStoryIntelligence(story.id);
        if (cancelled) return;
        setIntelligence(payload);

        const entityIds = payload.whatChanged?.affectedEntityIds ?? story.entityIds ?? [];
        if (entityIds.length > 0) {
          const results = await Promise.all(
            entityIds.slice(0, 12).map((id) => api.getEntity(id).catch(() => null))
          );
          if (!cancelled) {
            setEntities(results.filter((entity): entity is Entity => Boolean(entity)));
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Unable to load story intelligence.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [story.id, story.entityIds]);

  const dataBlocks = useMemo(
    () => (story.blocks ?? []).filter((block) => DATA_BLOCK_TYPES.has(block.blockType)),
    [story.blocks]
  );

  if (loading) {
    return (
      <div className="py-16 text-center text-sm text-slate-500 dark:text-slate-400">
        Loading story intelligence…
      </div>
    );
  }

  if (error || !intelligence) {
    return (
      <div className="py-16 text-center space-y-3">
        <AlertTriangle className="w-8 h-8 mx-auto text-amber-500" />
        <p className="text-sm text-slate-600 dark:text-slate-400">
          {error ?? 'No intelligence payload is available for this story yet.'}
        </p>
        <Link
          href={`/stories/${story.slug}`}
          className="inline-flex items-center gap-1.5 text-sm font-bold text-indigo-700 dark:text-indigo-400"
        >
          <ArrowLeft className="w-4 h-4" /> Back to the story
        </Link>
      </div>
    );
  }

  const metrics = intelligence.metrics;

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 p-5 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
              Story intelligence
            </p>
            <h1 className="mt-1 text-2xl font-extrabold text-slate-900 dark:text-white leading-tight">
              {intelligence.title}
            </h1>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              {intelligence.summary}
            </p>
          </div>
          <span className="shrink-0 rounded-full border border-slate-300 dark:border-slate-600 px-3 py-1 text-[11px] font-bold uppercase text-slate-600 dark:text-slate-300">
            {intelligence.status}
          </span>
        </div>

        {/* Metrics */}
        <dl className="mt-5 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {[
            { label: 'Sources', value: metrics.sourceCount },
            { label: 'Claims', value: metrics.claimCount },
            { label: 'Supported', value: metrics.supportedClaimCount },
            { label: 'Contested', value: metrics.contestedClaimCount },
            { label: 'Evidence', value: metrics.evidenceCount },
            { label: 'Timeline', value: metrics.timelineEventCount },
            { label: 'Perspectives', value: metrics.perspectiveCount },
            { label: 'Updates', value: metrics.updateCount },
          ].map((metric) => (
            <div
              key={metric.label}
              className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 px-3 py-2"
            >
              <dt className="text-[10px] uppercase tracking-wide text-slate-500 dark:text-slate-400">
                {metric.label}
              </dt>
              <dd className="text-xl font-extrabold text-slate-900 dark:text-white">
                {metric.value}
              </dd>
            </div>
          ))}
        </dl>
      </header>

      {/* Tabs */}
      <nav className="flex flex-wrap gap-1 border-b border-slate-200 dark:border-slate-800">
        {TABS.map((entry) => {
          const Icon = entry.icon;
          const isActive = tab === entry.id;
          return (
            <button
              key={entry.id}
              type="button"
              onClick={() => setTab(entry.id)}
              aria-current={isActive ? 'page' : undefined}
              className={`flex items-center gap-1.5 px-3 py-2 text-sm font-semibold border-b-2 -mb-px transition-colors ${
                isActive
                  ? 'border-indigo-500 text-indigo-700 dark:text-indigo-400'
                  : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              {entry.label}
            </button>
          );
        })}
      </nav>

      {/* Panels */}
      <section className="min-h-[18rem]">
        {tab === 'overview' && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 p-5">
              <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                What changed
              </h2>
              <p className="mt-1 text-xs font-mono text-slate-500 dark:text-slate-400">
                Version {intelligence.whatChanged.previousVersionNumber} →{' '}
                {intelligence.whatChanged.currentVersionNumber} ·{' '}
                {intelligence.whatChanged.updatedAt}
              </p>
              <ul className="mt-3 space-y-2">
                {intelligence.whatChanged.items.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm">
                    <span className="mt-0.5 rounded border border-slate-300 dark:border-slate-600 px-1.5 py-0.5 text-[10px] font-bold uppercase text-slate-600 dark:text-slate-300">
                      {item.changeType}
                    </span>
                    <span className="text-slate-700 dark:text-slate-300">{item.description}</span>
                  </li>
                ))}
              </ul>
              {intelligence.whatChanged.latestDevelopment && (
                <div className="mt-4 rounded-xl border border-indigo-200 dark:border-indigo-500/30 bg-indigo-50/50 dark:bg-indigo-500/5 p-3">
                  <div className="text-[10px] font-bold uppercase tracking-wide text-indigo-700 dark:text-indigo-400">
                    Latest development
                  </div>
                  <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {intelligence.whatChanged.latestDevelopment.title}
                  </div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">
                    {intelligence.whatChanged.latestDevelopment.description}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {tab === 'timeline' && (
          <ol className="space-y-3">
            {intelligence.timeline.length === 0 && (
              <li className="text-sm text-slate-500 dark:text-slate-400">
                No timeline events recorded for this story yet.
              </li>
            )}
            {intelligence.timeline.map((event) => (
              <li
                key={event.id}
                className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 p-4"
              >
                <div className="flex items-center gap-2 text-[11px] font-mono text-slate-500 dark:text-slate-400">
                  <span className="rounded border border-slate-300 dark:border-slate-600 px-1.5 py-0.5 font-bold uppercase">
                    {event.eventType}
                  </span>
                  <span>{event.occurredAt}</span>
                  {event.location && <span>· {event.location}</span>}
                </div>
                <h3 className="mt-1 text-sm font-bold text-slate-900 dark:text-slate-100">
                  {event.title}
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">{event.description}</p>
                {event.sourceIds.length > 0 && (
                  <p className="mt-1 text-[11px] font-mono text-slate-400">
                    Sources: {event.sourceIds.join(', ')}
                  </p>
                )}
              </li>
            ))}
          </ol>
        )}

        {tab === 'evidence' && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 p-5">
              <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Claims
              </h2>
              {intelligence.claims.length === 0 && (
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                  No claims have been recorded for this story.
                </p>
              )}
              <ul className="mt-3 space-y-3">
                {intelligence.claims.map((claim) => (
                  <li key={claim.id}>
                    <div className="flex items-start gap-2">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                          CLAIM_STATUS_STYLES[claim.status] ?? CLAIM_STATUS_STYLES.UNVERIFIED
                        }`}
                      >
                        {claim.status.replace(/_/g, ' ')}
                      </span>
                      <p className="text-sm text-slate-800 dark:text-slate-200 flex-1">
                        {claim.text}
                      </p>
                    </div>
                    {claim.confidence !== undefined && (
                      <p className="mt-1 text-[11px] font-mono text-slate-500 dark:text-slate-400">
                        Confidence {Math.round(claim.confidence * 100)}%
                        {claim.confidenceMethodology ? ` — ${claim.confidenceMethodology}` : ''}
                      </p>
                    )}
                    {claim.evidence.length > 0 && (
                      <ul className="mt-2 ml-4 space-y-1 border-l border-slate-200 dark:border-slate-700 pl-3">
                        {claim.evidence.map((item) => (
                          <li key={item.id} className="text-xs text-slate-600 dark:text-slate-400">
                            <span className="font-mono font-bold">{item.stance}</span> {item.title}
                            {item.url ? (
                              <a
                                href={item.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="ml-1 text-indigo-700 dark:text-indigo-400 hover:underline"
                              >
                                open
                              </a>
                            ) : null}
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 p-5">
              <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                All evidence
              </h2>
              {intelligence.evidence.length === 0 && (
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                  No evidence items attached yet.
                </p>
              )}
              <ul className="mt-3 space-y-2">
                {intelligence.evidence.map((item) => (
                  <li
                    key={item.id}
                    className="rounded-xl border border-slate-200 dark:border-slate-800 p-3"
                  >
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="rounded border border-slate-300 dark:border-slate-600 px-1.5 py-0.5 text-[10px] font-bold uppercase text-slate-600 dark:text-slate-300">
                        {item.stance}
                      </span>
                      <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                        {item.title}
                      </span>
                    </div>
                    {item.description && (
                      <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                        {item.description}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {tab === 'data' && (
          <div className="space-y-4">
            {dataBlocks.length === 0 && (
              <p className="text-sm text-slate-500 dark:text-slate-400">
                This story has no data blocks.
              </p>
            )}
            {dataBlocks.map((block) => (
              <BlockItem key={block.id} block={block} theme="light" />
            ))}
          </div>
        )}

        {tab === 'sources' && (
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 p-5">
            <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Sources ({intelligence.metrics.sourceCount})
            </h2>
            {intelligence.whatChanged.supportingSourceIds.length === 0 ? (
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                No sources linked to this story.
              </p>
            ) : (
              <ul className="mt-3 space-y-1 font-mono text-xs text-slate-600 dark:text-slate-400">
                {intelligence.whatChanged.supportingSourceIds.map((sourceId) => (
                  <li key={sourceId}>{sourceId}</li>
                ))}
              </ul>
            )}
          </div>
        )}

        {tab === 'perspectives' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {intelligence.perspectives.length === 0 && (
              <p className="text-sm text-slate-500 dark:text-slate-400">
                No perspectives recorded for this story.
              </p>
            )}
            {intelligence.perspectives.map((perspective) => (
              <article
                key={perspective.id}
                className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 p-4"
              >
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    {perspective.label}
                  </h3>
                  <span className="rounded border border-slate-300 dark:border-slate-600 px-1.5 py-0.5 text-[10px] font-bold uppercase text-slate-600 dark:text-slate-300">
                    {perspective.stance}
                  </span>
                </div>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                  {perspective.summary}
                </p>
                {perspective.quoteExcerpt && (
                  <blockquote className="mt-2 border-l-2 border-indigo-400 pl-3 text-sm italic text-slate-600 dark:text-slate-400">
                    “{perspective.quoteExcerpt}”
                  </blockquote>
                )}
                {perspective.sourceIds.length > 0 && (
                  <p className="mt-2 text-[11px] font-mono text-slate-400">
                    Sources: {perspective.sourceIds.join(', ')}
                  </p>
                )}
              </article>
            ))}
          </div>
        )}

        {tab === 'entities' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {entities.length === 0 && (
              <p className="text-sm text-slate-500 dark:text-slate-400">
                No entities linked to this story.
              </p>
            )}
            {entities.map((entity) => (
              <Link
                key={entity.id}
                href={`/entities/${entity.id}`}
                className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 p-4 hover:border-indigo-400 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="rounded bg-indigo-100 dark:bg-indigo-500/10 px-1.5 py-0.5 text-[10px] font-bold uppercase text-indigo-700 dark:text-indigo-400">
                    {entity.type}
                  </span>
                  <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    {entity.name}
                  </span>
                </div>
                {entity.description && (
                  <p className="mt-1 line-clamp-2 text-xs text-slate-600 dark:text-slate-400">
                    {entity.description}
                  </p>
                )}
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
