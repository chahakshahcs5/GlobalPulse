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
import {
  EvidenceBlockItem,
  PerspectiveBlockItem,
  InterviewBlockItem,
  LiveDataBlockItem,
  FactCheckBlockItem,
  DataExplorerBlockItem,
  RankingBlockItem,
  CalculatorBlockItem,
  FinancialBlockItem,
  ElectionBlockItem,
  DisasterBlockItem,
  ScienceBlockItem,
  AnnotatedImageBlockItem,
  VideoGalleryBlockItem,
  PodcastBlockItem,
  WaveformBlockItem,
  TranscriptBlockItem,
  DatasetBlockItem,
} from './MobileIntelligenceBlocks';
import {
  ImageBlockItem,
  GalleryBlockItem,
  ImageDiffBlockItem,
  SlideDeckBlockItem,
  EmbedBlockItem,
  DiagramBlockItem,
  FlowBlockItem,
} from './MobileVisualBlocks';
import {
  CitationBlockItem,
  RelatedStoriesBlockItem,
  ComparisonBlockItem,
  PollBlockItem,
  LiveTickerBlockItem,
  DocumentViewerBlockItem,
} from './MobileContextBlocks';

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
    case 'evidence':
      return <EvidenceBlockItem block={block} />;
    case 'perspective':
      return <PerspectiveBlockItem block={block} />;
    case 'interview':
      return <InterviewBlockItem block={block} />;
    case 'live_data':
      return <LiveDataBlockItem block={block} />;
    case 'fact_check':
      return <FactCheckBlockItem block={block} />;
    case 'data_explorer':
      return <DataExplorerBlockItem block={block} />;
    case 'ranking':
      return <RankingBlockItem block={block} />;
    case 'calculator':
      return <CalculatorBlockItem block={block} />;
    case 'financial':
      return <FinancialBlockItem block={block} />;
    case 'election':
      return <ElectionBlockItem block={block} />;
    case 'disaster':
      return <DisasterBlockItem block={block} />;
    case 'science':
      return <ScienceBlockItem block={block} />;
    case 'annotated_image':
      return <AnnotatedImageBlockItem block={block} />;
    case 'video_gallery':
      return <VideoGalleryBlockItem block={block} />;
    case 'podcast':
      return <PodcastBlockItem block={block} />;
    case 'waveform':
      return <WaveformBlockItem block={block} />;
    case 'transcript':
      return <TranscriptBlockItem block={block} />;
    case 'dataset':
      return <DatasetBlockItem block={block} />;
    case 'image':
      return <ImageBlockItem block={block} />;
    case 'gallery':
      return <GalleryBlockItem block={block} />;
    case 'image_diff':
      return <ImageDiffBlockItem block={block} />;
    case 'slide_deck':
      return <SlideDeckBlockItem block={block} />;
    case 'embed':
      return <EmbedBlockItem block={block} />;
    case 'diagram':
      return <DiagramBlockItem block={block} />;
    case 'flow':
      return <FlowBlockItem block={block} />;
    case 'citation':
      return <CitationBlockItem block={block} />;
    case 'related_stories':
      return <RelatedStoriesBlockItem block={block} />;
    case 'comparison':
      return <ComparisonBlockItem block={block} />;
    case 'poll':
      return <PollBlockItem block={block} />;
    case 'live_ticker':
      return <LiveTickerBlockItem block={block} />;
    case 'document_viewer':
      return <DocumentViewerBlockItem block={block} />;
    default:
      return null;
  }
}
