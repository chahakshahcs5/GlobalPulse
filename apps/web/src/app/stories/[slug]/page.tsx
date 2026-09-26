import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { DEMO_STORIES, DEMO_SOURCES } from '../../../lib/demo-data';
import { StoryRenderer } from '../../../components/StoryRenderer';
import { ProvenanceBadge } from '../../../components/ProvenanceBadge';

interface StoryPageProps {
  params: Promise<{ slug: string }>;
}

export default async function StoryPage({ params }: StoryPageProps) {
  const { slug } = await params;
  const story = DEMO_STORIES.find((s) => s.slug === slug);

  if (!story) {
    notFound();
  }

  const attachedSources = story.sourceIds
    .map((id: string) => DEMO_SOURCES[id])
    .filter(Boolean);

  return (
    <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Navigation Breadcrumb */}
      <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
        <Link href="/" className="hover:text-white transition">
          ← Back to Live Newsroom
        </Link>
        <span>/</span>
        <span className="uppercase text-slate-500 font-semibold">{story.articleType.replace('_', ' ')}</span>
      </div>

      {/* Story Header */}
      <header className="space-y-4 pb-6 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider bg-blue-600/20 text-blue-400 border border-blue-500/30 font-mono">
            {story.status}
          </span>
          <span className="text-xs font-mono text-slate-400">
            ID: <span className="text-slate-300">{story.id}</span>
          </span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
          {story.title}
        </h1>

        <p className="text-lg sm:text-xl text-slate-300 font-normal leading-relaxed">
          {story.summary}
        </p>

        {/* Provenance & Author Attribution */}
        <ProvenanceBadge
          clientType={story.createdByClient}
          createdVia={story.createdVia}
          versionNumber={story.currentVersionNumber}
          sourceCount={story.sourceIds.length}
          publishedAt={story.publishedAt}
        />
      </header>

      {/* Hero Image if present */}
      {story.heroImageUrl && (
        <div className="rounded-2xl overflow-hidden border border-slate-800 max-h-[460px] shadow-2xl relative">
          <img
            src={story.heroImageUrl}
            alt={story.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Structured Content Block Stream (StoryRenderer) */}
      <div className="py-4">
        <StoryRenderer blocks={story.blocks} theme="dark" />
      </div>

      {/* Source Attribution & Citation Registry */}
      {attachedSources.length > 0 && (
        <section className="pt-8 mt-12 border-t border-slate-800/80 space-y-4">
          <h3 className="text-xs font-bold font-mono uppercase tracking-widest text-slate-400">
            Attached Primary Sources & Documentation ({attachedSources.length})
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {attachedSources.map((src: any) => (
              <div
                key={src.id}
                className="p-4 rounded-xl border border-slate-800 bg-slate-900/40 space-y-2 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-blue-400 uppercase tracking-wider">{src.publisher}</span>
                  <span className="font-mono text-slate-500">{src.sourceType}</span>
                </div>
                <h4 className="font-semibold text-slate-200 text-sm">{src.title}</h4>
                {src.permissibleExcerpt && (
                  <p className="text-slate-400 italic line-clamp-2">"{src.permissibleExcerpt}"</p>
                )}
                <div className="pt-2 flex items-center justify-between font-mono text-[11px] text-slate-500 border-t border-slate-800/50">
                  <span>Author: {src.author || 'Desk'}</span>
                  <a
                    href={src.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 font-bold"
                  >
                    View Source ↗
                  </a>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </article>
  );
}
