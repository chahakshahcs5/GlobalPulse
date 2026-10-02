import type { StoryBlock } from '@ai-news/schemas';
import {
  HeadingBlockItem,
  ParagraphBlockItem,
  SummaryBlockItem,
  QuoteBlockItem,
  CalloutBlockItem,
} from './MobileTextBlocks';
import { VideoBlockItem, AudioBlockItem } from './MobileMediaBlocks';
import {
  ChartBlockItem,
  TimelineBlockItem,
  MapBlockItem,
  StatisticBlockItem,
  TableBlockItem,
} from './MobileDataBlocks';
import { SourceBlockItem, EntityBlockItem, WhatChangedBlockItem } from './MobileEntityBlocks';

export interface MobileBlockItemProps {
  block: StoryBlock;
}

export function MobileBlockItem({ block }: MobileBlockItemProps) {
  switch (block.blockType) {
    case 'heading':
      return <HeadingBlockItem block={block} />;
    case 'paragraph':
      return <ParagraphBlockItem block={block} />;
    case 'summary':
      return <SummaryBlockItem block={block} />;
    case 'quote':
      return <QuoteBlockItem block={block} />;
    case 'callout':
      return <CalloutBlockItem block={block} />;
    case 'video':
      return <VideoBlockItem block={block} />;
    case 'audio':
      return <AudioBlockItem block={block} />;
    case 'chart':
      return <ChartBlockItem block={block} />;
    case 'timeline':
      return <TimelineBlockItem block={block} />;
    case 'map':
      return <MapBlockItem block={block} />;
    case 'statistic':
      return <StatisticBlockItem block={block} />;
    case 'table':
      return <TableBlockItem block={block} />;
    case 'source':
      return <SourceBlockItem block={block} />;
    case 'entity':
      return <EntityBlockItem block={block} />;
    case 'what_changed':
      return <WhatChangedBlockItem block={block} />;
    default:
      return null;
  }
}
