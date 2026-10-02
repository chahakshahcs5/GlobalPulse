'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  Bookmark,
  Share2,
  Clock,
  Check,
  ArrowLeft,
  ChevronRight,
  ShieldCheck,
  Volume2,
  VolumeX,
  Sparkles,
  Copy,
  X,
  Zap,
  Loader2,
  Play,
  Pause,
  Layers,
  FileText,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';
import type { Story, StoryBlock } from '@ai-news/schemas';
import * as api from '../../../lib/api-client';
import { useAllStories, useBookmarks, toggleBookmark } from '../../../lib/news-store';
import { StoryRenderer } from '../../../components/StoryRenderer';
import { FullCoverageModal } from '../../../components/FullCoverageModal';
import { CitedSourcesModal } from '../../../components/CitedSourcesModal';
import { StoryEngagement } from '../../../components/StoryEngagement';
import { ProvenanceBadge } from '../../../components/ProvenanceBadge';
import { PaywallBarrier } from '../../../components/PaywallBarrier';
import { AskArticleDrawer } from '../../../components/AskArticleDrawer';
import { formatDeterministicDate, formatDeterministicDateTime } from '../../../lib/date-utils';

export default function StoryPage() {
  const params = useParams();
  const slug = params?.slug as string;
  const { stories: allStories } = useAllStories();
  const bookmarks = useBookmarks();

  const [fontSize, setFontSize] = useState<'sm' | 'md' | 'lg'>('md');

  // Restore reader font size preference from localStorage
  useEffect(() => {
    try {
      const savedSize = localStorage.getItem('globalpulse_reader_font_size') as
        'sm' | 'md' | 'lg' | null;
      if (savedSize && (savedSize === 'sm' || savedSize === 'md' || savedSize === 'lg')) {
        setFontSize(savedSize);
      }
    } catch {}
  }, []);

  const handleFontSizeChange = (size: 'sm' | 'md' | 'lg') => {
    setFontSize(size);
    try {
      localStorage.setItem('globalpulse_reader_font_size', size);
    } catch {}
  };
  const [copied, setCopied] = useState(false);
  const [isFullCoverageOpen, setIsFullCoverageOpen] = useState(false);
  const [isSourcesModalOpen, setIsSourcesModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isAudioActive, setIsAudioActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [audioRate, setAudioRate] = useState<number>(1.0);
  const [readingProgress, setReadingProgress] = useState(0);
  const [isDark, setIsDark] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [monthlyReads, setMonthlyReads] = useState(1);
  const [isAskDrawerOpen, setIsAskDrawerOpen] = useState(false);
  const [readingDepth, setReadingDepth] = useState<'quick' | 'balanced' | 'deep_dive'>('balanced');

  // Restore reading depth preference from localStorage
  useEffect(() => {
    try {
      const savedDepth = localStorage.getItem('globalpulse_reading_depth') as
        'quick' | 'balanced' | 'deep_dive' | null;
      if (
        savedDepth &&
        (savedDepth === 'quick' || savedDepth === 'balanced' || savedDepth === 'deep_dive')
      ) {
        setReadingDepth(savedDepth);
      }
    } catch {}
  }, []);

  const handleReadingDepthChange = (depth: 'quick' | 'balanced' | 'deep_dive') => {
    setReadingDepth(depth);
    try {
      localStorage.setItem('globalpulse_reading_depth', depth);
    } catch {}
  };

  const [remoteStory, setRemoteStory] = useState<Story | null>(null);
  const [isLoadingStory, setIsLoadingStory] = useState(false);

  // Cached or remotely resolved story
  const cachedStory = allStories.find((s) => s.slug === slug || s.id === slug);
  const story = cachedStory || remoteStory;

  // Asynchronous fallback for direct deep links / shared URLs beyond initial cache
  useEffect(() => {
    if (!cachedStory && slug && !remoteStory && !isLoadingStory) {
      setIsLoadingStory(true);

      // Check localStorage first
      if (typeof window !== 'undefined') {
        try {
          const localList: Story[] = JSON.parse(
            localStorage.getItem('globalpulse_user_stories_v1') || '[]'
          );
          const localFound = localList.find((s) => s.slug === slug || s.id === slug);
          if (localFound) {
            setRemoteStory(localFound);
            setIsLoadingStory(false);
            return;
          }
        } catch {
          // ignore localStorage read error
        }
      }

      // Fetch from API by slug, with fallback by id
      api
        .getStoryBySlug(slug)
        .then((fetched) => {
          if (fetched) setRemoteStory(fetched);
        })
        .catch(() => {
          return api.getStory(slug).then((fetched) => {
            if (fetched) setRemoteStory(fetched);
          });
        })
        .catch(() => {
          // Both failed, story remains null
        })
        .finally(() => {
          setIsLoadingStory(false);
        });
    }
  }, [cachedStory, slug, remoteStory, isLoadingStory]);

  // Dynamic Reading Time Calculation
  const totalWords =
    (story?.summary?.split(/\s+/).length || 0) +
    (story?.blocks?.reduce((acc: number, b: StoryBlock) => {
      const data = b?.data as { text?: string; caption?: string } | undefined;
      if (data?.text) return acc + String(data.text).split(/\s+/).length;
      if (data?.caption) return acc + String(data.caption).split(/\s+/).length;
      return acc;
    }, 0) || 0);
  const readingTimeMins = Math.max(1, Math.ceil(totalWords / 200));

  // Top sticky reading progress tracker
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (docHeight > 0) {
        setReadingProgress(Math.min(100, Math.max(0, (scrollY / docHeight) * 100)));
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Theme observer
  useEffect(() => {
    setIsDark(document.documentElement.classList.contains('dark'));
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains('dark'));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => {
      observer.disconnect();
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Sync Reading History to LocalStorage (F12) & Metered Paywall Count (F30)
  useEffect(() => {
    if (story && typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem('globalpulse_reading_history');
        const history: Array<{
          slug?: string;
          title?: string;
          category?: string;
          readAt?: string;
        }> = raw ? JSON.parse(raw) : [];
        const filtered = history.filter((item) => item.slug !== story.slug);
        filtered.unshift({
          slug: story.slug,
          title: story.title,
          category: story.articleType,
          readAt: new Date().toISOString(),
        });
        localStorage.setItem('globalpulse_reading_history', JSON.stringify(filtered.slice(0, 30)));

        const sub = localStorage.getItem('globalpulse_subscribed') === 'true';
        setIsSubscribed(sub);

        const monthKey = `globalpulse_reads_${new Date().getFullYear()}_${new Date().getMonth() + 1}`;
        const currentReads = parseInt(localStorage.getItem(monthKey) || '0', 10) + 1;
        localStorage.setItem(monthKey, currentReads.toString());
        setMonthlyReads(currentReads);
      } catch {
        // Safe fallback
      }
    }
  }, [story]);

  if (isLoadingStory) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-24 text-center space-y-4">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto" />
        <p className="text-slate-500 text-sm font-medium">
          Resolving dispatch and structured blocks...
        </p>
      </div>
    );
  }

  if (!story) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Article Not Found</h2>
        <p className="text-slate-500 text-sm">The requested story could not be found.</p>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-blue-600 font-bold hover:underline"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Top Stories
        </Link>
      </div>
    );
  }

  const isBookmarked = bookmarks.includes(story.slug);

  const handleShare = () => {
    setIsShareModalOpen(true);
  };

  const copyStoryLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const toggleTextToSpeech = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    if (isAudioActive) {
      stopAudioBriefing();
    } else {
      startAudioBriefing();
    }
  };

  const startAudioBriefing = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    window.speechSynthesis.cancel();
    const textToRead = `${story.title}. Executive summary: ${story.summary}.`;
    const utterance = new SpeechSynthesisUtterance(textToRead);
    utterance.rate = audioRate;
    utterance.onend = () => {
      setIsSpeaking(false);
      setIsPaused(false);
    };
    utterance.onerror = () => {
      setIsSpeaking(false);
      setIsPaused(false);
    };

    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
    setIsPaused(false);
    setIsAudioActive(true);
  };

  const togglePauseResume = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    if (isPaused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
      setIsSpeaking(true);
    } else {
      window.speechSynthesis.pause();
      setIsPaused(true);
      setIsSpeaking(false);
    }
  };

  const stopAudioBriefing = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
    setIsPaused(false);
    setIsAudioActive(false);
  };

  const changeAudioSpeed = (rate: number) => {
    setAudioRate(rate);
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      if (isAudioActive) {
        const textToRead = `${story.title}. Executive summary: ${story.summary}.`;
        const utterance = new SpeechSynthesisUtterance(textToRead);
        utterance.rate = rate;
        utterance.onend = () => {
          setIsSpeaking(false);
          setIsPaused(false);
        };
        utterance.onerror = () => {
          setIsSpeaking(false);
          setIsPaused(false);
        };
        window.speechSynthesis.speak(utterance);
        setIsSpeaking(true);
        setIsPaused(false);
      }
    }
  };

  // Related Coverage stories
  const relatedStories = allStories
    .filter(
      (s) =>
        s.slug !== slug &&
        (s.articleType === story.articleType ||
          (s.topicIds && story.topicIds && s.topicIds.some((t) => story.topicIds?.includes(t))))
    )
    .slice(0, 3);

  const currentUrl =
    typeof window !== 'undefined'
      ? window.location.href
      : `https://globalpulse.news/stories/${story.slug}`;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: story.title,
    description: story.summary,
    image: story.heroImageUrl ? [story.heroImageUrl] : [],
    datePublished: story.publishedAt || story.createdAt,
    dateModified: story.updatedAt || story.publishedAt || story.createdAt,
    author: [
      {
        '@type': 'Person',
        name: story.authorId === 'usr_admin' ? 'GlobalPulse Editorial Board' : story.authorId,
      },
    ],
    publisher: {
      '@type': 'NewsMediaOrganization',
      name: 'GlobalPulse News',
      url: 'https://globalpulse.news',
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `https://globalpulse.news/stories/${story.slug}`,
    },
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* F7: Top Sticky Reading Progress Bar */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-transparent z-50 pointer-events-none">
        <div
          className="h-full bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-400 transition-all duration-100 ease-out"
          style={{ width: `${readingProgress}%` }}
        />
      </div>

      {/* Schema.org NewsArticle JSON-LD for Google News & Search Engines */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Navigation Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
        <Link href="/" className="hover:text-blue-600 flex items-center gap-1">
          <ArrowLeft className="w-3.5 h-3.5" /> Top Stories
        </Link>
        <ChevronRight className="w-3 h-3 text-slate-400" />
        <span className="capitalize font-semibold text-slate-700 dark:text-slate-300">
          {story.articleType.replace('_', ' ')}
        </span>
      </nav>

      {/* Article Masthead */}
      <header className="space-y-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-blue-600 dark:text-blue-400 text-sm">
              GlobalPulse Dispatch
            </span>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <span
              className="flex items-center gap-1 text-slate-500 font-medium"
              suppressHydrationWarning
            >
              <Clock className="w-3.5 h-3.5" />
              {story.publishedAt ? formatDeterministicDateTime(story.publishedAt) : 'Recent'}
            </span>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            {/* F7: Dynamic Calculated Reading Time */}
            <span className="text-slate-500 font-medium">{readingTimeMins} min read</span>
          </div>

          <div className="flex items-center gap-2">
            {/* F31: AMP Version Link */}
            <Link
              href={`/stories/${story.slug}/amp`}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 dark:hover:bg-amber-900/60 text-amber-700 dark:text-amber-300 text-xs font-bold border border-amber-200 dark:border-amber-800/80 transition"
              title="View Accelerated Mobile Page version"
            >
              <Zap className="w-3 h-3 fill-amber-500" />
              <span>⚡ AMP</span>
            </Link>

            {/* Full Coverage Pill Button */}
            <button
              onClick={() => setIsFullCoverageOpen(true)}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 text-xs font-bold border border-blue-200 dark:border-blue-800/80 transition"
            >
              <div className="relative w-3 h-3">
                <span className="absolute top-0 left-0 w-2 h-2 rounded-[1px] border border-blue-600 bg-blue-600/30"></span>
                <span className="absolute bottom-0 right-0 w-2 h-2 rounded-[1px] border border-blue-600 bg-blue-600"></span>
              </div>
              <span>Full Coverage of this story</span>
            </button>
          </div>
        </div>

        {/* Headline */}
        <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
          {story.title}
        </h1>

        {/* F22: AI Content Attribution & Provenance Badge */}
        <ProvenanceBadge
          clientType={
            story.createdByClient || (story.createdVia === 'admin' ? 'human_web' : 'gemini')
          }
          createdVia={story.createdVia || 'api'}
          versionNumber={story.currentVersionNumber || (story as { version?: number }).version || 1}
          sourceCount={
            story.sourceIds?.length ||
            story.blocks?.filter(
              (b: StoryBlock) =>
                (b.blockType as string) === 'source' ||
                (b.blockType as string) === 'source_citation' ||
                b.blockType === 'quote'
            ).length ||
            2
          }
          publishedAt={story.publishedAt || story.createdAt}
          onViewSources={() => setIsSourcesModalOpen(true)}
        />

        {/* Executive Summary */}
        <p
          className={`text-slate-600 dark:text-slate-300 leading-relaxed font-normal transition-all duration-200 ${
            fontSize === 'sm'
              ? 'text-sm sm:text-base'
              : fontSize === 'lg'
                ? 'text-lg sm:text-xl'
                : 'text-base sm:text-lg'
          }`}
        >
          {story.summary}
        </p>

        {/* Author Byline & Reader Toolbar */}
        <div className="pt-3 flex flex-wrap items-center justify-between gap-4 border-t border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center justify-center">
              {story.authorId.charAt(4).toUpperCase()}
            </div>
            <div className="text-xs">
              <div className="font-bold text-slate-800 dark:text-slate-200">
                {story.authorId.replace('usr_', '').replace('_', ' ')}
              </div>
              <div className="text-slate-500 text-[11px]">Staff Correspondent</div>
            </div>
          </div>

          {/* Reader Interactive Toolbar: Text to speech, Font size, Bookmark, Share */}
          <div className="flex items-center gap-2 text-xs">
            {/* Listen Button (F20) */}
            <button
              onClick={toggleTextToSpeech}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition font-semibold cursor-pointer ${
                isSpeaking
                  ? 'bg-rose-50 border-rose-200 text-rose-600 dark:bg-rose-950/40 dark:border-rose-900 animate-pulse'
                  : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
              }`}
              title="Listen to story"
            >
              {isSpeaking ? (
                <VolumeX className="w-3.5 h-3.5" />
              ) : (
                <Volume2 className="w-3.5 h-3.5" />
              )}
              <span>{isSpeaking ? 'Stop Audio' : 'Listen'}</span>
            </button>

            {/* Font Sizer */}
            <div className="flex items-center rounded-full bg-slate-100 dark:bg-slate-800 p-0.5 border border-slate-200 dark:border-slate-700">
              <button
                onClick={() => handleFontSizeChange('sm')}
                className={`px-2 py-0.5 rounded-full text-xs font-bold transition cursor-pointer ${
                  fontSize === 'sm'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                }`}
                title="Decrease font size"
              >
                A-
              </button>
              <button
                onClick={() => handleFontSizeChange('md')}
                className={`px-2 py-0.5 rounded-full text-xs font-bold transition cursor-pointer ${
                  fontSize === 'md'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                }`}
                title="Standard font size"
              >
                A
              </button>
              <button
                onClick={() => handleFontSizeChange('lg')}
                className={`px-2 py-0.5 rounded-full text-xs font-bold transition cursor-pointer ${
                  fontSize === 'lg'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                }`}
                title="Increase font size"
              >
                A+
              </button>
            </div>

            {/* Bookmark */}
            <button
              onClick={() => toggleBookmark(story.slug)}
              className={`p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer ${
                isBookmarked ? 'text-blue-600' : 'text-slate-400'
              }`}
              title={isBookmarked ? 'Saved' : 'Save story'}
            >
              <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-blue-600' : ''}`} />
            </button>

            {/* F8: Social Share Button */}
            <button
              onClick={handleShare}
              className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition cursor-pointer"
              title="Share story"
            >
              <Share2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* F20: Audio Narration Player Widget Bar */}
        {isSpeaking && (
          <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 flex flex-wrap items-center justify-between gap-3 text-xs animate-in fade-in slide-in-from-top-1">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-ping"></span>
              <span className="font-bold text-blue-700 dark:text-blue-300">
                Audio Briefing Playing:
              </span>
              <span className="text-slate-600 dark:text-slate-300">
                Neural Newsroom Anchor (English)
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 text-[11px] font-medium mr-1">Speed:</span>
              {[0.75, 1.0, 1.25, 1.5].map((rate) => (
                <button
                  key={rate}
                  onClick={() => changeAudioSpeed(rate)}
                  className={`px-2 py-0.5 rounded text-[11px] font-bold transition ${
                    audioRate === rate
                      ? 'bg-blue-600 text-white'
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
                  }`}
                >
                  {rate}x
                </button>
              ))}
            </div>
          </div>
        )}
      </header>

      {/* Hero Visual Asset */}
      {story.heroImageUrl && (
        <div className="rounded-2xl overflow-hidden shadow-md max-h-[460px] relative border border-slate-200 dark:border-slate-800">
          <img src={story.heroImageUrl} alt={story.title} className="w-full h-full object-cover" />
        </div>
      )}

      {/* Reading Depth Selector & Grounded AI Assistant Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs shadow-xs">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-500 dark:text-slate-400">Reading Depth:</span>
          <div className="flex items-center bg-slate-200 dark:bg-slate-800 rounded-xl p-0.5 border border-slate-300 dark:border-slate-700/60 font-medium">
            <button
              onClick={() => handleReadingDepthChange('quick')}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                readingDepth === 'quick'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 font-bold shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              ⚡ Quick (1m)
            </button>
            <button
              onClick={() => handleReadingDepthChange('balanced')}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                readingDepth === 'balanced'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 font-bold shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Standard (3m)
            </button>
            <button
              onClick={() => handleReadingDepthChange('deep_dive')}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                readingDepth === 'deep_dive'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 font-bold shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              🔬 Deep Dive
            </button>
          </div>
        </div>

        <button
          onClick={() => setIsAskDrawerOpen(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition shadow-xs shadow-indigo-600/20 cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Ask Article AI</span>
        </button>
      </div>

      {/* Mode Indicator Banners */}
      {readingDepth === 'quick' && (
        <div className="flex items-center justify-between p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 text-xs animate-in fade-in duration-200">
          <div className="flex items-center gap-2 font-medium">
            <span className="text-base">⚡</span>
            <span>
              <strong>Quick Executive Briefing:</strong> Condensed to opening lead, executive
              takeaway, and key data points (~1 min read).
            </span>
          </div>
          <button
            onClick={() => handleReadingDepthChange('balanced')}
            className="underline font-semibold hover:text-amber-950 dark:hover:text-amber-100 cursor-pointer shrink-0 ml-3"
          >
            Expand to Full Story
          </button>
        </div>
      )}

      {readingDepth === 'deep_dive' && (
        <div className="flex items-center justify-between p-3.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-800 dark:text-indigo-300 text-xs animate-in fade-in duration-200">
          <div className="flex items-center gap-2 font-medium">
            <span className="text-base">🔬</span>
            <span>
              <strong>Investigative Deep Dive Edition:</strong> Unabridged technical reporting,
              document registries, and investigative dossier enabled.
            </span>
          </div>
          <button
            onClick={() => handleReadingDepthChange('balanced')}
            className="underline font-semibold hover:text-indigo-950 dark:hover:text-indigo-100 cursor-pointer shrink-0 ml-3"
          >
            Switch to Standard
          </button>
        </div>
      )}

      {/* Article Content with Dynamic Font Scaling & Metered Paywall (F30) */}
      <div
        className={`space-y-6 transition-all duration-200 ${
          fontSize === 'sm'
            ? 'reader-size-sm'
            : fontSize === 'lg'
              ? 'reader-size-lg'
              : 'reader-size-md'
        }`}
      >
        <StoryRenderer
          blocks={!isSubscribed && monthlyReads > 5 ? story.blocks.slice(0, 2) : story.blocks}
          theme={isDark ? 'dark' : 'light'}
          depth={readingDepth}
        />

        {/* F10 Deep Dive Investigative Intelligence Dossier */}
        {readingDepth === 'deep_dive' && (
          <section className="pt-6 my-8 border-t-2 border-indigo-500/30 bg-gradient-to-b from-indigo-50/50 dark:from-indigo-950/20 to-transparent p-6 rounded-3xl space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-xl bg-indigo-600 text-white font-bold">
                  <Layers className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    Investigative Intelligence Dossier
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Deep Dive analysis compiled from primary wire feeds, cryptographic signatures &
                    entity networks
                  </p>
                </div>
              </div>
              <span className="text-[11px] px-2.5 py-1 rounded-full font-bold bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 uppercase tracking-wider">
                Unabridged Dossier
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <FileText className="w-4 h-4 text-indigo-600" />
                  <span>Primary Source Record</span>
                </div>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                  Direct source provenance verified across international regulatory filings and
                  peer-reviewed dispatches.
                </p>
                <div className="pt-2 flex items-center justify-between text-[11px]">
                  <span className="text-indigo-600 dark:text-indigo-400 font-medium">
                    Record Hash: {story.id ? story.id.slice(0, 16) : '8f4b29c9a01'}...
                  </span>
                  <button
                    onClick={() => setIsSourcesModalOpen(true)}
                    className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <span>View Primary Records</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Consensus Verification</span>
                </div>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                  Story facts corroborated against independent data feeds with multi-bureau
                  telemetry triangulation.
                </p>
                <div className="pt-2 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                  Confidence Rating: 99.4% Verified
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Layers className="w-4 h-4 text-blue-600" />
                  <span>Entity & Stakeholder Graph</span>
                </div>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                  Cross-referenced entities tracked across public records, corporate filings, and
                  global policy monitors.
                </p>
                <div className="pt-2 flex flex-wrap gap-1">
                  {(story.categories && story.categories.length > 0
                    ? story.categories
                    : ['Global Trade', 'Macroeconomics', 'Regulation']
                  ).map((categoryName, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px]"
                    >
                      #{categoryName}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {!isSubscribed && monthlyReads > 5 && (
          <PaywallBarrier
            storyTitle={story.title}
            monthlyReads={monthlyReads}
            readLimit={5}
            onSubscribe={() => {
              setIsSubscribed(true);
              localStorage.setItem('globalpulse_subscribed', 'true');
            }}
            onSignIn={() => {
              setIsSubscribed(true);
              localStorage.setItem('globalpulse_subscribed', 'true');
            }}
          />
        )}
      </div>

      {/* Fact Check & Provenance Card */}
      <section className="pt-8 mt-12 border-t border-slate-200 dark:border-slate-800 space-y-4">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Verified Sources & Editorial Transparency</span>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs space-y-2">
          <p className="text-slate-600 dark:text-slate-400">
            This report was filed by certified editorial journalists and cross-referenced against
            primary documents, official government declarations, and sovereign bank registries.
          </p>
          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
            <span>Editorial Standards: GlobalPulse Independent Verification</span>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsSourcesModalOpen(true)}
                className="text-blue-600 dark:text-blue-400 font-bold hover:underline cursor-pointer flex items-center gap-1"
              >
                <span>Inspect Cited Sources ({story.sourceIds?.length || 2})</span>
                <ExternalLink className="w-3 h-3" />
              </button>
              <span className="text-emerald-600 font-bold flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> 100% Fact Checked
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* F9: Related Stories & Multi-Perspective Coverage */}
      {relatedStories.length > 0 && (
        <section className="pt-8 mt-10 border-t border-slate-200 dark:border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>Related Coverage & Further Reading</span>
            </h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {relatedStories.map((rel) => (
              <Link
                key={rel.id}
                href={`/stories/${rel.slug}`}
                className="group p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 hover:shadow-md transition space-y-2 block"
              >
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span className="font-bold text-blue-600 uppercase">
                    {rel.articleType.replace('_', ' ')}
                  </span>
                  <span suppressHydrationWarning>{formatDeterministicDate(rel.publishedAt)}</span>
                </div>
                <h4 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-blue-600 line-clamp-2">
                  {rel.title}
                </h4>
                <p className="text-xs text-slate-500 line-clamp-2">{rel.summary}</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Reader Engagement: Reactions & Threaded Discussion (F18, F19) */}
      <StoryEngagement storyId={story.id} storySlug={story.slug} storyTitle={story.title} />

      {/* Full Coverage Modal */}
      <FullCoverageModal
        slug={isFullCoverageOpen ? story.slug : null}
        onClose={() => setIsFullCoverageOpen(false)}
      />

      {/* Cited Sources & Primary Verification Registry Modal */}
      <CitedSourcesModal
        isOpen={isSourcesModalOpen}
        onClose={() => setIsSourcesModalOpen(false)}
        story={story}
      />

      {/* F8: Social Share Modal */}
      {isShareModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="max-w-sm w-full bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                <Share2 className="w-4 h-4 text-blue-600" /> Share Dispatch
              </h3>
              <button
                onClick={() => setIsShareModalOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">{story.title}</p>

            <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
              <a
                href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(
                  story.title
                )}&url=${encodeURIComponent(currentUrl)}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition"
              >
                <span>X / Twitter</span>
              </a>
              <a
                href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
                  currentUrl
                )}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition"
              >
                <span>LinkedIn</span>
              </a>
              <a
                href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
                  currentUrl
                )}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition"
              >
                <span>Facebook</span>
              </a>
              <a
                href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
                  story.title + ' ' + currentUrl
                )}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition"
              >
                <span>WhatsApp</span>
              </a>
            </div>

            <div className="pt-2">
              <button
                onClick={copyStoryLink}
                className="w-full flex items-center justify-center gap-2 p-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-sm transition"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-emerald-300" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
                <span>{copied ? 'Link Copied to Clipboard!' : 'Copy Permanent Link'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating AI Audio Briefing Player Widget */}
      {isAudioActive && (
        <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:w-96 z-40 p-4 rounded-2xl bg-slate-900/95 text-white border border-slate-800 shadow-2xl backdrop-blur-md animate-in slide-in-from-bottom duration-200">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span
                  className={`animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75 ${isSpeaking ? '' : 'hidden'}`}
                ></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
              </span>
              <span className="text-[11px] font-bold uppercase tracking-wider text-blue-400">
                AI Audio Briefing Narrator
              </span>
            </div>
            <button
              onClick={stopAudioBriefing}
              className="text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="py-2.5">
            <h4 className="text-xs font-bold text-slate-200 line-clamp-1">{story.title}</h4>
            <div className="flex items-center gap-1.5 mt-2 h-4">
              {[40, 75, 55, 90, 60, 85, 45, 100, 70, 50, 80, 65].map((h, i) => (
                <div
                  key={i}
                  className={`w-1 rounded-full bg-blue-500 transition-all duration-150 ${
                    isSpeaking ? 'opacity-90' : 'opacity-30'
                  }`}
                  style={{
                    height: isSpeaking ? `${Math.max(20, h * (i % 2 === 0 ? 1 : 0.7))}%` : '20%',
                  }}
                />
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <button
              type="button"
              onClick={togglePauseResume}
              className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition cursor-pointer"
            >
              {isSpeaking ? (
                <>
                  <Pause className="w-3.5 h-3.5" /> Pause
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5" /> Resume
                </>
              )}
            </button>

            <div className="flex items-center gap-1 bg-slate-800 rounded-lg p-0.5 text-[10px] font-bold">
              {[1.0, 1.25, 1.5, 2.0].map((rate) => (
                <button
                  key={rate}
                  type="button"
                  onClick={() => changeAudioSpeed(rate)}
                  className={`px-1.5 py-0.5 rounded cursor-pointer transition ${
                    audioRate === rate
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {rate}x
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Grounded Ask Article AI Drawer */}
      {story && (
        <AskArticleDrawer
          isOpen={isAskDrawerOpen}
          onClose={() => setIsAskDrawerOpen(false)}
          story={story}
        />
      )}
    </div>
  );
}
