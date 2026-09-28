'use client';

import Link from 'next/link';

import { Eye, Trash2, Clock, Bot, Check, XCircle, Send, Zap, Edit3 } from 'lucide-react';
import type { Story } from '@ai-news/schemas';
import {
  deleteUserStory,
  toggleStoryStatus,
  submitStoryForReview,
  reviewUserStory,
  useScheduledStories,
} from '../../../lib/news-store';
import type { FilterStatus } from './StoryFilterBar';

interface StoryTableProps {
  stories: Story[];
  filterStatus: FilterStatus;
  onSuccess: (message: string) => void;
  onEditStory?: (story: Story) => void;
}

export function StoryTable({ stories, filterStatus, onSuccess, onEditStory }: StoryTableProps) {
  const { sweep: sweepScheduled } = useScheduledStories();

  const filteredStories = stories.filter(
    (s) => filterStatus === 'ALL' || s.status === filterStatus
  );

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-xs">
        <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 border-b border-slate-200 dark:border-slate-800">
          <tr>
            <th className="p-3 font-semibold">Story Title</th>
            <th className="p-3 font-semibold">Category</th>
            <th className="p-3 font-semibold">Author / Agent</th>
            <th className="p-3 font-semibold">Status</th>
            <th className="p-3 font-semibold text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
          {filteredStories.map((story) => {
            const isPublished = story.status === 'PUBLISHED';
            const isInReview = story.status === 'IN_REVIEW';
            const isScheduled = story.status === 'SCHEDULED';
            const isDraft = story.status === 'DRAFT';

            return (
              <tr
                key={story.id}
                className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition"
              >
                <td className="p-3 font-semibold text-slate-900 dark:text-white max-w-sm truncate">
                  <Link href={`/stories/${story.slug}`} className="hover:text-blue-600">
                    {story.title}
                  </Link>
                  {isScheduled && story.scheduledPublishAt && (
                    <div className="text-[10px] text-purple-600 dark:text-purple-400 font-mono mt-0.5 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>Release: {new Date(story.scheduledPublishAt).toLocaleString()}</span>
                    </div>
                  )}
                </td>
                <td className="p-3 text-slate-600 dark:text-slate-300 uppercase font-mono text-[11px]">
                  {story.articleType.replace('_', ' ')}
                </td>
                <td className="p-3 text-slate-500">
                  <div className="flex items-center gap-1">
                    {story.authorId.includes('gemini') ||
                    story.authorId.includes('chatgpt') ||
                    story.authorId.includes('agent') ? (
                      <Bot className="w-3 h-3 text-indigo-500" />
                    ) : null}
                    <span>{story.authorId.replace('usr_', '').replace('_', ' ')}</span>
                  </div>
                </td>
                <td className="p-3">
                  {isInReview ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-800">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                      IN REVIEW
                    </span>
                  ) : isScheduled ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-400 border border-purple-300 dark:border-purple-800">
                      <Clock className="w-3 h-3 text-purple-500" />
                      SCHEDULED
                    </span>
                  ) : (
                    <button
                      onClick={() => toggleStoryStatus(story.id)}
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase transition cursor-pointer ${
                        isPublished
                          ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700'
                      }`}
                    >
                      {story.status}
                    </button>
                  )}
                </td>
                <td className="p-3 text-right space-x-2">
                  {isInReview && (
                    <>
                      <button
                        onClick={async () => {
                          await reviewUserStory(story.id, 'approve');
                          onSuccess(`Approved and published "${story.title}"`);
                        }}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 text-[11px] font-bold transition cursor-pointer"
                        title="Approve & Publish Story"
                      >
                        <Check className="w-3 h-3 text-emerald-600" /> Approve
                      </button>
                      <button
                        onClick={async () => {
                          const feedback =
                            prompt('Provide feedback for revision (optional):') || undefined;
                          await reviewUserStory(story.id, 'reject', feedback);
                          onSuccess(`Returned "${story.title}" to draft with feedback`);
                        }}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 hover:bg-rose-100 text-[11px] font-bold transition cursor-pointer"
                        title="Reject back to Draft"
                      >
                        <XCircle className="w-3 h-3 text-rose-600" /> Reject
                      </button>
                    </>
                  )}

                  {isDraft && (
                    <button
                      onClick={async () => {
                        await submitStoryForReview(story.id);
                        onSuccess(`Submitted "${story.title}" for editorial review`);
                      }}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 text-[11px] font-bold transition cursor-pointer"
                      title="Submit for Review"
                    >
                      <Send className="w-3 h-3 text-blue-600" /> Submit
                    </button>
                  )}

                  {isScheduled && (
                    <button
                      onClick={async () => {
                        await sweepScheduled();
                        onSuccess(`Triggered publishing sweep for "${story.title}"`);
                      }}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 hover:bg-purple-100 text-[11px] font-bold transition cursor-pointer"
                      title="Release immediately"
                    >
                      <Zap className="w-3 h-3 text-purple-600" /> Release
                    </button>
                  )}

                  {onEditStory && (
                    <button
                      onClick={() => onEditStory(story)}
                      className="inline-flex items-center gap-1 text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 font-semibold cursor-pointer"
                      title="Edit story content & blocks"
                    >
                      <Edit3 className="w-3.5 h-3.5" /> Edit
                    </button>
                  )}

                  <Link
                    href={`/stories/${story.slug}`}
                    className="inline-flex items-center gap-1 text-blue-600 hover:underline font-semibold"
                  >
                    <Eye className="w-3.5 h-3.5" /> View
                  </Link>
                  <button
                    onClick={() => deleteUserStory(story.id)}
                    className="text-slate-400 hover:text-rose-500 transition p-1 cursor-pointer"
                    title="Delete story"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
