'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, CheckCircle2, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { Story } from '@ai-news/schemas';
import { getStory } from '@ai-news/api-client';
import { StoryEditor } from '../../components/story-editor/StoryEditor';

/**
 * A story, on a page of its own.
 *
 * The newsroom's editor works in a drawer, which is right for a quick
 * change. A story that is being rewritten is not a quick change, so it gets
 * the whole screen.
 */
export default function EditStoryPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const storyId = params?.id;

  const [story, setStory] = useState<Story | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!storyId) return;

    let cancelled = false;

    void (async () => {
      try {
        const loaded = await getStory(storyId);
        if (!cancelled) setStory(loaded);
      } catch (cause) {
        if (!cancelled) {
          setError(cause instanceof Error ? cause.message : 'The story could not be read.');
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [storyId]);

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <Link
            href="/admin"
            className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 transition-colors hover:text-blue-600 dark:hover:text-blue-400"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to the newsroom
          </Link>
          <h1 className="mt-2 truncate text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            {story ? story.title : 'Edit story'}
          </h1>
          {story && (
            <p className="mt-1 text-[13px] text-slate-500">
              Every block this story has is loaded below, in the order it reads.
            </p>
          )}
        </div>
      </div>

      {notice && (
        <p className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
          <CheckCircle2 className="h-4 w-4" />
          {notice}
        </p>
      )}

      {error && (
        <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-700 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-300">
          {error}
        </p>
      )}

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        {isLoading ? (
          <p className="flex items-center gap-2 py-8 text-sm text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading the story…
          </p>
        ) : story ? (
          <StoryEditor
            story={story}
            onSaved={(message) => {
              setNotice(message);
              router.push('/admin');
            }}
            onCancel={() => router.push('/admin')}
          />
        ) : null}
      </div>
    </div>
  );
}
