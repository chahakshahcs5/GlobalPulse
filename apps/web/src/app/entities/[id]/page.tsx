import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { DEMO_ENTITIES, DEMO_STORIES, DEMO_EVENTS } from '../../../lib/demo-data';
import { ProvenanceBadge } from '../../../components/ProvenanceBadge';

interface EntityPageProps {
  params: Promise<{ id: string }>;
}

export default async function EntityPage({ params }: EntityPageProps) {
  const { id } = await params;
  const normalizedId = id.toLowerCase().trim();

  // Find entity by direct id or by slug
  let entity = Object.values(DEMO_ENTITIES).find(
    (e) => e.id.toLowerCase() === normalizedId || e.slug.toLowerCase() === normalizedId
  );

  // Fallback synthetic entity if not strictly in mock dictionary
  if (!entity) {
    const formattedName = id
      .replace(/^ent_/, '')
      .split('-')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');

    entity = {
      id,
      organizationId: 'org_default',
      name: formattedName,
      slug: id.replace(/^ent_/, '').toLowerCase(),
      type: 'ORGANIZATION',
      description: `Indexed global entity profiled within the GlobalPulse knowledge graph. External AI models reference this entity across real-time dispatches.`,
      aliases: [formattedName],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  // Find stories that reference this entity
  const matchingStories = DEMO_STORIES.filter(
    (s) =>
      s.entityIds.includes(entity!.id) ||
      s.summary.toLowerCase().includes(entity!.slug) ||
      s.title.toLowerCase().includes(entity!.name.toLowerCase())
  );
  const storiesToDisplay = matchingStories.length > 0 ? matchingStories : DEMO_STORIES.slice(0, 2);

  // Find linked events
  const linkedEvents = Object.values(DEMO_EVENTS).filter((evt) =>
    evt.entityIds.includes(entity!.id)
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-xs font-mono text-blue-400 font-bold uppercase tracking-wider">
        <Link href="/" className="hover:text-white transition">
          ← Live Feed
        </Link>
        <span>/</span>
        <span className="text-slate-400">Knowledge Graph</span>
        <span>/</span>
        <span>Entity Dossier</span>
      </div>

      {/* Entity Profile Header */}
      <div className="glass-card rounded-2xl p-6 sm:p-8 border border-slate-800 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center text-white text-2xl font-black shadow-lg shadow-blue-500/20 shrink-0">
              {entity.name.charAt(0)}
            </div>
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
                  {entity.name}
                </h1>
                <span className="px-3 py-1 rounded-full text-xs font-mono font-bold uppercase bg-blue-500/10 text-blue-400 border border-blue-500/30">
                  {entity.type}
                </span>
                <span className="px-2.5 py-1 rounded-full text-xs font-mono bg-slate-800 text-slate-400 border border-slate-700">
                  {entity.id}
                </span>
              </div>
              <p className="text-sm sm:text-base text-slate-300 max-w-3xl leading-relaxed">
                {entity.description}
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:items-end gap-2 shrink-0">
            <span className="text-[11px] font-mono uppercase text-slate-400">Catalogued via MCP</span>
            <span className="text-xs font-mono font-bold text-emerald-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              KNOWLEDGE GRAPH ACTIVE
            </span>
          </div>
        </div>

        {/* Aliases & Metadata */}
        {entity.aliases && entity.aliases.length > 0 && (
          <div className="pt-4 border-t border-slate-800/80 flex flex-wrap items-center gap-2">
            <span className="text-xs font-mono text-slate-400">Known Aliases:</span>
            {entity.aliases.map((alias) => (
              <span
                key={alias}
                className="px-2.5 py-0.5 rounded-md text-xs font-mono bg-slate-800/60 text-slate-300 border border-slate-700/60"
              >
                {alias}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Intelligence & Statistics Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-card rounded-xl p-5 border border-slate-800">
          <div className="text-xs font-mono text-slate-400 uppercase">Covered Dispatches</div>
          <div className="text-3xl font-black text-white mt-1">{storiesToDisplay.length}</div>
          <div className="text-xs text-slate-400 mt-1">Cross-verified stories citing entity</div>
        </div>
        <div className="glass-card rounded-xl p-5 border border-slate-800">
          <div className="text-xs font-mono text-slate-400 uppercase">Linked Events</div>
          <div className="text-3xl font-black text-blue-400 mt-1">{linkedEvents.length}</div>
          <div className="text-xs text-slate-400 mt-1">Diplomatic or industry milestones</div>
        </div>
        <div className="glass-card rounded-xl p-5 border border-slate-800">
          <div className="text-xs font-mono text-slate-400 uppercase">KG Synchronized</div>
          <div className="text-3xl font-black text-emerald-400 mt-1">100%</div>
          <div className="text-xs text-slate-400 mt-1">Idempotent UUID indexing</div>
        </div>
      </div>

      {/* Associated Events Section */}
      {linkedEvents.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold font-mono uppercase tracking-widest text-slate-400">
              Linked Developing Events
            </h2>
            <span className="text-xs font-mono text-slate-400">Live Tracker</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {linkedEvents.map((evt) => (
              <Link
                key={evt.id}
                href={`/events/${evt.id}`}
                className="glass-card rounded-xl p-5 border border-slate-800 hover:border-blue-500/50 transition group space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    {evt.status}
                  </span>
                  <span className="text-xs font-mono text-slate-400">{evt.location}</span>
                </div>
                <h3 className="text-lg font-bold text-white group-hover:text-blue-400 transition">
                  {evt.title}
                </h3>
                <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                  {evt.summary}
                </p>
                <div className="text-xs font-bold text-blue-400 pt-2 flex items-center gap-1">
                  View Event Timeline →
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Featured Stories Grid */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold font-mono uppercase tracking-widest text-slate-400">
            Stories Citing {entity.name}
          </h2>
          <span className="text-xs font-mono text-slate-400">
            {storiesToDisplay.length} Dispatches Published
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {storiesToDisplay.map((story) => (
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
                  Read Story →
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
