import { View, Text } from 'react-native';
import { useEffect, useState } from 'react';
import type {
  CitationBlock,
  RelatedStoriesBlock,
  ComparisonBlock,
  PollBlock,
  LiveTickerBlock,
  DocumentViewerBlock,
  Comment,
  LiveCommentsBlock,
} from '@ai-news/schemas';
import { styles } from './styles';
import { mobileApi } from '../../services/api';

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

export function PollBlockItem({ block, storyId }: { block: PollBlock; storyId?: string }) {
  const data = block.data || {};

  // Votes are counted on the server. The counts in the story payload are only
  // the baseline, so pull the live tally when the story context is known.
  const [tally, setTally] = useState<{
    totalVotes: number;
    options: Array<{ id: string; text: string; voteCount: number }>;
    userVotedOptionId: string | null;
  } | null>(null);

  useEffect(() => {
    if (!storyId || !block.id) return;
    let cancelled = false;
    mobileApi
      .fetchPollTally(storyId, block.id)
      .then((result) => {
        if (!cancelled && result) {
          setTally({
            totalVotes: result.totalVotes,
            options: result.options.map((o) => ({
              id: o.id,
              text: o.text,
              voteCount: o.voteCount,
            })),
            userVotedOptionId: result.userVotedOptionId ?? null,
          });
        }
      })
      .catch(() => {
        // Offline or unavailable: keep the payload baseline.
      });
    return () => {
      cancelled = true;
    };
  }, [storyId, block.id]);

  const total = tally?.totalVotes ?? data.totalVotes ?? 0;
  const options = tally?.options ?? data.options ?? [];
  const userVotedOptionId = tally?.userVotedOptionId ?? data.userVotedOptionId;

  return (
    <View style={styles.intelCard}>
      <Text style={styles.intelSectionLabel}>Poll{data.closed ? ' · closed' : ''}</Text>
      <Text style={styles.intelTitle}>{data.question}</Text>
      {options.map((option) => {
        const share = total > 0 ? Math.round((option.voteCount / total) * 100) : 0;
        return (
          <View key={option.id} style={styles.intelListItem}>
            <View style={styles.intelRowBetween}>
              <Text style={styles.intelText}>{option.text}</Text>
              <Text style={styles.chartValueNumber}>
                {option.voteCount} · {share}%
              </Text>
            </View>
            {userVotedOptionId === option.id ? (
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

  // A block bound to a live feed shows the current values instead of the
  // snapshot stored in the story payload.
  const [liveItems, setLiveItems] = useState<Array<{
    id: string;
    label: string;
    value: number | string;
    change?: number;
    unit?: string;
  }> | null>(null);

  useEffect(() => {
    if (!data.liveKey) return;
    let cancelled = false;
    const load = () => {
      mobileApi
        .fetchLiveFeed(data.liveKey as string)
        .then((feed) => {
          if (!cancelled && feed) {
            setLiveItems(
              feed.items.map((item) => ({
                id: item.id,
                label: item.label,
                value: item.value,
                change: item.change,
                unit: item.unit,
              }))
            );
          }
        })
        .catch(() => {
          // Keep the payload snapshot.
        });
    };
    load();
    const timer = setInterval(load, Math.max(15, data.refreshIntervalSeconds || 30) * 1000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [data.liveKey, data.refreshIntervalSeconds]);

  const items: Array<{
    symbol: string;
    label: string;
    value: number;
    delta: number;
    unit?: string;
    sparkline: number[];
    lastUpdated?: string;
  }> = liveItems
    ? liveItems.map((item) => ({
        symbol: item.id,
        label: item.label,
        value: typeof item.value === 'number' ? item.value : Number(item.value) || 0,
        delta: item.change ?? 0,
        unit: item.unit,
        sparkline: [],
      }))
    : (data.items ?? []);

  return (
    <View style={styles.intelCard}>
      {data.title ? <Text style={styles.intelTitle}>{data.title}</Text> : null}
      {items.map((item) => {
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

/**
 * Reader comments inside the article body.
 *
 * The mobile client is offline-first, so the thread is fetched once rather
 * than kept live over the realtime channel.
 */
export function LiveCommentsBlockItem({
  block,
  storyId,
}: {
  block: LiveCommentsBlock;
  storyId?: string;
}) {
  const data = block.data || {};
  const [comments, setComments] = useState<Comment[]>([]);

  useEffect(() => {
    if (!storyId) return;
    let cancelled = false;
    mobileApi
      .fetchStoryComments(storyId)
      .then((loaded) => {
        if (!cancelled) setComments(loaded);
      })
      .catch(() => {
        // Offline or unavailable: leave the block empty.
      });
    return () => {
      cancelled = true;
    };
  }, [storyId]);

  const visible = comments
    .filter((c) => c.status === 'approved')
    .filter((c) => !data.roles?.length || data.roles.includes(c.authorRole))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, data.maxComments ?? 10);

  return (
    <View style={styles.intelCard}>
      <Text style={styles.intelSectionLabel}>Live comments</Text>
      <Text style={styles.intelTitle}>{data.title}</Text>
      {data.description && <Text style={styles.intelMeta}>{data.description}</Text>}

      {visible.length === 0 ? (
        <Text style={styles.intelMeta}>No comments yet.</Text>
      ) : (
        visible.map((comment) => (
          <View key={comment.id} style={styles.intelListItem}>
            <Text style={styles.intelText}>{comment.authorName}</Text>
            <Text style={styles.intelMeta}>{comment.content}</Text>
          </View>
        ))
      )}
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
