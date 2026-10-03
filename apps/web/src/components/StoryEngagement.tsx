'use client';

import React, { useState } from 'react';
import { MessageSquare, ShieldCheck, Scale } from 'lucide-react';
import {
  useStoryComments,
  useStoryReactions,
  useBookmarks,
  toggleBookmark,
} from '../lib/news-store';
import type { StoryPerspective, StoryPerspectiveStance } from '@ai-news/schemas';
import { StoryReactionsBar, StoryCommentThread, StoryPerspectives } from './engagement';

interface StoryEngagementProps {
  storyId: string;
  storySlug: string;
  storyTitle?: string;
}

export const StoryEngagement: React.FC<StoryEngagementProps> = ({ storyId, storySlug }) => {
  const { comments, isLoading: commentsLoading, addComment } = useStoryComments(storyId);
  const { counts, userReactions, toggleReaction } = useStoryReactions(storyId);
  const bookmarks = useBookmarks();

  const [copied, setCopied] = useState(false);
  const [activeEngagementTab, setActiveEngagementTab] = useState<'comments' | 'perspectives'>(
    'comments'
  );

  // Community Perspectives state
  const [perspectives, setPerspectives] = useState<StoryPerspective[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(`globalpulse_perspectives_${storyId}`);
        if (saved) return JSON.parse(saved);
      } catch {}
    }
    return [
      {
        id: `psp_${storyId}_1`,
        storyId,
        organizationId: 'org_default',
        authorId: 'usr_analyst_1',
        authorName: 'Dr. Elena Rostova',
        authorRole: 'subscriber',
        stance: 'analytical',
        targetParagraphQuote:
          'The agreement outlines a multi-year transition roadmap with clear regional benchmarks.',
        argument:
          'The governance mechanism is significantly strengthened compared to previous summits because non-compliance triggers public multilateral review rather than discretionary closed-door arbitration.',
        evidenceUrl: 'https://unfccc.int/process/the-paris-agreement',
        status: 'approved',
        upvotes: 38,
        createdAt: new Date(Date.now() - 3600 * 1000 * 3).toISOString(),
        updatedAt: new Date(Date.now() - 3600 * 1000 * 3).toISOString(),
      },
      {
        id: `psp_${storyId}_2`,
        storyId,
        organizationId: 'org_default',
        authorId: 'usr_reader_2',
        authorName: 'Marcus Vance',
        authorRole: 'reader',
        stance: 'dissenting',
        targetParagraphQuote:
          'Financing commitments are scheduled to disburse over a 36-month horizon.',
        argument:
          'A 36-month disbursement window creates extreme vulnerability for low-lying island states facing immediate seasonal cyclone hazards this calendar year.',
        status: 'approved',
        upvotes: 24,
        createdAt: new Date(Date.now() - 3600 * 1000 * 1).toISOString(),
        updatedAt: new Date(Date.now() - 3600 * 1000 * 1).toISOString(),
      },
    ];
  });

  const handleSubmitPerspective = (p: {
    stance: StoryPerspectiveStance;
    quote?: string;
    argument: string;
    evidenceUrl?: string;
    authorName?: string;
  }) => {
    const newP: StoryPerspective = {
      id: `psp_${Date.now()}`,
      storyId,
      organizationId: 'org_default',
      authorId: 'usr_me',
      authorName: p.authorName?.trim() || 'Community Contributor',
      authorRole: 'reader',
      stance: p.stance,
      targetParagraphQuote: p.quote,
      argument: p.argument,
      evidenceUrl: p.evidenceUrl,
      status: 'approved',
      upvotes: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setPerspectives((prev) => {
      const updated = [newP, ...prev];
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(`globalpulse_perspectives_${storyId}`, JSON.stringify(updated));
        } catch {}
      }
      return updated;
    });
  };

  const handleUpvotePerspective = (id: string) => {
    setPerspectives((prev) => {
      const updated = prev.map((p) => (p.id === id ? { ...p, upvotes: p.upvotes + 1 } : p));
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(`globalpulse_perspectives_${storyId}`, JSON.stringify(updated));
        } catch {}
      }
      return updated;
    });
  };

  const isBookmarked = bookmarks.includes(storySlug) || bookmarks.includes(storyId);

  const handleShare = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleBookmark = () => {
    toggleBookmark(storySlug);
  };

  return (
    <section className="pt-8 border-t border-slate-200 dark:border-slate-800 space-y-8">
      {/* Action Bar: Reactions & Reader Tools */}
      <StoryReactionsBar
        counts={counts}
        userReactions={userReactions}
        toggleReaction={toggleReaction}
        isBookmarked={isBookmarked}
        onBookmark={handleBookmark}
        copied={copied}
        onShare={handleShare}
      />

      {/* Dual Tab Navigation: Reader Discussion vs Community Perspectives */}
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveEngagementTab('comments')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition cursor-pointer select-none active:scale-95 ${
                activeEngagementTab === 'comments'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              <span>Discussion</span>
              <span
                className={`text-xs px-2 py-0.2 rounded-full ${
                  activeEngagementTab === 'comments'
                    ? 'bg-blue-500 text-white'
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                {comments.length}
              </span>
            </button>

            <button
              onClick={() => setActiveEngagementTab('perspectives')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition cursor-pointer select-none active:scale-95 ${
                activeEngagementTab === 'perspectives'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Scale className="w-4 h-4" />
              <span>Perspectives & Annotations</span>
              <span
                className={`text-xs px-2 py-0.2 rounded-full ${
                  activeEngagementTab === 'perspectives'
                    ? 'bg-indigo-500 text-white'
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                {perspectives.length}
              </span>
            </button>
          </div>

          <span className="text-xs text-slate-400 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> Moderated & AI Fact-Checked
          </span>
        </div>

        {/* Tab 1: Reader Discussion & Comments */}
        {activeEngagementTab === 'comments' && (
          <StoryCommentThread
            comments={comments}
            commentsLoading={commentsLoading}
            onAddComment={addComment}
          />
        )}

        {/* Tab 2: Community Perspectives & Inline Fact Annotations */}
        {activeEngagementTab === 'perspectives' && (
          <StoryPerspectives
            storyId={storyId}
            perspectives={perspectives}
            onSubmitPerspective={handleSubmitPerspective}
            onUpvotePerspective={handleUpvotePerspective}
          />
        )}
      </div>
    </section>
  );
};
