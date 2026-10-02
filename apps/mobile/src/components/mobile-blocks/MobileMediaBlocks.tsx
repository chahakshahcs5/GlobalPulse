import { View, Text } from 'react-native';
import type { VideoBlock, AudioBlock } from '@ai-news/schemas';
import { styles } from './styles';

export function VideoBlockItem({ block }: { block: VideoBlock }) {
  const data = block.data || {};
  return (
    <View style={styles.mediaCard}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTypeBadge}>VIDEO DISPATCH</Text>
        {data.durationSeconds && (
          <Text style={styles.cardMetaText}>
            {Math.floor(data.durationSeconds / 60)}:
            {(data.durationSeconds % 60).toString().padStart(2, '0')}
          </Text>
        )}
      </View>
      <View style={styles.videoPlaceholder}>
        <Text style={styles.videoIcon}>▶</Text>
        <Text style={styles.videoUrlText} numberOfLines={1}>
          {data.url}
        </Text>
      </View>
      {data.caption && <Text style={styles.captionText}>{data.caption}</Text>}
    </View>
  );
}

export function AudioBlockItem({ block }: { block: AudioBlock }) {
  const data = block.data || {};
  return (
    <View style={styles.audioCard}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTypeBadge}>AUDIO BRIEFING</Text>
        {data.durationSeconds && (
          <Text style={styles.cardMetaText}>
            {Math.floor(data.durationSeconds / 60)}:
            {(data.durationSeconds % 60).toString().padStart(2, '0')}
          </Text>
        )}
      </View>
      <Text style={styles.cardTitle}>{data.title}</Text>
      {data.narrator && <Text style={styles.narratorText}>Narrated by: {data.narrator}</Text>}
      {data.transcript && (
        <Text style={styles.transcriptSnippet} numberOfLines={2}>
          "{data.transcript}"
        </Text>
      )}
    </View>
  );
}
