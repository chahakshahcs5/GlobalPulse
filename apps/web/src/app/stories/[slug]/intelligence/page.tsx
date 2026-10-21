'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import type { Story } from '@ai-news/schemas';
import * as api from '@ai-news/api-client';
import { StoryIntelligenceDashboard } from '../../../../components/story-intelligence/StoryIntelligenceDashboard';

export default function StoryIntelligencePage() {
  const params = useParams();
  const slug = params?.slug as string;

  const [story, setStory] = useState<Story | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const loaded = await api.getStoryBySlug(slug);
        if (!cancelled) setStory(loaded);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Unable to load this story.');
        }
      }
    }
    if (slug) void load();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <Link
        href={story ? `/stories/${story.slug}` : '/'}
        className="inline-flex items-center gap-1.5 text-sm font-bold text-indigo-700 dark:text-indigo-400 hover:underline mb-6"
      >
        <ArrowLeft className="w-4 h-4" /> Back to the story
      </Link>

      {error && (
        <div className="rounded-2xl border border-rose-200 dark:border-rose-500/30 bg-rose-50/60 dark:bg-rose-500/5 p-5 text-sm text-rose-700 dark:text-rose-300">
          {error}
        </div>
      )}

      {!story && !error && (
        <p className="text-sm text-slate-500 dark:text-slate-400">Loading story…</p>
      )}

      {story && <StoryIntelligenceDashboard story={story} />}
    </div>
  );
}
