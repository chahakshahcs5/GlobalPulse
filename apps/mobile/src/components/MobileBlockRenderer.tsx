import { View, Text, StyleSheet, ScrollView, type TextStyle } from 'react-native';
import type { StoryBlock } from '@ai-news/schemas';

export interface MobileBlockProps {
  blocks: StoryBlock[];
}

export function MobileBlockRenderer({ blocks }: MobileBlockProps) {
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

        switch (block.blockType) {
          case 'heading': {
            const level = block.data?.level || 2;
            const text = block.data?.text || '';
            const subtext = block.data?.subtext;

            let headingStyle: TextStyle = styles.h2;
            if (level === 1) headingStyle = styles.h1;
            else if (level === 3) headingStyle = styles.h3;
            else if (level === 4) headingStyle = styles.h4;

            return (
              <View key={key} style={styles.headingWrapper}>
                <Text style={headingStyle}>{text}</Text>
                {subtext && <Text style={styles.subtext}>{subtext}</Text>}
              </View>
            );
          }

          case 'paragraph': {
            return (
              <Text key={key} style={styles.paragraph}>
                {block.data?.text}
              </Text>
            );
          }

          case 'summary': {
            const data = block.data || {};
            const points = data.bulletPoints || [];
            return (
              <View key={key} style={styles.summaryCard}>
                <View style={styles.badgeRow}>
                  <View style={styles.pulseDot} />
                  <Text style={styles.summaryBadge}>EXECUTIVE BRIEFING</Text>
                </View>
                {data.headline && <Text style={styles.summaryHeadline}>{data.headline}</Text>}
                {points.map((pt: string, idx: number) => (
                  <View key={idx} style={styles.bulletRow}>
                    <Text style={styles.bulletDot}>•</Text>
                    <Text style={styles.bulletText}>{pt}</Text>
                  </View>
                ))}
              </View>
            );
          }

          case 'quote': {
            const data = block.data || {};
            return (
              <View key={key} style={styles.quoteCard}>
                <Text style={styles.quoteText}>"{data.quote}"</Text>
                {data.attribution && (
                  <Text style={styles.quoteAttribution}>
                    — {data.attribution}
                    {data.title ? `, ${data.title}` : ''}
                  </Text>
                )}
              </View>
            );
          }

          case 'chart': {
            const data = block.data || {};
            const values = data.values || [];
            return (
              <View key={key} style={styles.mediaCard}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardTypeBadge}>
                    {(data.chartType || 'CHART').toUpperCase()}
                  </Text>
                  <Text style={styles.cardMetaText}>Data Visual</Text>
                </View>
                <Text style={styles.cardTitle}>{data.title || 'Chart'}</Text>
                {data.subtitle && <Text style={styles.cardSubtitle}>{data.subtitle}</Text>}

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

          case 'timeline': {
            const data = block.data || {};
            const items = data.items || [];
            return (
              <View key={key} style={styles.mediaCard}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardTypeBadge}>CHRONOLOGY</Text>
                  <Text style={styles.cardMetaText}>{items.length} Milestones</Text>
                </View>
                <Text style={styles.cardTitle}>{data.title || 'Timeline'}</Text>
                <View style={styles.timelineList}>
                  {items.map(
                    (item: { date?: string; headline?: string; body?: string }, idx: number) => (
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
                    )
                  )}
                </View>
              </View>
            );
          }

          case 'map': {
            const data = block.data || {};
            const markers = data.markers || [];
            return (
              <View key={key} style={styles.mediaCard}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardTypeBadge}>GEOGRAPHIC MAP</Text>
                  <Text style={styles.cardMetaText}>Zoom: {data.zoom || 5}x</Text>
                </View>
                <Text style={styles.cardTitle}>{data.title || 'Location Overview'}</Text>
                {data.center && (
                  <Text style={styles.cardSubtitle}>
                    Coordinates: {Number(data.center[1]).toFixed(2)}°N,{' '}
                    {Number(data.center[0]).toFixed(2)}°E
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

          case 'statistic': {
            const data = block.data || {};
            const isUp = data.trend === 'up';
            return (
              <View key={key} style={styles.statCard}>
                <Text style={styles.statLabel}>{data.label}</Text>
                <View style={styles.statValueRow}>
                  <Text style={styles.statValue}>{data.value}</Text>
                  {data.trend && (
                    <View style={[styles.trendPill, isUp ? styles.trendUp : styles.trendDown]}>
                      <Text
                        style={[styles.trendText, isUp ? styles.trendTextUp : styles.trendTextDown]}
                      >
                        {isUp ? '↑' : '↓'} {data.trendValue || data.trend}
                      </Text>
                    </View>
                  )}
                </View>
                {data.context && <Text style={styles.statContext}>{data.context}</Text>}
              </View>
            );
          }

          case 'callout': {
            const data = block.data || {};
            return (
              <View key={key} style={styles.calloutCard}>
                {data.title && <Text style={styles.calloutTitle}>{data.title}</Text>}
                <Text style={styles.calloutText}>{data.text}</Text>
              </View>
            );
          }

          case 'video': {
            const data = block.data || {};
            return (
              <View key={key} style={styles.mediaCard}>
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

          case 'audio': {
            const data = block.data || {};
            return (
              <View key={key} style={styles.audioCard}>
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
                {data.narrator && (
                  <Text style={styles.narratorText}>Narrated by: {data.narrator}</Text>
                )}
                {data.transcript && (
                  <Text style={styles.transcriptSnippet} numberOfLines={2}>
                    "{data.transcript}"
                  </Text>
                )}
              </View>
            );
          }

          case 'source': {
            const data = block.data || {};
            return (
              <View key={key} style={styles.sourceCard}>
                <View style={styles.badgeRow}>
                  <Text style={styles.sourcePublisher}>{data.publisher}</Text>
                  {data.publishedAt && (
                    <Text style={styles.sourceDate}>
                      {new Date(data.publishedAt).toLocaleDateString()}
                    </Text>
                  )}
                </View>
                <Text style={styles.sourceTitle}>{data.title}</Text>
              </View>
            );
          }

          case 'entity': {
            const data = block.data || {};
            return (
              <View key={key} style={styles.entityCard}>
                <View style={styles.entityAvatar}>
                  <Text style={styles.entityAvatarText}>
                    {(data.name || 'EN').slice(0, 2).toUpperCase()}
                  </Text>
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

          case 'what_changed': {
            const data = block.data || {};
            const items = data.items || [];
            return (
              <View key={key} style={styles.diffCard}>
                <Text style={styles.diffHeader}>
                  What Changed in Version {data.previousVersionNumber + 1}
                </Text>
                {items.map((item: { changeType?: string; description?: string }, idx: number) => (
                  <View key={idx} style={styles.diffItem}>
                    <Text style={styles.diffBadge}>
                      {String(item.changeType || 'UPDATED').toUpperCase()}
                    </Text>
                    <Text style={styles.diffText}>{item.description || ''}</Text>
                  </View>
                ))}
              </View>
            );
          }

          case 'table': {
            const data = block.data || {};
            const headers = data.headers || [];
            const rows = data.rows || [];
            return (
              <View key={key} style={styles.mediaCard}>
                {data.title && <Text style={styles.cardTitle}>{data.title}</Text>}
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.tableScroll}
                >
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

          default:
            return null;
        }
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  emptyContainer: {
    paddingVertical: 32,
    alignItems: 'center',
  },
  emptyText: {
    color: '#64748b',
    fontSize: 14,
    fontStyle: 'italic',
  },
  headingWrapper: {
    marginVertical: 4,
  },
  h1: {
    fontSize: 26,
    fontWeight: '900',
    color: '#f8fafc',
    letterSpacing: -0.5,
    lineHeight: 32,
  },
  h2: {
    fontSize: 20,
    fontWeight: '800',
    color: '#f8fafc',
    letterSpacing: -0.3,
    lineHeight: 26,
  },
  h3: {
    fontSize: 17,
    fontWeight: '700',
    color: '#e2e8f0',
    lineHeight: 22,
  },
  h4: {
    fontSize: 15,
    fontWeight: '600',
    color: '#cbd5e1',
    lineHeight: 20,
  },
  subtext: {
    fontSize: 13,
    color: '#94a3b8',
    marginTop: 4,
  },
  paragraph: {
    fontSize: 15,
    lineHeight: 24,
    color: '#cbd5e1',
    fontWeight: '400',
  },
  summaryCard: {
    backgroundColor: 'rgba(30, 27, 75, 0.4)',
    borderColor: 'rgba(99, 102, 241, 0.3)',
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    gap: 8,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#818cf8',
  },
  summaryBadge: {
    fontSize: 10,
    fontWeight: '800',
    color: '#818cf8',
    letterSpacing: 1,
  },
  summaryHeadline: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  bulletDot: {
    color: '#818cf8',
    fontSize: 14,
    fontWeight: '700',
  },
  bulletText: {
    fontSize: 13,
    color: '#cbd5e1',
    flex: 1,
    lineHeight: 18,
  },
  quoteCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
    paddingLeft: 14,
    paddingVertical: 4,
    marginVertical: 6,
  },
  quoteText: {
    fontSize: 16,
    fontStyle: 'italic',
    color: '#e2e8f0',
    lineHeight: 22,
  },
  quoteAttribution: {
    fontSize: 12,
    fontWeight: '700',
    color: '#60a5fa',
    marginTop: 6,
  },
  mediaCard: {
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    borderColor: '#1e293b',
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    gap: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTypeBadge: {
    fontSize: 10,
    fontWeight: '800',
    color: '#3b82f6',
    letterSpacing: 0.8,
  },
  cardMetaText: {
    fontSize: 11,
    color: '#64748b',
    fontFamily: 'monospace',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#f8fafc',
  },
  cardSubtitle: {
    fontSize: 12,
    color: '#94a3b8',
  },
  chartValuesContainer: {
    marginTop: 8,
    gap: 6,
  },
  chartValueRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  chartValueLabel: {
    fontSize: 12,
    color: '#94a3b8',
  },
  chartValueNumber: {
    fontSize: 13,
    fontWeight: '700',
    color: '#f8fafc',
    fontFamily: 'monospace',
  },
  sourceFootnote: {
    fontSize: 10,
    color: '#64748b',
    fontStyle: 'italic',
    marginTop: 4,
  },
  timelineList: {
    marginTop: 8,
    gap: 12,
  },
  timelineItem: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
  },
  timelineStepBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    borderWidth: 1,
    borderColor: '#3b82f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineStepText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#3b82f6',
  },
  timelineContent: {
    flex: 1,
  },
  timelineDate: {
    fontSize: 10,
    fontWeight: '700',
    color: '#60a5fa',
    textTransform: 'uppercase',
  },
  timelineHeadline: {
    fontSize: 13,
    fontWeight: '700',
    color: '#f8fafc',
    marginTop: 1,
  },
  timelineBody: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 2,
    lineHeight: 15,
  },
  markerContainer: {
    marginTop: 6,
    gap: 4,
  },
  markerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  markerPin: {
    fontSize: 12,
  },
  markerTitle: {
    fontSize: 12,
    color: '#e2e8f0',
    fontWeight: '600',
  },
  statCard: {
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    borderColor: '#1e293b',
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    gap: 4,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  statValue: {
    fontSize: 32,
    fontWeight: '900',
    color: '#f8fafc',
    letterSpacing: -0.5,
  },
  trendPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  trendUp: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
  },
  trendDown: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
  },
  trendText: {
    fontSize: 12,
    fontWeight: '800',
  },
  trendTextUp: {
    color: '#34d399',
  },
  trendTextDown: {
    color: '#f87171',
  },
  statContext: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  calloutCard: {
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
    borderColor: '#334155',
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    gap: 4,
  },
  calloutTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#f8fafc',
  },
  calloutText: {
    fontSize: 13,
    color: '#cbd5e1',
    lineHeight: 18,
  },
  videoPlaceholder: {
    height: 140,
    backgroundColor: '#020617',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginVertical: 4,
  },
  videoIcon: {
    fontSize: 28,
    color: '#60a5fa',
  },
  videoUrlText: {
    fontSize: 10,
    color: '#64748b',
    paddingHorizontal: 16,
    fontFamily: 'monospace',
  },
  captionText: {
    fontSize: 11,
    color: '#94a3b8',
  },
  audioCard: {
    backgroundColor: 'rgba(30, 27, 75, 0.3)',
    borderColor: '#4338ca',
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    gap: 6,
  },
  narratorText: {
    fontSize: 11,
    color: '#a5b4fc',
  },
  transcriptSnippet: {
    fontSize: 12,
    color: '#cbd5e1',
    fontStyle: 'italic',
    marginTop: 4,
  },
  sourceCard: {
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    borderColor: '#1e293b',
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    gap: 4,
  },
  sourcePublisher: {
    fontSize: 10,
    fontWeight: '800',
    color: '#818cf8',
    textTransform: 'uppercase',
  },
  sourceDate: {
    fontSize: 10,
    color: '#64748b',
    fontFamily: 'monospace',
  },
  sourceTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#f8fafc',
  },
  entityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    borderColor: '#1e293b',
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    gap: 10,
  },
  entityAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  entityAvatarText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#818cf8',
  },
  entityInfo: {
    flex: 1,
  },
  entityName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#f8fafc',
  },
  entityTypeBadge: {
    fontSize: 9,
    fontWeight: '800',
    color: '#818cf8',
    textTransform: 'uppercase',
  },
  entityDescription: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 2,
  },
  diffCard: {
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    borderColor: '#1e293b',
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    gap: 6,
  },
  diffHeader: {
    fontSize: 12,
    fontWeight: '700',
    color: '#f8fafc',
  },
  diffItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  diffBadge: {
    fontSize: 9,
    fontWeight: '800',
    color: '#34d399',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  diffText: {
    fontSize: 11,
    color: '#cbd5e1',
    flex: 1,
  },
  tableScroll: {
    marginTop: 4,
  },
  table: {
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 8,
    overflow: 'hidden',
  },
  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: '#1e293b',
  },
  tableHeaderCell: {
    padding: 8,
    fontSize: 11,
    fontWeight: '700',
    color: '#f8fafc',
    minWidth: 90,
  },
  tableRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  tableCell: {
    padding: 8,
    fontSize: 11,
    color: '#cbd5e1',
    minWidth: 90,
  },
});
