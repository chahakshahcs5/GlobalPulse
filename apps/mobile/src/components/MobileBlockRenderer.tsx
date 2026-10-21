import { View, Text } from 'react-native';
import type { StoryBlock } from '@ai-news/schemas';
import { MobileBlockItem } from './mobile-blocks/MobileBlockItem';
import { styles } from './mobile-blocks/styles';

export interface MobileBlockProps {
  blocks: StoryBlock[];
  /** Parent story id — lets interactive blocks reach the server. */
  storyId?: string;
}

export function MobileBlockRenderer({ blocks, storyId }: MobileBlockProps) {
  if (!blocks || blocks.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No content blocks available for this revision.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {blocks.map((block) => {
        const key = block.id || `blk_${Math.random()}`;
        return <MobileBlockItem key={key} block={block} storyId={storyId} />;
      })}
    </View>
  );
}

export * from './mobile-blocks/index';
