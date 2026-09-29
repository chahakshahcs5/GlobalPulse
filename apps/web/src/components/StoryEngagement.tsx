'use client';

import React, { useState } from 'react';
import {
  ThumbsUp,
  Lightbulb,
  Flame,
  Heart,
  MessageSquare,
  Send,
  CornerDownRight,
  Share2,
  Bookmark,
  Check,
  ShieldCheck,
  Sparkles,
  Scale,
  ExternalLink,
  Quote,
} from 'lucide-react';
import {
  useStoryComments,
  useStoryReactions,
  useBookmarks,
  toggleBookmark,
} from '../lib/news-store';
import { formatDeterministicDateTime, formatDeterministicDate } from '../lib/date-utils';
import type { Comment, StoryPerspective, StoryPerspectiveStance } from '@ai-news/schemas';

interface StoryEngagementProps {
  storyId: string;
  storySlug: string;
  storyTitle?: string;
}

export const StoryEngagement: React.FC<StoryEngagementProps> = ({ storyId, storySlug }) => {
  const { comments, isLoading: commentsLoading, addComment } = useStoryComments(storyId);
  const { counts, userReactions, toggleReaction } = useStoryReactions(storyId);
  const bookmarks = useBookmarks();

  const [commentText, setCommentText] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);

  // Community Perspectives state
  const [activeEngagementTab, setActiveEngagementTab] = useState<'comments' | 'perspectives'>(
    'comments'
  );
  const [stanceFilter, setStanceFilter] = useState<string>('all');
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

  const [perspectiveStance, setPerspectiveStance] = useState<StoryPerspectiveStance>('analytical');
  const [perspectiveQuote, setPerspectiveQuote] = useState('');
  const [perspectiveArgument, setPerspectiveArgument] = useState('');
  const [perspectiveEvidence, setPerspectiveEvidence] = useState('');
  const [perspectiveAuthor, setPerspectiveAuthor] = useState('');
  const [isSubmittingPerspective, setIsSubmittingPerspective] = useState(false);

  const handleSubmitPerspective = (e: React.FormEvent) => {
    e.preventDefault();
    if (!perspectiveArgument.trim() || isSubmittingPerspective) return;

    setIsSubmittingPerspective(true);
    const newP: StoryPerspective = {
      id: `psp_${Date.now()}`,
      storyId,
      organizationId: 'org_default',
      authorId: 'usr_me',
      authorName: perspectiveAuthor.trim() || 'Community Contributor',
      authorRole: 'reader',
      stance: perspectiveStance,
      targetParagraphQuote: perspectiveQuote.trim() || undefined,
      argument: perspectiveArgument.trim(),
      evidenceUrl: perspectiveEvidence.trim() || undefined,
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

    setPerspectiveArgument('');
    setPerspectiveQuote('');
    setPerspectiveEvidence('');
    setIsSubmittingPerspective(false);
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

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await addComment(
        commentText.trim(),
        authorName.trim() || undefined,
        replyingToId || undefined
      );
      setCommentText('');
      setReplyingToId(null);
    } catch {
      // Handled in store
    } finally {
      setIsSubmitting(false);
    }
  };

  const reactionConfigs = [
    {
      type: 'like',
      label: 'Agree',
      icon: ThumbsUp,
      color:
        'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800',
    },
    {
      type: 'insightful',
      label: 'Insightful',
      icon: Lightbulb,
      color:
        'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800',
    },
    {
      type: 'important',
      label: 'Urgent',
      icon: Flame,
      color:
        'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800',
    },
    {
      type: 'heart',
      label: 'Applaud',
      icon: Heart,
      color:
        'text-pink-600 dark:text-pink-400 bg-pink-50 dark:bg-pink-950/40 border-pink-200 dark:border-pink-800',
    },
  ];

  // Organize comments into parent & child replies
  const rootComments = comments.filter((c) => !c.parentId);
  const repliesByParent = comments.reduce<Record<string, Comment[]>>((acc, c) => {
    if (c.parentId) {
      acc[c.parentId] = acc[c.parentId] || [];
      acc[c.parentId].push(c);
    }
    return acc;
  }, {});

  return (
    <section className="pt-8 border-t border-slate-200 dark:border-slate-800 space-y-8">
      {/* Action Bar: Reactions & Reader Tools */}
      <div className="flex flex-wrap items-center justify-between gap-4 py-4 px-5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 shadow-xs">
        {/* Reactions Pills */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 mr-1 hidden sm:inline">
            Reactions
          </span>
          {reactionConfigs.map((cfg) => {
            const Icon = cfg.icon;
            const count = counts[cfg.type] || 0;
            const hasReacted = userReactions.includes(cfg.type);

            return (
              <button
                key={cfg.type}
                onClick={() => toggleReaction(cfg.type)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                  hasReacted
                    ? `${cfg.color} shadow-xs font-bold scale-105`
                    : 'text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600'
                }`}
                title={`React with ${cfg.label}`}
              >
                <Icon className={`w-3.5 h-3.5 ${hasReacted ? 'fill-current' : ''}`} />
                <span>{cfg.label}</span>
                {count > 0 && <span className="font-mono text-[11px] opacity-80">({count})</span>}
              </button>
            );
          })}
        </div>

        {/* Share & Bookmark Utilities */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleBookmark}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition ${
              isBookmarked
                ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                : 'text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
          >
            <Bookmark className={`w-3.5 h-3.5 ${isBookmarked ? 'fill-white' : ''}`} />
            <span>{isBookmarked ? 'Saved' : 'Save'}</span>
          </button>

          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-500" />
                <span className="text-emerald-600 dark:text-emerald-400">Link Copied!</span>
              </>
            ) : (
              <>
                <Share2 className="w-3.5 h-3.5" />
                <span>Share</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Dual Tab Navigation: Reader Discussion vs Community Perspectives */}
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveEngagementTab('comments')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition ${
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
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition ${
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
          <div className="space-y-4">
            {/* Comment Input Form */}
            <form
              onSubmit={handleSubmitComment}
              className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-3"
            >
              {replyingToId && (
                <div className="flex items-center justify-between px-3 py-1.5 bg-blue-50 dark:bg-blue-950/40 rounded-lg text-xs text-blue-700 dark:text-blue-300">
                  <span className="flex items-center gap-1">
                    <CornerDownRight className="w-3.5 h-3.5" /> Replying to comment
                  </span>
                  <button
                    type="button"
                    onClick={() => setReplyingToId(null)}
                    className="font-bold hover:underline"
                  >
                    Cancel Reply
                  </button>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  value={authorName}
                  onChange={(e) => setAuthorName(e.target.value)}
                  placeholder="Your name or handle (optional)"
                  className="sm:w-64 px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                rows={3}
                maxLength={2000}
                placeholder="Share your perspective, context, or verified details on this story..."
                className="w-full p-3 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500 resize-none"
              />

              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-slate-400">
                  {commentText.length}/2000 characters
                </span>
                <button
                  type="submit"
                  disabled={!commentText.trim() || isSubmitting}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold transition shadow-xs cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? 'Posting...' : 'Post Comment'}</span>
                </button>
              </div>
            </form>

            {/* Comments Feed */}
            <div className="space-y-4 pt-2">
              {commentsLoading ? (
                <div className="py-8 text-center text-slate-400 text-sm animate-pulse">
                  Loading discussion...
                </div>
              ) : rootComments.length === 0 ? (
                <div className="py-12 text-center text-slate-500 dark:text-slate-400 space-y-2 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                  <MessageSquare className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-700" />
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    No reader comments yet
                  </p>
                  <p className="text-xs text-slate-500">
                    Start the conversation with your perspective or verified context.
                  </p>
                </div>
              ) : (
                rootComments.map((comment) => {
                  const replies = repliesByParent[comment.id] || [];

                  return (
                    <div
                      key={comment.id}
                      className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 space-y-3"
                    >
                      {/* Author Header */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 text-white text-xs font-bold flex items-center justify-center">
                            {comment.authorName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-bold text-slate-900 dark:text-white">
                                {comment.authorName}
                              </span>
                              {comment.authorRole === 'journalist' && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-bold">
                                  Journalist
                                </span>
                              )}
                              {comment.authorRole === 'ai_agent' && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 font-bold flex items-center gap-0.5">
                                  <Sparkles className="w-2.5 h-2.5" /> AI
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-slate-400" suppressHydrationWarning>
                              {formatDeterministicDateTime(comment.createdAt)}
                            </span>
                          </div>
                        </div>

                        <button
                          onClick={() => {
                            setReplyingToId(comment.id);
                            window.scrollTo({ top: window.scrollY - 100, behavior: 'smooth' });
                          }}
                          className="text-xs text-blue-600 dark:text-blue-400 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <CornerDownRight className="w-3 h-3" /> Reply
                        </button>
                      </div>

                      {/* Comment Body */}
                      <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                        {comment.content}
                      </p>

                      {/* Threaded Replies */}
                      {replies.length > 0 && (
                        <div className="pl-6 border-l-2 border-slate-100 dark:border-slate-800 space-y-3 pt-2">
                          {replies.map((reply) => (
                            <div
                              key={reply.id}
                              className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 space-y-2 border border-slate-100 dark:border-slate-800"
                            >
                              <div className="flex items-center gap-2">
                                <div className="w-5 h-5 rounded-full bg-slate-300 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-[10px] font-bold flex items-center justify-center">
                                  {reply.authorName.charAt(0).toUpperCase()}
                                </div>
                                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                                  {reply.authorName}
                                </span>
                                <span
                                  className="text-[10px] text-slate-400"
                                  suppressHydrationWarning
                                >
                                  {formatDeterministicDate(reply.createdAt)}
                                </span>
                              </div>
                              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                                {reply.content}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Community Perspectives & Stance Annotations */}
        {activeEngagementTab === 'perspectives' && (
          <div className="space-y-6">
            {/* Stance Filter Selector */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-slate-400 font-medium mr-1">Filter Stance:</span>
              {[
                { id: 'all', label: 'All Perspectives' },
                { id: 'in_favor', label: '✓ In Favor' },
                { id: 'dissenting', label: '✗ Dissenting' },
                { id: 'analytical', label: '⚡ Analytical' },
                { id: 'question', label: '? Questions' },
              ].map((filter) => (
                <button
                  key={filter.id}
                  onClick={() => setStanceFilter(filter.id)}
                  className={`px-3 py-1 rounded-xl text-xs font-medium transition cursor-pointer ${
                    stanceFilter === filter.id
                      ? 'bg-indigo-600 text-white font-bold shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>

            {/* Perspective Contribution Card */}
            <form
              onSubmit={handleSubmitPerspective}
              className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-4"
            >
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                <Scale className="w-4 h-4 text-indigo-500" />
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  Contribute Reader Perspective
                </h4>
              </div>

              {/* Stance Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
                  Select Your Stance:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(
                    [
                      { id: 'in_favor', label: 'In Favor', icon: '✓', color: 'border-emerald-500' },
                      {
                        id: 'dissenting',
                        label: 'Dissenting',
                        icon: '✗',
                        color: 'border-rose-500',
                      },
                      {
                        id: 'analytical',
                        label: 'Analytical',
                        icon: '⚡',
                        color: 'border-indigo-500',
                      },
                      {
                        id: 'question',
                        label: 'Clarifying Question',
                        icon: '?',
                        color: 'border-amber-500',
                      },
                    ] as const
                  ).map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setPerspectiveStance(s.id)}
                      className={`p-2 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                        perspectiveStance === s.id
                          ? `bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 ${s.color} ring-1 ring-indigo-500`
                          : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      <span>{s.icon}</span>
                      <span>{s.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Quoted Passage (optional) */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                  Quoted Article Passage or Claim (optional):
                </label>
                <input
                  type="text"
                  value={perspectiveQuote}
                  onChange={(e) => setPerspectiveQuote(e.target.value)}
                  placeholder="Paste specific sentence from article being annotated..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Argument details */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                  Your Argument & Factual Analysis:
                </label>
                <textarea
                  value={perspectiveArgument}
                  onChange={(e) => setPerspectiveArgument(e.target.value)}
                  rows={3}
                  required
                  placeholder="Provide structured reasoning, counter-arguments, or domain insight..."
                  className="w-full p-3 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 resize-none"
                />
              </div>

              {/* Evidence URL & Author */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                    Supporting Documentation / Source URL (optional):
                  </label>
                  <input
                    type="url"
                    value={perspectiveEvidence}
                    onChange={(e) => setPerspectiveEvidence(e.target.value)}
                    placeholder="https://..."
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                    Your Name or Handle (optional):
                  </label>
                  <input
                    type="text"
                    value={perspectiveAuthor}
                    onChange={(e) => setPerspectiveAuthor(e.target.value)}
                    placeholder="Dr. Specialist, Verified Subscriber..."
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  disabled={!perspectiveArgument.trim() || isSubmittingPerspective}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold transition shadow-xs cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSubmittingPerspective ? 'Submitting...' : 'Publish Perspective'}</span>
                </button>
              </div>
            </form>

            {/* List of Perspectives */}
            <div className="space-y-4">
              {perspectives
                .filter((p) => stanceFilter === 'all' || p.stance === stanceFilter)
                .map((psp) => {
                  const stanceStyles: Record<
                    string,
                    { badge: string; label: string; icon: string }
                  > = {
                    in_favor: {
                      badge: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
                      label: 'In Favor',
                      icon: '✓',
                    },
                    dissenting: {
                      badge: 'bg-rose-500/10 text-rose-500 border-rose-500/20',
                      label: 'Dissenting',
                      icon: '✗',
                    },
                    analytical: {
                      badge: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
                      label: 'Analytical',
                      icon: '⚡',
                    },
                    question: {
                      badge: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
                      label: 'Clarifying Question',
                      icon: '?',
                    },
                  };
                  const currentStance = stanceStyles[psp.stance] || stanceStyles.analytical;

                  return (
                    <div
                      key={psp.id}
                      className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-xs space-y-3"
                    >
                      {/* Top Bar: Stance Badge + Upvotes + Author */}
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-xs font-bold border flex items-center gap-1 ${currentStance.badge}`}
                          >
                            <span>{currentStance.icon}</span>
                            <span>{currentStance.label}</span>
                          </span>
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                            {psp.authorName}
                          </span>
                          <span className="text-[10px] text-slate-400" suppressHydrationWarning>
                            • {formatDeterministicDateTime(psp.createdAt)}
                          </span>
                        </div>

                        <button
                          onClick={() => handleUpvotePerspective(psp.id)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 transition cursor-pointer"
                          title="Upvote perspective"
                        >
                          <ThumbsUp className="w-3.5 h-3.5 text-indigo-500" />
                          <span>{psp.upvotes}</span>
                        </button>
                      </div>

                      {/* Quoted article context if any */}
                      {psp.targetParagraphQuote && (
                        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-100 dark:border-slate-800/80 text-xs text-slate-600 dark:text-slate-400 flex items-start gap-2">
                          <Quote className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
                          <p className="italic font-serif">"{psp.targetParagraphQuote}"</p>
                        </div>
                      )}

                      {/* Argument Body */}
                      <p className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed">
                        {psp.argument}
                      </p>

                      {/* Evidence Link */}
                      {psp.evidenceUrl && (
                        <div className="pt-2 border-t border-slate-100 dark:border-slate-800/60">
                          <a
                            href={psp.evidenceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-indigo-500 hover:text-indigo-400 font-medium hover:underline"
                          >
                            <span>Supporting Evidence Document</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
