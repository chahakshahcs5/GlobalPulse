import Link from 'next/link';
import { DEMO_STORIES } from '../../../lib/demo-data';
import { ProvenanceBadge } from '../../../components/ProvenanceBadge';

interface TopicPageProps {
  params: Promise<{ slug: string }>;
}

export default async function TopicPage({ params }: TopicPageProps) {
  const { slug } = await params;
  const topicName = slug
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');

  // Filter demo stories matching topic
  const matchingStories = DEMO_STORIES.filter(
    (s) =>
      s.slug.includes(slug) || s.topicIds.some((t: string) => t.includes(slug.replace('-', '_')))
  );
  const storiesToDisplay = matchingStories.length > 0 ? matchingStories : DEMO_STORIES;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Topic Header */}
      <div className="pb-6 border-b border-slate-800 space-y-3">
        <div className="flex items-center gap-2 text-xs font-mono text-blue-400 font-bold uppercase tracking-wider">
          <Link href="/" className="hover:text-white transition">
            ← Live Feed
          </Link>
          <span>/</span>
          <span>TOPIC DASHBOARD</span>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
              {topicName}
            </h1>
            <p className="text-sm sm:text-base text-slate-300 mt-2 max-w-2xl">
              Real-time editorial monitoring, timeline milestones, and data analytics on {topicName}
              .
            </p>
          </div>
          <span className="self-start sm:self-center px-3.5 py-1.5 rounded-full text-xs font-bold font-mono uppercase bg-blue-500/10 text-blue-400 border border-blue-500/30">
            {storiesToDisplay.length} Covered Stories
          </span>
        </div>
      </div>

      {/* Stories Grid */}
      <div className="space-y-6">
        <h2 className="text-xs font-bold font-mono uppercase tracking-widest text-slate-400">
          Published Topic Coverage
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {storiesToDisplay.map((story) => (
            <div
              key={story.id}
              className="glass-card rounded-2xl p-6 border border-slate-800 flex flex-col justify-between space-y-4"
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
