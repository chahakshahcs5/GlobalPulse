'use client';

import { Send, Calendar } from 'lucide-react';
import type { Story } from '@ai-news/schemas';

interface StoryPublishActionsProps {
  submitMode: 'PUBLISH' | 'REVIEW' | 'DRAFT' | 'SCHEDULE';
  setSubmitMode: (m: 'PUBLISH' | 'REVIEW' | 'DRAFT' | 'SCHEDULE') => void;
  scheduledAtInput: string;
  setScheduledAtInput: (s: string) => void;
  editingStory?: Story | null;
}

export function StoryPublishActions({
  submitMode,
  setSubmitMode,
  scheduledAtInput,
  setScheduledAtInput,
  editingStory,
}: StoryPublishActionsProps) {
  return (
    <div className="space-y-4">
      {/* Publishing Target / Embargo Time */}
      {submitMode === 'SCHEDULE' && (
        <div className="p-4 rounded-xl border border-purple-200 dark:border-purple-800 bg-purple-50/50 dark:bg-purple-950/30 space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-purple-700 dark:text-purple-300">
            <Calendar className="w-4 h-4" />
            <span>Embargo Publishing Schedule</span>
          </div>
          <input
            type="datetime-local"
            required
            value={scheduledAtInput}
            onChange={(e) => setScheduledAtInput(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-purple-300 dark:border-purple-700 bg-white dark:bg-slate-900 text-xs font-medium focus:outline-none"
          />
          <p className="text-[11px] text-purple-600 dark:text-purple-400">
            The automated background scheduler will automatically flip this story to PUBLISHED and
            broadcast it over SSE the moment this timestamp arrives.
          </p>
        </div>
      )}

      {/* Form Actions */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-200 dark:border-slate-800">
        <span className="text-xs text-slate-400">
          Supports human journalism & autonomous external AI agents via MCP.
        </span>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="submit"
            onClick={() => setSubmitMode('DRAFT')}
            className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition cursor-pointer"
          >
            {editingStory ? 'Save Changes as Draft' : 'Save as Draft'}
          </button>
          <button
            type="submit"
            onClick={() => setSubmitMode('REVIEW')}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition flex items-center gap-1.5 cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{editingStory ? 'Save & Submit for Review' : 'Submit for Review'}</span>
          </button>
          <button
            type="submit"
            onClick={() => setSubmitMode('SCHEDULE')}
            className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-md shadow-purple-500/20 transition flex items-center gap-1.5 cursor-pointer"
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Schedule Release</span>
          </button>
          <button
            type="submit"
            onClick={() => setSubmitMode('PUBLISH')}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-500/20 transition cursor-pointer"
          >
            {editingStory ? 'Save & Publish Revision' : 'Publish Immediately'}
          </button>
        </div>
      </div>
    </div>
  );
}
