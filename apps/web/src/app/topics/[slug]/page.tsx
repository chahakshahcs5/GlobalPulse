'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { getTopicDossier, listStories } from '../../../lib/api-client';
import { formatDeterministicDate } from '../../../lib/date-utils';
import {
  ArrowLeft,
  Newspaper,
  TrendingUp,
  Activity,
  Layers,
  Sparkles,
  Share2,
  Bookmark,
  Calendar,
  Tag,
} from 'lucide-react';
import type { Story, TopicDossier } from '@ai-news/schemas';

interface TopicPageProps {
  params: Promise<{ slug: string }>;
}

export default function TopicPage({ params }: TopicPageProps) {
  const { slug } = use(params);
  const [dossier, setDossier] = useState<TopicDossier | null>(null);
  const [stories, setStories] = useState<Story[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let isMounted = true;

    Promise.all([getTopicDossier(slug), listStories({ limit: 60 })])
      .then(([topicDossier, allStories]) => {
        if (!isMounted) return;
        setDossier(topicDossier);

        const slugClean = slug.toLowerCase();
        const normalized = slug.toLowerCase().replace(/[-_]/g, ' ');
        const matching = allStories.filter(
          (s) =>
            s.status === 'PUBLISHED' &&
            (s.slug.toLowerCase().includes(slugClean) ||
              (s.topicIds || []).some(
                (t) => t.toLowerCase().includes(slugClean) || t.toLowerCase().includes(normalized)
              ) ||
              (s.title || '').toLowerCase().includes(slugClean) ||
              (s.title || '').toLowerCase().includes(normalized))
        );
        setStories(matching);
        setIsLoading(false);
      })
      .catch(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [slug]);

  const topicName =
    dossier?.topic?.name ||
    slug
      .split(/[-_]/)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');

  const totalSentiment = dossier
    ? dossier.sentiment.positive +
      dossier.sentiment.cautious +
      dossier.sentiment.critical +
      dossier.sentiment.neutral
    : 0;

  const getPercent = (count: number) => {
    if (!totalSentiment) return 25;
    return Math.round((count / totalSentiment) * 100);
  };

  const handleShare = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Navigation Breadcrumb */}
      <div className="flex items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800 text-xs font-mono">
        <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 font-medium">
          <Link
            href="/"
            className="text-blue-600 dark:text-blue-400 hover:underline transition flex items-center gap-1 font-bold uppercase tracking-wider"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Top Stories
          </Link>
          <span>/</span>
          <span className="uppercase tracking-wider font-semibold text-slate-700 dark:text-slate-300">
            Topic Overview
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition shadow-xs cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>{copied ? 'Link Copied!' : 'Share'}</span>
          </button>
          <button
            onClick={() => setIsFollowing(!isFollowing)}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer ${
              isFollowing
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/30'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            <Bookmark className="w-3.5 h-3.5" />
            <span>{isFollowing ? 'Following Topic' : 'Follow Topic'}</span>
          </button>
        </div>
      </div>

      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-3xl p-8 sm:p-12 border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-950 to-blue-950/60 shadow-xl text-white">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />
        <div className="relative z-10 space-y-4 max-w-3xl">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="px-3 py-1 rounded-full text-xs font-mono font-bold uppercase tracking-wider bg-blue-500/20 text-blue-300 border border-blue-500/40 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> Verified Topic Hub
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-mono font-bold uppercase tracking-wider bg-slate-800 text-slate-300 border border-slate-700">
              {stories.length} {stories.length === 1 ? 'Story' : 'Stories'} Tracked
            </span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight flex items-center gap-3">
            <span className="text-blue-500">#</span>
            <span>{topicName}</span>
          </h1>

          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            {dossier?.topic?.description ||
              `Real-time intelligence aggregation, storyline milestones, key entities, and sentiment analysis tracking ${topicName}.`}
          </p>
        </div>
      </div>

      {/* Intelligence Grid: Sentiment Pulse & Key Entities */}
      {dossier && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sentiment Pulse */}
          <div className="lg:col-span-2 rounded-2xl p-6 sm:p-7 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 shadow-xs space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900">
                  <Activity className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold uppercase font-mono tracking-wider text-slate-900 dark:text-white">
                  Editorial Sentiment Pulse
                </h3>
              </div>
              <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
                {totalSentiment} Wire Assessments
              </span>
            </div>

            {/* Segmented Meter */}
            <div className="w-full h-3 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 overflow-hidden flex shadow-inner">
              <div
                style={{ width: `${getPercent(dossier.sentiment.positive)}%` }}
                className="bg-emerald-500 transition-all duration-500"
                title={`Positive: ${getPercent(dossier.sentiment.positive)}%`}
              />
              <div
                style={{ width: `${getPercent(dossier.sentiment.cautious)}%` }}
                className="bg-amber-500 transition-all duration-500"
                title={`Cautious: ${getPercent(dossier.sentiment.cautious)}%`}
              />
              <div
                style={{ width: `${getPercent(dossier.sentiment.critical)}%` }}
                className="bg-rose-500 transition-all duration-500"
                title={`Critical: ${getPercent(dossier.sentiment.critical)}%`}
              />
              <div
                style={{ width: `${getPercent(dossier.sentiment.neutral)}%` }}
                className="bg-slate-400 dark:bg-slate-600 transition-all duration-500"
                title={`Neutral: ${getPercent(dossier.sentiment.neutral)}%`}
              />
            </div>

            {/* Legend */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1 text-xs">
              <div className="flex items-center gap-2.5 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                <div>
                  <div className="font-extrabold text-sm text-emerald-800 dark:text-emerald-300">
                    {getPercent(dossier.sentiment.positive)}%
                  </div>
                  <div className="text-[10px] text-emerald-700 dark:text-emerald-400 uppercase font-mono font-bold">
                    Positive
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2.5 p-3 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
                <div>
                  <div className="font-extrabold text-sm text-amber-800 dark:text-amber-300">
                    {getPercent(dossier.sentiment.cautious)}%
                  </div>
                  <div className="text-[10px] text-amber-700 dark:text-amber-400 uppercase font-mono font-bold">
                    Cautious
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2.5 p-3 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0" />
                <div>
                  <div className="font-extrabold text-sm text-rose-800 dark:text-rose-300">
                    {getPercent(dossier.sentiment.critical)}%
                  </div>
                  <div className="text-[10px] text-rose-700 dark:text-rose-400 uppercase font-mono font-bold">
                    Critical
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-400 shrink-0" />
                <div>
                  <div className="font-extrabold text-sm text-slate-800 dark:text-slate-300">
                    {getPercent(dossier.sentiment.neutral)}%
                  </div>
                  <div className="text-[10px] text-slate-600 dark:text-slate-400 uppercase font-mono font-bold">
                    Neutral
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Key Entities */}
          <div className="rounded-2xl p-6 sm:p-7 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 shadow-xs space-y-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900">
                <Layers className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold uppercase font-mono tracking-wider text-slate-900 dark:text-white">
                Key Entities
              </h3>
            </div>
            <div className="space-y-2.5">
              {dossier.keyEntities.length > 0 ? (
                dossier.keyEntities.map((ent) => (
                  <div
                    key={ent.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 hover:border-blue-300 dark:hover:border-slate-600 transition"
                  >
                    <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {ent.name}
                    </span>
                    <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/80 shrink-0">
                      {ent.type}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-500 italic">No linked entities recorded.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Storyline Milestones & Co-occurring Topics */}
      {dossier && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Milestones Track */}
          <div className="lg:col-span-2 rounded-2xl p-6 sm:p-7 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 shadow-xs space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-900">
                  <Calendar className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold uppercase font-mono tracking-wider text-slate-900 dark:text-white">
                  Storyline Milestones Track
                </h3>
              </div>
              <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
                Chronological Evolution
              </span>
            </div>

            {dossier.timeline.length > 0 ? (
              <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
                {dossier.timeline.map((item, idx) => (
                  <div key={idx} className="relative group">
                    {/* Circle Beacon */}
                    <div className="absolute -left-6 top-1 w-3 h-3 rounded-full bg-blue-600 dark:bg-blue-500 border-2 border-white dark:border-slate-900 shadow-xs group-hover:scale-125 transition-transform" />
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-[11px] font-mono text-slate-500 dark:text-slate-400">
                        <span suppressHydrationWarning>{formatDeterministicDate(item.date)}</span>
                        {item.sourcePublisher && (
                          <>
                            <span>&bull;</span>
                            <span className="text-amber-700 dark:text-amber-400 font-semibold">
                              {item.sourcePublisher}
                            </span>
                          </>
                        )}
                      </div>
                      {item.storySlug ? (
                        <Link
                          href={`/stories/${item.storySlug}`}
                          className="block text-sm font-bold text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition leading-snug"
                        >
                          {item.headline}
                        </Link>
                      ) : (
                        <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                          {item.headline}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic">No milestones registered yet.</p>
            )}
          </div>

          {/* Related Co-Occurring Topics */}
          <div className="rounded-2xl p-6 sm:p-7 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 shadow-xs space-y-5 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-900">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold uppercase font-mono tracking-wider text-slate-900 dark:text-white">
                  Related Topic Network
                </h3>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Frequently co-occurring topics connected through cross-wire stories and joint entity
                coverage.
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                {dossier.relatedTopics.length > 0 ? (
                  dossier.relatedTopics.map((rel) => (
                    <Link
                      key={rel.id}
                      href={`/topics/${rel.slug}`}
                      className="group inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-blue-50 dark:bg-slate-800/80 dark:hover:bg-blue-950/40 border border-slate-200 hover:border-blue-300 dark:border-slate-700/80 dark:hover:border-blue-500/50 text-xs transition cursor-pointer"
                    >
                      <Tag className="w-3 h-3 text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400" />
                      <span className="font-semibold text-slate-800 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-white">
                        {rel.name}
                      </span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 shadow-2xs">
                        {rel.coOccurrenceCount}
                      </span>
                    </Link>
                  ))
                ) : (
                  <p className="text-xs text-slate-500 italic">No co-occurring topics yet.</p>
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80">
              <Link
                href="/categories"
                className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center gap-1 transition"
              >
                <span>Browse Global Category Taxonomy</span> &rarr;
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="rounded-2xl p-6 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 animate-pulse space-y-4 shadow-xs"
            >
              <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/4" />
              <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded w-3/4" />
              <div className="h-16 bg-slate-100 dark:bg-slate-800/60 rounded" />
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && stories.length === 0 && (
        <div className="p-12 text-center rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 space-y-3">
          <Newspaper className="w-10 h-10 mx-auto text-slate-400 dark:text-slate-500" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            No Stories in #{topicName} Yet
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            Stories tagged with this topic will appear here as they are published by newsroom
            editors or verified wires.
          </p>
          <div className="pt-2">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-xs"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Return to Top Stories</span>
            </Link>
          </div>
        </div>
      )}

      {/* Stories Grid */}
      {!isLoading && stories.length > 0 && (
        <div className="space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800/80">
            <h2 className="text-xs font-bold font-mono uppercase tracking-widest text-slate-500 dark:text-slate-400">
              Verified Topic Stories ({stories.length})
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {stories.map((story) => (
              <div
                key={story.id}
                className="bg-white dark:bg-slate-900/70 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-md flex flex-col justify-between space-y-4 transition shadow-xs"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-mono">
                    <span className="uppercase text-blue-600 dark:text-blue-400 font-bold">
                      {story.articleType.replace('_', ' ')}
                    </span>
                    <span suppressHydrationWarning>
                      {formatDeterministicDate(story.publishedAt || story.createdAt)}
                    </span>
                  </div>

                  <Link href={`/stories/${story.slug}`} className="block group">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition leading-snug">
                      {story.title}
                    </h3>
                  </Link>

                  <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-3 leading-relaxed">
                    {story.summary}
                  </p>

                  {story.categories && story.categories.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {story.categories.map((c) => (
                        <span
                          key={c}
                          className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800/80 text-[10px] font-mono text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                        >
                          {c}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
                  <span className="text-slate-500 dark:text-slate-400">By {story.authorId}</span>
                  <Link
                    href={`/stories/${story.slug}`}
                    className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-bold transition flex items-center gap-1"
                  >
                    <span>Read Full Story</span> &rarr;
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
