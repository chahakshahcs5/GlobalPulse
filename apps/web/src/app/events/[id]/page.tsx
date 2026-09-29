import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getEvent, listStories, getEntity } from '../../../lib/api-client';
import { MapRenderer } from '@ai-news/media';
import { formatDeterministicDate } from '../../../lib/date-utils';
import type { Story, Entity } from '@ai-news/schemas';

import { DEMO_EVENTS, DEMO_STORIES, DEMO_ENTITIES } from '../../../lib/demo-data';

interface EventPageProps {
  params: Promise<{ id: string }>;
}

export default async function EventPage({ params }: EventPageProps) {
  const { id } = await params;
  const normalizedId = id.trim();

  // Fetch event directly from the live API backend, falling back to known records if API is offline
  let event = await getEvent(normalizedId);
  if (!event && DEMO_EVENTS[normalizedId]) {
    event = DEMO_EVENTS[normalizedId];
  }

  // If the event does not exist / unknown, return authentic 404
  if (!event) {
    notFound();
  }

  // Find all live stories associated with this event
  let allStories = await listStories({ limit: 50 });
  if (allStories.length === 0) {
    allStories = DEMO_STORIES;
  }

  const stories = allStories.filter(
    (s: Story) =>
      (event.storyIds || []).includes(s.id) ||
      (s.topicIds || []).some((t: string) => (event.topicIds || []).includes(t)) ||
      (s.entityIds || []).some((e: string) => (event.entityIds || []).includes(e))
  );

  // Fetch participating entities from live backend
  const participatingEntities: Entity[] = [];
  for (const entId of (event.entityIds || []).slice(0, 10)) {
    try {
      const ent = (await getEntity(entId)) || DEMO_ENTITIES[entId];
      if (ent) participatingEntities.push(ent);
    } catch {
      if (DEMO_ENTITIES[entId]) participatingEntities.push(DEMO_ENTITIES[entId]);
    }
  }

  // Render SVG map if coordinates exist
  let mapSvg: string | null = null;
  if (event.coordinates) {
    mapSvg = MapRenderer.renderSvgFallback(
      {
        title: event.location || event.title,
        center: event.coordinates,
        zoom: 5,
        style: 'dark',
        markers: [{ coordinates: event.coordinates, title: event.location || event.title }],
      },
      800,
      360,
      'dark'
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-xs font-mono text-blue-400 font-bold uppercase tracking-wider">
        <Link href="/" className="hover:text-white transition">
          ← Live Feed
        </Link>
        <span>/</span>
        <span className="text-slate-400">Event Monitoring</span>
        <span>/</span>
        <span>Chronological Tracker</span>
      </div>

      {/* Event Header Banner */}
      <div className="glass-card rounded-2xl p-6 sm:p-8 border border-slate-800 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
          <div className="space-y-3 max-w-4xl">
            <div className="flex flex-wrap items-center gap-3">
              <span
                className={`px-3 py-1 rounded-full text-xs font-mono font-bold uppercase ${
                  event.status === 'ACTIVE'
                    ? 'bg-red-500/10 text-red-400 border border-red-500/30'
                    : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                }`}
              >
                {`● ${event.status || 'ACTIVE'} EVENT`}
              </span>
              {event.location && (
                <span className="flex items-center gap-1.5 text-xs font-mono text-slate-300 bg-slate-800/80 px-3 py-1 rounded-full border border-slate-700">
                  📍 {event.location}
                </span>
              )}
              <span className="text-xs font-mono text-slate-500" suppressHydrationWarning>
                Logged {formatDeterministicDate(event.occurredAt || event.createdAt)}
              </span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
              {event.title}
            </h1>

            <p className="text-base sm:text-lg text-slate-300 leading-relaxed">{event.summary}</p>
          </div>

          <div className="flex flex-col sm:items-end gap-2 shrink-0">
            <span className="text-xs font-mono text-slate-400">Live Agent Stream</span>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 font-mono text-xs font-bold">
              <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping"></span>
              MCP FEED ACTIVE
            </div>
          </div>
        </div>

        {/* Participating Entities Bar */}
        {participatingEntities.length > 0 && (
          <div className="pt-6 border-t border-slate-800/80 flex flex-wrap items-center gap-3">
            <span className="text-xs font-mono uppercase tracking-wider text-slate-400">
              Key Entities Involved:
            </span>
            {participatingEntities.map((ent) => (
              <Link
                key={ent.id}
                href={`/entities/${ent.id}`}
                className="flex items-center gap-2 px-3 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 border border-slate-700/80 text-xs font-mono text-slate-200 transition"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
                <span className="font-bold">{ent.name}</span>
                <span className="text-[10px] text-slate-400 uppercase">({ent.type})</span>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Map & Coordinates Visualization */}
      {mapSvg && (
        <div className="glass-card rounded-2xl p-6 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase tracking-wider text-blue-400 font-bold">
              Spatial Geospatial Coordinates
            </span>
            <span className="text-xs font-mono text-slate-500">{event.location}</span>
          </div>
          <div
            className="w-full overflow-hidden rounded-xl border border-slate-800 bg-slate-950 flex items-center justify-center p-2"
            dangerouslySetInnerHTML={{ __html: mapSvg }}
          />
        </div>
      )}

      {/* Linked Stories Coverage */}
      <div className="space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <h2 className="text-lg font-black text-white uppercase font-mono tracking-wider">
            Connected Dispatches ({stories.length})
          </h2>
          <span className="text-xs font-mono text-slate-500">Live Agent Ingestion Feed</span>
        </div>

        {stories.length === 0 ? (
          <div className="p-8 text-center rounded-2xl border border-dashed border-slate-800 text-slate-400 text-xs font-mono">
            No published dispatches linked to this event yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {stories.map((story: Story) => (
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
