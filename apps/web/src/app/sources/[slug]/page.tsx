'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { getPublisherProfile, followTarget, unfollowTarget } from '../../../lib/api-client';
import { DEMO_PUBLISHERS, DEMO_SOURCES, DEMO_STORIES } from '../../../lib/demo-data';
import { formatDeterministicDate } from '../../../lib/date-utils';
import {
  CheckCircle2,
  Globe,
  Plus,
  Check,
  ExternalLink,
  ArrowLeft,
  FileText,
  Newspaper,
  ShieldCheck,
  Building2,
} from 'lucide-react';
import type { PublisherProfile, PublisherStoryRef } from '@ai-news/schemas';

export default function PublisherDetailPage() {
  const params = useParams();
  const slug = (params?.slug as string) || '';

  const [profile, setProfile] = useState<PublisherProfile | null>(null);
  const [activeTab, setActiveTab] = useState<'articles' | 'stories'>('articles');
  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    // Check localStorage for initial follow state
    try {
      const stored = localStorage.getItem('globalpulse_followed_sources');
      const followed: string[] = stored ? JSON.parse(stored) : [];
      if (followed.includes(slug)) {
        setIsFollowing(true);
      }
    } catch {}

    getPublisherProfile(slug)
      .then((data) => {
        if (!isMounted) return;
        if (data && data.publisher) {
          setProfile(data);
          setIsFollowing(!!data.isFollowing);
          setFollowerCount(data.followerCount || 0);
          setIsLoading(false);
        } else {
          fallbackToDemo();
        }
      })
      .catch(() => {
        if (!isMounted) return;
        fallbackToDemo();
      });

    function fallbackToDemo() {
      // Find matching demo publisher
      const demoPub = Object.values(DEMO_PUBLISHERS).find(
        (p) => p.slug === slug || p.id === slug || p.domain === slug
      );

      if (demoPub) {
        // Collect demo sources under this publisher
        const citedArticles = Object.values(DEMO_SOURCES).filter(
          (s) =>
            s.publisherId === demoPub.id ||
            s.publisher.toLowerCase() === demoPub.name.toLowerCase() ||
            (s.domain && s.domain === demoPub.domain)
        );

        const citedIds = new Set(citedArticles.map((a) => a.id));
        const referencingStories: PublisherStoryRef[] = DEMO_STORIES.filter((story) =>
          story.sourceIds.some((id) => citedIds.has(id))
        ).map((s) => ({
          id: s.id,
          slug: s.slug,
          title: s.title,
          summary: s.summary,
          publishedAt: s.publishedAt,
          articleType: s.articleType,
          heroImageUrl: s.heroImageUrl,
        }));

        const demoProfile: PublisherProfile = {
          publisher: demoPub,
          citedArticles,
          referencingStories,
          followerCount: demoPub.followerCount || 1840,
          isFollowing: false,
        };

        setProfile(demoProfile);
        setFollowerCount(demoPub.followerCount || 1840);
      }
      setIsLoading(false);
    }

    return () => {
      isMounted = false;
    };
  }, [slug]);

  const handleFollowToggle = async () => {
    if (!profile) return;
    const next = !isFollowing;
    setIsFollowing(next);
    setFollowerCount((prev) => (next ? prev + 1 : Math.max(0, prev - 1)));

    try {
      const stored = localStorage.getItem('globalpulse_followed_sources');
      const followed: string[] = stored ? JSON.parse(stored) : [];
      const updated = next
        ? Array.from(new Set([...followed, profile.publisher.id, profile.publisher.slug]))
        : followed.filter((id) => id !== profile.publisher.id && id !== profile.publisher.slug);
      localStorage.setItem('globalpulse_followed_sources', JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent('globalpulse_sources_updated'));
    } catch {}

    if (next) {
      await followTarget('source', profile.publisher.id);
    } else {
      await unfollowTarget('source', profile.publisher.id);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-12 space-y-6">
        <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/4 animate-pulse" />
        <div className="h-48 bg-white dark:bg-slate-900/60 rounded-3xl border border-slate-200 dark:border-slate-800 animate-pulse" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-4">
        <Building2 className="w-12 h-12 text-slate-400 dark:text-slate-500 mx-auto" />
        <h2 className="text-2xl font-black text-slate-900 dark:text-white">
          Source Publication Not Found
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          The publication "{slug}" is not currently registered in the source registry.
        </p>
        <Link
          href="/sources"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-500 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Return to Sources Directory
        </Link>
      </div>
    );
  }

  const { publisher, citedArticles, referencingStories } = profile;
  const domain =
    publisher.domain ||
    publisher.websiteUrl
      ?.replace(/^https?:\/\//, '')
      .replace(/^www\./, '')
      .split('/')[0] ||
    '';

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Back link */}
      <div>
        <Link
          href="/sources"
          className="inline-flex items-center gap-1.5 text-xs font-mono text-blue-600 dark:text-blue-400 hover:text-slate-900 dark:hover:text-white transition-colors uppercase tracking-wider"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>All Verified Sources</span>
        </Link>
      </div>

      {/* Publisher Hero Profile Banner */}
      <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-gradient-to-b dark:from-slate-900/90 dark:to-slate-950 p-6 sm:p-8 space-y-6 relative overflow-hidden shadow-xs dark:shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/5 dark:bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="flex items-start sm:items-center gap-5">
            {/* Publisher Logo */}
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-slate-100 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700/80 overflow-hidden flex items-center justify-center shrink-0 shadow-sm">
              {publisher.logoUrl ? (
                <img
                  src={publisher.logoUrl}
                  alt={publisher.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              ) : null}
              <span className="font-black text-2xl text-blue-600 dark:text-blue-400 font-mono">
                {publisher.name.slice(0, 2).toUpperCase()}
              </span>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                  {publisher.name}
                </h1>
                {publisher.isVerified && (
                  <span title="Verified Primary Source">
                    <CheckCircle2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </span>
                )}
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-500/20 uppercase">
                  {publisher.category || 'General'}
                </span>
              </div>

              <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 font-mono flex-wrap">
                {domain && (
                  <a
                    href={publisher.websiteUrl || `https://${domain}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300"
                  >
                    <Globe className="w-3.5 h-3.5 text-slate-400" />
                    <span>{domain}</span>
                    <ExternalLink className="w-3 h-3 text-slate-400" />
                  </a>
                )}
                {publisher.country && (
                  <>
                    <span className="text-slate-300 dark:text-slate-600">•</span>
                    <span>{publisher.country}</span>
                  </>
                )}
                {publisher.credibilityScore && (
                  <>
                    <span className="text-slate-300 dark:text-slate-600">•</span>
                    <span className="text-emerald-700 dark:text-emerald-400 font-bold flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      {publisher.credibilityScore}% Trust Rating
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Follow Button & Stats */}
          <div className="flex items-center gap-3 self-start md:self-center">
            <button
              onClick={handleFollowToggle}
              type="button"
              className={`px-5 py-2.5 rounded-full text-sm font-bold flex items-center gap-2 transition-all duration-200 cursor-pointer shadow-sm ${
                isFollowing
                  ? 'bg-blue-50 dark:bg-blue-600/20 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-500/40 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/20 dark:hover:text-rose-300'
                  : 'bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-200 text-white dark:text-slate-950 font-bold'
              }`}
            >
              {isFollowing ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Following</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>Follow Source</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Editorial Bio */}
        {publisher.description && (
          <p className="text-sm text-slate-600 dark:text-slate-300 max-w-3xl leading-relaxed border-t border-slate-100 dark:border-slate-800/80 pt-4">
            {publisher.description}
          </p>
        )}

        {/* Quick Metrics Bar */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80 grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs font-mono">
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80">
            <span className="text-slate-500 block text-[11px]">Followers</span>
            <span className="text-base font-bold text-slate-900 dark:text-white mt-0.5 block">
              {followerCount.toLocaleString()}
            </span>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80">
            <span className="text-slate-500 block text-[11px]">Cited Reference Articles</span>
            <span className="text-base font-bold text-blue-600 dark:text-blue-400 mt-0.5 block">
              {citedArticles.length}
            </span>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 col-span-2 sm:col-span-1">
            <span className="text-slate-500 block text-[11px]">GlobalPulse Stories Citing</span>
            <span className="text-base font-bold text-emerald-600 dark:text-emerald-400 mt-0.5 block">
              {referencingStories.length}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex items-center gap-3 border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setActiveTab('articles')}
          type="button"
          className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
            activeTab === 'articles'
              ? 'border-blue-600 dark:border-blue-500 text-blue-600 dark:text-white'
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Cited Reference Articles ({citedArticles.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('stories')}
          type="button"
          className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
            activeTab === 'stories'
              ? 'border-blue-600 dark:border-blue-500 text-blue-600 dark:text-white'
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <Newspaper className="w-4 h-4" />
          <span>Referencing Stories ({referencingStories.length})</span>
        </button>
      </div>

      {/* Tab 1 Content: All Cited Articles under this Publisher (news1, news2, etc.) */}
      {activeTab === 'articles' && (
        <div className="space-y-4">
          <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
            Specific articles, wire dispatches, and documents from <strong>{publisher.name}</strong>{' '}
            registered and cited across platform coverage.
          </p>

          {citedArticles.length === 0 ? (
            <div className="p-12 text-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 space-y-2">
              <FileText className="w-8 h-8 text-slate-400 dark:text-slate-500 mx-auto" />
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                No Specific Articles Registered Yet
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                When external AI reporters cite articles from {domain}, they will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {citedArticles.map((src) => (
                <div
                  key={src.id}
                  className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2 text-xs font-mono text-slate-500 dark:text-slate-400">
                      <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-blue-700 dark:text-blue-400 font-bold uppercase text-[10px]">
                        {src.sourceType}
                      </span>
                      {src.publishedAt && (
                        <span suppressHydrationWarning>
                          {formatDeterministicDate(src.publishedAt)}
                        </span>
                      )}
                      {src.author && (
                        <>
                          <span className="text-slate-300 dark:text-slate-600">•</span>
                          <span>By {src.author}</span>
                        </>
                      )}
                    </div>

                    <h3 className="text-base font-bold text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                      <a href={src.url} target="_blank" rel="noopener noreferrer">
                        {src.title}
                      </a>
                    </h3>

                    {src.permissibleExcerpt && (
                      <p className="text-xs text-slate-600 dark:text-slate-400 italic line-clamp-2 bg-slate-50 dark:bg-slate-950/60 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800/60">
                        "{src.permissibleExcerpt}"
                      </p>
                    )}
                  </div>

                  <a
                    href={src.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="self-start sm:self-center shrink-0 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/80 dark:hover:bg-slate-700 text-xs font-semibold text-slate-800 dark:text-white flex items-center gap-1.5 transition-colors shadow-xs"
                  >
                    <span>View Primary Source</span>
                    <ExternalLink className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 2 Content: Platform Stories referencing this Publisher */}
      {activeTab === 'stories' && (
        <div className="space-y-4">
          <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
            GlobalPulse investigative stories and dispatches that corroborate factual claims with
            citations from <strong>{publisher.name}</strong>.
          </p>

          {referencingStories.length === 0 ? (
            <div className="p-12 text-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 space-y-2">
              <Newspaper className="w-8 h-8 text-slate-400 dark:text-slate-500 mx-auto" />
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                No Stories Referencing This Publisher Yet
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Stories citing articles from {publisher.name} will appear in this list.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {referencingStories.map((story) => (
                <Link
                  key={story.id}
                  href={`/stories/${story.slug}`}
                  className="group rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-5 flex flex-col justify-between space-y-3 hover:border-blue-500/40 hover:shadow-md transition-all shadow-xs"
                >
                  <div className="space-y-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-500/20">
                      {story.articleType.replace('_', ' ')}
                    </span>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2">
                      {story.title}
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                      {story.summary}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs font-mono text-slate-500 dark:text-slate-400">
                    <span suppressHydrationWarning>
                      {story.publishedAt ? formatDeterministicDate(story.publishedAt) : 'Recent'}
                    </span>
                    <span className="text-blue-600 dark:text-blue-400 font-semibold group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                      Read Story →
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
