'use client';


import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, Clock, ShieldCheck, Zap } from 'lucide-react';
import { useAllStories } from '../../../../lib/news-store';
import { formatDeterministicDate } from '../../../../lib/date-utils';

export default function AmpStoryPage() {
  const params = useParams();
  const slug = params?.slug as string;
  const { stories } = useAllStories();

  const story = stories.find((s) => s.slug === slug);

  if (!story) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-4">
        <h2 className="text-xl font-bold text-slate-800 dark:text-white">AMP Story Not Found</h2>
        <Link href="/" className="text-blue-600 underline text-sm">
          Return to Top Stories
        </Link>
      </div>
    );
  }

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: story.title,
    description: story.summary,
    image: story.heroImageUrl ? [story.heroImageUrl] : [],
    datePublished: story.publishedAt || story.createdAt,
    dateModified: story.updatedAt || story.publishedAt || story.createdAt,
    author: [{ '@type': 'Person', name: story.authorId }],
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
    <div className="max-w-2xl mx-auto px-4 py-6 font-sans space-y-6">
      {/* Schema.org NewsArticle JSON-LD for Google AMP Validation */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* AMP Top Bar */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 text-xs">
        <Link
          href={`/stories/${story.slug}`}
          className="flex items-center gap-1.5 text-blue-600 font-bold hover:underline"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Full Web Experience
        </Link>
        <span className="flex items-center gap-1 font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2.5 py-0.5 rounded-full border border-amber-200 dark:border-amber-800">
          <Zap className="w-3 h-3 fill-amber-500" /> Accelerated Mobile Page (AMP)
        </span>
      </div>

      <header className="space-y-3">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span className="font-extrabold text-blue-600 uppercase tracking-wide">
            {story.articleType.replace('_', ' ')}
          </span>
          <span>•</span>
          <span className="flex items-center gap-1" suppressHydrationWarning>
            <Clock className="w-3 h-3" />
            {formatDeterministicDate(story.publishedAt)}
          </span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white leading-tight">
          {story.title}
        </h1>

        <p className="text-base text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
          {story.summary}
        </p>
      </header>

      {story.heroImageUrl && (
        <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800">
          <img
            src={story.heroImageUrl}
            alt={story.title}
            className="w-full h-auto object-cover"
          />
        </div>
      )}

      {/* Story Body */}
      <div className="space-y-4 text-sm sm:text-base text-slate-800 dark:text-slate-200 leading-relaxed">
        {story.blocks?.map((b: any) => (
          <div key={b.id}>
            {b.data && 'text' in b.data && <p className="leading-relaxed">{String(b.data.text)}</p>}
            {b.data && 'quote' in b.data && (
              <blockquote className="pl-4 border-l-4 border-blue-600 italic my-3 text-slate-600 dark:text-slate-300">
                "{String(b.data.quote)}"
              </blockquote>
            )}
          </div>
        ))}
      </div>

      <footer className="pt-6 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
        <span className="flex items-center gap-1 text-emerald-600 font-bold">
          <ShieldCheck className="w-4 h-4" /> GlobalPulse Verified
        </span>
        <Link href={`/stories/${story.slug}`} className="text-blue-600 font-bold hover:underline">
          View Interactive Graphics & Discussions →
        </Link>
      </footer>
    </div>
  );
}
