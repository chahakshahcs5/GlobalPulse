'use client';

import { Send, Calendar, Save } from 'lucide-react';
import type { Story } from '@ai-news/schemas';

interface StoryPublishActionsProps {
  submitMode: 'PUBLISH' | 'REVIEW' | 'DRAFT' | 'SCHEDULE';
  setSubmitMode: (m: 'PUBLISH' | 'REVIEW' | 'DRAFT' | 'SCHEDULE') => void;
  scheduledAtInput: string;
  setScheduledAtInput: (s: string) => void;
  editingStory?: Story | null;
}

const OPTIONS: {
  id: 'PUBLISH' | 'REVIEW' | 'DRAFT' | 'SCHEDULE';
  label: string;
  hint: string;
}[] = [
  { id: 'DRAFT', label: 'Draft', hint: 'Kept in the newsroom, not published.' },
  { id: 'REVIEW', label: 'For review', hint: 'Sent to the editor for review.' },
  { id: 'SCHEDULE', label: 'Scheduled', hint: 'Published at the time you set.' },
  { id: 'PUBLISH', label: 'Published', hint: 'Published as soon as it is saved.' },
];

export function StoryPublishActions({
  submitMode,
  setSubmitMode,
  scheduledAtInput,
  setScheduledAtInput,
  editingStory,
}: StoryPublishActionsProps) {
  const chosen = OPTIONS.find((option) => option.id === submitMode) ?? OPTIONS[0];

  return (
    <div className="space-y-3 border-t border-slate-200 pt-5 dark:border-slate-800">
      {/* Publishing Target / Embargo Time */}
      {submitMode === 'SCHEDULE' && (
        <div className="space-y-2 rounded-xl border border-purple-200 bg-purple-50/50 p-4 dark:border-purple-800 dark:bg-purple-950/30">
          <div className="flex items-center gap-2 text-xs font-bold text-purple-700 dark:text-purple-300">
            <Calendar className="w-4 h-4" />
            <span>Embargo Publishing Schedule</span>
          </div>
          <input
            type="datetime-local"
            required
            value={scheduledAtInput}
            onChange={(e) => setScheduledAtInput(e.target.value)}
            className="w-full rounded-xl border border-purple-300 bg-white px-3 py-2 text-xs font-medium focus:outline-none dark:border-purple-700 dark:bg-slate-900"
          />
          <p className="text-[11px] text-purple-600 dark:text-purple-400">
            The automated background scheduler will automatically flip this story to PUBLISHED and
            broadcast it over SSE the moment this timestamp arrives.
          </p>
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/*
          One choice and one action.

          Four buttons that each save the story differently is a lot to read
          and more to decide between, and the one that gets pressed is the
          one that matters. So the outcome is chosen, and then the story is
          saved.
        */}
        <div
          className="inline-flex w-full gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-800 sm:w-auto"
          role="radiogroup"
          aria-label="How should this story be saved?"
        >
          {OPTIONS.map((option) => {
            const isChosen = option.id === submitMode;
            return (
              <button
                key={option.id}
                type="button"
                role="radio"
                aria-checked={isChosen}
                onClick={() => setSubmitMode(option.id)}
                title={option.hint}
                className={`flex-1 cursor-pointer whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-bold transition sm:flex-none ${
                  isChosen
                    ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-700 dark:text-white'
                    : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                {option.label}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-3">
          <span className="text-[11px] text-slate-400">{chosen.hint}</span>
          <button
            type="submit"
            className="flex cursor-pointer items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-blue-500/20 transition hover:bg-blue-700"
          >
            {submitMode === 'PUBLISH' ? (
              <Save className="w-3.5 h-3.5" />
            ) : submitMode === 'REVIEW' ? (
              <Send className="w-3.5 h-3.5" />
            ) : submitMode === 'SCHEDULE' ? (
              <Calendar className="w-3.5 h-3.5" />
            ) : (
              <Save className="w-3.5 h-3.5" />
            )}
            {editingStory ? 'Save story' : 'Create story'}
          </button>
        </div>
      </div>
    </div>
  );
}
