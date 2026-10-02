import { View, Text, ScrollView } from 'react-native';
import type {
  ChartBlock,
  TimelineBlock,
  MapBlock,
  StatisticBlock,
  TableBlock,
} from '@ai-news/schemas';
import { styles } from './styles';

export function ChartBlockItem({ block }: { block: ChartBlock }) {
  const data = block.data || {};
  const values = (data.values as Array<Record<string, unknown>>) || [];
  return (
    <View style={styles.mediaCard}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTypeBadge}>{(data.chartType || 'CHART').toUpperCase()}</Text>
        <Text style={styles.cardMetaText}>Data Visual</Text>
      </View>
      <Text style={styles.cardTitle}>{data.title || 'Chart'}</Text>
      {(data as { subtitle?: string }).subtitle && (
        <Text style={styles.cardSubtitle}>{(data as { subtitle?: string }).subtitle}</Text>
      )}

      {/* Values summary list */}
      <View style={styles.chartValuesContainer}>
        {values.slice(0, 4).map((row: Record<string, unknown>, rIdx: number) => {
          const label =
            (row[data.xAxis?.key] as string) || (row.name as string) || `Row ${rIdx + 1}`;
          const val =
            (row[data.series?.[0]?.key] as number) ||
            (row.value as number) ||
            (row.val as number) ||
            0;
          return (
            <View key={rIdx} style={styles.chartValueRow}>
              <Text style={styles.chartValueLabel}>{String(label)}</Text>
              <Text style={styles.chartValueNumber}>{Number(val).toLocaleString()}</Text>
            </View>
          );
        })}
      </View>

      {data.sourceAttribution && (
        <Text style={styles.sourceFootnote}>Source: {data.sourceAttribution}</Text>
      )}
    </View>
  );
}

export function TimelineBlockItem({ block }: { block: TimelineBlock }) {
  const data = block.data || {};
  const items = data.items || [];
  return (
    <View style={styles.mediaCard}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTypeBadge}>CHRONOLOGY</Text>
        <Text style={styles.cardMetaText}>{items.length} Milestones</Text>
      </View>
      <Text style={styles.cardTitle}>{data.title || 'Timeline'}</Text>
      <View style={styles.timelineList}>
        {items.map((item: { date?: string; headline?: string; body?: string }, idx: number) => (
          <View key={idx} style={styles.timelineItem}>
            <View style={styles.timelineStepBadge}>
              <Text style={styles.timelineStepText}>{idx + 1}</Text>
            </View>
            <View style={styles.timelineContent}>
              <Text style={styles.timelineDate}>{item.date}</Text>
              <Text style={styles.timelineHeadline}>{item.headline}</Text>
              <Text style={styles.timelineBody} numberOfLines={2}>
                {item.body}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

export function MapBlockItem({ block }: { block: MapBlock }) {
  const data = block.data || {};
  const markers = data.markers || [];
  return (
    <View style={styles.mediaCard}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTypeBadge}>GEOGRAPHIC MAP</Text>
        <Text style={styles.cardMetaText}>Zoom: {data.zoom || 5}x</Text>
      </View>
      <Text style={styles.cardTitle}>{data.title || 'Location Overview'}</Text>
      {data.center && (
        <Text style={styles.cardSubtitle}>
          Coordinates: {Number(data.center[1]).toFixed(2)}°N, {Number(data.center[0]).toFixed(2)}°E
        </Text>
      )}
      {markers.length > 0 && (
        <View style={styles.markerContainer}>
          {markers.map((m: { title?: string }, idx: number) => (
            <View key={idx} style={styles.markerRow}>
              <Text style={styles.markerPin}>📍</Text>
              <Text style={styles.markerTitle}>{m.title || ''}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

export function StatisticBlockItem({ block }: { block: StatisticBlock }) {
  const data = block.data || {};
  const isUp = data.trend === 'up';
  return (
    <View style={styles.statCard}>
      <Text style={styles.statLabel}>{data.label}</Text>
      <View style={styles.statValueRow}>
        <Text style={styles.statValue}>{data.value}</Text>
        {data.trend && (
          <View style={[styles.trendPill, isUp ? styles.trendUp : styles.trendDown]}>
            <Text style={[styles.trendText, isUp ? styles.trendTextUp : styles.trendTextDown]}>
              {isUp ? '↑' : '↓'} {data.trendValue || data.trend}
            </Text>
          </View>
        )}
      </View>
      {data.context && <Text style={styles.statContext}>{data.context}</Text>}
    </View>
  );
}

export function TableBlockItem({ block }: { block: TableBlock }) {
  const data = block.data || {};
  const headers = data.headers || [];
  const rows = data.rows || [];
  return (
    <View style={styles.mediaCard}>
      {data.title && <Text style={styles.cardTitle}>{data.title}</Text>}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tableScroll}>
        <View style={styles.table}>
          <View style={styles.tableHeaderRow}>
            {headers.map((h: string, hIdx: number) => (
              <Text key={hIdx} style={styles.tableHeaderCell}>
                {h}
              </Text>
            ))}
          </View>
          {rows.map((row: string[], rIdx: number) => (
            <View key={rIdx} style={styles.tableRow}>
              {row.map((cell: string, cIdx: number) => (
                <Text key={cIdx} style={styles.tableCell}>
                  {cell}
                </Text>
              ))}
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
