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
} from 'lucide-react';
import {
  useStoryComments,
  useStoryReactions,
  useBookmarks,
  toggleBookmark,
} from '../lib/news-store';
import { formatDeterministicDateTime, formatDeterministicDate } from '../lib/date-utils';

interface StoryEngagementProps {
  storyId: string;
  storySlug: string;
  storyTitle?: string;
}

export const StoryEngagement: React.FC<StoryEngagementProps> = ({
  storyId,
  storySlug,
}) => {
  const { comments, isLoading: commentsLoading, addComment } = useStoryComments(storyId);
  const { counts, userReactions, toggleReaction } = useStoryReactions(storyId);
  const bookmarks = useBookmarks();

  const [commentText, setCommentText] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);

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
      await addComment(commentText.trim(), authorName.trim() || undefined, replyingToId || undefined);
      setCommentText('');
      setReplyingToId(null);
    } catch (err) {
      // Handled in store
    } finally {
      setIsSubmitting(false);
    }
  };

  const reactionConfigs = [
    { type: 'like', label: 'Agree', icon: ThumbsUp, color: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800' },
    { type: 'insightful', label: 'Insightful', icon: Lightbulb, color: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800' },
    { type: 'important', label: 'Urgent', icon: Flame, color: 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800' },
    { type: 'heart', label: 'Applaud', icon: Heart, color: 'text-pink-600 dark:text-pink-400 bg-pink-50 dark:bg-pink-950/40 border-pink-200 dark:border-pink-800' },
  ];

  // Organize comments into parent & child replies
  const rootComments = comments.filter((c) => !c.parentId);
  const repliesByParent = comments.reduce<Record<string, any[]>>((acc, c) => {
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

      {/* Reader Discussion Header */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
              Reader Discussion
            </h3>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 font-bold text-slate-700 dark:text-slate-300">
              {comments.length}
            </span>
          </div>
          <span className="text-xs text-slate-400 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> Moderated & AI Fact-Checked
          </span>
        </div>

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
              className="sm:w-64 px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <textarea
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            rows={3}
            maxLength={2000}
            placeholder="Share your perspective, context, or verified details on this story..."
            className="w-full p-3 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />

          <div className="flex items-center justify-between pt-1">
            <span className="text-[11px] text-slate-400">
              {commentText.length}/2000 characters
            </span>
            <button
              type="submit"
              disabled={!commentText.trim() || isSubmitting}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold transition shadow-xs"
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
                      className="text-xs text-blue-600 dark:text-blue-400 font-semibold hover:underline flex items-center gap-1"
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
                            <span className="text-[10px] text-slate-400" suppressHydrationWarning>
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
    </section>
  );
};
