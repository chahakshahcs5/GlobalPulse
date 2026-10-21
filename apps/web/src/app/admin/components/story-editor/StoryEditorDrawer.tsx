'use client';

import { X, FileText } from 'lucide-react';
import { StoryEditor } from './StoryEditor';
import type { StoryEditorDrawerProps } from './types';

/**
 * The story editor, in a drawer.
 *
 * The editor itself lives in `StoryEditor`, because it is also used on a
 * page of its own. This is the panel it appears in inside the newsroom.
 */
export function StoryEditorDrawer({
  isOpen,
  onClose,
  onSuccess,
  editingStory,
}: StoryEditorDrawerProps) {
  if (!isOpen) return null;

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 px-6 py-5 border-b border-slate-200 dark:border-slate-800">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-600" />
            <h2 className="text-lg font-extrabold text-slate-900 dark:text-white tracking-tight">
              {editingStory ? `Edit Story: "${editingStory.title}"` : 'Draft a New Story Dispatch'}
            </h2>
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            {editingStory
              ? 'Every block this story has is loaded below, in the order it reads.'
              : 'Compose the story out of blocks. They are saved to the API as you go.'}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close the editor"
          className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="p-6 pt-4">
        <StoryEditor story={editingStory} onSaved={onSuccess} onCancel={onClose} />
      </div>
    </div>
  );
}
