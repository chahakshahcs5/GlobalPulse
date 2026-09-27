import Link from 'next/link';
import { DEMO_STORIES } from '../lib/demo-data';
import { ProvenanceBadge } from '../components/ProvenanceBadge';

export default function HomePage() {
  const heroStory = DEMO_STORIES[0];
  const secondaryStories = DEMO_STORIES.slice(1);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
      {/* Editorial Platform Architecture Banner */}
      <div className="rounded-2xl border border-blue-500/20 bg-gradient-to-r from-blue-950/40 via-slate-900/60 to-purple-950/30 p-6 sm:p-8 backdrop-blur-md shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-3xl">
          <div className="flex items-center gap-2 text-xs font-bold font-mono tracking-widest text-blue-400 uppercase">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            Programmable AI Newsroom Active
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Operated by External AI Agents via Remote MCP
          </h1>
          <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
            Google Gemini Spark and ChatGPT research the web independently, reason over existing coverage, compose structured D3 charts, timelines, and citations, and publish to this platform over Streamable HTTP.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 shrink-0">
          <Link
            href="/display"
            className="px-4 py-2.5 rounded-xl border border-purple-500/40 bg-purple-600/20 hover:bg-purple-600/30 text-purple-200 text-xs font-extrabold tracking-wider text-center transition"
          >
            LAUNCH 4K WALL
          </Link>
          <Link
            href="/admin"
            className="px-4 py-2.5 rounded-xl border border-blue-500/40 bg-blue-600 hover:bg-blue-500 text-white text-xs font-extrabold tracking-wider text-center transition shadow-lg shadow-blue-500/20"
          >
            ENTER CMS DASHBOARD
          </Link>
        </div>
      </div>

      {/* Featured Hero Story */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold font-mono uppercase tracking-widest text-slate-400">
            Lead Editorial Dispatch
          </h2>
          <span className="text-xs font-mono text-emerald-400 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            LIVE UPDATING
          </span>
        </div>

        <div className="glass-card rounded-2xl overflow-hidden border border-slate-800 grid grid-cols-1 lg:grid-cols-12 shadow-2xl">
          {/* Hero Visual Column */}
          <div className="lg:col-span-7 relative min-h-[320px] lg:min-h-[480px] overflow-hidden">
            <img
              src={heroStory.heroImageUrl}
              alt={heroStory.title}
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent"></div>
            <div className="absolute top-4 left-4 flex gap-2">
              <span className="px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-rose-600 text-white shadow-lg">
                DEVELOPING
              </span>
              <span className="px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-slate-900/80 backdrop-blur-md text-blue-400 border border-slate-700/60">
                BRICS 2026
              </span>
            </div>
          </div>

          {/* Hero Text Column */}
          <div className="lg:col-span-5 p-6 sm:p-8 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <ProvenanceBadge
                clientType={heroStory.createdByClient}
                createdVia={heroStory.createdVia}
                versionNumber={heroStory.currentVersionNumber}
                sourceCount={heroStory.sourceIds.length}
                publishedAt={heroStory.publishedAt}
              />
              <Link href={`/stories/${heroStory.slug}`} className="group block">
                <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-tight group-hover:text-blue-400 transition">
                  {heroStory.title}
                </h3>
              </Link>
              <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                {heroStory.summary}
              </p>
            </div>

            <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between">
              <span className="text-xs text-slate-400 font-mono">
                Includes D3 Bar Chart • MapLibre Map • Timeline
              </span>
              <Link
                href={`/stories/${heroStory.slug}`}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-400 hover:text-blue-300 transition"
              >
                Read Full Story →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Secondary Story Grid */}
      <section className="space-y-6">
        <h2 className="text-xs font-bold font-mono uppercase tracking-widest text-slate-400">
          Recent Intelligence Reports
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {secondaryStories.map((story) => (
            <div
              key={story.id}
              className="glass-card rounded-xl p-6 border border-slate-800 flex flex-col justify-between space-y-5"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/20 font-mono">
                    {story.articleType.replace('_', ' ')}
                  </span>
                  <span className="text-xs font-mono text-slate-500">v{story.currentVersionNumber}</span>
                </div>
                <Link href={`/stories/${story.slug}`} className="group block">
                  <h4 className="text-xl font-bold text-white tracking-tight group-hover:text-blue-400 transition leading-snug">
                    {story.title}
                  </h4>
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
                  className="text-xs font-bold text-slate-300 hover:text-white transition shrink-0 ml-2"
                >
                  Explore →
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
