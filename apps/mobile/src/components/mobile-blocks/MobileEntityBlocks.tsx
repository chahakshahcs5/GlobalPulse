import { View, Text } from 'react-native';
import type { SourceBlock, EntityBlock, WhatChangedBlock } from '@ai-news/schemas';
import { styles } from './styles';

export function SourceBlockItem({ block }: { block: SourceBlock }) {
  const data = block.data || {};
  return (
    <View style={styles.sourceCard}>
      <View style={styles.badgeRow}>
        <Text style={styles.sourcePublisher}>{data.publisher}</Text>
        {data.publishedAt && (
          <Text style={styles.sourceDate}>{new Date(data.publishedAt).toLocaleDateString()}</Text>
        )}
      </View>
      <Text style={styles.sourceTitle}>{data.title}</Text>
    </View>
  );
}

export function EntityBlockItem({ block }: { block: EntityBlock }) {
  const data = block.data || {};
  return (
    <View style={styles.entityCard}>
      <View style={styles.entityAvatar}>
        <Text style={styles.entityAvatarText}>{(data.name || 'EN').slice(0, 2).toUpperCase()}</Text>
      </View>
      <View style={styles.entityInfo}>
        <View style={styles.badgeRow}>
          <Text style={styles.entityName}>{data.name}</Text>
          <Text style={styles.entityTypeBadge}>{data.type}</Text>
        </View>
        {data.description && (
          <Text style={styles.entityDescription} numberOfLines={2}>
            {data.description}
          </Text>
        )}
      </View>
    </View>
  );
}

export function WhatChangedBlockItem({ block }: { block: WhatChangedBlock }) {
  const data = block.data || {};
  const items = data.items || [];
  return (
    <View style={styles.diffCard}>
      <Text style={styles.diffHeader}>
        What Changed in Version {data.previousVersionNumber + 1}
      </Text>
      {items.map((item: { changeType?: string; description?: string }, idx: number) => (
        <View key={idx} style={styles.diffItem}>
          <Text style={styles.diffBadge}>{String(item.changeType || 'UPDATED').toUpperCase()}</Text>
          <Text style={styles.diffText}>{item.description || ''}</Text>
        </View>
      ))}
    </View>
  );
}
