import type { Story, StoryBlock } from '@ai-news/schemas';

/**
 * What changed in a story's blocks.
 *
 * The composer is told what happened rather than being handed a new list,
 * because the platform is told the same thing: a block added, a block
 * changed, a block removed, or the order changed. Sending the whole list
 * every time would turn every keystroke into a rewrite of the story.
 */
export type BlockChange =
  | { kind: 'added'; block: StoryBlock }
  | { kind: 'edited'; block: StoryBlock }
  | { kind: 'removed'; block: StoryBlock }
  | { kind: 'reordered' };

export interface StoryEditorDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (message: string) => void;
  editingStory?: Story | null;
}
