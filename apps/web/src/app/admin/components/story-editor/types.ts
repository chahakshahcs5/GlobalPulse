import type { Story } from '@ai-news/schemas';

export interface MediaBlockDraft {
  id: string;
  type: 'image' | 'chart' | 'quote' | 'timeline' | 'video' | 'table' | 'callout' | 'statistic';
  data: Record<string, string | number | readonly string[] | undefined>;
  items?: Array<{ date: string; headline: string; body: string }>;
}

export interface StoryEditorDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (message: string) => void;
  editingStory?: Story | null;
}
