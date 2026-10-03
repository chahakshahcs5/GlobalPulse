'use client';

import React, { useState } from 'react';
import { MessageSquare, Send, CornerDownRight } from 'lucide-react';
import type { Comment } from '@ai-news/schemas';
import { formatDeterministicDate } from '../../lib/date-utils';

interface StoryCommentThreadProps {
  comments: Comment[];
  commentsLoading: boolean;
  onAddComment: (text: string, author?: string, parentId?: string) => Promise<unknown>;
}

export function StoryCommentThread({
  comments,
  commentsLoading,
  onAddComment,
}: StoryCommentThreadProps) {
  const [commentText, setCommentText] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onAddComment(
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

  const rootComments = comments.filter((c) => !c.parentId);
  const repliesByParent = comments.reduce<Record<string, Comment[]>>((acc, c) => {
    if (c.parentId) {
      acc[c.parentId] = acc[c.parentId] || [];
      acc[c.parentId].push(c);
    }
    return acc;
  }, {});

  return (
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
              className="font-bold hover:underline cursor-pointer"
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
          <span className="text-[11px] text-slate-400">{commentText.length}/2000 characters</span>
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
                        {comment.authorRole === 'subscriber' && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 font-bold">
                            Subscriber
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400" suppressHydrationWarning>
                        {formatDeterministicDate(comment.createdAt)}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => setReplyingToId(comment.id)}
                    className="text-xs font-semibold text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 flex items-center gap-1 cursor-pointer"
                  >
                    <CornerDownRight className="w-3.5 h-3.5" /> Reply
                  </button>
                </div>

                {/* Comment Body */}
                <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed pl-9">
                  {comment.content}
                </p>

                {/* Threaded Replies */}
                {replies.length > 0 && (
                  <div className="pl-9 space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800/60">
                    {replies.map((reply) => (
                      <div
                        key={reply.id}
                        className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-1.5"
                      >
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-bold text-slate-900 dark:text-white">
                            {reply.authorName}
                          </span>
                          <span className="text-slate-400" suppressHydrationWarning>
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
  );
}
