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
} from 'lucide-react';
import { useAllStories, useBookmarks, toggleBookmark } from '../../../lib/news-store';
import { StoryRenderer } from '../../../components/StoryRenderer';
import { FullCoverageModal } from '../../../components/FullCoverageModal';
import { StoryEngagement } from '../../../components/StoryEngagement';

export default function StoryPage() {
  const params = useParams();
  const slug = params?.slug as string;
  const { stories: allStories } = useAllStories();
  const bookmarks = useBookmarks();

  const [fontSize, setFontSize] = useState<'sm' | 'md' | 'lg'>('md');
  const [copied, setCopied] = useState(false);
  const [isFullCoverageOpen, setIsFullCoverageOpen] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isDark, setIsDark] = useState(false);

  const story = allStories.find((s) => s.slug === slug);

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

  if (!story) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Article Not Found</h2>
        <p className="text-slate-500 text-sm">The requested story could not be found.</p>
        <Link href="/" className="inline-flex items-center gap-1.5 text-blue-600 font-bold hover:underline">
          <ArrowLeft className="w-4 h-4" /> Back to Top Stories
        </Link>
      </div>
    );
  }

  const isBookmarked = bookmarks.includes(story.slug);

  const handleShare = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const toggleTextToSpeech = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    } else {
      const textToRead = `${story.title}. ${story.summary}`;
      const utterance = new SpeechSynthesisUtterance(textToRead);
      utterance.rate = 1.0;
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
      setIsSpeaking(true);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
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
            <span className="flex items-center gap-1 text-slate-500 font-medium">
              <Clock className="w-3.5 h-3.5" />
              {story.publishedAt ? new Date(story.publishedAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              }) : 'Recent'}
            </span>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <span className="text-slate-500">4 min read</span>
          </div>

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

        {/* Headline */}
        <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
          {story.title}
        </h1>

        {/* Executive Summary */}
        <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
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
            {/* Listen Button */}
            <button
              onClick={toggleTextToSpeech}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition font-semibold ${
                isSpeaking
                  ? 'bg-rose-50 border-rose-200 text-rose-600 dark:bg-rose-950/40 dark:border-rose-900'
                  : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
              }`}
              title="Listen to story"
            >
              {isSpeaking ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
              <span>{isSpeaking ? 'Stop Audio' : 'Listen'}</span>
            </button>

            {/* Font Sizer */}
            <div className="flex items-center rounded-full bg-slate-100 dark:bg-slate-800 p-0.5 border border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setFontSize('sm')}
                className={`px-2 py-0.5 rounded-full text-xs font-bold transition ${
                  fontSize === 'sm' ? 'bg-white dark:bg-slate-700 shadow-xs' : 'text-slate-400'
                }`}
              >
                A-
              </button>
              <button
                onClick={() => setFontSize('md')}
                className={`px-2 py-0.5 rounded-full text-xs font-bold transition ${
                  fontSize === 'md' ? 'bg-white dark:bg-slate-700 shadow-xs' : 'text-slate-400'
                }`}
              >
                A
              </button>
              <button
                onClick={() => setFontSize('lg')}
                className={`px-2 py-0.5 rounded-full text-xs font-bold transition ${
                  fontSize === 'lg' ? 'bg-white dark:bg-slate-700 shadow-xs' : 'text-slate-400'
                }`}
              >
                A+
              </button>
            </div>

            {/* Bookmark */}
            <button
              onClick={() => toggleBookmark(story.slug)}
              className={`p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition ${
                isBookmarked ? 'text-blue-600' : 'text-slate-400'
              }`}
              title={isBookmarked ? 'Saved' : 'Save story'}
            >
              <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-blue-600' : ''}`} />
            </button>

            {/* Share */}
            <button
              onClick={handleShare}
              className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition"
              title="Copy story link"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Share2 className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </header>

      {/* Hero Visual Asset */}
      {story.heroImageUrl && (
        <div className="rounded-2xl overflow-hidden shadow-md max-h-[460px] relative border border-slate-200 dark:border-slate-800">
          <img
            src={story.heroImageUrl}
            alt={story.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Article Content with Dynamic Font Scaling */}
      <div className={`space-y-6 ${
        fontSize === 'sm' ? 'reader-size-sm' : fontSize === 'lg' ? 'reader-size-lg' : 'reader-size-md'
      }`}>
        <StoryRenderer blocks={story.blocks} theme={isDark ? 'dark' : 'light'} />
      </div>

      {/* Fact Check & Provenance Card */}
      <section className="pt-8 mt-12 border-t border-slate-200 dark:border-slate-800 space-y-4">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Verified Sources & Editorial Transparency</span>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs space-y-2">
          <p className="text-slate-600 dark:text-slate-400">
            This report was filed by certified editorial journalists and cross-referenced against primary documents, official government declarations, and sovereign bank registries.
          </p>
          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
            <span>Editorial Standards: GlobalPulse Independent Verification</span>
            <span className="text-emerald-600 font-bold flex items-center gap-1">
              <Check className="w-3.5 h-3.5" /> 100% Fact Checked
            </span>
          </div>
        </div>
      </section>

      {/* Reader Engagement: Reactions & Threaded Discussion */}
      <StoryEngagement
        storyId={story.id}
        storySlug={story.slug}
        storyTitle={story.title}
      />

      {/* Full Coverage Modal */}
      <FullCoverageModal
        slug={isFullCoverageOpen ? story.slug : null}
        onClose={() => setIsFullCoverageOpen(false)}
      />
    </div>
  );
}
