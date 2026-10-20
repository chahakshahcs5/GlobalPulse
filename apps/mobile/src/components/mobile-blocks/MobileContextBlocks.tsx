import { View, Text } from 'react-native';
import type {
  CitationBlock,
  RelatedStoriesBlock,
  ComparisonBlock,
  PollBlock,
  LiveTickerBlock,
  DocumentViewerBlock,
} from '@ai-news/schemas';
import { styles } from './styles';

/**
 * Mobile renderers for context blocks: citations, related stories,
 * comparisons, polls, live tickers, and document viewers.
 */

export function CitationBlockItem({ block }: { block: CitationBlock }) {
  const data = block.data || {};
  return (
    <View style={styles.intelCard}>
      <Text style={styles.intelSectionLabel}>Citation</Text>
      <Text style={styles.intelText}>“{data.claim}”</Text>
      {data.quoteExcerpt ? (
        <Text style={styles.transcriptSnippet}>“{data.quoteExcerpt}”</Text>
      ) : null}
      <Text style={styles.intelMeta}>Sources: {data.sourceIds?.join(', ')}</Text>
    </View>
  );
}

export function RelatedStoriesBlockItem({ block }: { block: RelatedStoriesBlock }) {
  const data = block.data || {};
  return (
    <View style={styles.intelCard}>
      <Text style={styles.intelTitle}>{data.title || 'Related stories'}</Text>
      {data.storyIds?.map((storyId) => (
        <Text key={storyId} style={styles.intelMeta}>
          • {storyId}
        </Text>
      ))}
    </View>
  );
}

export function ComparisonBlockItem({ block }: { block: ComparisonBlock }) {
  const data = block.data || {};
  return (
    <View style={styles.intelCard}>
      {data.title ? <Text style={styles.intelTitle}>{data.title}</Text> : null}
      <View style={styles.intelRowBetween}>
        <Text style={styles.intelText}>{data.subjectA?.name}</Text>
        <Text style={styles.intelText}>{data.subjectB?.name}</Text>
      </View>
      {data.subjectA?.points?.map((point, idx) => (
        <View key={idx} style={styles.intelRowBetween}>
          <Text style={styles.intelText}>{point}</Text>
          <Text style={styles.intelText}>{data.subjectB?.points?.[idx] ?? '—'}</Text>
        </View>
      ))}
    </View>
  );
}

export function PollBlockItem({ block }: { block: PollBlock }) {
  const data = block.data || {};
  const total = data.totalVotes || 0;

  return (
    <View style={styles.intelCard}>
      <Text style={styles.intelSectionLabel}>Poll{data.closed ? ' · closed' : ''}</Text>
      <Text style={styles.intelTitle}>{data.question}</Text>
      {data.options?.map((option) => {
        const share = total > 0 ? Math.round((option.voteCount / total) * 100) : 0;
        return (
          <View key={option.id} style={styles.intelListItem}>
            <View style={styles.intelRowBetween}>
              <Text style={styles.intelText}>{option.text}</Text>
              <Text style={styles.chartValueNumber}>
                {option.voteCount} · {share}%
              </Text>
            </View>
            {data.userVotedOptionId === option.id ? (
              <Text style={styles.intelMeta}>Your vote</Text>
            ) : null}
          </View>
        );
      })}
      <Text style={styles.intelMeta}>
        {total} votes{data.expiresAt ? ` · closes ${data.expiresAt}` : ''}
      </Text>
    </View>
  );
}

export function LiveTickerBlockItem({ block }: { block: LiveTickerBlock }) {
  const data = block.data || {};
  return (
    <View style={styles.intelCard}>
      {data.title ? <Text style={styles.intelTitle}>{data.title}</Text> : null}
      {data.items?.map((item) => {
        const isUp = item.delta > 0;
        return (
          <View key={item.symbol} style={styles.intelRowBetween}>
            <View>
              <Text style={styles.intelText}>{item.label}</Text>
              <Text style={styles.intelMeta}>
                {item.value}
                {item.unit ? ` ${item.unit}` : ''}
                {item.lastUpdated ? ` · ${item.lastUpdated}` : ''}
              </Text>
            </View>
            <View style={isUp ? styles.intelPillPositive : styles.intelPillNegative}>
              <Text style={isUp ? styles.intelPillPositiveText : styles.intelPillNegativeText}>
                {isUp ? '↑' : '↓'} {Math.abs(item.delta)}
              </Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

export function DocumentViewerBlockItem({ block }: { block: DocumentViewerBlock }) {
  const data = block.data || {};
  return (
    <View style={styles.intelCard}>
      <Text style={styles.intelSectionLabel}>{data.documentType}</Text>
      <Text style={styles.intelTitle}>{data.title}</Text>
      {data.description ? <Text style={styles.intelText}>{data.description}</Text> : null}
      <Text style={styles.intelMeta}>
        {data.pageCount} pages · {data.documentUrl}
      </Text>
      {data.highlights?.map((highlight, idx) => (
        <View key={idx} style={styles.intelListItem}>
          <Text style={styles.intelMeta}>
            Page {highlight.page}
            {highlight.tag ? ` · ${highlight.tag}` : ''}
          </Text>
          <Text style={styles.intelText}>{highlight.excerpt}</Text>
          {highlight.note ? <Text style={styles.intelMeta}>{highlight.note}</Text> : null}
        </View>
      ))}
      {data.sourceAttribution ? (
        <Text style={styles.sourceFootnote}>Source: {data.sourceAttribution}</Text>
      ) : null}
    </View>
  );
}
