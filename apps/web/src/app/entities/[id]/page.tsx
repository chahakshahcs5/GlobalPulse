import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getEntity, listStories, listEvents } from '../../../lib/api-client';
import { formatDeterministicDate } from '../../../lib/date-utils';
import { ArrowLeft, Calendar, Newspaper } from 'lucide-react';
import type { Story, Event } from '@ai-news/schemas';

import { DEMO_ENTITIES, DEMO_STORIES, DEMO_EVENTS } from '../../../lib/demo-data';

interface EntityPageProps {
  params: Promise<{ id: string }>;
}

export default async function EntityPage({ params }: EntityPageProps) {
  const { id } = await params;
  const normalizedId = id.trim();

  // Fetch entity from live database/API, falling back to known records if API is offline
  let entity = await getEntity(normalizedId);
  if (!entity && DEMO_ENTITIES[normalizedId]) {
    entity = DEMO_ENTITIES[normalizedId];
  }

  // If entity is unknown / not found, return authentic 404
  if (!entity) {
    notFound();
  }

  // Find live stories that reference this entity
  let allStories = await listStories({ limit: 50 });
  if (allStories.length === 0) {
    allStories = DEMO_STORIES;
  }

  const storiesToDisplay = allStories.filter(
    (s: Story) =>
      (s.entityIds || []).includes(entity.id) ||
      (s.summary || '').toLowerCase().includes((entity.slug || '').toLowerCase()) ||
      (s.title || '').toLowerCase().includes(entity.name.toLowerCase())
  );

  // Find live linked events from the API
  let allEvents = await listEvents();
  if (allEvents.length === 0) {
    allEvents = Object.values(DEMO_EVENTS);
  }

  const linkedEvents = allEvents.filter((evt: Event) => (evt.entityIds || []).includes(entity.id));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-xs font-mono text-blue-400 font-bold uppercase tracking-wider">
        <Link href="/" className="hover:text-white transition flex items-center gap-1">
          <ArrowLeft className="w-3.5 h-3.5" /> Live Feed
        </Link>
        <span>/</span>
        <span className="text-slate-400">Knowledge Graph</span>
        <span>/</span>
        <span>Entity Profile</span>
      </div>

      {/* Entity Profile Header */}
      <div className="glass-card rounded-2xl p-6 sm:p-8 border border-slate-800 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
          <div className="space-y-3 max-w-4xl">
            <div className="flex flex-wrap items-center gap-3">
              <span className="px-3 py-1 rounded-full text-xs font-mono font-bold uppercase bg-blue-500/10 text-blue-400 border border-blue-500/30">
                {entity.type || 'ORGANIZATION'}
              </span>
              <span className="text-xs font-mono text-slate-500">ID: {entity.id}</span>
              <span className="text-xs font-mono text-slate-500" suppressHydrationWarning>
                Indexed {formatDeterministicDate(entity.createdAt)}
              </span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
              {entity.name}
            </h1>

            <p className="text-base sm:text-lg text-slate-300 leading-relaxed">
              {entity.description}
            </p>
          </div>

          <div className="flex flex-col sm:items-end gap-2 shrink-0">
            <span className="text-xs font-mono text-slate-400">Knowledge Graph</span>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono text-xs font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              VERIFIED ENTITY
            </div>
          </div>
        </div>

        {/* Aliases & Taxonomy Meta */}
        {entity.aliases && entity.aliases.length > 0 && (
          <div className="pt-4 border-t border-slate-800/80 flex flex-wrap items-center gap-2">
            <span className="text-xs font-mono text-slate-400">Known Aliases:</span>
            {entity.aliases.map((alias: string, idx: number) => (
              <span
                key={idx}
                className="px-2.5 py-0.5 rounded-md bg-slate-800/80 border border-slate-700 text-xs font-mono text-slate-300"
              >
                {alias}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Linked Events Timeline Section */}
      {linkedEvents.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <h2 className="text-lg font-black text-white uppercase font-mono tracking-wider flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-400" />
              Connected Chronological Events ({linkedEvents.length})
            </h2>
            <span className="text-xs font-mono text-slate-500">Milestone Timeline</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {linkedEvents.map((evt: Event) => (
              <Link
                key={evt.id}
                href={`/events/${evt.id}`}
                className="glass-card rounded-xl p-5 border border-slate-800 hover:border-blue-500/40 transition block space-y-2 group"
              >
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-blue-400 font-bold">{evt.status || 'ACTIVE'}</span>
                  <span className="text-slate-500" suppressHydrationWarning>
                    {formatDeterministicDate(evt.occurredAt || evt.createdAt)}
                  </span>
                </div>
                <h3 className="text-base font-bold text-white group-hover:text-blue-400 transition">
                  {evt.title}
                </h3>
                <p className="text-xs text-slate-300 line-clamp-2">{evt.summary}</p>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Dispatches referencing this entity */}
      <div className="space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <h2 className="text-lg font-black text-white uppercase font-mono tracking-wider flex items-center gap-2">
            <Newspaper className="w-4 h-4 text-blue-400" />
            Covered Dispatches Referencing {entity.name} ({storiesToDisplay.length})
          </h2>
          <span className="text-xs font-mono text-slate-500">Direct Ingestion Corpus</span>
        </div>

        {storiesToDisplay.length === 0 ? (
          <div className="p-8 text-center rounded-2xl border border-dashed border-slate-800 text-slate-400 text-xs font-mono">
            No published dispatches have cited this entity yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {storiesToDisplay.map((story: Story) => (
              <div
                key={story.id}
                className="glass-card rounded-2xl p-6 border border-slate-800 flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                    <span className="uppercase text-blue-400 font-bold">
                      {story.articleType.replace('_', ' ')}
                    </span>
                    <span suppressHydrationWarning>
                      {formatDeterministicDate(story.publishedAt || story.createdAt)}
                    </span>
                  </div>

                  <Link href={`/stories/${story.slug}`} className="block group">
                    <h3 className="text-lg font-bold text-white group-hover:text-blue-400 transition leading-snug">
                      {story.title}
                    </h3>
                  </Link>

                  <p className="text-xs text-slate-300 line-clamp-3 leading-relaxed">
                    {story.summary}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-slate-400">By {story.authorId}</span>
                  <Link
                    href={`/stories/${story.slug}`}
                    className="text-blue-400 hover:text-blue-300 font-bold transition"
                  >
                    Read Full Dispatch &rarr;
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
