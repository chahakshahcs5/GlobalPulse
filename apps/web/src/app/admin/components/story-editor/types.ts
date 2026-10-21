import type {
  CalloutBlockDataInput,
  ChartBlockDataInput,
  ImageBlockDataInput,
  QuoteBlockDataInput,
  StatisticBlockDataInput,
  Story,
  TableBlockDataInput,
  TimelineBlockDataInput,
  VideoBlockDataInput,
} from '@ai-news/schemas';

/**
 * The payload an editor provides for a block.
 *
 * These are the schemas' *input* types, not their output types: a field the
 * schema gives a default may be left out by the editor, and the platform
 * fills it in on write. Typing the draft against the output type would
 * force every defaulted field to be spelled out by hand.
 */
export type ImageDraftData = ImageBlockDataInput;
export type ChartDraftData = ChartBlockDataInput;
export type QuoteDraftData = QuoteBlockDataInput;
export type TimelineDraftData = TimelineBlockDataInput;
export type VideoDraftData = VideoBlockDataInput;
export type TableDraftData = TableBlockDataInput;
export type CalloutDraftData = CalloutBlockDataInput;
export type StatisticDraftData = StatisticBlockDataInput;

/**
 * A block the newsroom composer is editing.
 *
 * Each one carries the payload its own schema declares, rather than a
 * flat bag of strings. That is what lets the composer use the same
 * schema-driven form as the Block Studio, and it is what stops the composer
 * from producing a block the platform will reject.
 */
export type MediaBlockDraft =
  | { id: string; type: 'image'; data: ImageDraftData }
  | { id: string; type: 'chart'; data: ChartDraftData }
  | { id: string; type: 'quote'; data: QuoteDraftData }
  | { id: string; type: 'timeline'; data: TimelineDraftData }
  | { id: string; type: 'video'; data: VideoDraftData }
  | { id: string; type: 'table'; data: TableDraftData }
  | { id: string; type: 'callout'; data: CalloutDraftData }
  | { id: string; type: 'statistic'; data: StatisticDraftData };

/** The block types the composer offers, in the order the toolbar lists them. */
export const COMPOSER_BLOCK_TYPES: MediaBlockDraft['type'][] = [
  'image',
  'chart',
  'quote',
  'timeline',
  'table',
  'callout',
  'statistic',
  'video',
];

export interface StoryEditorDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (message: string) => void;
  editingStory?: Story | null;
}
