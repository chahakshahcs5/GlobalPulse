'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import { useState } from 'react';
import { StoryEditor } from '../../components/story-editor/StoryEditor';

/**
 * A new story, on a page of its own.
 *
 * The newsroom's editor works in a drawer, which is right for a quick
 * change. Writing a story is not a quick change, so it gets the whole
 * screen.
 */
export default function NewStoryPage() {
  const router = useRouter();
  const [notice, setNotice] = useState<string | null>(null);

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link
            href="/admin"
            className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 transition-colors hover:text-blue-600 dark:hover:text-blue-400"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to the newsroom
          </Link>
          <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            New story
          </h1>
          <p className="mt-1 text-[13px] text-slate-500">
            Compose the story out of blocks. The blocks are written to the API as you go, so the
            draft is never only in this browser.
          </p>
        </div>
      </div>

      {notice && (
        <p className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
          <CheckCircle2 className="h-4 w-4" />
          {notice}
        </p>
      )}

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <StoryEditor
          story={null}
          onSaved={(message) => {
            setNotice(message);
            router.push('/admin');
          }}
          onCancel={() => router.push('/admin')}
        />
      </div>
    </div>
  );
}
