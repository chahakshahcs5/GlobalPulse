import Link from 'next/link';
import { DEMO_EVENTS, DEMO_STORIES, DEMO_ENTITIES } from '../../../lib/demo-data';
import { ProvenanceBadge } from '../../../components/ProvenanceBadge';
import { MapRenderer } from '@ai-news/media';

interface EventPageProps {
  params: Promise<{ id: string }>;
}

export default async function EventPage({ params }: EventPageProps) {
  const { id } = await params;
  const normalizedId = id.toLowerCase().trim();

  // Find event by ID
  let event = Object.values(DEMO_EVENTS).find(
    (e) => e.id.toLowerCase() === normalizedId || e.id.toLowerCase().includes(normalizedId)
  );

  if (!event) {
    const formattedTitle = id
      .replace(/^evt_/, '')
      .split('-')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');

    event = {
      id,
      organizationId: 'org_default',
      title: formattedTitle,
      summary:
        'Developing international event tracked continuously across multi-agent dispatches and real-time wire feeds.',
      status: 'ACTIVE',
      occurredAt: new Date().toISOString(),
      location: 'Global Intelligence Feed',
      topicIds: ['top_global'],
      entityIds: ['ent_india', 'ent_china'],
      storyIds: ['sty_brics_2026'],
      sourceIds: ['src_reuters'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  // Find all stories associated with this event
  const stories = DEMO_STORIES.filter(
    (s) =>
      event!.storyIds.includes(s.id) ||
      s.topicIds.some((t) => event!.topicIds.includes(t)) ||
      s.entityIds.some((e) => event!.entityIds.includes(e))
  );

  // Find participating entities
  const participatingEntities = event.entityIds
    .map((entId) => DEMO_ENTITIES[entId])
    .filter(Boolean);

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
                {`● ${event.status} EVENT`}
              </span>
              {event.location && (
                <span className="flex items-center gap-1.5 text-xs font-mono text-slate-300 bg-slate-800/80 px-3 py-1 rounded-full border border-slate-700">
                  📍 {event.location}
                </span>
              )}
              <span className="text-xs font-mono text-slate-500">
                Logged {new Date(event.occurredAt).toUTCString()}
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
            <h2 className="text-xs font-bold font-mono uppercase tracking-widest text-slate-400">
              Geographic Event Epicenter & Representation
            </h2>
            {event.coordinates && (
              <span className="text-xs font-mono text-slate-400">
                Coordinates: [{event.coordinates[0].toFixed(4)}, {event.coordinates[1].toFixed(4)}]
              </span>
            )}
          </div>
          <div
            className="w-full overflow-hidden rounded-xl border border-slate-800/80 bg-slate-950 flex justify-center"
            dangerouslySetInnerHTML={{ __html: mapSvg }}
          />
        </div>
      )}

      {/* Stories Timeline Linked to Event */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xs font-bold font-mono uppercase tracking-widest text-slate-400">
              Associated Dispatches & Revisions
            </h2>
            <p className="text-sm text-slate-300 mt-1">
              External AI reporters submit verified articles as this event evolves.
            </p>
          </div>
          <span className="text-xs font-mono text-slate-400">
            {stories.length} Dispatches Published
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {stories.map((story) => (
            <div
              key={story.id}
              className="glass-card rounded-2xl p-6 border border-slate-800 flex flex-col justify-between space-y-4 hover:border-slate-700 transition"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    {story.articleType.replace('_', ' ')}
                  </span>
                  <span className="text-xs font-mono text-slate-500">
                    Version {story.currentVersionNumber}
                  </span>
                </div>

                <Link href={`/stories/${story.slug}`} className="group block">
                  <h3 className="text-xl font-bold text-white tracking-tight group-hover:text-blue-400 transition leading-snug">
                    {story.title}
                  </h3>
                </Link>

                <p className="text-sm text-slate-300 leading-relaxed line-clamp-3">
                  {story.summary}
                </p>
              </div>

              <div className="pt-4 border-t border-slate-800/60 flex items-center justify-between">
                <ProvenanceBadge
                  clientType={story.createdByClient}
                  createdVia={story.createdVia}
                  versionNumber={story.currentVersionNumber}
                  sourceCount={story.sourceIds.length}
                />
                <Link
                  href={`/stories/${story.slug}`}
                  className="text-xs font-bold text-blue-400 hover:text-blue-300 transition shrink-0 ml-2"
                >
                  Read Dispatch →
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
